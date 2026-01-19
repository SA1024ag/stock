import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StockSearch from './pages/StockSearch';
import StockDetail from './pages/StockDetail';
import Portfolio from './pages/Portfolio';
import News from './pages/News';
import Home from './pages/Home';


// AI & Insights Pages
import AIStockInsights from './pages/AIStockInsights';
import AIPortfolioAnalysis from './pages/AIPortfolioAnalysis';
import AIRecommendations from './pages/AIRecommendations';

// Learning Pages
// Learning Pages
import LearningHub from './pages/LearningHub';
import { StockExplainers, BeginnerGuides, PortfolioReport, Transactions, ProfitLoss, Watchlist, Alerts, MarketMovers } from './pages/PlaceholderPages';

// Profile Pages
import Account from './pages/profile/Account';
import Settings from './pages/profile/Settings';
import Security from './pages/profile/Security';
import Help from './pages/profile/Help';
import Payment from './pages/Payment';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import useUpstoxAuth from './hooks/useUpstoxAuth';
import TokenExpiredNotification from './components/TokenExpiredNotification';
import './App.css';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />

      {/* Main Pages */}
      <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/search" element={<PrivateRoute><StockSearch /></PrivateRoute>} />
      <Route path="/stock/:symbol" element={<PrivateRoute><StockDetail /></PrivateRoute>} />
      <Route path="/portfolio" element={<PrivateRoute><Portfolio /></PrivateRoute>} />
      <Route path="/news" element={<PrivateRoute><News /></PrivateRoute>} />

      <Route path="/news/:symbol" element={<PrivateRoute><News /></PrivateRoute>} />



      {/* AI & Insights */}
      <Route path="/ai-insights" element={<PrivateRoute><AIStockInsights /></PrivateRoute>} />
      <Route path="/ai-portfolio" element={<PrivateRoute><AIPortfolioAnalysis /></PrivateRoute>} />
      <Route path="/ai-recommendations" element={<PrivateRoute><AIRecommendations /></PrivateRoute>} />

      {/* Learning */}
      <Route path="/learning-hub" element={<PrivateRoute><LearningHub /></PrivateRoute>} />
      <Route path="/stock-explainers" element={<PrivateRoute><StockExplainers /></PrivateRoute>} />
      <Route path="/beginner-guides" element={<PrivateRoute><BeginnerGuides /></PrivateRoute>} />

      {/* Reports */}
      <Route path="/portfolio-report" element={<PrivateRoute><PortfolioReport /></PrivateRoute>} />
      <Route path="/transactions" element={<PrivateRoute><Transactions /></PrivateRoute>} />
      <Route path="/profit-loss" element={<PrivateRoute><ProfitLoss /></PrivateRoute>} />

      {/* Tracking */}
      <Route path="/watchlist" element={<PrivateRoute><Watchlist /></PrivateRoute>} />
      <Route path="/alerts" element={<PrivateRoute><Alerts /></PrivateRoute>} />
      <Route path="/market-movers" element={<PrivateRoute><MarketMovers /></PrivateRoute>} />

      {/* Profile */}
      <Route path="/profile" element={<PrivateRoute><Account /></PrivateRoute>} /> {/* Default redirect/page */}
      <Route path="/profile/account" element={<PrivateRoute><Account /></PrivateRoute>} />
      <Route path="/profile/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
      <Route path="/profile/security" element={<PrivateRoute><Security /></PrivateRoute>} />
      <Route path="/profile/help" element={<PrivateRoute><Help /></PrivateRoute>} />
      <Route path="/payment" element={<PrivateRoute><Payment /></PrivateRoute>} />
    </Routes>
  );
}

function AppContent() {
  const { user } = useAuth();
  const { tokenStatus, openAuthPopup } = useUpstoxAuth();

  const handleReauthenticate = () => {
    openAuthPopup();
  };

  return (
    <div className="App">
      <Navbar />
      {user && <Sidebar />}

      {/* Token Expiry Notification - Only show for logged-in users */}
      {user && (
        <TokenExpiredNotification
          tokenStatus={tokenStatus}
          onReauthenticate={handleReauthenticate}
        />
      )}

      <main className="main-content">
        <AppRoutes />
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <AppContent />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
