import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Activity, BarChart2, BookOpen, ShieldCheck, Cpu } from 'lucide-react';
import './LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-page">
            {/* Transparent Navbar */}
            <nav className="landing-nav">
                <div className="nav-logo">StockLabs</div>
                <div className="nav-links">
                    <Link to="/login" className="btn-login">Login</Link>
                    <Link to="/register" className="btn-signup">Sign Up</Link>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="hero-section">
                <div className="hero-content">
                    <h1 className="hero-headline">
                        Master the Stock Market with <span className="gradient-text">AI-Powered Insights</span>
                    </h1>
                    <p className="hero-subheadline">
                        Practice trading with logical virtual funds, get real-time market data, and learn from advanced analysis—completely risk-free.
                    </p>
                    <Link to="/register" className="cta-button">
                        Get Started Free
                    </Link>
                </div>

                <div className="hero-visual">
                    <div className="chart-placeholder">
                        {/* CSS-only Chart Animation */}
                        <div className="bar-container">
                            <div className="bar" style={{ height: '40%', animationDelay: '0s' }}></div>
                            <div className="bar" style={{ height: '70%', animationDelay: '0.2s' }}></div>
                            <div className="bar" style={{ height: '50%', animationDelay: '0.4s' }}></div>
                            <div className="bar" style={{ height: '85%', animationDelay: '0.6s' }}></div>
                            <div className="bar" style={{ height: '60%', animationDelay: '0.8s' }}></div>
                            <div className="bar" style={{ height: '95%', animationDelay: '1s' }}></div>
                        </div>
                        <div style={{ marginTop: '20px', color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
                            Real-Time Simulations
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Showcase */}
            <section className="features-section">
                <div className="features-grid">
                    {/* Feature 1: Virtual Portfolio */}
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <ShieldCheck size={28} />
                        </div>
                        <h3 className="feature-title">Virtual Funds</h3>
                        <p className="feature-desc">
                            Start with $10,000 in virtual simulation money. Make mistakes here so you don't make them in the real market.
                        </p>
                    </div>

                    {/* Feature 2: AI Analysis */}
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <Cpu size={28} />
                        </div>
                        <h3 className="feature-title">AI Stock Insights</h3>
                        <p className="feature-desc">
                            Leverage Llama-powered AI to analyze market trends, sentiment, and get personalized portfolio reviews.
                        </p>
                    </div>

                    {/* Feature 3: Real-Time Data */}
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <Activity size={28} />
                        </div>
                        <h3 className="feature-title">Live Market Data</h3>
                        <p className="feature-desc">
                            Access real-time stock prices and charts via key market providers. Stay ahead of the curve.
                        </p>
                    </div>

                    {/* Feature 4: Learning Hub */}
                    <div className="feature-card">
                        <div className="feature-icon-wrapper">
                            <BookOpen size={28} />
                        </div>
                        <h3 className="feature-title">Learning Hub</h3>
                        <p className="feature-desc">
                            From beginner basics to advanced trading strategies. Learn at your own pace with curated modules.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default LandingPage;
