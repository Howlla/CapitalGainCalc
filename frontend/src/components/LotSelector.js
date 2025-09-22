import React from 'react';

// Helpers for consistent formatting
const fmtMoney = (n) => (typeof n === 'number' ? n.toFixed(2) : '-');
const fmtQty = (n) => (typeof n === 'number' ? n.toFixed(5) : '-');

// Parse "mm/dd/YYYY" safely without timezone surprises
function parseMDY(mdy) {
  if (!mdy || typeof mdy !== 'string') return null;
  const parts = mdy.split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map((p) => parseInt(p, 10));
  if (!y || !m || !d) return null;
  // Create local date
  return new Date(y, m - 1, d);
}

function addYears(date, years) {
  const dt = new Date(date.getTime());
  dt.setFullYear(dt.getFullYear() + years);
  return dt;
}

// Long-term if as-of date is on/after purchase date + 1 year
function isLongTerm(purchaseDateStr, asOf = new Date()) {
  const p = parseMDY(purchaseDateStr);
  if (!p) return null; // unknown
  const anniversary = addYears(p, 1);
  return asOf >= anniversary;
}

function LotSelector({ lots, prices, selectedLotIds, onToggleLot }) {
  if (!Array.isArray(lots) || lots.length === 0) return null;

  const asOf = new Date();

  return (
    <div>
      <h2>Tax Lots (Select to plan sales)</h2>
      <table>
        <thead>
          <tr>
            <th>Select</th>
            <th>Ticker</th>
            <th>Quantity</th>
            <th>Cost Basis/Share</th>
            <th>Current Price</th>
            <th>Unrealized P/L</th>
            <th>Term</th>
            <th>Purchase Date</th>
          </tr>
        </thead>
        <tbody>
          {lots.map((lot) => {
            const { lotId, instrument, qty, costBasisPerShare, purchaseDate } = lot;
            const current = prices?.[instrument];
            const unrealized =
              typeof current === 'number'
                ? (current - costBasisPerShare) * qty
                : null;
            const checked = !!selectedLotIds[lotId];

            const lt = isLongTerm(purchaseDate, asOf);
            const termLabel = lt == null ? '—' : lt ? 'Long-term' : 'Short-term';

            return (
              <tr key={lotId}>
                <td>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleLot(lotId)}
                    aria-label={`Select lot ${lotId}`}
                  />
                </td>
                <td>{instrument}</td>
                <td>{fmtQty(qty)}</td>
                <td>{fmtMoney(costBasisPerShare)}</td>
                <td>{typeof current === 'number' ? fmtMoney(current) : '—'}</td>
                <td>{typeof unrealized === 'number' ? fmtMoney(unrealized) : '—'}</td>
                <td>{termLabel}</td>
                <td>{purchaseDate || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default LotSelector;