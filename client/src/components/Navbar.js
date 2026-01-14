import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          📈 AI Stock Simulator
        </Link>
        
        {user && (
          <div className="navbar-menu">
            <Link to="/dashboard" className="navbar-link">
              Dashboard
            </Link>
            <Link to="/search" className="navbar-link">
              Search Stocks
            </Link>
            <Link to="/portfolio" className="navbar-link">
              Portfolio
            </Link>
            <div className="navbar-user">
              <span className="navbar-balance">
                Balance: ${user.virtualBalance?.toFixed(2) || '0.00'}
              </span>
              <span className="navbar-username">{user.username}</span>
              <button onClick={handleLogout} className="btn btn-secondary btn-sm">
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
