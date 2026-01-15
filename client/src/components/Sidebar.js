import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({});
    const location = useLocation();

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    const toggleSection = (sectionName) => {
        setExpandedSections(prev => ({
            ...prev,
            [sectionName]: !prev[sectionName]
        }));
    };

    const menuSections = [
        {
            name: 'AI & Insights',
            icon: '🤖',
            items: [
                { name: 'AI Stock Insights', path: '/ai-insights', icon: '📊' },
                { name: 'AI Portfolio Analysis', path: '/ai-portfolio', icon: '💼' },
                { name: 'AI Recommendations', path: '/ai-recommendations', icon: '💡' }
            ]
        },
        {
            name: 'Learning',
            icon: '📚',
            items: [
                { name: 'Learning Hub', path: '/learning-hub', icon: '🎓' },
                { name: 'Stock Explainers', path: '/stock-explainers', icon: '📖' },
                { name: 'Beginner Guides', path: '/beginner-guides', icon: '🌱' }
            ]
        },
        {
            name: 'Reports',
            icon: '📈',
            items: [
                { name: 'Portfolio Report', path: '/portfolio-report', icon: '📋' },
                { name: 'Transactions', path: '/transactions', icon: '💳' },
                { name: 'Profit & Loss', path: '/profit-loss', icon: '💰' }
            ]
        },
        {
            name: 'Tracking',
            icon: '👁️',
            items: [
                { name: 'Watchlist', path: '/watchlist', icon: '⭐' },
                { name: 'Alerts', path: '/alerts', icon: '🔔' },
                { name: 'Market Movers', path: '/market-movers', icon: '🚀' }
            ]
        }
    ];

    const isActiveLink = (path) => {
        return location.pathname === path;
    };

    return (
        <>
            {/* Hamburger Button */}
            <button
                className={`hamburger-btn ${isOpen ? 'active' : ''}`}
                onClick={toggleSidebar}
                aria-label="Toggle menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>

            {/* Overlay */}
            {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>☰ Dashboard Menu</h2>
                </div>

                <nav className="sidebar-nav">
                    {menuSections.map((section) => (
                        <div key={section.name} className="sidebar-section">
                            <button
                                className={`section-header ${expandedSections[section.name] ? 'expanded' : ''}`}
                                onClick={() => toggleSection(section.name)}
                            >
                                <span className="section-icon">{section.icon}</span>
                                <span className="section-title">{section.name}</span>
                                <span className="expand-icon">
                                    {expandedSections[section.name] ? '−' : '+'}
                                </span>
                            </button>

                            <div className={`section-items ${expandedSections[section.name] ? 'expanded' : ''}`}>
                                {section.items.map((item) => (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        className={`sidebar-link ${isActiveLink(item.path) ? 'active' : ''}`}
                                        onClick={() => setIsOpen(false)}
                                    >
                                        <span className="item-icon">{item.icon}</span>
                                        <span className="item-name">{item.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
