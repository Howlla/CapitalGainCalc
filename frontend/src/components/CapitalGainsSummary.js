
import React from 'react';

function CapitalGainsSummary({ data }) {
    if (!data) {
        return null;
    }

    return (
        <div>
            <h2>Capital Gains Summary</h2>
            <p>Past Years Capital Gains: {data.past_gains.toFixed(2)}</p>
            <p>Current Year Capital Gains: {data.current_year_gains.toFixed(2)}</p>
        </div>
    );
}

export default CapitalGainsSummary;
