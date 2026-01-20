import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Toast from '../components/common/Toast';
import { Trash2, ArrowUpRight, ArrowDownRight, TrendingUp, Bell, BellRing, X } from 'lucide-react';
import './StockSearch.css'; // Reusing search styles for list
import './Portfolio.css';   // Reusing portfolio styles for table

function Watchlist() {
    const [watchlist, setWatchlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState('symbol'); // symbol, price, change
    const [sortOrder, setSortOrder] = useState('asc'); // asc, desc

    // Alert Modal State
    const [alertModalOpen, setAlertModalOpen] = useState(false);
    const [currentAlertStock, setCurrentAlertStock] = useState(null);
    const [targetHigh, setTargetHigh] = useState('');
    const [targetLow, setTargetLow] = useState('');
    const [toast, setToast] = useState(null); // { message, type }

    useEffect(() => {
        fetchWatchlist();
        const interval = setInterval(fetchWatchlist, 15000); // Poll every 15s
        return () => clearInterval(interval);
    }, []);

    const fetchWatchlist = async () => {
        try {
            const response = await api.get('/watchlist');
            const watchlistItems = response.data;

            // Fetch current data for each stock
            const enrichedWatchlist = await Promise.all(watchlistItems.map(async (item) => {
                try {
                    const stockResponse = await api.get(`/stocks/${item.symbol}`);
                    return { ...item, ...stockResponse.data };
                } catch (err) {
                    console.error(`Failed to fetch data for ${item.symbol}`, err);
                    return item;
                }
            }));

            setWatchlist(enrichedWatchlist);
        } catch (err) {
            console.error('Error fetching watchlist:', err);
            if (loading) setError('Failed to load watchlist');
        } finally {
            setLoading(false);
        }
    };

    const removeFromWatchlist = async (symbol) => {
        try {
            await api.delete(`/watchlist/remove/${symbol}`);
            setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
            setToast({ message: `${symbol} removed from watchlist`, type: 'success' });
        } catch (err) {
            console.error('Error removing from watchlist:', err);
            setError('Failed to remove stock');
        }
    };

    const openAlertModal = (stock) => {
        setCurrentAlertStock(stock);
        setTargetHigh(stock.targetHigh || '');
        setTargetLow(stock.targetLow || '');
        setAlertModalOpen(true);
    };

    const saveAlerts = async () => {
        try {
            await api.put(`/watchlist/update/${currentAlertStock.symbol}`, {
                targetHigh: targetHigh ? parseFloat(targetHigh) : undefined,
                targetLow: targetLow ? parseFloat(targetLow) : undefined
            });

            // Optimistic update
            setWatchlist(prev => prev.map(item =>
                item.symbol === currentAlertStock.symbol
                    ? { ...item, targetHigh: targetHigh ? parseFloat(targetHigh) : undefined, targetLow: targetLow ? parseFloat(targetLow) : undefined }
                    : item
            ));

            setAlertModalOpen(false);
            setToast({ message: 'Alerts saved successfully', type: 'success' });
        } catch (err) {
            console.error('Error updating alerts:', err);
            setToast({ message: 'Failed to save alerts', type: 'error' });
        }
    };

    // Sorting logic
    const sortedWatchlist = [...watchlist].sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === 'price' || sortBy === 'change') {
            valA = parseFloat(valA || 0);
            valB = parseFloat(valB || 0);
        } else {
            valA = String(valA || '').toLowerCase();
            valB = String(valB || '').toLowerCase();
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const toggleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    // Performance Highlights
    const topGainer = watchlist.length > 0 ? watchlist.reduce((prev, current) => (prev.changePercent > current.changePercent) ? prev : current) : null;
    const topLoser = watchlist.length > 0 ? watchlist.reduce((prev, current) => (prev.changePercent < current.changePercent) ? prev : current) : null;

    // Check if alert triggered
    const isAlertTriggered = (stock) => {
        if (!stock.price) return false;
        if (stock.targetHigh && stock.price >= stock.targetHigh) return 'high';
        if (stock.targetLow && stock.price <= stock.targetLow) return 'low';
        return false;
    };


    if (loading && watchlist.length === 0) return <div className="loading">Loading Watchlist...</div>;

    return (
        <div className="portfolio-container">
            <div className="portfolio-header">
                <div>
                    <h1>My Watchlist</h1>
                    <p className="text-secondary">Track your favorite stocks in real-time</p>
                </div>
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            {watchlist.length > 0 && (
                <>
                    {/* Performance Overview */}
                    <div className="performance-overview" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                        {topGainer && topGainer.change > 0 && (
                            <div className="highlight-card" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#10b981' }}>
                                    <TrendingUp size={20} />
                                    <span style={{ fontWeight: '600' }}>Top Gainer</span>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{topGainer.symbol}</div>
                                <div style={{ color: '#10b981', fontWeight: '500' }}>+{topGainer.changePercent?.toFixed(2)}%</div>
                            </div>
                        )}
                        {topLoser && topLoser.change < 0 && (
                            <div className="highlight-card" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '1rem', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: '#ef4444' }}>
                                    <TrendingUp size={20} style={{ transform: 'scaleY(-1)' }} />
                                    <span style={{ fontWeight: '600' }}>Top Loser</span>
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{topLoser.symbol}</div>
                                <div style={{ color: '#ef4444', fontWeight: '500' }}>{topLoser.changePercent?.toFixed(2)}%</div>
                            </div>
                        )}
                    </div>

                    {/* Controls */}
                    <div className="watchlist-controls" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                        {['symbol', 'price', 'change'].map(field => (
                            <button
                                key={field}
                                className={`sort-btn ${sortBy === field ? 'active' : ''}`}
                                onClick={() => toggleSort(field)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    border: sortBy === field ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                                    background: sortBy === field ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                    color: sortBy === field ? '#3b82f6' : '#9ca3af',
                                    cursor: 'pointer',
                                    textTransform: 'capitalize'
                                }}
                            >
                                Sort by {field} {sortBy === field && (sortOrder === 'asc' ? '↑' : '↓')}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {watchlist.length === 0 && !loading ? (
                <div className="empty-state">
                    <div className="empty-icon">⭐</div>
                    <h3>Your watchlist is empty</h3>
                    <p className="text-secondary">Start adding stocks to track their performance</p>
                    <Link to="/search">
                        <Button variant="primary">Explore Stocks</Button>
                    </Link>
                </div>
            ) : (
                <div className="watchlist-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                    {sortedWatchlist.map((stock) => {
                        const alertTriggered = isAlertTriggered(stock);
                        return (
                            <div key={stock.symbol} className="watchlist-card" style={{
                                background: alertTriggered ? (alertTriggered === 'high' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)') : 'rgba(30, 41, 59, 0.7)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '16px',
                                border: alertTriggered ? (alertTriggered === 'high' ? '2px solid #10b981' : '2px solid #ef4444') : '1px solid rgba(255, 255, 255, 0.08)',
                                padding: '1.5rem',
                                position: 'relative',
                                transition: 'all 0.2s',
                                cursor: 'pointer',
                                boxShadow: alertTriggered ? (alertTriggered === 'high' ? '0 0 15px rgba(16, 185, 129, 0.3)' : '0 0 15px rgba(239, 68, 68, 0.3)') : 'none'
                            }}
                                onMouseEnter={(e) => {
                                    if (!alertTriggered) {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!alertTriggered) {
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                    <Link to={`/stock/${stock.symbol}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                        <div className="stock-info">
                                            <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{stock.symbol}</h3>
                                            <p className="text-secondary" style={{ margin: 0, fontSize: '0.875rem' }}>Stock</p>
                                        </div>
                                    </Link>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                openAlertModal(stock);
                                            }}
                                            className="alert-btn-icon"
                                            title={stock.targetHigh || stock.targetLow ? "Edit Alerts" : "Set Alerts"}
                                            style={{
                                                background: stock.targetHigh || stock.targetLow ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                border: 'none',
                                                color: stock.targetHigh || stock.targetLow ? '#3b82f6' : '#9ca3af',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {alertTriggered ? <BellRing size={20} className="animate-bounce" /> : <Bell size={20} />}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                removeFromWatchlist(stock.symbol);
                                            }}
                                            className="delete-btn-icon"
                                            title="Remove from Watchlist"
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#ef4444',
                                                padding: '8px',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                opacity: 0.7,
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>

                                <Link to={`/stock/${stock.symbol}`} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                        <div className="price-info">
                                            <span style={{ fontSize: '1.75rem', fontWeight: '600', display: 'block', lineHeight: 1.2 }}>
                                                {stock.price ? `₹${stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-'}
                                            </span>
                                            {alertTriggered && (
                                                <div style={{
                                                    color: alertTriggered === 'high' ? '#10b981' : '#ef4444',
                                                    fontSize: '0.8rem',
                                                    fontWeight: '600',
                                                    marginTop: '0.5rem'
                                                }}>
                                                    Target {alertTriggered === 'high' ? 'High' : 'Low'} Hit!
                                                </div>
                                            )}
                                        </div>
                                        {stock.change !== undefined && (
                                            <div className={`change-pill ${stock.change >= 0 ? 'positive' : 'negative'}`} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.25rem',
                                                padding: '0.5rem 0.75rem',
                                                borderRadius: '9999px',
                                                background: stock.change >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: stock.change >= 0 ? '#10b981' : '#ef4444',
                                                fontWeight: '500'
                                            }}>
                                                {stock.change >= 0 ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
                                                <span>{Math.abs(stock.change).toFixed(2)} ({Math.abs(stock.changePercent || 0).toFixed(2)}%)</span>
                                            </div>
                                        )}
                                    </div>
                                </Link>
                            </div>
                        );
                    })}

                    {/* Add New Stock Card */}
                    <Link to="/search" style={{ textDecoration: 'none' }}>
                        <div className="add-card" style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '16px',
                            border: '2px dashed rgba(255, 255, 255, 0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: '180px',
                            color: '#9ca3af',
                            transition: 'all 0.2s',
                            cursor: 'pointer'
                        }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            }}
                        >
                            <div style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                borderRadius: '50%',
                                padding: '1rem',
                                marginBottom: '1rem'
                            }}>
                                <div style={{ fontSize: '1.5rem' }}>+</div>
                            </div>
                            <span>Add More Stocks</span>
                        </div>
                    </Link>
                </div>
            )}

            {/* Alert Modal */}
            {alertModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0, 0, 0, 0.8)',
                    backdropFilter: 'blur(5px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#1e293b',
                        padding: '2rem',
                        borderRadius: '16px',
                        width: '90%',
                        maxWidth: '400px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setAlertModalOpen(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'transparent',
                                border: 'none',
                                color: '#9ca3af',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={20} />
                        </button>

                        <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Bell size={24} color="#3b82f6" />
                            Set Alerts for {currentAlertStock?.symbol}
                        </h2>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#9ca3af' }}>Current Price</label>
                            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
                                ₹{(currentAlertStock?.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#10b981' }}>Target High (Alert if above)</label>
                            <input
                                type="number"
                                value={targetHigh}
                                onChange={(e) => setTargetHigh(e.target.value)}
                                placeholder="e.g. 2600"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#ef4444' }}>Target Low (Alert if below)</label>
                            <input
                                type="number"
                                value={targetLow}
                                onChange={(e) => setTargetLow(e.target.value)}
                                placeholder="e.g. 2400"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '1rem'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <Button variant="secondary" onClick={() => setAlertModalOpen(false)} style={{ flex: 1 }}>Cancel</Button>
                            <Button variant="primary" onClick={saveAlerts} style={{ flex: 1 }}>Save Alerts</Button>
                        </div>
                    </div>
                </div>
            )}

            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </div>
    );
}

export default Watchlist;
