
import requests
import os
from dotenv import load_dotenv

load_dotenv()

def test_get_price():
    """Tests the /api/get_price endpoint."""
    tickers = 'MSFT,AAPL,GOOG'
    url = f'http://localhost:5000/api/get_price?tickers={tickers}'

    try:
        response = requests.get(url)
        if response.ok:
            data = response.json()
            print(data)
        else:
            print(f'Error: {response.status_code}')
            print(response.text)
    except Exception as e:
        print(f'An error occurred: {e}')

def test_fmp_api_key():
    """Tests the FMP API key directly."""
    api_key = os.getenv('FMP_API_KEY')
    if not api_key:
        print("FMP_API_KEY not found in .env file.")
        return

    ticker = 'AAPL'
    url = f'https://financialmodelingprep.com/stable/batch-quote?symbols={ticker}&apikey={api_key}'

    try:
        response = requests.get(url)
        if response.ok:
            print("FMP API key is valid.")
            print(response.json())
        else:
            print(f"Error testing FMP API key: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f'An error occurred while testing FMP API key: {e}')


if __name__ == '__main__':
    test_get_price()
    test_fmp_api_key()
