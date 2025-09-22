import React from 'react';

const steps = [
  {
    title: 'Open your position',
    caption: 'In Robinhood, open the stock you want to sell.',
    img: '/images/iphone-sell-1.png',
  },
  {
    title: 'Trade → Sell',
    caption: 'Tap Trade, then Sell to start a sell order.',
    img: '/images/iphone-sell-2.png',
  },
  {
    title: 'Choose tax lots',
    caption: 'Select “Specific lot” or “Tax lots,” then pick the lots to sell.',
    img: '/images/iphone-sell-3.png',
  },
  {
    title: 'Review lots',
    caption: 'Confirm the selected lots and verify quantity per lot.',
    img: '/images/iphone-sell-4.png',
  }
];

function HowToSellLots() {
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

export default HowToSellLots;