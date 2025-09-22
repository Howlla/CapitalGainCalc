import React, { useState } from 'react';
import CapitalGainsDisplay from './CapitalGainsDisplay';
import CapitalGainsSummary from './CapitalGainsSummary';
import SellPlanner from './SellPlanner';

function FileUpload() {
    const [file, setFile] = useState(null);
    const [capitalGainsData, setCapitalGainsData] = useState(null);
    const [capitalGainsSummary, setCapitalGainsSummary] = useState(null);
    const [remainingTickers, setRemainingTickers] = useState([]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
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

            if (response.ok) {
                const data = await response.json();
                setCapitalGainsData(data.gains);
                setCapitalGainsSummary(data.summary);
                setRemainingTickers(data.remaining_tickers);
            } else {
                console.error('File upload failed');
            }
        } catch (error) {
            console.error('Error uploading file:', error);
        }
    };

    return (
        <div>
            <h2>Upload your CSV file</h2>
            <form onSubmit={handleSubmit}>
                <input type="file" onChange={handleFileChange} />
                <button type="submit">Upload</button>
            </form>
            <CapitalGainsSummary data={capitalGainsSummary} />
            <CapitalGainsDisplay data={capitalGainsData} />
            <SellPlanner remainingTickers={remainingTickers} />
        </div>
    );
}

export default FileUpload;