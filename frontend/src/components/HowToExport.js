import React from 'react';

const steps = [
  {
    title: 'Open Account',
    caption: 'Tap the Account tab (person icon) in Robinhood on iPhone.',
    img: '/images/iphone-export-1.png',
  },
  {
    title: 'Statements & History',
    caption: 'Open Statements & History (or Activity → History).',
    img: '/images/iphone-export-2.png',
  },
  {
    title: 'Export CSV',
    caption: 'Choose Export/Download CSV. Select your desired date range.',
    img: '/images/iphone-export-3.png',
  },
  {
    title: 'Save and Upload',
    caption: 'Save to Files, then upload the CSV here.',
    img: '/images/iphone-export-4.png',
  },
];

function HowToExport() {
  return (
    <div className="howto-grid">
      {steps.map((s, idx) => (
        <div className="howto-card" key={idx}>
          <div className="iphone-frame">
            <img
              src={s.img}
              alt={`${s.title} screenshot`}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const parent = e.currentTarget.parentElement;
                if (parent && !parent.querySelector('.placeholder')) {
                  const ph = document.createElement('div');
                  ph.className = 'placeholder';
                  ph.textContent = 'Screenshot';
                  parent.appendChild(ph);
                }
              }}
            />
          </div>
          <h4>{s.title}</h4>
          <p>{s.caption}</p>
        </div>
      ))}
    </div>
  );
}

export default HowToExport;