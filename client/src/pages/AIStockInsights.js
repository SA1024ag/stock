import React, { useState } from 'react';
import api from '../services/api';
import './AIPages.css';

const AIStockInsights = () => {
    const [symbol, setSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' or 'prediction'
    const [analysis, setAnalysis] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [error, setError] = useState('');

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!symbol.trim()) return;

        setLoading(true);
        setError('');

        try {
            if (activeTab === 'analysis') {
                const res = await api.post('/ai/analyze', { symbol: symbol.toUpperCase() });
                setAnalysis(res.data);
            } else {
                // Call the new Prediction Endpoint
                const res = await api.post('/ai/predict', { symbol: symbol.toUpperCase() });
                setPrediction(res.data);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch data. Is the Python service running?');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-page">
            <div className="page-header">
                <h1>🤖 AI Stock Intelligence</h1>
                <p className="page-subtitle">Deep learning models & fundamental analysis</p>
            </div>

            {/* Tab Switcher */}
            <div className="tabs-container" style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    className={`btn ${activeTab === 'analysis' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('analysis')}
                >
                    📝 Fundamental Analysis
                </button>
                <button
                    className={`btn ${activeTab === 'prediction' ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => setActiveTab('prediction')}
                >
                    📈 Price Prediction (LSTM)
                </button>
            </div>

            <div className="ai-search-section">
                <form onSubmit={handleSearch} className="ai-search-form">
                    <div className="search-input-group">
                        <input
                            type="text"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            placeholder={activeTab === 'analysis' ? "Analyze AAPL..." : "Predict Prices for RELIANCE..."}
                            className="ai-search-input"
                        />
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? <span className="spinner"></span> : 'Go'}
                        </button>
                    </div>
                </form>
                {error && <div className="alert alert-error">{error}</div>}
            </div>

            {/* RENDER PREDICTION RESULTS */}
            {activeTab === 'prediction' && prediction && (
                <div className="prediction-results fade-in">
                    <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
                        <h2>🔮 30-Day Forecast: {prediction.ticker}</h2>

                        {/* Display the Plot from Base64 */}
                        <div className="chart-container" style={{ marginTop: '20px', borderRadius: '10px', overflow: 'hidden' }}>
                            <img
                                src={`data:image/png;base64,${prediction.plot}`}
                                alt="Prediction Chart"
                                style={{ width: '100%', height: 'auto' }}
                            />
                        </div>

                        {/* Metrics Grid */}
                        <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginTop: '20px' }}>
                            <div className="metric-card">
                                <small>Root Mean Sq Error</small>
                                <h3>{prediction.metrics.rmse.toFixed(2)}</h3>
                            </div>
                            <div className="metric-card">
                                <small>Accuracy Trend</small>
                                <h3 className={prediction.metrics.directional_accuracy > 50 ? 'text-green' : 'text-red'}>
                                    {prediction.metrics.directional_accuracy.toFixed(1)}%
                                </h3>
                            </div>
                            <div className="metric-card">
                                <small>Last Actual</small>
                                <h3>₹{prediction.last_actual_price.toFixed(2)}</h3>
                            </div>
                            <div className="metric-card">
                                <small>Predicted Next</small>
                                <h3>₹{prediction.last_predicted_price.toFixed(2)}</h3>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'analysis' && analysis && (
                <div className="ai-results">
                    <div className="ai-analysis-card glass-panel">
                        <div className="analysis-header">
                            <h3>🧠 Smart Analysis</h3>
                            <span className="ai-badge">Powered by Groq AI</span>
                        </div>
                        <div className="analysis-content formatted-analysis">
                            {analysis.analysis.split('\n').map((line, index) => {
                                const trimmed = line.trim();
                                if (!trimmed) return null;

                                // Section headers with emoji
                                if (trimmed.match(/^[📊⚠️💡🎯📈✨]/)) {
                                    return <h4 key={index} className="analysis-section-header">{trimmed}</h4>;
                                }

                                // Section headers ending with ':'
                                if (trimmed.endsWith(':') && !trimmed.startsWith('-')) {
                                    return <h4 key={index} className="analysis-section-header">{trimmed}</h4>;
                                }

                                // Bullet points
                                if (trimmed.startsWith('-')) {
                                    return <li key={index} className="analysis-bullet">{trimmed.substring(1).trim()}</li>;
                                }

                                // Regular paragraphs
                                return <p key={index} className="analysis-text">{trimmed}</p>;
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIStockInsights;