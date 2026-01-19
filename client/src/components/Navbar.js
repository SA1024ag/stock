import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import ProfileDropdown from './ProfileDropdown';
import './Navbar.css';
import api from '../services/api';


function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  const [showProfileDropdown, setShowProfileDropdown] = React.useState(false);
  const [loading, setLoading] = React.useState(false);


  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileDropdown && !event.target.closest('.user-menu')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Debounce function to limit API calls
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Search API call
  const searchStocks = async (query) => {
    if (!query) {
      setSearchResults([]);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get(`/stocks/search?q=${query}`);
      setSearchResults(response.data);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Memoize the debounced search function
  const debouncedSearch = React.useCallback(debounce(searchStocks, 300), []);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length > 0) {
      setLoading(true);
      setShowSuggestions(true);
      debouncedSearch(query);
    } else {
      setSearchResults([]);
      setShowSuggestions(false);
      setLoading(false);
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-logo">⚡</span>
          <span className="brand-text">Trade<span className="text-green">AI</span></span>
        </Link>

        {user && (
          <div className="navbar-content">
            <div className="navbar-links">
              <Link to="/" className={`nav-link ${isActive('/')}`}>
                Home
              </Link>
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                Dashboard
              </Link>
              <Link to="/portfolio" className={`nav-link ${isActive('/portfolio')}`}>
                Portfolio
              </Link>
              <Link to="/news" className={`nav-link ${isActive('/news')}`}>
                News
              </Link>
              <Link to="/community" className={`nav-link ${isActive('/community')}`}>
                Community
              </Link>
            </div>

            <div className="navbar-actions">
              <div className="navbar-search">
                <input
                  type="text"
                  placeholder="Search stocks..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (searchQuery.length > 0) setShowSuggestions(true);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchQuery) {
                      navigate(`/stock/${searchQuery.toUpperCase()}`);
                      setShowSuggestions(false);
                    }
                  }}
                />
                <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>

                {showSuggestions && searchQuery.length > 0 && (
                  <div className="search-suggestions glass-panel">
                    {loading ? (
                      <div className="suggestion-item" style={{ cursor: 'default' }}>
                        <span className="suggestion-name">Searching...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map((stock) => (
                        <div
                          key={stock.symbol}
                          className="suggestion-item"
                          onMouseDown={() => {
                            navigate(`/stock/${stock.symbol}`);
                            setSearchQuery('');
                            setSearchResults([]);
                            setShowSuggestions(false);
                          }}
                        >
                          <span className="suggestion-symbol">{stock.symbol}</span>
                          <span className="suggestion-name">{stock.name}</span>
                        </div>
                      ))
                    ) : (
                      <div className="suggestion-item" style={{ cursor: 'default' }}>
                        <span className="suggestion-name">No results found</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={toggleTheme}
                className="theme-toggle"
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              <div className="balance-display glass-panel">
                <span className="balance-label">Buying Power</span>
                <span className="balance-amount text-green">
                  ₹{user.virtualBalance?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </span>
              </div>

              <div className="user-menu">
                <div
                  className="user-avatar"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  style={{ cursor: 'pointer' }}
                >
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                {showProfileDropdown && (
                  <ProfileDropdown onClose={() => setShowProfileDropdown(false)} />
                )}
              </div>
            </div>
          </div>
        )}
      </div>


    </nav >
  );
}

export default Navbar;