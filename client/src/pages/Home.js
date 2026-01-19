import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Home.css';

// A curated list of popular symbols to sample performance from
// const DEFAULT_SYMBOLS = []; // Removed

function Home() {
  const [quotes, setQuotes] = useState({ top: [], worst: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuotes();
    // Refresh periodically to feel more "live"
    const interval = setInterval(fetchQuotes, 60000); // 60s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchQuotes = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch pre-calculated movers from backend
      const res = await api.get('/stocks/market/movers');
      setQuotes(res.data); // { gainers: [], losers: [] }

    } catch (err) {
      console.error('Error fetching movers', err);
      // Fail silently or show error?
      // setError('Failed to load top movers.');
    } finally {
      setLoading(false);
    }
  };

  const { top = [], worst = [] } = { top: quotes.gainers, worst: quotes.losers };

  return (
    <div className="home">
      <h1>Market Snapshot</h1>
      <p className="home-subtitle">
        See today&apos;s top gainers and losers from a curated list of popular Indian stocks.
      </p>

      {loading && <div className="loading">Loading market data...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && (
        <div className="home-grid">
          <div className="card">
            <h2 className="card-header">Top Performing Stocks</h2>
            {!top || top.length === 0 ? (
              <p>No data available.</p>
            ) : (
              <div className="home-list">
                {top.map((q) => (
                  <StockSummary key={q.symbol} quote={q} positive />
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h2 className="card-header">Worst Performing Stocks</h2>
            {!worst || worst.length === 0 ? (
              <p>No data available.</p>
            ) : (
              <div className="home-list">
                {worst.map((q) => (
                  <StockSummary key={q.symbol} quote={q} positive={false} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StockSummary({ quote, positive }) {
  const isUp = quote.changePercent >= 0;
  const directionClass = isUp ? 'positive' : 'negative';
  const navigate = useNavigate();

  return (
    <div
      className="home-stock"
      onClick={() => navigate(`/stock/${quote.symbol}`)}
      role="button"
      tabIndex={0}
    >
      <div className="home-stock-header">
        <span className="home-stock-symbol">{quote.symbol}</span>
        <span className={`badge ${isUp ? 'badge-success' : 'badge-danger'}`}>
          {isUp ? 'Gainer' : 'Loser'}
        </span>
      </div>
      <div className="home-stock-body">
        <div className="home-stock-price">
          ₹{quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`home-stock-change ${directionClass}`}>
          {isUp ? '+' : ''}
          {quote.change.toFixed(2)} ({isUp ? '+' : ''}
          {quote.changePercent.toFixed(2)}%)
        </div>
      </div>
      <div className="home-stock-meta">
        <span>Open: ₹{quote.open.toLocaleString('en-IN')}</span>
        <span>High: ₹{quote.high.toLocaleString('en-IN')}</span>
        <span>Low: ₹{quote.low.toLocaleString('en-IN')}</span>
      </div>
    </div>
  );
}

export default Home;

