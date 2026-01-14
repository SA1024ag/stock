import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
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
    return <div className="loading">Loading portfolio...</div>;
  }

  if (!portfolioSummary || !portfolioSummary.holdings || portfolioSummary.holdings.length === 0) {
    return (
      <div className="portfolio-empty">
        <h1>Your Portfolio</h1>
        <div className="card">
          <p>Your portfolio is empty. Start by searching for stocks and making your first purchase!</p>
          <Link to="/search" className="btn btn-primary">
            Search Stocks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio">
      <h1>Your Portfolio</h1>

      <div className="portfolio-summary">
        <div className="summary-card">
          <h3>Portfolio Value</h3>
          <div className="summary-value">${portfolioSummary.totalValue.toFixed(2)}</div>
        </div>
        
        <div className="summary-card">
          <h3>Total Invested</h3>
          <div className="summary-value">${portfolioSummary.totalInvested.toFixed(2)}</div>
        </div>
        
        <div className={`summary-card ${portfolioSummary.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
          <h3>Total Gain/Loss</h3>
          <div className="summary-value">
            {portfolioSummary.totalGainLoss >= 0 ? '+' : ''}
            ${portfolioSummary.totalGainLoss.toFixed(2)}
            <span className="summary-percent">
              ({portfolioSummary.totalGainLossPercent >= 0 ? '+' : ''}
              {portfolioSummary.totalGainLossPercent.toFixed(2)}%)
            </span>
          </div>
        </div>
        
        <div className="summary-card">
          <h3>Available Balance</h3>
          <div className="summary-value">${portfolioSummary.virtualBalance.toFixed(2)}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header-row">
          <h2 className="card-header">Holdings</h2>
          <button onClick={handleGetAIReview} className="btn btn-primary" disabled={loadingReview}>
            {loadingReview ? 'Analyzing...' : '🤖 Get AI Portfolio Review'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <table className="table">
          <thead>
            <tr>
              <th>Symbol</th>
              <th>Shares</th>
              <th>Avg Price</th>
              <th>Current Price</th>
              <th>Invested</th>
              <th>Current Value</th>
              <th>Gain/Loss</th>
              <th>Allocation</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {portfolioSummary.holdings.map((holding) => (
              <tr key={holding.symbol}>
                <td>
                  <Link to={`/stock/${holding.symbol}`} className="stock-link">
                    {holding.symbol}
                  </Link>
                </td>
                <td>{holding.shares}</td>
                <td>${holding.averagePrice.toFixed(2)}</td>
                <td>${holding.currentPrice.toFixed(2)}</td>
                <td>${holding.totalInvested.toFixed(2)}</td>
                <td>${holding.currentValue.toFixed(2)}</td>
                <td className={holding.gainLoss >= 0 ? 'positive' : 'negative'}>
                  {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss.toFixed(2)}
                  <br />
                  <small>({holding.gainLossPercent >= 0 ? '+' : ''}{holding.gainLossPercent.toFixed(2)}%)</small>
                </td>
                <td>{holding.allocation.toFixed(1)}%</td>
                <td>
                  <Link to={`/stock/${holding.symbol}`} className="btn btn-sm btn-primary">
                    Trade
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {aiReview && (
        <div className="card ai-review-card">
          <h2 className="card-header">🤖 AI Portfolio Analysis</h2>
          <div className="ai-review-content">
            {aiReview.analysis.split('\n').map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>
          
          {aiReview.holdingsBreakdown && (
            <div className="holdings-breakdown">
              <h3>Holdings Breakdown</h3>
              <div className="breakdown-list">
                {aiReview.holdingsBreakdown.map((holding) => (
                  <div key={holding.symbol} className="breakdown-item">
                    <span className="breakdown-symbol">{holding.symbol}</span>
                    <span className="breakdown-value">
                      ${holding.currentValue.toFixed(2)} ({holding.allocation.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Portfolio;
