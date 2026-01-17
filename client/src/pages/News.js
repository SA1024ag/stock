import React, { useState, useEffect } from 'react';
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
        </div>
    );
}

export default News;
