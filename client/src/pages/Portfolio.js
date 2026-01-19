import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './Portfolio.css';

function Portfolio() {
  const [portfolioSummary, setPortfolioSummary] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');

  useEffect(() => {
    fetchPortfolio();
    fetchRecentTrades();
  }, []);

  const fetchPortfolio = async () => {
    try {
      const response = await api.get('/portfolio/summary');
      const data = response.data;

      // Calculate allocation for each holding
      if (data.holdings && data.holdings.length > 0) {
        const totalValue = data.totalValue || 0;
        data.holdings = data.holdings.map(holding => ({
          ...holding,
          allocation: totalValue > 0 ? ((holding.currentValue || 0) / totalValue) * 100 : 0
        }));
      }

      setPortfolioSummary(data);

      // Fetch performance data after portfolio is loaded
      fetchPerformanceData();
    } catch (error) {
      console.error('Error fetching portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentTrades = async () => {
    try {
      const response = await api.get('/portfolio/transactions');
      // Get the 10 most recent trades
      setRecentTrades(response.data.slice(0, 10));
    } catch (error) {
      console.error('Error fetching trades:', error);
    }
  };

  // Fetch real performance data from backend
  const fetchPerformanceData = async () => {
    try {
      const response = await api.get('/portfolio/history');
      const data = response.data;

      // Format dates for display
      const formattedData = data.map(point => ({
        date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: point.value
      }));

      setPerformanceData(formattedData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
      // Fallback to showing at least current value
      setPerformanceData([{
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: portfolioSummary?.totalValue || 0
      }]);
    }
  };

  if (loading) {
    return (
      <div className="portfolio-loading">
        <div className="loading-spinner"></div>
        <p>Loading your portfolio...</p>
      </div>
    );
  }

  if (!portfolioSummary || !portfolioSummary.holdings || portfolioSummary.holdings.length === 0) {
    return (
      <div className="portfolio-empty">
        <div className="empty-content">
          <div className="empty-icon">📊</div>
          <h1>Your Portfolio</h1>
          <Card className="glass-panel empty-card">
            <p className="empty-message">Your portfolio is empty. Start building your wealth by making your first investment!</p>
            <Link to="/search">
              <Button variant="primary" className="cta-button">
                <span className="button-icon">🔍</span>
                Explore Stocks
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const isPositive = portfolioSummary.totalGainLoss >= 0;
  const dayChangePercent = 2.34; // Mock data - would come from backend

  return (
    <div className="portfolio-container">
      {/* Header */}
      <div className="portfolio-header">
        <h1 className="portfolio-title">Portfolio Dashboard</h1>
        <p className="portfolio-subtitle">Your financial command center</p>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="summary-grid">
        <Card className="summary-card glass-card glow-border-blue">
          <div className="summary-content">
            <span className="summary-label">Total Portfolio Value</span>
            <span className="summary-value-xl">₹{portfolioSummary.totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <div className="summary-meta">
              <span className={`day-change ${dayChangePercent >= 0 ? 'positive' : 'negative'}`}>
                {dayChangePercent >= 0 ? '▲' : '▼'} {Math.abs(dayChangePercent).toFixed(2)}% today
              </span>
            </div>
          </div>
        </Card>

        <Card className="summary-card glass-card">
          <div className="summary-content">
            <span className="summary-label">Total Profit/Loss</span>
            <span className={`summary-value-xl ${isPositive ? 'text-green' : 'text-red'}`}>
              {isPositive ? '+' : ''}₹{Math.abs(portfolioSummary.totalGainLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <div className="summary-meta">
              <span className={`percent-badge ${isPositive ? 'badge-green' : 'badge-red'}`}>
                {isPositive ? '▲' : '▼'} {Math.abs(portfolioSummary.totalGainLossPercent).toFixed(2)}%
              </span>
            </div>
          </div>
        </Card>

        <Card className="summary-card glass-card">
          <div className="summary-content">
            <span className="summary-label">Cash Balance</span>
            <span className="summary-value-xl">₹{portfolioSummary.virtualBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <div className="summary-meta">
              <span className="meta-text">Available for trading</span>
            </div>
          </div>
        </Card>

        <Card className="summary-card glass-card">
          <div className="summary-content">
            <span className="summary-label">Total Invested</span>
            <span className="summary-value-xl text-muted">₹{portfolioSummary.totalInvested.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            <div className="summary-meta">
              <span className="meta-text">{portfolioSummary.holdings.length} positions</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Performance Chart */}
      <Card className="chart-card glass-card">
        <div className="chart-header">
          <div>
            <h2 className="chart-title">Portfolio Performance</h2>
            <p className="chart-subtitle">Value over time</p>
          </div>
          <div className="timeframe-selector">
            {['1W', '1M', '3M', '1Y', 'ALL'].map(tf => (
              <button
                key={tf}
                className={`timeframe-btn ${selectedTimeframe === tf ? 'active' : ''}`}
                onClick={() => setSelectedTimeframe(tf)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickLine={false}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickLine={false}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(16, 20, 30, 0.95)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
                }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#3b82f6' }}
                formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Value']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                fill="url(#lineGradient)"
                filter="drop-shadow(0 0 8px rgba(59, 130, 246, 0.6))"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Holdings Section */}
      <Card className="holdings-card glass-card">
        <div className="section-header">
          <div>
            <h2 className="section-title">Holdings</h2>
            <p className="section-subtitle">{portfolioSummary.holdings.length} active positions</p>
          </div>
          <Link to="/search">
            <Button variant="primary" size="sm">
              <span className="button-icon">+</span>
              Add Position
            </Button>
          </Link>
        </div>

        <div className="holdings-grid">
          {portfolioSummary.holdings.map((holding) => {
            const gain = holding.gainLoss ?? 0;
            const isGain = gain >= 0;
            const gainLossPercent = holding.gainLossPercent ?? 0;
            const averagePrice = holding.averagePrice ?? 0;
            const currentPrice = holding.currentPrice ?? 0;
            const currentValue = holding.currentValue ?? 0;
            const allocation = holding.allocation ?? 0;

            return (
              <Card key={holding.symbol} className="holding-card glass-card-subtle">
                <div className="holding-header">
                  <div className="holding-info">
                    <Link to={`/stock/${holding.symbol}`} className="holding-symbol">
                      {holding.symbol}
                    </Link>
                    <span className="holding-shares">{holding.shares || 0} shares</span>
                  </div>
                  <div className={`holding-pnl ${isGain ? 'positive' : 'negative'}`}>
                    <span className="pnl-amount">{isGain ? '+' : ''}₹{Math.abs(gain).toFixed(2)}</span>
                    <span className="pnl-percent">{isGain ? '+' : ''}{gainLossPercent.toFixed(2)}%</span>
                  </div>
                </div>

                <div className="holding-details">
                  <div className="detail-row">
                    <span className="detail-label">Avg Price</span>
                    <span className="detail-value">₹{averagePrice.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Current</span>
                    <span className="detail-value">₹{currentPrice.toFixed(2)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Total Value</span>
                    <span className="detail-value-bold">₹{currentValue.toFixed(2)}</span>
                  </div>
                  {holding.stopLoss && (
                    <div className="detail-row">
                      <span className="detail-label">Stop Loss</span>
                      <span className="detail-value text-red">${holding.stopLoss.toFixed(2)}</span>
                    </div>
                  )}
                  {holding.takeProfit && (
                    <div className="detail-row">
                      <span className="detail-label">Take Profit</span>
                      <span className="detail-value text-green">${holding.takeProfit.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="holding-allocation">
                  <div className="allocation-info">
                    <span className="allocation-label">Portfolio Allocation</span>
                    <span className="allocation-percent">{allocation.toFixed(1)}%</span>
                  </div>
                  <div className="allocation-bar">
                    <div
                      className="allocation-fill"
                      style={{ width: `${Math.min(allocation, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="holding-actions">
                  <Link to={`/stock/${holding.symbol}`} className="action-link">
                    <Button variant="secondary" size="sm" className="action-btn">
                      Buy More
                    </Button>
                  </Link>
                  <Link to={`/stock/${holding.symbol}`} className="action-link">
                    <Button variant="outline" size="sm" className="action-btn">
                      Sell
                    </Button>
                  </Link>
                  <Link to={`/stock/${holding.symbol}`} className="action-link">
                    <Button variant="ghost" size="sm" className="action-btn">
                      Details
                    </Button>
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Recent Trades */}
      {recentTrades.length > 0 && (
        <Card className="trades-card glass-card">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recent Trades</h2>
              <p className="section-subtitle">Latest transactions</p>
            </div>
            <Link to="/transactions">
              <Button variant="ghost" size="sm">View All →</Button>
            </Link>
          </div>

          <div className="trades-list">
            {recentTrades.map((trade, index) => {
              const isBuy = trade.type === 'buy';
              const tradeDate = new Date(trade.createdAt);

              return (
                <div key={index} className="trade-item">
                  <div className="trade-main">
                    <div className={`trade-type-badge ${isBuy ? 'badge-buy' : 'badge-sell'}`}>
                      {isBuy ? 'BUY' : 'SELL'}
                    </div>
                    <div className="trade-info">
                      <Link to={`/stock/${trade.symbol}`} className="trade-symbol">
                        {trade.symbol}
                      </Link>
                      <span className="trade-quantity">{trade.shares} shares @ ₹{trade.price.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="trade-meta">
                    <span className="trade-total">₹{(trade.shares * trade.price).toFixed(2)}</span>
                    <span className="trade-date">
                      {tradeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {tradeDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

export default Portfolio;
