from flask import Flask, request, jsonify
from csv_parser import parse_robinhood_csv
from capital_gains_calculator import calculate_capital_gains
import os
import requests
from dotenv import load_dotenv

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
        capital_gains = calculate_capital_gains(trades)

        os.remove(file_path)

        return jsonify(capital_gains)

@app.route('/api/get_price', methods=['GET'])
def get_price():
    tickers = request.args.get('tickers')
    if not tickers:
        return jsonify({'error': 'Ticker symbols are required'}), 400

    api_key = os.getenv('FMP_API_KEY')
    url = f'https://financialmodelingprep.com/stable/batch-quote?symbols={tickers}&apikey={api_key}'

    try:
        response = requests.get(url)
        data = response.json()
        if not isinstance(data, list):
            error_message = data.get("Error Message", "An unknown error occurred with the FMP API.")
            return jsonify({'error': error_message}), 500
        prices = {item['symbol']: item['price'] for item in data}
        return jsonify(prices)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
