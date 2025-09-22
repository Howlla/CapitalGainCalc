from flask import Flask, request, jsonify
from csv_parser import parse_robinhood_csv
from capital_gains_calculator import calculate_capital_gains
import os
from dotenv import load_dotenv
import yfinance as yf
import pandas as pd

load_dotenv()

app = Flask(__name__)

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        filename = file.filename
        file_path = os.path.join(os.getcwd(), filename)
        file.save(file_path)

        trades = parse_robinhood_csv(file_path)
        result = calculate_capital_gains(trades)

        os.remove(file_path)

        # result includes: { gains, summary, unsold_lots, remaining_tickers }
        return jsonify(result)

@app.route('/api/get_price', methods=['GET'])
def get_price():
    """
    Returns a flat map of ticker -> price using a single yfinance download call.
    Example: { "AAPL": 190.12, "MSFT": 413.88 }
    """
    tickers_param = request.args.get('tickers')
    if not tickers_param:
        return jsonify({'error': 'Ticker symbols are required'}), 400

    # Normalize symbols
    symbols = [s.strip().upper() for s in tickers_param.split(',') if s.strip()]
    if not symbols:
        return jsonify({'error': 'No valid ticker symbols provided'}), 400

    try:
        # Single call to yf.download for all symbols
        df = yf.download(
            tickers=" ".join(symbols),
            period="1d",            # last trading day prices
            interval="1d",
            auto_adjust=False,
            progress=False,
            threads=True            # let yfinance manage concurrency internally
        )
    except Exception as e:
        return jsonify({'error': f'yfinance error: {str(e)}'}), 502

    prices = {}

    if isinstance(df.columns, pd.MultiIndex):
        # Multiple tickers: columns like ('Close','AAPL'), ('Adj Close','AAPL'), ...
        for sym in symbols:
            price = None
            if ('Close', sym) in df.columns:
                series = df[('Close', sym)].dropna()
                if not series.empty:
                    price = float(series.iloc[-1])
            if price is None and ('Adj Close', sym) in df.columns:
                series = df[('Adj Close', sym)].dropna()
                if not series.empty:
                    price = float(series.iloc[-1])
            if price is not None:
                prices[sym] = price
    else:
        # Single ticker: columns like 'Close', 'Adj Close'
        # yfinance sometimes returns lowercase/space variants; normalize keys
        cols = {str(c).lower(): c for c in df.columns}
        sym = symbols[0]
        price = None
        if 'close' in cols:
            series = df[cols['close']].dropna()
            if not series.empty:
                price = float(series.iloc[-1])
        if price is None and 'adj close' in cols:
            series = df[cols['adj close']].dropna()
            if not series.empty:
                price = float(series.iloc[-1])
        if price is not None:
            prices[sym] = price

    if not prices:
        return jsonify({'error': 'Unable to fetch prices for provided tickers'}), 502

    return jsonify(prices)

if __name__ == '__main__':
    app.run(debug=True)