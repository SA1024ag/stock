import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPortfolioSummary();
  }, []);

  const fetchPortfolioSummary = async () => {
    try {
      const response = await api.get('/portfolio/summary');
      setPortfolioSummary(response.data);
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1>Welcome, {user?.username}!</h1>
      
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-label">Virtual Balance</div>
          <div className="stat-value">${portfolioSummary?.virtualBalance?.toFixed(2) || user?.virtualBalance?.toFixed(2) || '0.00'}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Portfolio Value</div>
          <div className="stat-value">${portfolioSummary?.totalValue?.toFixed(2) || '0.00'}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-label">Total Invested</div>
          <div className="stat-value">${portfolioSummary?.totalInvested?.toFixed(2) || '0.00'}</div>
        </div>
        
        <div className={`stat-card ${portfolioSummary?.totalGainLoss >= 0 ? 'positive' : 'negative'}`}>
          <div className="stat-label">Total Gain/Loss</div>
          <div className="stat-value">
            {portfolioSummary?.totalGainLoss >= 0 ? '+' : ''}
            ${portfolioSummary?.totalGainLoss?.toFixed(2) || '0.00'}
            <span className="stat-percent">
              ({portfolioSummary?.totalGainLossPercent >= 0 ? '+' : ''}
              {portfolioSummary?.totalGainLossPercent?.toFixed(2) || '0.00'}%)
            </span>
          </div>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link to="/search" className="action-card">
          <h3>🔍 Search Stocks</h3>
          <p>Find and analyze stocks</p>
        </Link>
        
        <Link to="/portfolio" className="action-card">
          <h3>💼 View Portfolio</h3>
          <p>Manage your holdings</p>
        </Link>
      </div>

      {portfolioSummary?.holdings && portfolioSummary.holdings.length > 0 && (
        <div className="card">
          <h2 className="card-header">Recent Holdings</h2>
          <div className="holdings-preview">
            {portfolioSummary.holdings.slice(0, 5).map((holding) => (
              <div key={holding.symbol} className="holding-item">
                <div className="holding-symbol">{holding.symbol}</div>
                <div className="holding-details">
                  <span>{holding.shares} shares</span>
                  <span className={holding.gainLoss >= 0 ? 'positive' : 'negative'}>
                    {holding.gainLoss >= 0 ? '+' : ''}${holding.gainLoss.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/portfolio" className="btn btn-secondary" style={{ marginTop: '15px', display: 'inline-block' }}>
            View Full Portfolio
          </Link>
        </div>
      )}

      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}

export default Dashboard;
