import React from 'react';

function FAQ() {
  const items = [
    {
      q: 'Do you store my CSV?',
      a: 'No. Your file is processed to compute your lots and gains, then deleted immediately after processing. We do not retain your file.',
    },
    {
      q: 'What broker exports are supported?',
      a: 'Robinhood CSV is supported today. Other brokers can be added—tell us what you need.',
    },
    {
      q: 'How do you classify short-term vs long-term?',
      a: 'We use purchase date vs. sale date or today (for planning) to determine holding period.',
    },
    {
      q: 'What about wash sales and stock splits?',
      a: 'We flag and adjust for wash sales and handle stock splits so quantities and bases stay correct.',
    },
    {
      q: 'Is this tax advice?',
      a: 'No. This tool is for planning and insights. Consult a tax professional for advice.',
    },
  ];

  return (
    <section id="faq" className="faq">
      <div className="container">
        <h2>FAQ</h2>
        <div className="faq-grid">
          {items.map((it, i) => (
            <details key={i} className="faq-item">
              <summary>{it.q}</summary>
              <p>{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;