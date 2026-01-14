import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './StockDetail.css';

function StockDetail() {
  const { symbol } = useParams();
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const [stockData, setStockData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [shares, setShares] = useState('');
  const [action, setAction] = useState('buy');
  const [loading, setLoading] = useState(true);
  const [trading, setTrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchStockData();
    fetchAnalysis();
    // Refresh stock data every 30 seconds
    const interval = setInterval(fetchStockData, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

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
      
      // Update user balance
      if (response.data.remainingBalance !== undefined) {
        updateUser({ ...user, virtualBalance: response.data.remainingBalance });
      }

      // Refresh stock data
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
    return <div className="loading">Loading stock data...</div>;
  }

  if (!stockData) {
    return (
      <div className="error-container">
        <div className="alert alert-error">Stock not found or data unavailable</div>
        <button onClick={() => navigate('/search')} className="btn btn-primary">
          Back to Search
        </button>
      </div>
    );
  }

  const totalCost = stockData.price * (parseInt(shares) || 0);

  return (
    <div className="stock-detail">
      <button onClick={() => navigate(-1)} className="back-button">
        ← Back
      </button>

      <div className="stock-header">
        <h1>{stockData.symbol}</h1>
        <div className={`stock-price ${stockData.change >= 0 ? 'positive' : 'negative'}`}>
          ${stockData.price.toFixed(2)}
          <span className="price-change">
            {stockData.change >= 0 ? '+' : ''}{stockData.change.toFixed(2)} 
            ({stockData.changePercent >= 0 ? '+' : ''}{stockData.changePercent.toFixed(2)}%)
          </span>
        </div>
      </div>

      <div className="stock-info-grid">
        <div className="card">
          <h3>Stock Information</h3>
          <div className="info-row">
            <span className="info-label">Open:</span>
            <span>${stockData.open.toFixed(2)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">High:</span>
            <span>${stockData.high.toFixed(2)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Low:</span>
            <span>${stockData.low.toFixed(2)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Previous Close:</span>
            <span>${stockData.previousClose.toFixed(2)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Volume:</span>
            <span>{stockData.volume.toLocaleString()}</span>
          </div>
        </div>

        <div className="card">
          <h3>AI Analysis</h3>
          {analysis ? (
            <div className="analysis-content">
              {analysis.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          ) : (
            <p className="analysis-loading">Loading AI analysis...</p>
          )}
        </div>
      </div>

      <div className="card trading-card">
        <h3>Trade Stock</h3>
        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleTrade} className="trading-form">
          <div className="form-group">
            <label>Action</label>
            <select value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="buy">Buy</option>
              <option value="sell">Sell</option>
            </select>
          </div>

          <div className="form-group">
            <label>Number of Shares</label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              min="1"
              required
              placeholder="Enter number of shares"
            />
          </div>

          {shares && (
            <div className="trade-summary">
              <p>
                <strong>Price per share:</strong> ${stockData.price.toFixed(2)}
              </p>
              <p>
                <strong>Total {action === 'buy' ? 'cost' : 'value'}:</strong> ${totalCost.toFixed(2)}
              </p>
              {action === 'buy' && (
                <p>
                  <strong>Available balance:</strong> ${user?.virtualBalance?.toFixed(2) || '0.00'}
                </p>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-block" disabled={trading}>
            {trading ? 'Processing...' : `${action === 'buy' ? 'Buy' : 'Sell'} Stock`}
          </button>
        </form>
      </div>
    </div>
  );
}

export default StockDetail;
