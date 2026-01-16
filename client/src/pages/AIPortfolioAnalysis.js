import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AIPages.css';

const AIPortfolioAnalysis = () => {
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [error, setError] = useState('');

    const handleAnalyze = async () => {
        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const token = localStorage.getItem('token');
            const response = await api.post(
                '/ai/portfolio-review',
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            setAnalysis(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to analyze portfolio');
            console.error('Portfolio analysis error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-page">
            <div className="page-header">
                <h1>💼 AI Portfolio Analysis</h1>
                <p className="page-subtitle">Get comprehensive AI-powered analysis of your entire portfolio</p>
            </div>

            <div className="ai-action-section">
                <button
                    onClick={handleAnalyze}
                    className="btn btn-primary ai-analyze-btn large"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Analyzing Your Portfolio...
                        </>
                    ) : (
                        <>
                            <span>🔍</span>
                            Analyze My Portfolio
                        </>
                    )}
                </button>

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}
            </div>

            {analysis && (
                <div className="ai-results">
                    <div className="portfolio-summary-card glass-panel">
                        <h3>📊 Portfolio Summary</h3>
                        <div className="summary-stats">
                            <div className="stat-item">
                                <span className="stat-label">Total Value</span>
                                <span className="stat-value primary">${analysis.portfolioValue.toFixed(2)}</span>
                            </div>
                            <div className="stat-item">
                                <span className="stat-label">Holdings</span>
                                <span className="stat-value">{analysis.holdingsBreakdown.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="holdings-breakdown glass-panel">
                        <h3>📈 Holdings Breakdown</h3>
                        <div className="holdings-table-wrapper">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Symbol</th>
                                        <th>Shares</th>
                                        <th>Invested</th>
                                        <th>Current Value</th>
                                        <th>Gain/Loss</th>
                                        <th>Allocation</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analysis.holdingsBreakdown.map((holding) => (
                                        <tr key={holding.symbol}>
                                            <td><strong>{holding.symbol}</strong></td>
                                            <td>{holding.shares}</td>
                                            <td>${holding.invested.toFixed(2)}</td>
                                            <td>${holding.currentValue.toFixed(2)}</td>
                                            <td className={holding.gainLoss >= 0 ? 'text-green' : 'text-red'}>
                                                {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss.toFixed(2)}
                                                <br />
                                                <small>({holding.gainLossPercent.toFixed(2)}%)</small>
                                            </td>
                                            <td>
                                                <div className="allocation-bar">
                                                    <div
                                                        className="allocation-fill"
                                                        style={{ width: `${holding.allocation}%` }}
                                                    ></div>
                                                    <span className="allocation-text">{holding.allocation.toFixed(1)}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="ai-analysis-card glass-panel">
                        <div className="analysis-header">
                            <h3>🧠 AI Portfolio Review</h3>
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
                    <div className="empty-icon">💼</div>
                    <h3>Portfolio Analysis Ready</h3>
                    <p>Click the button above to get a comprehensive AI analysis of your portfolio</p>
                    <ul className="feature-list">
                        <li>✓ Diversification assessment</li>
                        <li>✓ Risk level evaluation</li>
                        <li>✓ Personalized recommendations</li>
                        <li>✓ Performance insights</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AIPortfolioAnalysis;
