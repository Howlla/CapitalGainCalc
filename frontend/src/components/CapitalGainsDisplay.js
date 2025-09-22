
import React from 'react';

function CapitalGainsDisplay({ data }) {
    if (!data) {
        return null;
    }

    return (
        <div>
            <h2>Capital Gains</h2>
            {Object.keys(data).map((instrument) => (
                <div key={instrument}>
                    <h3>{instrument}</h3>
                    <table>
                        <thead>
                            <tr>
                                <th>Sell Date</th>
                                <th>Buy Date</th>
                                <th>Quantity</th>
                                <th>Buy Price</th>
                                <th>Sell Price</th>
                                <th>Gain/Loss</th>
                                <th>Gain Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data[instrument].map((gain, index) => (
                                <tr key={index}>
                                    <td>{gain.sell_date}</td>
                                    <td>{gain.buy_date}</td>
                                    <td>{gain.quantity}</td>
                                    <td>{gain.buy_price}</td>
                                    <td>{gain.sell_price}</td>
                                    <td>{gain.gain_loss.toFixed(2)}</td>
                                    <td>{gain.gain_type}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}

export default CapitalGainsDisplay;
