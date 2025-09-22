import React from 'react';

function CapitalGainsSummary({
  data,
  unsoldLots = [],
  prices = {},
  plannedSales = {},
  onPlannedSalesChange = () => {},
}) {
  if (!data) {
    return null;
  }

  const past = Number(data?.past_gains ?? 0).toFixed(2);
  const current = Number(data?.current_year_gains ?? 0).toFixed(2);

  return (
    <div>
      <h2>Capital Gains Summary</h2>
      <p>Past Years Capital Gains: {past}</p>
      <p>Current Year Capital Gains: {current}</p>

      {/* Minimal visibility to confirm the new backend data is arriving */}
      {Array.isArray(unsoldLots) && unsoldLots.length > 0 && (
        <>
          <h3>Unsold Lots</h3>
          <table>
            <thead>
              <tr>
                <th>Instrument</th>
                <th>Lot ID</th>
                <th>Qty</th>
                <th>Cost Basis</th>
                <th>Purchase Date</th>
                <th>Current Price</th>
              </tr>
            </thead>
            <tbody>
              {unsoldLots.map((lot) => (
                <tr key={lot.lotId}>
                  <td>{lot.instrument}</td>
                  <td>{lot.lotId}</td>
                  <td>{lot.qty}</td>
                  <td>{lot.costBasisPerShare}</td>
                  <td>{lot.purchaseDate}</td>
                  <td>{prices?.[lot.instrument] ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}

export default CapitalGainsSummary;