import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import './MarketTicker.css';
import { TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

const MarketTicker = () => {
    const [indices, setIndices] = useState([]);
    const [marketStatus, setMarketStatus] = useState('CLOSED');
    const navigate = useNavigate();

    useEffect(() => {
        fetchIndices();
        checkMarketStatus();
        const interval = setInterval(() => {
            fetchIndices();
            checkMarketStatus();
        }, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const fetchIndices = async () => {
        try {
            const response = await api.get('/stocks/market/indices');
            setIndices(response.data);
        } catch (error) {
            console.error('Failed to fetch indices', error);
        }
    };

    const checkMarketStatus = () => {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const ist = new Date(utc + (3600000 * 5.5)); // IST is UTC + 5:30

        const day = ist.getDay();
        const hour = ist.getHours();
        const minute = ist.getMinutes();
        const timeInMinutes = hour * 60 + minute;

        // Market hours: 9:15 AM to 3:30 PM, Mon-Fri
        const openTime = 9 * 60 + 15;
        const closeTime = 15 * 60 + 30;

        let status = 'CLOSED';
        if (day >= 1 && day <= 5) {
            if (timeInMinutes >= openTime && timeInMinutes < closeTime) {
                status = 'OPEN';
            }
        }
        setMarketStatus(status);
    };

    const getStatusColor = () => {
        return marketStatus === 'OPEN' ? 'text-green' : 'text-red';
    };

    return (
        <div className="market-ticker-container">
            <div className="market-status">
                <Clock size={16} className={`status-icon ${getStatusColor()}`} />
                <span className="status-label">Market Status:</span>
                <span className={`status-value ${getStatusColor()}`}>{marketStatus}</span>
            </div>

            <div className="ticker-wrapper">
                <div className="ticker-track">
                    {/* Double the list for seamless scrolling */}
                    {[...indices, ...indices].map((index, i) => (
                        <div
                            key={`${index.name}-${i}`}
                            className="ticker-item"
                            onClick={() => navigate(`/stock/${index.name.replace(/\s+/g, '')}`)} // Placeholder nav
                        >
                            <span className="index-name">{index.name}</span>
                            <span className="index-price">{index.price.toLocaleString('en-IN')}</span>

                            <div className={`index-change ${index.change >= 0 ? 'positive' : 'negative'}`}>
                                {index.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span>{Math.abs(index.change).toFixed(2)}</span>
                                <span className="change-percent">({Math.abs(index.changePercent).toFixed(2)}%)</span>
                            </div>
                        </div>
                    ))}
                    {indices.length === 0 && <div className="loading-ticker">Loading Market Data...</div>}
                </div>
            </div>
        </div>
    );
};

export default MarketTicker;
