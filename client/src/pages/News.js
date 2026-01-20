import React, { useState, useEffect } from 'react';
import { getNews } from '../services/newsApi';
import './News.css';

function News() {
    const [news, setNews] = useState([]);
    const [timeRange, setTimeRange] = useState('1d');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const data = await getNews(timeRange);
            setNews(data);
            setLoading(false);
        };
        load();
    }, [timeRange]);

    if (loading) return <div className="news-page"><div className="loading">Loading news...</div></div>;

    return (
        <div className="news-page">
            <div className="news-header">
                <h1 className="page-title">Market News</h1>
            </div>

            {loading ? (
                <div className="loading">Loading news...</div>
            ) : (
                <div className="news-list-simple">
                    {news.map((item, index) => (
                        <div key={index} className="simple-news-item">
                            <a href={item.link} target="_blank" rel="noopener noreferrer" className="news-link-wrapper">
                                <h3 className="news-item-title">{item.title}</h3>
                                <div className="news-meta-simple">
                                    <span className="source-tag">{item.source}</span>
                                    <span className="date-tag">{new Date(item.pubDate).toLocaleDateString()}</span>
                                </div>
                                <p className="news-snippet">{item.snippet}</p>
                            </a>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}

export default News;
