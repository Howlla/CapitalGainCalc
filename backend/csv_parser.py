import csv
from datetime import datetime

DATE_FORMATS = [
    "%m/%d/%Y",
    "%m/%d/%y",
    "%Y-%m-%d",
    "%Y-%m-%d %H:%M",
    "%Y-%m-%d %H:%M:%S",
    "%m/%d/%Y %H:%M",
    "%m/%d/%Y %H:%M:%S",
]

def _normalize_date_str(s: str) -> str:
    """
    Normalize various date formats to mm/dd/YYYY.
    Falls back to the first token before space if needed.
    """
    if not s:
        return s
    raw = s.strip()
    # Try as-is
    for fmt in DATE_FORMATS:
        try:
            dt = datetime.strptime(raw, fmt)
            return dt.strftime("%m/%d/%Y")
        except ValueError:
            pass
    # Try only the date portion before a space (if any)
    if " " in raw:
        date_part = raw.split(" ", 1)[0]
        for fmt in DATE_FORMATS:
            try:
                dt = datetime.strptime(date_part, fmt)
                return dt.strftime("%m/%d/%Y")
            except ValueError:
                pass
    # Last resort: return original (calculator will try to parse too)
    return raw

def _clean_money(v: str) -> float:
    """
    Convert currency strings like '$1,234.56' or '(1,234.56)' to float.
    """
    if v is None:
        return 0.0
    s = str(v).strip()
    neg = False
    if "(" in s and ")" in s:
        neg = True
    s = s.replace("$", "").replace(",", "").replace("(", "").replace(")", "")
    try:
        val = float(s)
    except ValueError:
        val = 0.0
    return -val if neg else val

def _clean_number(v: str) -> float:
    """
    Convert number strings that may include commas to float.
    """
    if v is None:
        return 0.0
    s = str(v).strip().replace(",", "")
    try:
        return float(s)
    except ValueError:
        return 0.0

def _normalize_trans_code(raw: str, description: str = "") -> str:
    """
    Normalize various Robinhood-like transaction codes into canonical ones:
    - Buy
    - Sell
    - CDIV (Cash Dividend)
    - SPL (Stock Split; Quantity holds extra shares credited)
    """
    u = (raw or "").strip().upper()
    d = (description or "").strip().upper()

    if u.startswith("BUY") or "REINVEST" in u or "DRIP" in u or "REINVEST" in d or "DRIP" in d:
        return "Buy"
    if u.startswith("SELL"):
        return "Sell"
    if "CDIV" in u or "DIV" in u or "DIVIDEND" in d:
        return "CDIV"
    if u.startswith("SPL") or "SPLIT" in d:
        # Robinhood often uses "SPL" in Trans Code for splits
        return "SPL"
    return (raw or "").strip()

def parse_robinhood_csv(file_path):
    """Parses a Robinhood CSV file and returns a list of trades."""
    trades = []
    with open(file_path, 'r', newline='', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader, None)  # Skip header if present

        for row in reader:
            if not row:
                continue
            # Typical indices:
            # 0: Activity Date, 3: Instrument, 4: Description, 5: Trans Code, 6: Quantity, 7: Price, 8: Amount
            try:
                activity_date_raw = row[0]
                instrument = row[3].strip()
                description = row[4] if len(row) > 4 else ""
                trans_code = _normalize_trans_code(row[5] if len(row) > 5 else "", description)
            except IndexError:
                continue

            if trans_code not in ['Buy', 'Sell', 'CDIV', 'SPL']:
                continue

            activity_date = _normalize_date_str(activity_date_raw)

            try:
                if trans_code == 'CDIV':
                    trade = {
                        'activity_date': activity_date,
                        'instrument': instrument,
                        'trans_code': trans_code,
                        'quantity': 0.0,
                        'price': 0.0,
                        'amount': _clean_money(row[8]) if len(row) > 8 else 0.0,
                        'description': description,
                    }
                elif trans_code == 'SPL':
                    # Quantity column contains the additional shares credited
                    extra = _clean_number(row[6]) if len(row) > 6 else 0.0
                    trade = {
                        'activity_date': activity_date,
                        'instrument': instrument,
                        'trans_code': 'SPL',
                        'extra_shares': extra,
                        'description': description,
                    }
                else:
                    qty = _clean_number(row[6]) if len(row) > 6 else 0.0
                    price = _clean_money(row[7]) if len(row) > 7 else 0.0
                    amt = _clean_money(row[8]) if len(row) > 8 else qty * price
                    # Some exports may show negative qty for Sell; normalize to positive
                    if qty < 0:
                        qty = abs(qty)
                    trade = {
                        'activity_date': activity_date,
                        'instrument': instrument,
                        'trans_code': trans_code,
                        'quantity': qty,
                        'price': price,
                        'amount': amt,
                        'description': description,
                    }
                trades.append(trade)
            except (ValueError, IndexError):
                # Ignore rows that can't be parsed as trades
                continue

    return trades

if __name__ == '__main__':
    # Example manual test (adjust file path as needed)
    file_path = r'./test.csv'
    trades = parse_robinhood_csv(file_path)
    for trade in trades:
        print(trade)