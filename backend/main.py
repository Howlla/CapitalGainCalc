from flask import Flask, request, jsonify
from csv_parser import parse_robinhood_csv
from capital_gains_calculator import calculate_capital_gains
import os
from dotenv import load_dotenv
import yfinance as yf
import pandas as pd
import re

load_dotenv()

app = Flask(__name__)

# -------- Formatting helpers --------
def _round_price(val):
    try:
        return round(float(val), 2)
    except Exception:
        return val

def _round_qty(val):
    try:
        return round(float(val), 5)
    except Exception:
        return val

def _format_upload_result(result: dict) -> dict:
    """
    Enforce:
      - Prices -> 2 decimals
      - Quantities (stock units) -> 5 decimals
    on the result of calculate_capital_gains().
    """
    if not isinstance(result, dict):
        return result

    out = {
        'gains': {},
        'summary': {},
        'unsold_lots': [],
        'remaining_tickers': result.get('remaining_tickers', []),
    }

    # Summary: currency fields (2 decimals)
    summary = result.get('summary', {}) or {}
    out['summary'] = {
        'past_gains': _round_price(summary.get('past_gains', 0)),
        'current_year_gains': _round_price(summary.get('current_year_gains', 0)),
    }

    # Gains per instrument
    gains = result.get('gains', {}) or {}
    for instrument, entries in gains.items():
        formatted_entries = []
        for e in entries or []:
            formatted_entries.append({
                'instrument': e.get('instrument'),
                'sell_date': e.get('sell_date'),
                'buy_date': e.get('buy_date'),
                'quantity': _round_qty(e.get('quantity', 0)),
                'buy_price': _round_price(e.get('buy_price', 0)),
                'sell_price': _round_price(e.get('sell_price', 0)),
                'gain_loss': _round_price(e.get('gain_loss', 0)),
                'gain_type': e.get('gain_type'),
            })
        out['gains'][instrument] = formatted_entries

    # Unsold lots: qty (5), costBasisPerShare (2)
    unsold = result.get('unsold_lots', []) or []
    for lot in unsold:
        out['unsold_lots'].append({
            'lotId': lot.get('lotId'),
            'instrument': lot.get('instrument'),
            'qty': _round_qty(lot.get('qty', 0)),
            'costBasisPerShare': _round_price(lot.get('costBasisPerShare', 0)),
            'purchaseDate': lot.get('purchaseDate'),
        })

    return out


@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    filename = file.filename
    file_path = os.path.join(os.getcwd(), filename)
    file.save(file_path)

    try:
        trades = parse_robinhood_csv(file_path)
        result = calculate_capital_gains(trades)
        result = _format_upload_result(result)
        return jsonify(result)
    finally:
        try:
            os.remove(file_path)
        except Exception:
            pass


@app.route('/api/get_price', methods=['GET'])
def get_price():
    """
    Returns a flat map of ticker -> price using a single yfinance download call.
    Prices are rounded to 2 decimals.
    Example: { "AAPL": 190.12, "MSFT": 413.88 }
    """
    tickers_param = request.args.get('tickers', '')
    if not tickers_param.strip():
        return jsonify({'error': 'Ticker symbols are required'}), 400

    # Accept commas, semicolons, and whitespace as delimiters
    symbols = [s.strip().upper() for s in re.split(r'[,\s;]+', tickers_param) if s.strip()]
    if not symbols:
        return jsonify({'error': 'No valid ticker symbols provided'}), 400

    try:
        df = yf.download(
            tickers=" ".join(symbols),
            period="1d",
            interval="1d",
            auto_adjust=False,
            progress=False,
            threads=True
        )
    except Exception as e:
        return jsonify({'error': f'yfinance error: {str(e)}'}), 502

    prices = {}

    if isinstance(df.columns, pd.MultiIndex):
        # Multiple tickers
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
                prices[sym] = _round_price(price)
    else:
        # Single ticker
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
            prices[sym] = _round_price(price)

    if not prices:
        return jsonify({'error': 'No prices found for provided tickers'}), 404

    return jsonify(prices)


if __name__ == "__main__":
    # Default to port 5000 to match CRA proxy config
    port = int(os.environ.get("PORT", "5000"))
    app.run(host="0.0.0.0", port=port)