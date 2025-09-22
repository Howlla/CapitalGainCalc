import React, { useMemo, useRef } from 'react';

// Helpers for consistent formatting
const fmtMoney = (n) => (typeof n === 'number' ? n.toFixed(2) : '—');
const fmtQty = (n) => (typeof n === 'number' ? n.toFixed(5) : '—');

// Parse "mm/dd/YYYY" safely without timezone surprises
function parseMDY(mdy) {
  if (!mdy || typeof mdy !== 'string') return null;
  const parts = mdy.split('/');
  if (parts.length !== 3) return null;
  const [m, d, y] = parts.map((p) => parseInt(p, 10));
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}
function addYears(date, years) {
  const dt = new Date(date.getTime());
  dt.setFullYear(dt.getFullYear() + years);
  return dt;
}
function isLongTerm(purchaseDateStr, asOf = new Date()) {
  const p = parseMDY(purchaseDateStr);
  if (!p) return null;
  const anniversary = addYears(p, 1);
  return asOf >= anniversary;
}

function groupLotsByTicker(lots = []) {
  const map = new Map();
  for (const lot of lots) {
    const t = lot.instrument || '—';
    if (!map.has(t)) map.set(t, []);
    map.get(t).push(lot);
  }
  return map;
}

function computeTickerSummary(lots = [], currentPrice) {
  // Returns { totalQty, netPL, gainsOnly, lossesOnly }
  let totalQty = 0;
  let netPL = null;
  let gainsOnly = 0;
  let lossesOnly = 0;
  if (typeof currentPrice !== 'number') {
    totalQty = lots.reduce((s, l) => s + (Number(l.qty) || 0), 0);
    return { totalQty, netPL, gainsOnly: null, lossesOnly: null };
  }
  for (const lot of lots) {
    const qty = Number(lot.qty) || 0;
    const basis = Number(lot.costBasisPerShare) || 0;
    const pl = (currentPrice - basis) * qty;
    totalQty += qty;
    netPL = (netPL ?? 0) + pl;
    if (pl >= 0) gainsOnly += pl;
    else lossesOnly += pl; // negative sum
  }
  return { totalQty, netPL: netPL ?? 0, gainsOnly, lossesOnly };
}

function GroupedLotSelector({
  lots,
  prices,
  selectedLotIds,
  onToggleLot,
  onToggleLongTerm, // (ticker, longTermLots, allLongTermSelected, allLots) => void
}) {
  const asOf = new Date();
  const rootRef = useRef(null);

  const grouped = useMemo(() => groupLotsByTicker(lots || []), [lots]);

  const expandAll = () => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll('details.accordion-item').forEach((el) => { el.open = true; });
  };
  const collapseAll = () => {
    const root = rootRef.current;
    if (!root) return;
    root.querySelectorAll('details.accordion-item').forEach((el) => { el.open = false; });
  };

  return (
    <div className="accordion" ref={rootRef}>
      <div className="accordion-toolbar">
        <h2>Your tax lots by ticker</h2>
        <div className="accordion-actions">
          <button type="button" className="btn btn-accent-outline small" onClick={expandAll}>
            Expand all
          </button>
          <button type="button" className="btn btn-danger-outline small" onClick={collapseAll}>
            Collapse all
          </button>
        </div>
      </div>

      {[...grouped.entries()].map(([ticker, tlots]) => {
        const price = prices?.[ticker];
        const { totalQty, netPL, gainsOnly, lossesOnly } = computeTickerSummary(tlots, price);

        // Long-term subset and selection status
        const longTermLots = tlots.filter((l) => isLongTerm(l.purchaseDate, asOf) === true);
        const longTermSelectedCount = longTermLots.reduce((s, l) => s + (selectedLotIds?.[l.lotId] ? 1 : 0), 0);
        const allLongTermSelected = longTermLots.length > 0 && longTermSelectedCount === longTermLots.length;

        return (
          <details className="accordion-item" key={ticker}>
            <summary className="accordion-header" role="button">
              <div className="header-left">
                <span className="chevron" aria-hidden="true" />
                <div className="ticker-cell">
                  <div className="ticker">{ticker}</div>
                  <div className="sub">
                    Price: {typeof price === 'number' ? `$${fmtMoney(price)}` : '—'} • Qty: {fmtQty(totalQty)}
                  </div>
                </div>
              </div>

              <div className="pl-summary">
                <span className={`badge ${typeof netPL === 'number' ? (netPL >= 0 ? 'pl-pos' : 'pl-neg') : 'muted'}`}>
                  Net {typeof netPL === 'number' ? (netPL >= 0 ? 'Gain' : 'Loss') : 'P/L'}:{' '}
                  {typeof netPL === 'number' ? `$${fmtMoney(Math.abs(netPL))}` : '—'}
                </span>
                <span className="badge outline">
                  Gains: {typeof gainsOnly === 'number' ? `$${fmtMoney(gainsOnly)}` : '—'}
                </span>
                <span className="badge outline">
                  Losses: {typeof lossesOnly === 'number' ? `$${fmtMoney(Math.abs(lossesOnly))}` : '—'}
                </span>
                <button
                  type="button"
                  className="btn btn-accent-outline small"
                  disabled={longTermLots.length === 0}
                  title={longTermLots.length === 0 ? 'No long‑term lots for this ticker yet' : undefined}
                  onClick={(e) => {
                    e.preventDefault(); // don't toggle the details element
                    if (onToggleLongTerm) {
                      onToggleLongTerm(ticker, longTermLots, allLongTermSelected, tlots);
                    } else {
                      if (allLongTermSelected) {
                        tlots.forEach((lot) => {
                          if (selectedLotIds?.[lot.lotId]) onToggleLot?.(lot.lotId);
                        });
                      } else {
                        longTermLots.forEach((lot) => {
                          if (!selectedLotIds?.[lot.lotId]) onToggleLot?.(lot.lotId);
                        });
                      }
                    }
                  }}
                >
                  {allLongTermSelected ? 'Clear all' : 'Select all long‑term tax lots'}
                </button>
              </div>
            </summary>

            <div className="accordion-body">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th className="select-col">Select</th>
                      <th>Quantity</th>
                      <th>Cost Basis/Share</th>
                      <th>Current Price</th>
                      <th>Unrealized P/L</th>
                      <th>Term</th>
                      <th>Purchase Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tlots.map((lot) => {
                      const checked = !!selectedLotIds?.[lot.lotId];
                      const current = price;
                      const unrealized =
                        typeof current === 'number'
                          ? (current - Number(lot.costBasisPerShare || 0)) * Number(lot.qty || 0)
                          : null;
                      const lt = isLongTerm(lot.purchaseDate, asOf);
                      const termLabel = lt == null ? '—' : lt ? 'Long-term' : 'Short-term';
                      const checkboxId = `lot-check-${lot.lotId}`;

                      return (
                        <tr key={lot.lotId}>
                          <td className="select-cell">
                            <label className="checkbox" htmlFor={checkboxId}>
                              <input
                                id={checkboxId}
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggleLot?.(lot.lotId)}
                                aria-label={`Select lot ${lot.lotId}`}
                              />
                              <span className="cb-box" aria-hidden="true">
                                <svg
                                  className="cb-icon"
                                  viewBox="0 0 24 24"
                                  focusable="false"
                                  aria-hidden="true"
                                >
                                  <path d="M5 12l4 4 10-10" />
                                </svg>
                              </span>
                            </label>
                          </td>
                          <td>{fmtQty(lot.qty)}</td>
                          <td>{fmtMoney(lot.costBasisPerShare)}</td>
                          <td>{typeof current === 'number' ? fmtMoney(current) : '—'}</td>
                          <td className={typeof unrealized === 'number' ? (unrealized >= 0 ? 'pl-pos' : 'pl-neg') : ''}>
                            {typeof unrealized === 'number' ? fmtMoney(unrealized) : '—'}
                          </td>
                          <td>{termLabel}</td>
                          <td>{lot.purchaseDate || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </details>
        );
      })}
    </div>
  );
}

export default GroupedLotSelector;