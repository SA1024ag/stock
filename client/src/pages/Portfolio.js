import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Portfolio.css';

function Portfolio() {
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [aiReview, setAiReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReview, setLoadingReview] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await api.get('/portfolio/summary');
      setPortfolioSummary(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setError('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  };

  const handleGetAIReview = async () => {
    setLoadingReview(true);
    setError('');

    try {
      const response = await api.post('/ai/portfolio-review');
      setAiReview(response.data);
    } catch (error) {
      console.error('Error fetching AI review:', error);
      setError('Failed to get AI review. Please try again.');
    } finally {
      setLoadingReview(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading assets...</div>;
  }

  if (!portfolioSummary || !portfolioSummary.holdings || portfolioSummary.holdings.length === 0) {
    return (
      <div className="portfolio-empty">
        <div className="empty-content text-center">
          <h1 className="mb-4">Your Portfolio</h1>
          <Card className="glass-panel p-5">
            <p className="mb-4 text-secondary">Your portfolio is empty. Start by searching for stocks and making your first purchase!</p>
            <Link to="/search">
              <Button variant="primary">Search Stocks</Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const isPositive = portfolioSummary.totalGainLoss >= 0;

  return (
    <div className="portfolio-container">
      <div className="portfolio-header">
        <h1>Asset Allocation</h1>
        <p className="text-secondary">Manage your positions and performance</p>
      </div>

      <div className="portfolio-stats-grid">
        <Card className="summary-card glass-panel">
          <span className="summary-label">Total Portfolio Value</span>
          <span className="summary-value-large">${portfolioSummary.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </Card>

        <Card className="summary-card glass-panel">
          <span className="summary-label">Total Invested</span>
          <span className="summary-value-large text-secondary">${portfolioSummary.totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </Card>

        <Card className="summary-card glass-panel">
          <span className="summary-label">Total Gain/Loss</span>
          <div className="value-group">
            <span className={`summary-value-large ${isPositive ? 'text-green' : 'text-red'}`}>
              {isPositive ? '+' : ''}${Math.abs(portfolioSummary.totalGainLoss).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`summary-percent ${isPositive ? 'bg-green' : 'bg-red'}`}>
              {isPositive ? '▲' : '▼'} {Math.abs(portfolioSummary.totalGainLossPercent).toFixed(2)}%
            </span>
          </div>
        </Card>

        <Card className="summary-card glass-panel">
          <span className="summary-label">Buying Power</span>
          <span className="summary-value-large">${portfolioSummary.virtualBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        </Card>
      </div>

      <Card className="holdings-card glass-panel">
        <div className="card-header-flex">
          <h2>Holdings</h2>
          <Button
            onClick={handleGetAIReview}
            variant="primary"
            size="sm"
            isLoading={loadingReview}
            disabled={loadingReview}
            className="ai-btn"
          >
            {loadingReview ? 'Analyzing...' : ' ✨ AI Portfolio Review'}
          </Button>
        </div>

        {error && <div className="alert alert-error mb-4">{error}</div>}

        <div className="table-responsive">
          <table className="table premium-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Shares</th>
                <th>Avg Price</th>
                <th>Current</th>
                <th>Total Value</th>
                <th>Gain/Loss</th>
                <th>Alloc</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {portfolioSummary.holdings.map((holding) => {
                const gain = holding.gainLoss ?? 0;
                const isGain = gain >= 0;
                return (
                  <tr key={holding.symbol}>
                    <td>
                      <Link to={`/stock/${holding.symbol}`} className="stock-link-cell">
                        {holding.symbol}
                      </Link>
                    </td>
                    <td>{holding.shares}</td>
                    <td>${holding.averagePrice.toFixed(2)}</td>
                    <td>${holding.currentPrice.toFixed(2)}</td>
                    <td className="font-bold">${holding.currentValue.toFixed(2)}</td>
                    <td>
                      <div className={`pnl-cell ${isGain ? 'text-green' : 'text-red'}`}>
                        <span>{isGain ? '+' : ''}${gain.toFixed(2)}</span>
                        <span className="text-xs opacity-75">
                          {holding.gainLossPercent >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="allocation-bar-wrapper">
                        <span>{holding.allocation.toFixed(1)}%</span>
                        <div className="allocation-bar-bg">
                          <div className="allocation-bar-fill" style={{ width: `${holding.allocation}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="text-right">
                      <Link to={`/stock/${holding.symbol}`}>
                        <Button size="sm" variant="secondary">Trade</Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {aiReview && (
        <Card className="ai-review-card glass-panel mt-4 border-glow">
          <div className="ai-header mb-4">
            <h2>🤖 AI Portfolio Analysis</h2>
            <span className="ai-badge">Generated just now</span>
          </div>
          <div className="ai-review-content text-secondary">
            {aiReview.analysis.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-3">{paragraph}</p>
            ))}
          </div>

          {aiReview.holdingsBreakdown && (
            <div className="holdings-breakdown mt-4 pt-4 border-t border-glass">
              <h3 className="mb-3 text-sm uppercase text-muted">Breakdown</h3>
              <div className="breakdown-grid">
                {aiReview.holdingsBreakdown.map((holding) => (
                  <div key={holding.symbol} className="breakdown-item bg-dark-soft">
                    <span className="font-bold">{holding.symbol}</span>
                    <span className="text-muted">
                      ${holding.currentValue.toFixed(2)} ({holding.allocation.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default Portfolio;
