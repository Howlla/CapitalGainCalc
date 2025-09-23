import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import CapitalGainsSummary from '../components/CapitalGainsSummary';
import GroupedLotSelector from '../components/GroupedLotSelector';
import CapitalGainsDisplay from '../components/CapitalGainsDisplay';
import HowToSellLots from '../components/HowToSellLots';


function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const navResult = location.state?.uploadResult;
  const stored = (() => {
    try {
      return JSON.parse(sessionStorage.getItem('sellall_upload_result') || 'null');
    } catch {
      return null;
    }
  })();

  const initial = navResult || stored;

  const [capitalGainsData, setCapitalGainsData] = useState(initial?.gains ?? null);
  const [capitalGainsSummary, setCapitalGainsSummary] = useState(initial?.summary ?? null);
  const [unsoldLots, setUnsoldLots] = useState(initial?.unsold_lots ?? []);
  const [prices, setPrices] = useState({});
  const [selectedLotIds, setSelectedLotIds] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const [showPastYears, setShowPastYears] = useState(false);

  useEffect(() => {
    if (!initial) {
      navigate('/#upload', { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch prices for lots on this page
  useEffect(() => {
    const symbols = [...new Set((unsoldLots || []).map(l => l.instrument))].filter(Boolean);
    if (!symbols.length) return;

    const list = symbols.map(s => s.trim()).filter(Boolean).join(',');
    if (!list) return;

    let cancelled = false;

    async function fetchPrices() {
      try {
        const res = await fetch(`/api/get_price?tickers=${encodeURIComponent(list)}`);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.error('Price fetch failed', res.status, data);
          return;
        }
        const priceMap = data && data.prices ? data.prices : data;
        if (!cancelled && priceMap && typeof priceMap === 'object') {
          setPrices(prev => ({ ...prev, ...priceMap }));
        }
      } catch (e) {
        console.error('Error fetching prices', e);
      }
    }

    fetchPrices();
    return () => { cancelled = true; };
  }, [unsoldLots]);

  function toggleLotSelection(lotId) {
    setSelectedLotIds(prev => {
      const next = { ...prev };
      if (next[lotId]) delete next[lotId];
      else next[lotId] = true;
      return next;
    });
  }

  // Batch action: if all long-term already selected -> clear ALL lots for ticker; else select all long-term
  function toggleTickerLongTerm(ticker, longTermLots, allLongTermSelected, allLots) {
    setSelectedLotIds(prev => {
      const next = { ...prev };
      if (allLongTermSelected) {
        // Clear all lots (both LT and ST) for this ticker
        for (const lot of allLots || []) {
          if (next[lot.lotId]) delete next[lot.lotId];
        }
      } else {
        // Select all long-term lots for this ticker
        for (const lot of longTermLots || []) {
          next[lot.lotId] = true;
        }
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

  if (!initial) {
    return (
      <div className="container" style={{ padding: '32px 0' }}>
        <p>We couldn’t find your results. Please upload your CSV again.</p>
        <Link to="/#upload" className="btn btn-primary">Go to Upload</Link>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="nav">
        <div className="container nav-inner">
          <a href="/" className="brand" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
            <img src="/images/logo.png" alt="sell-all logo" className="brand-logo" />
            <span className="brand-text">sell-all.com</span>
          </a>
          <nav className="nav-links">
            <a href="/#upload" onClick={(e) => { e.preventDefault(); navigate('/#upload'); }}>Upload another</a>
          </nav>
        </div>
      </header>

      <section className="upload-section">
        <div className="container">
          {capitalGainsSummary && (
            <CapitalGainsSummary
              data={capitalGainsSummary}
              plannedAdditionalGain={plannedAdditionalGain}
              showPastYears={showPastYears}
              onToggleShowPastYears={setShowPastYears}
            />
          )}

          {unsoldLots?.length > 0 && (
            <GroupedLotSelector
              lots={unsoldLots}
              prices={prices}
              selectedLotIds={selectedLotIds}
              onToggleLot={toggleLotSelection}
              onToggleLongTerm={toggleTickerLongTerm}
            />
          )}
{/* 
          <div className="details-toggle">
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
      </section>

      {/* How to sell by tax lot guide */}
      <section className="howto" style={{ paddingTop: 8 }}>
        <div className="container">
          <h2>Sell by tax lot in Robinhood</h2>
          <p className="howto-intro">
            Follow these steps to sell specific lots. Screens vary by app version; use “Specific lot” or “Tax lots” when available.
          </p>
          <HowToSellLots />
        </div>
      </section>

      <footer className="site-footer">
        <div className="container">
          <div className="footer-inner">
            <a href="/" className="brand" onClick={(e) => { e.preventDefault(); navigate('/'); }}>
              <img src="/images/logo.png" alt="sell-all logo" className="brand-logo" />
              <span className="brand-text">sell-all.com</span>
            </a>
            <div className="small muted">© {new Date().getFullYear()} sell-all.com • Cookie‑free analytics</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default ResultsPage;