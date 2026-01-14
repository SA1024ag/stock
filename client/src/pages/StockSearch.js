import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
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
    <div className="stock-search">
      <h1>Search Stocks</h1>
      
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by symbol or company name (e.g., AAPL, Apple)"
          className="search-input"
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && <div className="alert alert-error">{error}</div>}

      {results.length > 0 && (
        <div className="search-results">
          <h2>Search Results</h2>
          <div className="results-list">
            {results.map((stock) => (
              <StockResultCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        </div>
      )}

      {!loading && query && results.length === 0 && (
        <div className="no-results">
          <p>No stocks found. Try a different search term.</p>
        </div>
      )}
    </div>
  );
}

function StockResultCard({ stock }) {
  const navigate = useNavigate();

  const handleViewDetails = () => {
    navigate(`/stock/${stock.symbol}`);
  };

  return (
    <div className="result-card" onClick={handleViewDetails}>
      <div className="result-header">
        <h3>{stock.symbol}</h3>
        <span className="result-type">{stock.type}</span>
      </div>
      <p className="result-name">{stock.name}</p>
      <p className="result-region">{stock.region}</p>
      <button className="btn btn-primary btn-sm" onClick={handleViewDetails}>
        View Details
      </button>
    </div>
  );
}

export default StockSearch;
