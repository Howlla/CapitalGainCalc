import os
import sys
import time
import requests
from urllib.parse import quote_plus

BASE_URL = os.getenv("BASE_URL", "http://localhost:5000").rstrip("/")


def _extract_prices_and_errors(resp):
    """
    Accept both shapes:
      - 200: {"AAPL": 123.45, "MSFT": 456.78}
      - 207: {"prices": {"AAPL": 123.45}, "errors": [{"MSFT": "reason"}]}
    Returns: (prices_dict, errors_list)
    """
    try:
        data = resp.json()
    except Exception:
        return {}, [{"response": f"Non-JSON response: {resp.text[:200]}"}]

    if isinstance(data, dict) and "prices" in data:
        prices = data.get("prices", {}) or {}
        errors = data.get("errors", []) or []
        return prices, errors

    # Fallback to flat map
    if isinstance(data, dict):
        return data, []

    return {}, [{"response": f"Unexpected JSON shape: {data}"}]


def _print_result(test_name, resp, prices, errors):
    print(f"\n[{test_name}] HTTP {resp.status_code}")
    if prices:
        print("Prices:")
        for k, v in prices.items():
            print(f"  {k}: {v}")
    if errors:
        print("Errors:")
        for item in errors:
            print(f"  {item}")
    if not prices and not errors:
        print(f"Body: {resp.text[:500]}")


def _ensure_server_up():
    try:
        health = requests.get(f"{BASE_URL}/", timeout=2)
        # Not all apps have a root route; just seeing if host responds
        return True
    except Exception:
        return False


def test_get_price_basic():
    """Tests the /api/get_price endpoint with common tickers."""
    tickers = "MSFT,AAPL,GOOG"
    url = f"{BASE_URL}/api/get_price?tickers={quote_plus(tickers)}"
    resp = requests.get(url, timeout=15)
    prices, errors = _extract_prices_and_errors(resp)
    _print_result("basic", resp, prices, errors)


def test_get_price_delimiters():
    """
    Tests that the endpoint handles comma, space, and semicolon separated lists.
    This matches the yfinance-backed endpoint behavior we discussed.
    """
    mixed = "MSFT; AAPL NVDA"
    url = f"{BASE_URL}/api/get_price?tickers={quote_plus(mixed)}"
    resp = requests.get(url, timeout=15)
    prices, errors = _extract_prices_and_errors(resp)
    _print_result("mixed-delimiters", resp, prices, errors)


def test_get_price_invalid_symbol():
    """Tests handling of an invalid symbol."""
    invalid = "NOT_A_REAL_TICKER_12345"
    url = f"{BASE_URL}/api/get_price?tickers={quote_plus(invalid)}"
    resp = requests.get(url, timeout=15)
    prices, errors = _extract_prices_and_errors(resp)
    _print_result("invalid-ticker", resp, prices, errors)


if __name__ == "__main__":
    print(f"Using BASE_URL={BASE_URL}")
    if not _ensure_server_up():
        print("Warning: Could not reach the server. Is the Flask app running on this BASE_URL?")
        print("Start the backend with: python backend/main.py")
        sys.exit(1)

    start = time.time()
    test_get_price_basic()
    test_get_price_delimiters()
    test_get_price_invalid_symbol()
    print(f"\nCompleted in {time.time() - start:.2f}s")