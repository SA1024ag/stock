import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './StockSearch.css';

function StockSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`/stocks/search?q=${encodeURIComponent(query)}`);
      setResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setError('Failed to search stocks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>Market Search</h1>
        <p className="text-secondary">Explore companies and trading opportunities</p>
      </div>

      <Card className="search-container glass-panel">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by symbol (e.g. RELIANCE, TATASTEEL)"
              className="search-input-premium"
            />
          </div>
          <Button type="submit" variant="primary" isLoading={loading} className="search-button">
            Search
          </Button>
        </form>
      </Card>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="search-results-container">
        {results.length > 0 ? (
          <div className="results-grid">
            {results.map((stock) => (
              <StockResultCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        ) : (
          !loading && query && (
            <div className="no-results text-center text-muted">
              <p>No results found for "{query}"</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}

function StockResultCard({ stock }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/stock/${stock.symbol}`);
  };

  return (
    <div className="result-card-premium glass-panel" onClick={handleViewDetails}>
      <div className="result-card-content">
        <div className="result-main">
          <div className="result-symbol">{stock.symbol}</div>
          <div className="result-type-badge">{stock.type}</div>
        </div>
        <div className="result-info">
          <p className="result-name">{stock.name}</p>
          <p className="result-region text-muted">{stock.exchange}</p>
        </div>
      </div>
      <div className="result-action">
        <span className="action-text">Analyze ›</span>
      </div>
    </div>
  );
}

export default StockSearch;
