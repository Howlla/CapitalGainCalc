
import React, { useState, useEffect } from 'react';

function SellPlanner({ remainingTickers }) {
    const [prices, setPrices] = useState(null);

    useEffect(() => {
        const fetchPrices = async () => {
            if (remainingTickers && remainingTickers.length > 0) {
                try {
                    const response = await fetch(`/api/get_price?tickers=${remainingTickers.join(',')}`);
                    if (response.ok) {
                        const data = await response.json();
                        setPrices(data);
                    } else {
                        console.error('Failed to fetch prices');
                    }
                } catch (error) {
                    console.error('Error fetching prices:', error);
                }
            }
        };

        fetchPrices();
    }, [remainingTickers]);

    return (
        <div>
            <h2>Sell Planner</h2>
            {prices && (
                <table>
                    <thead>
                        <tr>
                            <th>Ticker</th>
                            <th>Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(prices).map((ticker) => (
                            <tr key={ticker}>
                                <td>{ticker}</td>
                                <td>{prices[ticker]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

export default SellPlanner;
