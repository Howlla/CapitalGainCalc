import React from 'react';
import HowToExport from './HowToExport';

function LandingPage() {
  return (
    <div>
      <header className="nav">
        <div className="container nav-inner">
          <a href="#" className="brand">
            <img src="/images/logo.png" alt="sell-all logo" className="brand-logo" />
            {/* <span className="brand-text">sell-all.com</span> */}
          </a>
          <nav className="nav-links">
            <a href="#howto">How to export</a>
            <a href="#faq">FAQ</a>
            <a href="#upload" className="btn btn-ghost">Upload trades</a>
          </nav>
        </div>
      </header>

      <section className="hero">
        <div className="container hero-inner">
          <h1>Sell smarter. Protect your money.</h1>
          <p className="subtitle">
            Plan your finances. Prepare for unexpected. No signups needed.
          </p>
          <div className="cta-row">
            <a href="#upload" className="btn btn-primary">Upload your trades</a>
          </div>
          <p className="hero-note">
            See realized gains, model scenarios by lot, and avoid surprises.
          </p>
        </div>
      </section>

      <section className="features">
        <div className="container features-grid">
          <div className="feature-card">
            <h3>Protect your money</h3>
            <p>Understand tax impact before you sell. Avoid costly mistakes.</p>
          </div>
          <div className="feature-card">
            <h3>Plan your finances</h3>
            <p>Select lots, set targets, and project current‑year totals.</p>
          </div>
          <div className="feature-card">
            <h3>Prepare for unexpected</h3>
            <p>Run what‑ifs with live prices and your actual holdings.</p>
          </div>
          <div className="feature-card">
            <h3>No signups needed</h3>
            <p>Use it instantly. Upload, plan your sells, execute trades.</p>
          </div>
        </div>
      </section>

      <section id="howto" className="howto">
        <div className="container">
          <h2>Export your Robinhood data</h2>
          <p className="howto-intro">
            Follow these steps on your phone, then upload the CSV below.
          </p>
          <HowToExport />
        </div>
      </section>
    </div>
  );
}

export default LandingPage;