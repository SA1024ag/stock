import React, { useState } from 'react';
import api from '../services/api';
import './StockPredictionSimulator.css';

const StockPredictionSimulator = ({ symbol, currentPrice }) => {
    const [inflation, setInflation] = useState(5);
    const [interestRate, setInterestRate] = useState(3);

    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handlePredict = async () => {
        setLoading(true);
        setError(null);
        setPrediction(null);

        try {
            const response = await api.post('/ai/predict', {
                symbol,
                currentPrice,
                parameters: {
                    inflation,
                    interestRate,

                }
            });
            setPrediction(response.data);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to generate prediction');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="prediction-simulator-card glass-panel">
            <h3>🔮 Future Price Simulator</h3>
            <p className="text-secondary text-sm mb-4">
                Adjust economic parameters to see how they might affect {symbol}'s price in the next 6-12 months.
            </p>

            <div className="simulator-controls">
                <div className="control-group">
                    <label>Inflation Rate: {inflation}%</label>
                    <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.5"
                        value={inflation}
                        onChange={(e) => setInflation(parseFloat(e.target.value))}
                    />
                    <div className="range-labels">
                        <span>Low</span>
                        <span>High</span>
                    </div>
                </div>

                <div className="control-group">
                    <label>Interest Rate: {interestRate}%</label>
                    <input
                        type="range"
                        min="0"
                        max="15"
                        step="0.25"
                        value={interestRate}
                        onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                    />
                    <div className="range-labels">
                        <span>Low</span>
                        <span>High</span>
                    </div>
                </div>



                <button
                    className="predict-btn"
                    onClick={handlePredict}
                    disabled={loading}
                >
                    {loading ? 'Analyzing...' : 'Predict Future Price'}
                </button>
            </div>

            {error && <div className="error-message mt-4">{error}</div>}

            {prediction && (
                <div className="prediction-results mt-4">
                    <div className="price-range">
                        <div className="range-item low">
                            <span className="label">Likely Low</span>
                            <span className="value">₹{prediction.predicted_low?.toFixed(2) || 'N/A'}</span>
                        </div>
                        <div className="range-arrow">➜</div>
                        <div className="range-item high">
                            <span className="label">Likely High</span>
                            <span className="value">₹{prediction.predicted_high?.toFixed(2) || 'N/A'}</span>
                        </div>
                    </div>



                    <div className="prediction-reasoning mt-3">
                        <p><strong>Analysis:</strong> {prediction.reasoning}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockPredictionSimulator;
