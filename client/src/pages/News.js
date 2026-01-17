import React, { useState, useEffect } from 'react';
<<<<<<< HEAD
import { useParams } from 'react-router-dom';
import api from '../services/api';
import './News.css';

function News() {
    const { symbol } = useParams();
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchNews = async () => {
            try {
                setLoading(true);
                const endpoint = symbol ? `/stocks/news/${symbol}` : '/stocks/news/general';
                // Note: The backend route is /news/:symbol? so passing nothing works for general, but let's be explicit if needed
                // Actually our backend route handles /news/:symbol?. If symbol is undefined, it fetches general.
                // But if we pass 'general' string it treats it as symbol 'GENERAL'.
                // Let's rely on the backend route param being optional.
                // If symbol is undefined, we request `/stocks/news/`.

                let url = '/stocks/news';
                if (symbol) {
                    url += `/${symbol}`;
                }

                const response = await api.get(url);
                setNews(response.data);
                setError(null);
            } catch (err) {
                console.error('Error fetching news:', err);
                setError('Failed to load news. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [symbol]);

    const formatDate = (dateString) => {
        // Format: 20240315T150000 or ISO
        if (!dateString) return '';
        if (dateString.includes('T')) {
            // Simple parsing for Alpha Vantage format 20240315T150000
            const year = dateString.substring(0, 4);
            const month = dateString.substring(4, 6);
            const day = dateString.substring(6, 8);
            const hour = dateString.substring(9, 11);
            const minute = dateString.substring(11, 13);
            const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
            return date.toLocaleDateString(undefined, {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });
        }
        return new Date(dateString).toLocaleDateString();
    };

    const getSentimentColor = (label) => {
        if (!label) return 'text-gray';
        if (label.includes('Bullish')) return 'text-green';
        if (label.includes('Bearish')) return 'text-red';
        return 'text-gray';
    };

    return (
        <div className="news-page fade-in">
            <div className="header-section">
                <h1 className="page-title">
                    {symbol ? `${symbol} News` : 'Market News'}
                </h1>
                <p className="page-subtitle">
                    Latest updates and market sentiment
                    {symbol && <span className="ticker-badge">{symbol}</span>}
                </p>
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading latest news...</p>
                </div>
            ) : error ? (
                <div className="error-message glass-panel">
                    {error}
                </div>
            ) : (
                <div className="news-grid">
                    {news.map((item, index) => (
                        <a
                            key={index}
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="news-card glass-panel"
                        >
                            <div className="news-image-container">
                                <img
                                    src={item.banner_image || 'https://images.unsplash.com/photo-1611974765270-ca1258822fde?auto=format&fit=crop&w=600&q=80'}
                                    alt={item.title}
                                    className="news-image"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = 'https://images.unsplash.com/photo-1611974765270-ca1258822fde?auto=format&fit=crop&w=600&q=80'
                                    }}
                                />
                                <div className="news-overlay">
                                    <span className="news-source">{item.source}</span>
                                </div>
                            </div>
                            <div className="news-content">
                                <div className="news-meta">
                                    <span className="news-date">{formatDate(item.time_published)}</span>
                                    {item.sentiment_label && (
                                        <span className={`news-sentiment ${getSentimentColor(item.sentiment_label)}`}>
                                            {item.sentiment_label}
                                        </span>
                                    )}
                                </div>
                                <h3 className="news-title">{item.title}</h3>
                                <p className="news-summary">{item.summary && item.summary.length > 150 ? item.summary.substring(0, 150) + '...' : item.summary}</p>
                            </div>
                        </a>
                    ))}
                </div>
            )}
=======
import { getPersonalizedNews, getNewsByCategory } from '../services/newsApi';
import NewsCard from '../components/NewsCard';
import './News.css';

function News() {
    const [activeTab, setActiveTab] = useState('for-you');
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortBy, setSortBy] = useState('relevant');

    useEffect(() => {
        fetchNews();
    }, [activeTab, sortBy]);

    const fetchNews = async () => {
        setLoading(true);
        setError(null);

        try {
            let response;

            if (activeTab === 'for-you') {
                response = await getPersonalizedNews({}, 30);
            } else if (activeTab === 'market') {
                response = await getNewsByCategory('Market', 30);
            } else if (activeTab === 'company') {
                response = await getNewsByCategory('Company', 30);
            } else if (activeTab === 'global') {
                response = await getNewsByCategory('Global', 30);
            }

            let newsData = response.data || [];

            // Apply sorting
            if (sortBy === 'latest') {
                newsData.sort((a, b) => {
                    const dateA = new Date(parseTimestamp(a.time_published));
                    const dateB = new Date(parseTimestamp(b.time_published));
                    return dateB - dateA;
                });
            } else if (sortBy === 'impactful') {
                newsData.sort((a, b) => {
                    const scoreA = Math.abs(parseFloat(a.overall_sentiment_score) || 0);
                    const scoreB = Math.abs(parseFloat(b.overall_sentiment_score) || 0);
                    return scoreB - scoreA;
                });
            }
            // 'relevant' is already sorted by backend

            setNews(newsData);
        } catch (err) {
            console.error('Error fetching news:', err);
            setError('Failed to load news. Please check your API configuration.');
        } finally {
            setLoading(false);
        }
    };

    const parseTimestamp = (timestamp) => {
        if (!timestamp) return new Date();
        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6);
        const day = timestamp.substring(6, 8);
        const hour = timestamp.substring(9, 11);
        const minute = timestamp.substring(11, 13);
        return `${year}-${month}-${day}T${hour}:${minute}:00Z`;
    };

    const handleRefresh = () => {
        fetchNews();
    };

    return (
        <div className="news-page">
            <div className="news-header">
                <div className="news-header-content">
                    <h1>📰 Market News</h1>
                    <p className="news-subtitle">Stay updated with real-time market insights</p>
                </div>

                <div className="news-controls">
                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="relevant">Most Relevant</option>
                        <option value="latest">Latest</option>
                        <option value="impactful">Most Impactful</option>
                    </select>

                    <button className="refresh-btn" onClick={handleRefresh} title="Refresh news">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="23 4 23 10 17 10"></polyline>
                            <polyline points="1 20 1 14 7 14"></polyline>
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <div className="news-tabs">
                <button
                    className={`news-tab ${activeTab === 'for-you' ? 'active' : ''}`}
                    onClick={() => setActiveTab('for-you')}
                >
                    <span className="tab-icon">📌</span>
                    For You
                </button>
                <button
                    className={`news-tab ${activeTab === 'market' ? 'active' : ''}`}
                    onClick={() => setActiveTab('market')}
                >
                    <span className="tab-icon">📈</span>
                    Market Headlines
                </button>
                <button
                    className={`news-tab ${activeTab === 'company' ? 'active' : ''}`}
                    onClick={() => setActiveTab('company')}
                >
                    <span className="tab-icon">🏢</span>
                    Company News
                </button>
                <button
                    className={`news-tab ${activeTab === 'global' ? 'active' : ''}`}
                    onClick={() => setActiveTab('global')}
                >
                    <span className="tab-icon">🌍</span>
                    Global Markets
                </button>
            </div>

            <div className="news-content">
                {loading ? (
                    <div className="news-loading">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="news-skeleton">
                                <div className="skeleton-image"></div>
                                <div className="skeleton-content">
                                    <div className="skeleton-line skeleton-title"></div>
                                    <div className="skeleton-line skeleton-text"></div>
                                    <div className="skeleton-line skeleton-text short"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="news-error">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        <h3>Unable to Load News</h3>
                        <p>{error}</p>
                        <p className="error-hint">
                            💡 <strong>Tip:</strong> Make sure your Alpha Vantage API key is configured in <code>server/.env</code>
                        </p>
                        <button className="btn-retry" onClick={handleRefresh}>Try Again</button>
                    </div>
                ) : news.length === 0 ? (
                    <div className="news-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"></path>
                            <path d="M18 14h-8"></path>
                            <path d="M15 18h-5"></path>
                            <path d="M10 6h8v4h-8V6Z"></path>
                        </svg>
                        <h3>No News Available</h3>
                        <p>Check back later for the latest market updates</p>
                    </div>
                ) : (
                    <div className="news-feed">
                        {news.map((article, index) => (
                            <NewsCard key={index} article={article} />
                        ))}
                    </div>
                )}
            </div>
>>>>>>> 019e19f41111e0bcae56f49a6e2ebdfe431d05b3
        </div>
    );
}

export default News;
