import csv

def parse_robinhood_csv(file_path):
    """Parses a Robinhood CSV file and returns a list of trades."""
    trades = []
    with open(file_path, 'r') as f:
        reader = csv.reader(f)
        header = next(reader)  # Skip header

        for row in reader:
            if len(row) < 9:
                continue

            trans_code = row[5]
            if trans_code not in ['Buy', 'Sell', 'CDIV']:
                continue

            try:
                if trans_code == 'CDIV':
                    trade = {
                        'activity_date': row[0],
                        'instrument': row[3],
                        'trans_code': trans_code,
                        'quantity': 0,
                        'price': 0,
                        'amount': float(row[8].replace('$', '').replace('(', '-').replace(')', ''))
                    }
                else:
                    trade = {
                        'activity_date': row[0],
                        'instrument': row[3],
                        'trans_code': trans_code,
                        'quantity': float(row[6]),
                        'price': float(row[7].replace('$', '')),
                        'amount': float(row[8].replace('$', '').replace('(', '-').replace(')', ''))
                    }
                trades.append(trade)
            except (ValueError, IndexError):
                # Ignore rows that can't be parsed as trades
                continue

    return trades

if __name__ == '__main__':
    # Example usage:
    file_path = r'C:\Users\Valued Customer\Desktop\code\capitalGainCalc\test.csv'
    trades = parse_robinhood_csv(file_path)
    for trade in trades:
        print(trade)