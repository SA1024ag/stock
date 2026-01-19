import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Brain,
    LineChart,
    PieChart,
    Sparkles,
    Activity,
    BookOpen,
    GraduationCap,
    Target,
    Star,
    Newspaper,
    Menu,
    X
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({
        'AI & Insights': true,
        'Learn': true,
        'Tracking': true
    });
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
            type: 'section',
            name: 'AI & Insights',
            icon: <Brain size={20} />,
            items: [
                { name: 'AI Stock Insights', path: '/ai-insights', icon: <LineChart size={18} /> },
                { name: 'AI Portfolio Analysis', path: '/ai-portfolio', icon: <PieChart size={18} /> },
                { name: 'AI Recommendations', path: '/ai-recommendations', icon: <Sparkles size={18} /> },
                { name: 'Market Simulator', path: '/simulate', icon: <Activity size={18} /> }
            ]
        },
        {
            type: 'link',
            name: 'Learning',
            path: '/learning-hub',
            icon: <GraduationCap size={20} />
        },
        {
            type: 'link',
            name: 'Watchlist',
            path: '/watchlist',
            icon: <Target size={20} />
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
                <div className="hamburger-icon-wrapper">
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                </div>
            </button>

            {/* Overlay */}
            {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}

            {/* Sidebar */}
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <h2>Dashboard</h2>
                </div>

                <nav className="sidebar-nav">


                    {menuSections.map((item) => {
                        if (item.type === 'link') {
                            return (
                                <Link
                                    key={item.name}
                                    to={item.path}
                                    className={`sidebar-link direct-link ${isActiveLink(item.path) ? 'active' : ''}`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    <span className="item-icon">{item.icon}</span>
                                    <span className="item-name">{item.name}</span>
                                </Link>
                            );
                        }

                        return (
                            <div key={item.name} className="sidebar-section">
                                <button
                                    className={`section-header ${expandedSections[item.name] ? 'expanded' : ''}`}
                                    onClick={() => toggleSection(item.name)}
                                >
                                    <span className="section-icon">{item.icon}</span>
                                    <span className="section-title">{item.name}</span>
                                    <span className="expand-icon">
                                        {expandedSections[item.name] ? '−' : '+'}
                                    </span>
                                </button>

                                <div className={`section-items ${expandedSections[item.name] ? 'expanded' : ''}`}>
                                    {item.items.map((subItem) => (
                                        <Link
                                            key={subItem.path}
                                            to={subItem.path}
                                            className={`sidebar-link ${isActiveLink(subItem.path) ? 'active' : ''}`}
                                            onClick={() => setIsOpen(false)}
                                        >
                                            <span className="item-icon">{subItem.icon}</span>
                                            <span className="item-name">{subItem.name}</span>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
};

export default Sidebar;
