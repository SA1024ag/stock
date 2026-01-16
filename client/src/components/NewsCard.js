import React from 'react';
import { useNavigate } from 'react-router-dom';
import './NewsCard.css';

function NewsCard({ article }) {
    const navigate = useNavigate();

    const getImpactBadge = (sentimentScore) => {
        const score = parseFloat(sentimentScore) || 0;
        if (score > 0.3) return { icon: '🔺', label: 'Positive', className: 'impact-positive' };
        if (score < -0.3) return { icon: '🔻', label: 'Negative', className: 'impact-negative' };
        return { icon: '⚪', label: 'Neutral', className: 'impact-neutral' };
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return '';

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

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    };

    const impact = getImpactBadge(article.sentimentScore || article.overall_sentiment_score);

    const handleTickerClick = (ticker, e) => {
        e.preventDefault();
        e.stopPropagation();
        navigate(`/stock/${ticker}`);
    };

    return (
        <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="news-card"
        >
            {article.imageUrl && (
                <div className="news-card-image">
                    <img src={article.imageUrl} alt={article.title} />
                </div>
            )}

            <div className="news-card-content">
                <div className="news-card-header">
                    {article.tickers && article.tickers.length > 0 && (
                        <div className="news-tickers">
                            {article.tickers.slice(0, 3).map((ticker, idx) => (
                                <span
                                    key={idx}
                                    className="ticker-badge"
                                    onClick={(e) => handleTickerClick(ticker, e)}
                                    title={`View ${ticker} details`}
                                >
                                    {ticker}
                                </span>
                            ))}
                        </div>
                    )}

                    <span className={`impact-badge ${impact.className}`}>
                        <span className="impact-icon">{impact.icon}</span>
                        <span className="impact-label">{impact.label}</span>
                    </span>
                </div>

                <h3 className="news-card-title">{article.title}</h3>

                <p className="news-card-summary">{article.summary}</p>

                <div className="news-card-footer">
                    <div className="news-meta">
                        <span className="news-source">{article.source}</span>
                        <span className="news-dot">•</span>
                        <span className="news-time">{formatTimestamp(article.publishedAt || article.time_published)}</span>
                        {article.category && (
                            <>
                                <span className="news-dot">•</span>
                                <span className="news-category">{article.category}</span>
                            </>
                        )}
                    </div>

                    {article.explanation && (
                        <div className="news-explanation" title="Why am I seeing this?">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <span className="explanation-text">{article.explanation}</span>
                        </div>
                    )}
                </div>
            </div>
        </a>
    );
}

export default NewsCard;
