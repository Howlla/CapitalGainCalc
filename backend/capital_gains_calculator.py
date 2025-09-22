from collections import defaultdict
from datetime import datetime

def calculate_capital_gains_summary(all_capital_gains_by_instrument):
    """Calculates a summary of capital gains split by past vs current year realized trades."""
    today = datetime.today()
    current_year = today.year

    past_gains = 0.0
    current_year_gains = 0.0

    for instrument, gains in all_capital_gains_by_instrument.items():
        for gain in gains:
            sell_date = datetime.strptime(gain['sell_date'], '%m/%d/%Y')
            if sell_date.year < current_year:
                past_gains += gain['gain_loss']
            else:
                current_year_gains += gain['gain_loss']

    return {
        'past_gains': past_gains,
        'current_year_gains': current_year_gains,
    }

def _stable_lot_id(instrument: str, buy_dt: datetime, seq: int) -> str:
    """
    Build a stable lot id from instrument, ISO date, and a per-date sequence.
    Example: AAPL-20230110-0
    """
    return f"{instrument}-{buy_dt.strftime('%Y%m%d')}-{seq}"

def calculate_capital_gains(trades):
    """
    Calculates realized capital gains using FIFO and returns:
    - gains: { instrument: [ {sell_date, buy_date, quantity, buy_price, sell_price, gain_loss, gain_type} ] }
    - summary: { past_gains, current_year_gains }
    - unsold_lots: [ { lotId, instrument, qty, costBasisPerShare, purchaseDate } ]
    - remaining_tickers: [ "AAPL", "MSFT", ... ]   (backward compatibility)
    """
    # Group trades by instrument
    trades_by_instrument = defaultdict(list)
    for trade in trades:
        trades_by_instrument[trade['instrument']].append(trade)

    all_capital_gains = {}
    all_unsold_lots = []

    for instrument, instrument_trades in trades_by_instrument.items():
        # Sort trades by date
        instrument_trades.sort(key=lambda t: datetime.strptime(t['activity_date'], '%m/%d/%Y'))

        # Split buys and sells
        raw_buys = [t for t in instrument_trades if t['trans_code'] == 'Buy']
        sells = [t for t in instrument_trades if t['trans_code'] == 'Sell']

        # Create explicit buy lots with stable lot IDs
        date_seq = defaultdict(int)  # per purchase date sequence
        buy_lots = []
        for b in raw_buys:
            buy_dt = datetime.strptime(b['activity_date'], '%m/%d/%Y')
            seq = date_seq[buy_dt.date()]
            lot_id = _stable_lot_id(instrument, buy_dt, seq)
            date_seq[buy_dt.date()] += 1

            buy_lots.append({
                'lotId': lot_id,
                'instrument': instrument,
                'activity_date': b['activity_date'],  # mm/dd/YYYY (kept as-is for UI)
                'price': b['price'],                  # cost basis per share
                'quantity': b['quantity'],            # remaining qty (will be decremented)
            })

        # FIFO matching
        capital_gains = []
        for sell in sells:
            sell_quantity = sell['quantity']
            sell_date = datetime.strptime(sell['activity_date'], '%m/%d/%Y')
            sell_price = sell['price']

            while sell_quantity > 0 and buy_lots:
                buy = buy_lots[0]
                buy_quantity = buy['quantity']
                buy_date = datetime.strptime(buy['activity_date'], '%m/%d/%Y')
                buy_price = buy['price']

                # Determine the quantity to be sold from this buy lot
                quantity_to_sell = min(sell_quantity, buy_quantity)

                # Calculate gain/loss
                gain_loss = (sell_price - buy_price) * quantity_to_sell

                # Determine holding period
                holding_period_days = (sell_date - buy_date).days
                gain_type = 'long_term' if holding_period_days > 365 else 'short_term'

                capital_gains.append({
                    'instrument': instrument,
                    'sell_date': sell['activity_date'],
                    'buy_date': buy['activity_date'],
                    'quantity': quantity_to_sell,
                    'buy_price': buy_price,
                    'sell_price': sell_price,
                    'gain_loss': gain_loss,
                    'gain_type': gain_type,
                })

                # Update quantities
                sell_quantity -= quantity_to_sell
                buy['quantity'] -= quantity_to_sell

                # If the buy lot is fully used, remove it
                if buy['quantity'] <= 0:
                    buy_lots.pop(0)

            # Extra sells beyond total buys (if any) are ignored.

        all_capital_gains[instrument] = capital_gains

        # Remaining buy lots are unsold inventory
        for buy in buy_lots:
            if buy['quantity'] > 0:
                all_unsold_lots.append({
                    'lotId': buy['lotId'],
                    'instrument': instrument,
                    'qty': buy['quantity'],
                    'costBasisPerShare': buy['price'],
                    'purchaseDate': buy['activity_date'],
                })

    # Build summary
    summary = calculate_capital_gains_summary(all_capital_gains)

    # Backward compatibility for existing frontend
    remaining_tickers = sorted(list({lot['instrument'] for lot in all_unsold_lots}))

    return {
        'gains': all_capital_gains,
        'summary': summary,
        'unsold_lots': all_unsold_lots,
        'remaining_tickers': remaining_tickers,
    }