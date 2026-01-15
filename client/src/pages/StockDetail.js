import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import CandlestickChart from '../components/CandlestickChart';
import './StockDetail.css';

function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [stockData, setStockData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [timeframe, setTimeframe] = useState('1M'); // Add timeframe state
  const [shares, setShares] = useState('');
  const [action, setAction] = useState('buy');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false); // Separate loading for chart
  const [trading, setTrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStockData();
    fetchAnalysis();
    fetchHistoricalData(timeframe); // Pass timeframe
    const interval = setInterval(fetchStockData, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  // Refetch when timeframe changes
  useEffect(() => {
    if (symbol) {
      fetchHistoricalData(timeframe);
    }
  }, [timeframe]);

  const fetchStockData = async () => {
    try {
      const response = await api.get(`/stocks/${symbol}`);
      setStockData(response.data);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      setError('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalysis = async () => {
    try {
      const response = await api.post('/ai/analyze', { symbol });
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error('Error fetching analysis:', error);
    }
  };

  const fetchHistoricalData = async (selectedTimeframe) => {
    setChartLoading(true);
    try {
      const response = await api.get(`/stocks/${symbol}/history`, {
        params: { timeframe: selectedTimeframe }
      });
      setHistoricalData(response.data);
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setError(`Failed to load ${selectedTimeframe} data`);
    } finally {
      setChartLoading(false);
    }
  };

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    if (!shares || shares <= 0) {
      setError('Please enter a valid number of shares');
      return;
    }

    setTrading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post(`/portfolio/${action}`, {
        symbol,
        shares: parseInt(shares)
      });

      setSuccess(response.data.message);
      setShares('');

      if (response.data.remainingBalance !== undefined) {
        updateUser({ ...user, virtualBalance: response.data.remainingBalance });
      }

      setTimeout(() => {
        fetchStockData();
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.message || 'Trading failed. Please try again.');
    } finally {
      setTrading(false);
    }
  };

  if (loading) {
    return <div className="loading">Initializing Market Data...</div>;
  }

  if (!stockData) {
    return (
      <div className="error-container">
        <div className="alert alert-error">Stock not found</div>
        <Button onClick={() => navigate('/search')}>Back to Search</Button>
      </div>
    );
  }

  const totalCost = stockData.price * (parseInt(shares) || 0);

  return (
    <div className="stock-detail-container">
      <div className="stock-detail-header">
        <button onClick={() => navigate(-1)} className="back-link">
          ‹ Back
        </button>
        <div className="header-flex">
          <div>
            <h1 className="stock-title">{stockData.symbol}</h1>
            <p className="text-secondary">Real-time Quote</p>
          </div>
          <div className="stock-price-display">
            <span className="current-price">${stockData.price.toFixed(2)}</span>
            <span className={`price-change-badge ${stockData.change >= 0 ? 'bg-green' : 'bg-red'}`}>
              {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} ({stockData.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        {/* Left Column: Chart, Info & Analysis */}
        <div className="detail-main">
          {/* Candlestick Chart */}
          {chartLoading ? (
            <div className="chart-loading" style={{
              background: 'rgba(17, 24, 39, 0.5)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '2rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '500px',
              color: '#9ca3af'
            }}>
              <p>Loading chart data...</p>
            </div>
          ) : (
            <CandlestickChart
              symbol={symbol}
              data={historicalData}
              currentPrice={stockData.price}
              onTimeframeChange={handleTimeframeChange}
            />
          )}

          <Card className="info-card glass-panel mb-4">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Open</span>
                <span className="value">${stockData.open.toFixed(2)}</span>
              </div>
              <div className="info-item">
                <span className="label">High</span>
                <span className="value">${stockData.high.toFixed(2)}</span>
              </div>
              <div className="info-item">
                <span className="label">Low</span>
                <span className="value">${stockData.low.toFixed(2)}</span>
              </div>
              <div className="info-item">
                <span className="label">Vol</span>
                <span className="value">{stockData.volume.toLocaleString()}</span>
              </div>
            </div>
          </Card>

          <Card title="AI Market Analysis" className="analysis-card glass-panel">
            {analysis ? (
              <div className="analysis-content text-secondary">
                {analysis.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-2">{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className="loading-state">
                <span className="pulse">●</span> Analyzing market sentiment...
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Trading Interface */}
        <div className="detail-sidebar">
          <Card className="trading-card glass-panel border-glow">
            <h3 className="card-title mb-4">Trade Execution</h3>

            <form onSubmit={handleTrade} className="trading-form">
              <div className="trade-tabs mb-4">
                <button
                  type="button"
                  className={`trade-tab ${action === 'buy' ? 'active buy' : ''}`}
                  onClick={() => setAction('buy')}
                >
                  Buy
                </button>
                <button
                  type="button"
                  className={`trade-tab ${action === 'sell' ? 'active sell' : ''}`}
                  onClick={() => setAction('sell')}
                >
                  Sell
                </button>
              </div>

              <div className="form-group">
                <label>Shares</label>
                <input
                  type="number"
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                  min="1"
                  required
                  placeholder="0"
                  className="input-large"
                />
              </div>

              <div className="order-summary mb-4">
                <div className="summary-row">
                  <span>Est. Total</span>
                  <span className="font-bold">${totalCost.toFixed(2)}</span>
                </div>
                {action === 'buy' && (
                  <div className="summary-row text-xs text-muted">
                    <span>Available</span>
                    <span>${user?.virtualBalance?.toFixed(2)}</span>
                  </div>
                )}
              </div>

              {error && <div className="alert alert-error text-sm">{error}</div>}
              {success && <div className="alert alert-success text-sm">{success}</div>}

              <Button
                type="submit"
                variant={action === 'buy' ? 'success' : 'danger'}
                className="w-full"
                isLoading={trading}
              >
                {action === 'buy' ? 'Submit Buy Order' : 'Submit Sell Order'}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default StockDetail;
