import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
              <Link to="/dashboard" className={`nav-link ${isActive('/dashboard')}`}>
                Dashboard
              </Link>
              <Link to="/search" className={`nav-link ${isActive('/search')}`}>
                Market
              </Link>
              <Link to="/portfolio" className={`nav-link ${isActive('/portfolio')}`}>
                Portfolio
              </Link>
            </div>

            <div className="navbar-actions">
              <button onClick={toggleTheme} className="theme-toggle" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              <div className="balance-display glass-panel">
                <span className="balance-label">Buying Power</span>
                <span className="balance-amount text-green">
                  ${user.virtualBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                </span>
              </div>

              <div className="user-menu">
                <div className="user-avatar">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
                <button onClick={handleLogout} className="btn-logout" title="Logout">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
