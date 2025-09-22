import React from 'react';
import FileUpload from './components/FileUpload';
import LandingPage from './components/LandingPage';
import FAQ from './components/FAQ';
import './App.css';

function App() {
  return (
    <div className="App">
      <LandingPage />
      <section id="upload" className="upload-section">
        <div className="container">
          <div className="upload-card">
            <h2>Upload your CSV</h2>
            <p className="muted">
              We currently accept Robinhood trade history exports in CSV format.
            </p>
            <FileUpload />
          </div>
        </div>
      </section>
      <FAQ />
      <footer className="site-footer">
        <div className="container">
          <div className="footer-inner">
            <a href="#" className="brand">
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

export default App;