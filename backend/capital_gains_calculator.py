from collections import defaultdict
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

def _parse_date(s: str) -> datetime:
    """
    Parse a date string from multiple common formats into a datetime.
    """
    raw = (s or "").strip()
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            pass
    if " " in raw:
        token = raw.split(" ", 1)[0]
        for fmt in DATE_FORMATS:
            try:
                return datetime.strptime(token, fmt)
            except ValueError:
                pass
    # Fallback: expect mm/dd/YYYY
    return datetime.strptime(raw, "%m/%d/%Y")

def calculate_capital_gains_summary(all_capital_gains_by_instrument):
    """Calculates a summary of capital gains split by past vs current year realized trades."""
    today = datetime.today()
    current_year = today.year

    past_gains = 0.0
    current_year_gains = 0.0

    for instrument, gains in all_capital_gains_by_instrument.items():
        for gain in gains:
            sell_date = _parse_date(gain['sell_date'])
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
    - remaining_tickers: [ "AAPL", "MSFT", ... ]
    Splits (SPL) are handled as extra shares credited on the split date. We compute the
    split ratio from current holdings: ratio = 1 + extra_shares / pre_split_total_qty,
    and proportionally adjust all open lots (qty *= ratio, price /= ratio).
    """
    # Group trades by instrument
    trades_by_instrument = defaultdict(list)
    for trade in trades:
        trades_by_instrument[trade['instrument']].append(trade)

    all_capital_gains = {}
    all_unsold_lots = []

    for instrument, instrument_trades in trades_by_instrument.items():
        # Build chronological event list: Buy, Sell, SPL (ignore CDIV for gains)
        events = []
        for t in instrument_trades:
            code = t.get('trans_code')
            if code not in ('Buy', 'Sell', 'SPL'):
                continue
            dt = _parse_date(t['activity_date'])
            if code == 'Buy':
                events.append({
                    'type': 'Buy',
                    'date': dt,
                    'activity_date': t['activity_date'],
                    'quantity': float(t.get('quantity', 0.0)),
                    'price': float(t.get('price', 0.0)),
                })
            elif code == 'Sell':
                events.append({
                    'type': 'Sell',
                    'date': dt,
                    'activity_date': t['activity_date'],
                    'quantity': float(t.get('quantity', 0.0)),
                    'price': float(t.get('price', 0.0)),
                })
            elif code == 'SPL':
                events.append({
                    'type': 'SPL',
                    'date': dt,
                    'activity_date': t['activity_date'],
                    'extra_shares': float(t.get('extra_shares', 0.0)),
                })

        # Order events: splits first on a given day (effective before trading), then buys, then sells
        type_order = {'SPL': 0, 'Buy': 1, 'Sell': 2}
        events.sort(key=lambda e: (e['date'], type_order[e['type']]))

        # Event-driven FIFO inventory and gains
        buy_lots = []
        date_seq = defaultdict(int)  # sequence per date for stable lot ids
        capital_gains = []

        for ev in events:
            if ev['type'] == 'Buy':
                buy_dt = ev['date']
                seq = date_seq[buy_dt.date()]
                lot_id = _stable_lot_id(instrument, buy_dt, seq)
                date_seq[buy_dt.date()] += 1

                buy_lots.append({
                    'lotId': lot_id,
                    'instrument': instrument,
                    'activity_date': ev['activity_date'],  # keep original string for UI
                    'price': ev['price'],                  # cost basis per share
                    'quantity': ev['quantity'],            # remaining qty
                })

            elif ev['type'] == 'SPL':
                extra = ev.get('extra_shares', 0.0) or 0.0
                if extra <= 0 or not buy_lots:
                    # No holdings or no extra shares -> nothing to do
                    continue
                pre_total = sum(float(l['quantity']) for l in buy_lots)
                if pre_total <= 0:
                    continue
                ratio = 1.0 + (extra / pre_total)
                # Proportionally scale all open lots
                for l in buy_lots:
                    l['quantity'] = float(l['quantity']) * ratio
                    # Adjust per-share basis down so total basis stays the same
                    if ratio != 0:
                        l['price'] = float(l['price']) / ratio

            elif ev['type'] == 'Sell':
                sell_quantity = ev['quantity']
                sell_date = ev['date']
                sell_price = ev['price']

                while sell_quantity > 0 and buy_lots:
                    buy = buy_lots[0]
                    buy_quantity = float(buy['quantity'])
                    buy_date = _parse_date(buy['activity_date'])
                    buy_price = float(buy['price'])

                    quantity_to_sell = min(sell_quantity, buy_quantity)
                    gain_loss = (sell_price - buy_price) * quantity_to_sell

                    holding_period_days = (sell_date - buy_date).days
                    gain_type = 'long_term' if holding_period_days > 365 else 'short_term'

                    capital_gains.append({
                        'instrument': instrument,
                        'sell_date': ev['activity_date'],
                        'buy_date': buy['activity_date'],
                        'quantity': quantity_to_sell,
                        'buy_price': buy_price,
                        'sell_price': sell_price,
                        'gain_loss': gain_loss,
                        'gain_type': gain_type,
                    })

                    # Update quantities
                    sell_quantity -= quantity_to_sell
                    buy['quantity'] = buy_quantity - quantity_to_sell

                    # If the buy lot is fully used, remove it
                    if buy['quantity'] <= 0:
                        buy_lots.pop(0)

                # Extra sells beyond total buys (if any) are ignored.

        all_capital_gains[instrument] = capital_gains

        # Remaining buy lots are unsold inventory
        for buy in buy_lots:
            if float(buy['quantity']) > 0:
                all_unsold_lots.append({
                    'lotId': buy['lotId'],
                    'instrument': instrument,
                    'qty': float(buy['quantity']),
                    'costBasisPerShare': float(buy['price']),
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