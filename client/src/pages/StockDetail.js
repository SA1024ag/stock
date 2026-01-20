import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import CandlestickChart from '../components/CandlestickChart';
import StockPredictionSimulator from '../components/StockPredictionSimulator';
import { Star, Check } from 'lucide-react';
import './StockDetail.css';

function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [stockData, setStockData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [timeframe, setTimeframe] = useState('1M');
  const [shares, setShares] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [action, setAction] = useState('buy');
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(false);
  const [trading, setTrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Watchlist State
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  useEffect(() => {
    if (symbol) {
      fetchStockData();
      fetchAnalysis();
      fetchHistoricalData(timeframe);
      checkWatchlistStatus(); // Check watchlist status
      const interval = setInterval(fetchStockData, 30000);
      return () => clearInterval(interval);
    }
  }, [symbol]);

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

  const checkWatchlistStatus = async () => {
    try {
      const response = await api.get('/watchlist');
      const exists = response.data.some(item => item.symbol === symbol);
      setInWatchlist(exists);
    } catch (err) {
      console.error('Error checking watchlist:', err);
    }
  };

  const toggleWatchlist = async () => {
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await api.delete(`/watchlist/remove/${symbol}`);
        setInWatchlist(false);
        toast.success('Removed from Watchlist');
      } else {
        await api.post('/watchlist/add', { symbol });
        setInWatchlist(true);
        toast.success('Added to Watchlist');
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
      toast.error('Failed to update watchlist');
    } finally {
      setWatchlistLoading(false);
    }
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
      const payload = {
        symbol,
        shares: parseInt(shares)
      };

      if (action === 'buy') {
        if (stopLoss) payload.stopLoss = parseFloat(stopLoss);
        if (takeProfit) payload.takeProfit = parseFloat(takeProfit);
      }

      const response = await api.post(`/portfolio/${action}`, payload);

      toast.success(response.data.message);
      setShares('');

      if (response.data.remainingBalance !== undefined) {
        updateUser({ ...user, virtualBalance: response.data.remainingBalance });
      }

      setTimeout(() => {
        fetchStockData();
      }, 1000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Trading failed. Please try again.');
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

  // Calculate stats based on timeframe
  const getDisplayStats = () => {
    if (!stockData) return { open: 0, high: 0, low: 0, volume: 0 };

    // For 1D, use the live data directly
    if (timeframe === '1D') {
      return {
        open: stockData.open,
        high: stockData.high,
        low: stockData.low,
        volume: stockData.volume
      };
    }

    // For other timeframes, calculate from historical data
    if (historicalData.length > 0) {
      let min = Infinity;
      let max = -Infinity;
      let open = historicalData[0].open;
      const totalVol = historicalData.reduce((sum, item) => sum + (item.volume || 0), 0);

      historicalData.forEach(item => {
        if (item.high > max) max = item.high;
        if (item.low < min) min = item.low;
      });

      return {
        open: open,
        high: max === -Infinity ? stockData.high : max,
        low: min === Infinity ? stockData.low : min,
        // For larger timeframes, showing total volume might be too large, 
        // maybe show Average Daily Vol? Or just keep it as 'Vol'. 
        // Let's stick to simple Total for now or fallback to current if confusing.
        // Actually, users usually expect Volume to be "Volume for the period" or "Avg Vol".
        // Given the request focused on High/Low, let's just use the current stock Data volume 
        // for simplicity unless asked, as summing 1Y volume gives a huge number.
        // But to be consistent with "stats for this view", let's use stockData.volume (Current) 
        // for Volume, as that's often a separate indicator. 
        // WAIT: The image shows Vol changing slightly? No, it's 1,40,04,870 in all.
        // We will keep Volume as "Today's Volume" to avoid confusion, 
        // but update High/Low/Open.
        volume: stockData.volume
      };
    }

    return {
      open: stockData.open,
      high: stockData.high,
      low: stockData.low,
      volume: stockData.volume
    };
  };

  const displayStats = getDisplayStats();
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
          <div className="stock-price-display" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <button
              className={`watchlist-btn-icon ${inWatchlist ? 'active' : ''}`}
              onClick={toggleWatchlist}
              disabled={watchlistLoading}
              title={inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              style={{
                background: inWatchlist ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                border: inWatchlist ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                color: inWatchlist ? '#10b981' : '#9ca3af',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: inWatchlist ? '0 0 10px rgba(16, 185, 129, 0.2)' : 'none'
              }}
            >
              {watchlistLoading ? (
                <span className="animate-spin" style={{ fontSize: '1rem' }}>⌛</span>
              ) : inWatchlist ? (
                <Check size={20} strokeWidth={2.5} />
              ) : (
                <Star size={20} strokeWidth={2} />
              )}
            </button>
            <div style={{ textAlign: 'right' }}>
              <span className="current-price" style={{ display: 'block', lineHeight: '1' }}>₹{(stockData.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className={`price-change-badge ${stockData.change >= 0 ? 'bg-green' : 'bg-red'}`} style={{ fontSize: '0.9rem', marginTop: '0.25rem', display: 'inline-block' }}>
                {stockData.change >= 0 ? '+' : ''}₹{Math.abs(stockData.change || 0).toFixed(2)} ({(stockData.changePercent || 0).toFixed(2)}%)
              </span>
            </div>
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
              selectedTimeframe={timeframe}
            />
          )}

          <Card className="info-card glass-panel mb-4">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Open ({timeframe})</span>
                <span className="value">₹{(displayStats.open || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="info-item">
                <span className="label">High ({timeframe})</span>
                <span className="value">₹{(displayStats.high || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="info-item">
                <span className="label">Low ({timeframe})</span>
                <span className="value">₹{(displayStats.low || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="info-item">
                <span className="label">Vol</span>
                <span className="value">{(displayStats.volume || 0).toLocaleString('en-IN')}</span>
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

          <StockPredictionSimulator
            symbol={symbol}
            currentPrice={stockData.price}
          />
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

              {action === 'buy' && (
                <>
                  <div className="form-group">
                    <label>Stop Loss (₹)</label>
                    <input
                      type="number"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      className="input-medium"
                    />
                  </div>
                  <div className="form-group">
                    <label>Take Profit (₹)</label>
                    <input
                      type="number"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="Optional"
                      className="input-medium"
                    />
                  </div>
                </>
              )}

              <div className="order-summary mb-4">
                <div className="summary-row">
                  <span>Est. Total</span>
                  <span className="font-bold">₹{totalCost.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                {action === 'buy' && (
                  <div className="summary-row text-xs text-muted">
                    <span>Available</span>
                    <span>₹{user?.virtualBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
