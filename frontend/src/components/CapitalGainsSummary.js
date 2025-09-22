import React from 'react';

// Money is always shown with 2 decimals
const fmtMoney = (n) => (typeof n === 'number' ? n.toFixed(2) : '-');

function CapitalGainsSummary({
  data,
  plannedAdditionalGain = 0,
  showPastYears = false,
  onToggleShowPastYears,
}) {
  if (!data) return null;

  const current = Number(data.current_year_gains ?? 0);
  const projected = current + Number(plannedAdditionalGain ?? 0);

  return (
    <div>
      <h2>Capital Gains Summary</h2>

      <p>
        Current Year Capital Gains: <strong>{fmtMoney(current)}</strong>
      </p>

      {plannedAdditionalGain !== 0 && (
        <p>
          Selected Lots (Projected Additional):{' '}
          <strong>{fmtMoney(plannedAdditionalGain)}</strong>
        </p>
      )}

      {plannedAdditionalGain !== 0 && (
        <p>
          Projected Current-Year Total:{' '}
          <strong>{fmtMoney(projected)}</strong>
        </p>
      )}

      <div style={{ marginTop: 8 }}>
        <label>
          <input
            type="checkbox"
            checked={!!showPastYears}
            onChange={(e) => onToggleShowPastYears?.(e.target.checked)}
          />
          {' '}Show past years capital gains
        </label>
      </div>

      {showPastYears && (
        <p style={{ marginTop: 8 }}>
          Past Years Capital Gains: <strong>{fmtMoney(data.past_gains ?? 0)}</strong>
        </p>
      )}
    </div>
  );
}

export default CapitalGainsSummary;