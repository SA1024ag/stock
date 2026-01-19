import React, { useState } from 'react';
import api from '../services/api';
import './AIPages.css';

const AIStockInsights = () => {
    const [symbol, setSymbol] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState('');

    const handleAnalyze = async (e) => {
        e.preventDefault();

        if (!symbol.trim()) {
            setError('Please enter a stock symbol');
            return;
        }

        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const token = localStorage.getItem('token');
            const response = await api.post(
                '/ai/analyze',
                { symbol: symbol.toUpperCase() },
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setAnalysis(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to analyze stock');
            console.error('Analysis error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-page">
            <div className="page-header">
                <h1>🤖 AI Stock Insights</h1>
                <p className="page-subtitle">Get AI-powered analysis and insights for any stock</p>
            </div>

            <div className="ai-search-section">
                <form onSubmit={handleAnalyze} className="ai-search-form">
                    <div className="search-input-group">
                        <input
                            type="text"
                            value={symbol}
                            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            placeholder="Enter stock symbol (e.g., AAPL, TSLA, GOOGL)"
                            className="ai-search-input"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            className="btn btn-primary ai-analyze-btn"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <span>📊</span>
                                    Analyze
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}
            </div>

            {analysis && (
                <div className="ai-results">
                    <div className="stock-info-card glass-panel">
                        <div className="stock-header">
                            <h2>{analysis.symbol}</h2>
                            <div className={`price-badge ${analysis.stockData.change >= 0 ? 'positive' : 'negative'}`}>
                                ₹{analysis.stockData.price.toFixed(2)}
                            </div>
                        </div>

                        <div className="stock-metrics">
                            <div className="metric">
                                <span className="metric-label">Change</span>
                                <span className={`metric-value ${analysis.stockData.change >= 0 ? 'text-green' : 'text-red'}`}>
                                    {analysis.stockData.change >= 0 ? '+' : ''}
                                    {analysis.stockData.change.toFixed(2)} ({analysis.stockData.changePercent.toFixed(2)}%)
                                </span>
                            </div>
                            <div className="metric">
                                <span className="metric-label">Volume</span>
                                <span className="metric-value">{analysis.stockData.volume.toLocaleString()}</span>
                            </div>
                            <div className="metric">
                                <span className="metric-label">52W High</span>
                                <span className="metric-value">₹{analysis.stockData.high.toFixed(2)}</span>
                            </div>
                            <div className="metric">
                                <span className="metric-label">52W Low</span>
                                <span className="metric-value">₹{analysis.stockData.low.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="ai-analysis-card glass-panel">
                        <div className="analysis-header">
                            <h3>🧠 AI Analysis</h3>
                            <span className="ai-badge">Powered by Groq AI</span>
                        </div>
                        <div className="analysis-content">
                            {analysis.analysis.split('\n').map((paragraph, index) => (
                                paragraph.trim() && <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {!analysis && !loading && (
                <div className="empty-state">
                    <div className="empty-icon">📈</div>
                    <h3>Ready to Analyze</h3>
                    <p>Enter a stock symbol above to get AI-powered insights and analysis</p>
                </div>
            )}
        </div>
    );
};

export default AIStockInsights;
