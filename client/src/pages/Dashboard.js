import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPortfolioSummary();
    fetchIndices();
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

  const fetchIndices = async () => {
    try {
      const response = await api.get('/stocks/market/indices');
      setIndices(response.data);
    } catch (error) {
      console.error('Error fetching indices:', error);
    }
  };

  if (loading) {
    return <div className="loading">Initializing Terminal...</div>;
  }

  // Calculate stats safetly
  const balance = portfolioSummary?.virtualBalance ?? user?.virtualBalance ?? 0;
  const totalValue = portfolioSummary?.totalValue ?? 0;
  const totalInvested = portfolioSummary?.totalInvested ?? 0;
  const totalGainLoss = portfolioSummary?.totalGainLoss ?? 0;
  const totalGainLossPercent = portfolioSummary?.totalGainLossPercent ?? 0;
  const isPositive = totalGainLoss >= 0;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>Market Overview</h1>
          <p className="text-secondary">Welcome back, {user?.username || 'Trader'}</p>
        </div>
        <div className="dashboard-actions-header">
          <Link to="/search">
            <Button variant="primary">
              + New Trade
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          {error}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="stats-grid">
        <Card className="stat-card glass-panel">
          <div className="stat-label">Net Liquidation Value</div>
          <div className="stat-row">
            <div className="stat-value-large">
              ₹{(balance + totalValue).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`stat-change ${isPositive ? 'text-green' : 'text-red'}`}>
              {isPositive ? '▲' : '▼'} Total P/L
            </div>
          </div>
        </Card>

        <Card className="stat-card glass-panel">
          <div className="stat-label">Day's P/L</div>
          <div className="stat-row">
            <div className={`stat-value-large ${isPositive ? 'text-green' : 'text-red'}`}>
              {isPositive ? '+' : ''}₹{totalGainLoss.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`stat-subvalue ${isPositive ? 'text-green' : 'text-red'}`}>
              {isPositive ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
            </div>
          </div>
        </Card>

        <Card className="stat-card glass-panel">
          <div className="stat-label">Buying Power</div>
          <div className="stat-row">
            <div className="stat-value-large text-secondary">
              ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <Link to="/search" className="link-small">Top Up ›</Link>
          </div>
        </Card>

        <Card className="stat-card glass-panel">
          <div className="stat-label">Market Status</div>
          {indices.length > 0 ? (
            <div className="indices-rotate">
              <div className="stat-value-small">
                {indices[0].name}: <span className={indices[0].change >= 0 ? 'text-green' : 'text-red'}>
                  {indices[0].price.toFixed(2)} ({indices[0].changePercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="stat-value-large text-green">OPEN</div>
              <div className="stat-subvalue text-muted">NSE / BSE</div>
            </>
          )}
        </Card>
      </div>

      <div className="dashboard-content">
        {/* Holdings Section */}
        <div className="holdings-section">
          <div className="section-header">
            <h3>Active Positions</h3>
          </div>

          {portfolioSummary?.holdings && portfolioSummary.holdings.length > 0 ? (
            <div className="holdings-list">
              {portfolioSummary.holdings.slice(0, 5).map((holding) => {
                const gain = holding.gainLoss ?? 0;
                const isGain = gain >= 0;
                return (
                  <Card
                    key={holding.symbol}
                    className="holding-card-row"
                    onClick={() => navigate(`/stock/${holding.symbol}`)}
                  >
                    <div className="holding-info">
                      <span className="holding-symbol">{holding.symbol}</span>
                      <span className="holding-shares text-secondary">{holding.shares} shares</span>
                    </div>
                    <div className="holding-values">
                      <span className="holding-price">₹{(holding.currentPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className={`holding-pl ${isGain ? 'text-green' : 'text-red'}`}>
                        {isGain ? '+' : ''}{gain.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="empty-state">
              <div className="text-center p-4">
                <p className="text-secondary mb-3">No active positions</p>
                <Link to="/search">
                  <Button variant="primary" size="sm">Start Trading</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
