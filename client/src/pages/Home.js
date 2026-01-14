import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './Home.css';

// A curated list of popular symbols to sample performance from
const DEFAULT_SYMBOLS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'TSLA',
  'META',
  'NVDA',
  'NFLX',
  'JPM',
  'DIS'
];

function Home() {
  const [symbols] = useState(DEFAULT_SYMBOLS);
  const [quotes, setQuotes] = useState([]);
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
      const results = await Promise.all(
        symbols.map(async (symbol) => {
          try {
            const res = await api.get(`/stocks/${symbol}`);
            return res.data;
          } catch (err) {
            // If one symbol fails, skip it but keep the rest
            console.error(`Failed to fetch quote for ${symbol}`, err);
            return null;
          }
        })
      );

      const validQuotes = results.filter(Boolean);
      setQuotes(validQuotes);
    } catch (err) {
      console.error('Error fetching quotes for home page', err);
      setError('Failed to load top movers. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getSortedQuotes = () => {
    if (!quotes.length) return { top: [], worst: [] };
    const sorted = [...quotes].sort(
      (a, b) => b.changePercent - a.changePercent
    );
    return {
      top: sorted.slice(0, 3),
      worst: sorted.slice(-3).reverse()
    };
  };

  const { top, worst } = getSortedQuotes();

  return (
    <div className="home">
      <h1>Market Snapshot</h1>
      <p className="home-subtitle">
        See today&apos;s top gainers and losers from a curated list of popular stocks.
      </p>

      {loading && <div className="loading">Loading market data...</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && !error && quotes.length > 0 && (
        <div className="home-grid">
          <div className="card">
            <h2 className="card-header">Top Performing Stocks</h2>
            {top.length === 0 ? (
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
            {worst.length === 0 ? (
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

  return (
    <div className="home-stock">
      <div className="home-stock-header">
        <span className="home-stock-symbol">{quote.symbol}</span>
        <span className={`badge ${isUp ? 'badge-success' : 'badge-danger'}`}>
          {isUp ? 'Gainer' : 'Loser'}
        </span>
      </div>
      <div className="home-stock-body">
        <div className="home-stock-price">
          ${quote.price.toFixed(2)}
        </div>
        <div className={`home-stock-change ${directionClass}`}>
          {isUp ? '+' : ''}
          {quote.change.toFixed(2)} ({isUp ? '+' : ''}
          {quote.changePercent.toFixed(2)}%)
        </div>
      </div>
      <div className="home-stock-meta">
        <span>Open: ${quote.open.toFixed(2)}</span>
        <span>High: ${quote.high.toFixed(2)}</span>
        <span>Low: ${quote.low.toFixed(2)}</span>
      </div>
    </div>
  );
}

export default Home;

