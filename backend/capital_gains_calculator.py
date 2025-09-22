
from collections import defaultdict
from datetime import datetime

def calculate_capital_gains_summary(capital_gains):
    """Calculates a summary of capital gains."""
    today = datetime.today()
    current_year = today.year

    past_gains = 0
    current_year_gains = 0

    for instrument in capital_gains:
        for gain in capital_gains[instrument]:
            sell_date = datetime.strptime(gain['sell_date'], '%m/%d/%Y')
            if sell_date.year < current_year:
                past_gains += gain['gain_loss']
            else:
                current_year_gains += gain['gain_loss']

    return {
        'past_gains': past_gains,
        'current_year_gains': current_year_gains
    }

def calculate_capital_gains(trades):
    """Calculates capital gains for a list of trades."""
    trades_by_instrument = defaultdict(list)
    for trade in trades:
        trades_by_instrument[trade['instrument']].append(trade)

    all_capital_gains = {}
    for instrument, instrument_trades in trades_by_instrument.items():
        instrument_trades.sort(key=lambda t: datetime.strptime(t['activity_date'], '%m/%d/%Y'))
        buys = [t for t in instrument_trades if t['trans_code'] == 'Buy']
        sells = [t for t in instrument_trades if t['trans_code'] == 'Sell']

        capital_gains = []
        for sell in sells:
            sell_quantity = sell['quantity']
            sell_date = datetime.strptime(sell['activity_date'], '%m/%d/%Y')
            sell_price = sell['price']

            while sell_quantity > 0 and buys:
                buy = buys[0]
                buy_quantity = buy['quantity']
                buy_date = datetime.strptime(buy['activity_date'], '%m/%d/%Y')
                buy_price = buy['price']

                quantity_to_sell = min(sell_quantity, buy_quantity)
                gain_loss = (sell_price - buy_price) * quantity_to_sell
                holding_period = (sell_date - buy_date).days
                gain_type = 'long_term' if holding_period > 365 else 'short_term'

                capital_gains.append({
                    'instrument': instrument,
                    'sell_date': sell['activity_date'],
                    'buy_date': buy['activity_date'],
                    'quantity': quantity_to_sell,
                    'buy_price': buy_price,
                    'sell_price': sell_price,
                    'gain_loss': gain_loss,
                    'gain_type': gain_type
                })

                sell_quantity -= quantity_to_sell
                buy['quantity'] -= quantity_to_sell

                if buy['quantity'] <= 0:
                    buys.pop(0)
        all_capital_gains[instrument] = capital_gains

    remaining_buys = {}
    for instrument, instrument_trades in trades_by_instrument.items():
        # ... (logic to calculate capital gains)
        remaining_buys[instrument] = buys

    summary = calculate_capital_gains_summary(all_capital_gains)

    return {
        'gains': all_capital_gains,
        'summary': summary,
        'remaining_tickers': [ticker for ticker, buys in remaining_buys.items() if buys]
    }
    """Calculates capital gains for a list of trades."""
    # Group trades by instrument
    trades_by_instrument = defaultdict(list)
    for trade in trades:
        trades_by_instrument[trade['instrument']].append(trade)

    all_capital_gains = {}
    for instrument, instrument_trades in trades_by_instrument.items():
        # Sort trades by date
        instrument_trades.sort(key=lambda t: datetime.strptime(t['activity_date'], '%m/%d/%Y'))

        # Separate buys and sells
        buys = [t for t in instrument_trades if t['trans_code'] == 'Buy']
        sells = [t for t in instrument_trades if t['trans_code'] == 'Sell']

        # Implement FIFO logic
        capital_gains = []
        for sell in sells:
            sell_quantity = sell['quantity']
            sell_date = datetime.strptime(sell['activity_date'], '%m/%d/%Y')
            sell_price = sell['price']

            while sell_quantity > 0 and buys:
                buy = buys[0]
                buy_quantity = buy['quantity']
                buy_date = datetime.strptime(buy['activity_date'], '%m/%d/%Y')
                buy_price = buy['price']

                # Determine the quantity to be sold from this buy transaction
                quantity_to_sell = min(sell_quantity, buy_quantity)

                # Calculate gain/loss
                gain_loss = (sell_price - buy_price) * quantity_to_sell

                # Determine holding period
                holding_period = (sell_date - buy_date).days
                gain_type = 'long_term' if holding_period > 365 else 'short_term'

                capital_gains.append({
                    'instrument': instrument,
                    'sell_date': sell['activity_date'],
                    'buy_date': buy['activity_date'],
                    'quantity': quantity_to_sell,
                    'buy_price': buy_price,
                    'sell_price': sell_price,
                    'gain_loss': gain_loss,
                    'gain_type': gain_type
                })

                # Update quantities
                sell_quantity -= quantity_to_sell
                buy['quantity'] -= quantity_to_sell

                # If the buy transaction is fully used, remove it
                if buy['quantity'] <= 0:
                    buys.pop(0)
        all_capital_gains[instrument] = capital_gains
    return all_capital_gains

if __name__ == '__main__':
    from csv_parser import parse_robinhood_csv

    # Example usage:
    file_path = r'C:\Users\Valued Customer\Desktop\code\capitalGainCalc\test.csv'
    trades = parse_robinhood_csv(file_path)
    all_capital_gains = calculate_capital_gains(trades)
    for instrument, gains in all_capital_gains.items():
        print(instrument)
        for gain in gains:
            print(gain)



