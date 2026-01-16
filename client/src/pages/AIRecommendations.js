import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './AIPages.css';

const AIRecommendations = () => {
    const [portfolio, setPortfolio] = useState([]);
    const [recommendations, setRecommendations] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPortfolio();
    }, []);

    const fetchPortfolio = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await api.get('/portfolio', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setPortfolio(response.data);
        } catch (err) {
            console.error('Error fetching portfolio:', err);
        }
    };

    const generateRecommendations = async () => {
        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('token');

            // Get portfolio analysis first
            const analysisResponse = await api.post(
                '/ai/portfolio-review',
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            // Generate recommendations based on portfolio
            setRecommendations({
                analysis: analysisResponse.data.analysis,
                portfolioValue: analysisResponse.data.portfolioValue,
                suggestions: generateSmartSuggestions(analysisResponse.data)
            });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate recommendations');
            console.error('Recommendations error:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateSmartSuggestions = (data) => {
        const suggestions = [];

        // Diversification suggestions
        if (data.holdingsBreakdown.length < 5) {
            suggestions.push({
                type: 'diversification',
                icon: '🎯',
                title: 'Increase Diversification',
                description: 'Consider adding more stocks to your portfolio to reduce risk. Aim for at least 5-10 different holdings across various sectors.',
                priority: 'high'
            });
        }

        // Concentration risk
        const maxAllocation = Math.max(...data.holdingsBreakdown.map(h => h.allocation));
        if (maxAllocation > 40) {
            suggestions.push({
                type: 'concentration',
                icon: '⚖️',
                title: 'Reduce Concentration Risk',
                description: `One of your holdings represents ${maxAllocation.toFixed(1)}% of your portfolio. Consider rebalancing to reduce exposure to a single stock.`,
                priority: 'high'
            });
        }

        // Performance-based suggestions
        const losingStocks = data.holdingsBreakdown.filter(h => h.gainLossPercent < -10);
        if (losingStocks.length > 0) {
            suggestions.push({
                type: 'performance',
                icon: '📉',
                title: 'Review Underperforming Stocks',
                description: `${losingStocks.length} stock(s) are down more than 10%. Review these positions: ${losingStocks.map(s => s.symbol).join(', ')}`,
                priority: 'medium'
            });
        }

        // Winning stocks
        const winningStocks = data.holdingsBreakdown.filter(h => h.gainLossPercent > 20);
        if (winningStocks.length > 0) {
            suggestions.push({
                type: 'profit',
                icon: '🎉',
                title: 'Consider Taking Profits',
                description: `${winningStocks.length} stock(s) are up more than 20%. Consider taking partial profits: ${winningStocks.map(s => s.symbol).join(', ')}`,
                priority: 'low'
            });
        }

        // Portfolio size suggestions
        if (data.portfolioValue < 1000) {
            suggestions.push({
                type: 'growth',
                icon: '💰',
                title: 'Build Your Portfolio',
                description: 'Your portfolio is still small. Consider regular contributions to grow your investments over time.',
                priority: 'medium'
            });
        }

        return suggestions;
    };

    return (
        <div className="ai-page">
            <div className="page-header">
                <h1>💡 AI Recommendations</h1>
                <p className="page-subtitle">Get personalized investment recommendations based on your portfolio</p>
            </div>

            <div className="ai-action-section">
                <button
                    onClick={generateRecommendations}
                    className="btn btn-primary ai-analyze-btn large"
                    disabled={loading || portfolio.length === 0}
                >
                    {loading ? (
                        <>
                            <span className="spinner"></span>
                            Generating Recommendations...
                        </>
                    ) : (
                        <>
                            <span>✨</span>
                            Generate Recommendations
                        </>
                    )}
                </button>

                {portfolio.length === 0 && (
                    <div className="alert alert-error">
                        <span>ℹ️</span>
                        You need to add stocks to your portfolio first to get recommendations.
                    </div>
                )}

                {error && (
                    <div className="alert alert-error">
                        <span>⚠️</span>
                        {error}
                    </div>
                )}
            </div>

            {recommendations && (
                <div className="ai-results">
                    <div className="recommendations-grid">
                        {recommendations.suggestions.map((suggestion, index) => (
                            <div key={index} className={`recommendation-card glass-panel priority-${suggestion.priority}`}>
                                <div className="recommendation-icon">{suggestion.icon}</div>
                                <h3>{suggestion.title}</h3>
                                <p>{suggestion.description}</p>
                                <span className={`priority-badge ${suggestion.priority}`}>
                                    {suggestion.priority.toUpperCase()} PRIORITY
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="ai-analysis-card glass-panel">
                        <div className="analysis-header">
                            <h3>🧠 Detailed AI Analysis</h3>
                            <span className="ai-badge">Powered by Groq AI</span>
                        </div>
                        <div className="analysis-content">
                            {recommendations.analysis.split('\n').map((paragraph, index) => (
                                paragraph.trim() && <p key={index}>{paragraph}</p>
                            ))}
                        </div>
                    </div>

                    <div className="portfolio-value-card glass-panel">
                        <h4>Current Portfolio Value</h4>
                        <div className="value-display">${recommendations.portfolioValue.toFixed(2)}</div>
                    </div>
                </div>
            )}

            {!recommendations && !loading && (
                <div className="empty-state">
                    <div className="empty-icon">💡</div>
                    <h3>Smart Recommendations Await</h3>
                    <p>Get AI-powered recommendations tailored to your portfolio</p>
                    <ul className="feature-list">
                        <li>✓ Diversification strategies</li>
                        <li>✓ Risk management tips</li>
                        <li>✓ Rebalancing suggestions</li>
                        <li>✓ Performance optimization</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AIRecommendations;
