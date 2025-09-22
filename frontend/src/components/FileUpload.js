import React, { useMemo, useState } from 'react';
import CapitalGainsDisplay from './CapitalGainsDisplay';
import CapitalGainsSummary from './CapitalGainsSummary';
import LotSelector from './LotSelector';

function FileUpload() {
  const [file, setFile] = useState(null);
  const [capitalGainsData, setCapitalGainsData] = useState(null);
  const [capitalGainsSummary, setCapitalGainsSummary] = useState(null);
  const [unsoldLots, setUnsoldLots] = useState([]);
  const [prices, setPrices] = useState({});
  const [selectedLotIds, setSelectedLotIds] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [showPastYears, setShowPastYears] = useState(false);

  // Drag & drop
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) setFile(f);
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

      setCapitalGainsData(data.gains ?? null);
      setCapitalGainsSummary(data.summary ?? null);

      const lots = Array.isArray(data.unsold_lots) ? data.unsold_lots : [];
      setUnsoldLots(lots);
      setSelectedLotIds({});

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
      const priceMap = data && data.prices ? data.prices : data;
      if (priceMap && typeof priceMap === 'object') {
        setPrices(prev => ({ ...prev, ...priceMap }));
      }
    } catch (e) {
      console.error('Error fetching prices', e);
    }
  }

  function toggleLotSelection(lotId) {
    setSelectedLotIds(prev => {
      const next = { ...prev };
      if (next[lotId]) {
        delete next[lotId];
      } else {
        next[lotId] = true;
      }
      return next;
    });
  }

  const plannedAdditionalGain = useMemo(() => {
    if (!Array.isArray(unsoldLots) || !unsoldLots.length) return 0;
    let total = 0;
    for (const lot of unsoldLots) {
      if (!selectedLotIds[lot.lotId]) continue;
      const current = prices?.[lot.instrument];
      if (typeof current !== 'number') continue;
      total += (current - lot.costBasisPerShare) * lot.qty;
    }
    return total;
  }, [unsoldLots, selectedLotIds, prices]);

  return (
    <div>
      <form onSubmit={handleSubmit} className="upload-form">
        <div
          className={`dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              document.getElementById('file-input')?.click();
            }
          }}
        >
          <div className="dropzone-inner">
            {/* <div className="dropzone-icon">⬆️</div> */}
            <div className="dropzone-text">
              <strong>Drag & drop</strong> your CSV here, or click to browse
            </div>
            {file && <div className="file-name">Selected: {file.name}</div>}
          </div>
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
        <div
          className="upload-actions"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
        >
          <button type="submit" className="btn btn-primary">Upload</button>
          <span className="privacy-note" style={{ textAlign: 'center' }}>
            We do not store your file. It is deleted immediately after processing.
          </span>
        </div>
      </form>

      {capitalGainsSummary && (
        <CapitalGainsSummary
          data={capitalGainsSummary}
          plannedAdditionalGain={plannedAdditionalGain}
          showPastYears={showPastYears}
          onToggleShowPastYears={setShowPastYears}
        />
      )}

      {unsoldLots?.length > 0 && (
        <LotSelector
          lots={unsoldLots}
          prices={prices}
          selectedLotIds={selectedLotIds}
          onToggleLot={toggleLotSelection}
        />
      )}

      {/* <div className="details-toggle">
        <label>
          <input
            type="checkbox"
            checked={showDetails}
            onChange={(e) => setShowDetails(e.target.checked)}
          />
          {' '}Show detailed realized trades (per-lot matches)
        </label>
      </div> */}

      {showDetails && capitalGainsData && (
        <CapitalGainsDisplay data={capitalGainsData} />
      )}
    </div>
  );
}

export default FileUpload;