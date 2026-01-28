import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StockSearch from './pages/StockSearch';
import StockDetail from './pages/StockDetail';
import Portfolio from './pages/Portfolio';
import News from './pages/News';
import Community from './pages/Community';
import Home from './pages/Home';
import LandingPage from './pages/LandingPage';
import { Toaster } from 'react-hot-toast';


// AI & Insights Pages
import AIStockInsights from './pages/AIStockInsights';
import AIPortfolioAnalysis from './pages/AIPortfolioAnalysis';
import AIRecommendations from './pages/AIRecommendations';
import ScenarioSimulator from './pages/ScenarioSimulator';

// Learning Pages
import LearningHub from './pages/LearningHub';
import ModuleDetailPage from './pages/ModuleDetailPage';
import Watchlist from './pages/Watchlist';
import { StockExplainers, BeginnerGuides, PortfolioReport, Transactions, ProfitLoss, Alerts, MarketMovers } from './pages/PlaceholderPages';

// Profile Pages
import Account from './pages/profile/Account';
import Settings from './pages/profile/Settings';
import Security from './pages/profile/Security';
import Help from './pages/profile/Help';
import Payment from './pages/Payment';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
      <Route path="/" element={user ? <Home /> : <LandingPage />} />
      <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route path="/search" element={<PrivateRoute><StockSearch /></PrivateRoute>} />
      <Route path="/stock/:symbol" element={<PrivateRoute><StockDetail /></PrivateRoute>} />
      <Route path="/portfolio" element={<PrivateRoute><Portfolio /></PrivateRoute>} />
      <Route path="/news" element={<PrivateRoute><News /></PrivateRoute>} />
      <Route path="/community" element={<PrivateRoute><Community /></PrivateRoute>} />

      <Route path="/news/:symbol" element={<PrivateRoute><News /></PrivateRoute>} />



      {/* AI & Insights */}
      <Route path="/ai-insights" element={<PrivateRoute><AIStockInsights /></PrivateRoute>} />
      <Route path="/ai-portfolio" element={<PrivateRoute><AIPortfolioAnalysis /></PrivateRoute>} />
      <Route path="/ai-recommendations" element={<PrivateRoute><AIRecommendations /></PrivateRoute>} />
      <Route path="/simulate" element={<PrivateRoute><ScenarioSimulator /></PrivateRoute>} />

      {/* Learning */}
      <Route path="/learning-hub" element={<PrivateRoute><LearningHub /></PrivateRoute>} />
      <Route path="/module/:moduleId" element={<PrivateRoute><ModuleDetailPage /></PrivateRoute>} />
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
      <Route path="/add-credits" element={<PrivateRoute><Payment /></PrivateRoute>} />
    </Routes>
  );
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  // Hide main navbar on landing page (when user is not logged in and on root path)
  const showNavbar = user || (location.pathname !== '/');

  return (
    <div className="App">
      {showNavbar && <Navbar />}
      {user && <Sidebar />}

      <main className="main-content">
        <AppRoutes />
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(15, 23, 42, 0.9)',
            color: '#fff',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '16px',
            borderRadius: '12px',
            fontSize: '14px',
            maxWidth: '400px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
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
