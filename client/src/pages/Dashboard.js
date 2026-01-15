import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
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
          <div className="stat-value-large">
            ${(balance + totalValue).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`stat-change ${isPositive ? 'text-green' : 'text-red'}`}>
            {isPositive ? '▲' : '▼'} Total P/L
          </div>
        </Card>

        <Card className="stat-card glass-panel">
          <div className="stat-label">Day's P/L</div>
          <div className={`stat-value-large ${isPositive ? 'text-green' : 'text-red'}`}>
            {isPositive ? '+' : ''}{totalGainLoss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`stat-subvalue ${isPositive ? 'text-green' : 'text-red'}`}>
            {isPositive ? '+' : ''}{totalGainLossPercent.toFixed(2)}%
          </div>
        </Card>

        <Card className="stat-card glass-panel">
          <div className="stat-label">Buying Power</div>
          <div className="stat-value-large text-secondary">
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <Link to="/search" className="link-small">Top Up ›</Link>
        </Card>

        <Card className="stat-card glass-panel">
          <div className="stat-label">Market Status</div>
          <div className="stat-value-large text-green">OPEN</div>
          <div className="stat-subvalue text-muted">NYSE / NASDAQ</div>
        </Card>
      </div>

      <div className="dashboard-content grid grid-2">
        {/* Holdings Section */}
        <div className="holdings-section">
          <div className="section-header">
            <h3>Active Positions</h3>
            <Link to="/portfolio" className="text-muted link-hover">View All ›</Link>
          </div>

          {portfolioSummary?.holdings && portfolioSummary.holdings.length > 0 ? (
            <div className="holdings-list">
              {portfolioSummary.holdings.slice(0, 5).map((holding) => {
                const gain = holding.gainLoss ?? 0;
                const isGain = gain >= 0;
                return (
                  <Card key={holding.symbol} className="holding-card-row">
                    <div className="holding-info">
                      <span className="holding-symbol">{holding.symbol}</span>
                      <span className="holding-shares text-secondary">{holding.shares} shares</span>
                    </div>
                    <div className="holding-values">
                      <span className="holding-price">${(holding.currentPrice || 0).toFixed(2)}</span>
                      <span className={`holding-pl ${isGain ? 'text-green' : 'text-red'}`}>
                        {isGain ? '+' : ''}{gain.toFixed(2)}
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

        {/* Quick Actions / Watchlist Placeholder */}
        <div className="side-section">
          <Card title="Quick Access" className="h-full">
            <div className="quick-links">
              <Link to="/search" className="quick-link-item">
                <div className="icon-box">🔍</div>
                <div>
                  <div className="font-bold">Symbol Search</div>
                  <div className="text-xs text-muted">Find stocks to trade</div>
                </div>
              </Link>
              <Link to="/portfolio" className="quick-link-item">
                <div className="icon-box">📊</div>
                <div>
                  <div className="font-bold">Portfolio Analysis</div>
                  <div className="text-xs text-muted">Deep dive into performance</div>
                </div>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
