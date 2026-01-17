import React, { useState, useEffect } from 'react';
import { getMarketNews } from '../services/newsApi';
import './NewsPanel.css';

function NewsPanel({ isOpen, onClose }) {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);

    // Fetch news when panel opens
    useEffect(() => {
        if (isOpen && (!lastFetch || Date.now() - lastFetch > 5 * 60 * 1000)) {
            fetchNews();
        }
    }, [isOpen]);

    const fetchNews = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await getMarketNews(15);
            setNews(response.data || []);
            setLastFetch(Date.now());
        } catch (err) {
            console.error('Failed to fetch news:', err);
            setError('Failed to load news. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchNews();
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';

        // Alpha Vantage format: YYYYMMDDTHHMMSS
        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6);
        const day = timestamp.substring(6, 8);
        const hour = timestamp.substring(9, 11);
        const minute = timestamp.substring(11, 13);

        const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00`);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else if (diffDays < 7) {
            return `${diffDays}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const getSentimentColor = (sentiment) => {
        if (!sentiment) return '';
        const lower = sentiment.toLowerCase();
        if (lower.includes('bullish') || lower.includes('positive')) return 'sentiment-positive';
        if (lower.includes('bearish') || lower.includes('negative')) return 'sentiment-negative';
        return 'sentiment-neutral';
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="news-panel-overlay" onClick={onClose} />
            <div className="news-panel glass-panel">
                <div className="news-panel-header">
                    <div className="news-header-left">
                        <h3>📰 Market News</h3>
                        <span className="news-subtitle">Real-time updates</span>
                    </div>
                    <div className="news-header-actions">
                        <button
                            className="news-refresh-btn"
                            onClick={handleRefresh}
                            disabled={loading}
                            title="Refresh news"
                        >
                            <svg
                                className={loading ? 'spinning' : ''}
                                xmlns="http://www.w3.org/2000/svg"
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                        </button>
                        <button className="news-close-btn" onClick={onClose} title="Close">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="news-panel-content">
                    {loading && news.length === 0 ? (
                        <div className="news-loading">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="news-skeleton">
                                    <div className="skeleton-line skeleton-title"></div>
                                    <div className="skeleton-line skeleton-text"></div>
                                    <div className="skeleton-line skeleton-text short"></div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="news-error">
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                            <p>{error}</p>
                            <button className="btn-retry" onClick={handleRefresh}>Try Again</button>
                        </div>
                    ) : news.length === 0 ? (
                        <div className="news-empty">
                            <p>No news available at the moment.</p>
                        </div>
                    ) : (
                        <div className="news-list">
                            {news.map((article, index) => (
                                <a
                                    key={index}
                                    href={article.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="news-item"
                                >
                                    <div className="news-item-content">
                                        <h4 className="news-title">{article.title}</h4>
                                        <p className="news-summary">{article.summary}</p>
                                        <div className="news-meta">
                                            <span className="news-source">{article.source}</span>
                                            <span className="news-dot">•</span>
                                            <span className="news-time">{formatTimestamp(article.publishedAt)}</span>
                                            {article.sentiment && (
                                                <>
                                                    <span className="news-dot">•</span>
                                                    <span className={`news-sentiment ${getSentimentColor(article.sentiment)}`}>
                                                        {article.sentiment}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    {article.imageUrl && (
                                        <div className="news-image">
                                            <img src={article.imageUrl} alt={article.title} />
                                        </div>
                                    )}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default NewsPanel;
