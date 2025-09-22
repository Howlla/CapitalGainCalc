import React, { useState } from 'react';
import CapitalGainsDisplay from './CapitalGainsDisplay';
import CapitalGainsSummary from './CapitalGainsSummary';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [capitalGainsData, setCapitalGainsData] = useState(null);
  const [capitalGainsSummary, setCapitalGainsSummary] = useState(null);

  // Lot-level unsold inventory for planning: [{ lotId, instrument, qty, costBasisPerShare, purchaseDate }]
  const [unsoldLots, setUnsoldLots] = useState([]);

  // Live prices by symbol (from /api/get_price using yfinance on the backend)
  const [prices, setPrices] = useState({});

  // Planner state keyed by lotId: { [lotId]: qtyToSell }
  const [plannedSales, setPlannedSales] = useState({});

  const handleFileChange = (e) => {
    setFile(e.target.files[0] || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file!');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        console.error('File upload failed', response.status, text);
        alert('Upload failed');
        return;
      }

      const data = await response.json();

      // Expecting:
      // data = { gains, summary, unsold_lots }
      setCapitalGainsData(data.gains ?? null);
      setCapitalGainsSummary(data.summary ?? null);

      const lots = Array.isArray(data.unsold_lots) ? data.unsold_lots : [];
      setUnsoldLots(lots);

      // Reset planner state on new upload
      setPlannedSales({});

      // Fetch current prices for all symbols present in lots
      const symbols = [...new Set(lots.map(l => l.instrument))].filter(Boolean);
      if (symbols.length) {
        await fetchPrices(symbols);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Upload error');
    }
  };

  async function fetchPrices(symbols) {
    const list = symbols.map(s => s.trim()).filter(Boolean).join(',');
    if (!list) return;
    try {
      const res = await fetch(`/api/get_price?tickers=${encodeURIComponent(list)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error('Price fetch failed', res.status, data);
        return;
      }
      // Accept either { prices: {...} } or flat map
      const priceMap = data && data.prices ? data.prices : data;
      if (priceMap && typeof priceMap === 'object') {
        setPrices(prev => ({ ...prev, ...priceMap }));
      }
    } catch (e) {
      console.error('Error fetching prices', e);
    }
  }

  return (
    <div>
      <h2>Upload your CSV file</h2>
      <form onSubmit={handleSubmit}>
        <input type="file" accept=".csv" onChange={handleFileChange} />
        <button type="submit">Upload</button>
      </form>

      {/* Sell planning is integrated into CapitalGainsSummary */}
      <CapitalGainsSummary
        data={capitalGainsSummary}
        unsoldLots={unsoldLots}          // all unsold lots that could be sold this calendar year
        prices={prices}                  // current market prices from yfinance
        plannedSales={plannedSales}      // { [lotId]: qtyToSell }
        onPlannedSalesChange={setPlannedSales}
      />

      <CapitalGainsDisplay data={capitalGainsData} />
    </div>
  );
}

export default FileUpload;