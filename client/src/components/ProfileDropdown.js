import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './ProfileDropdown.css';

const ProfileDropdown = ({ onClose }) => {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleNavigate = (path) => {
        navigate(path);
        onClose();
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        onClose();
    };

    // Helper for icons (SVG)
    const Icon = ({ name }) => {
        // Simple SVG mappings for the requested icons
        const icons = {
            user: <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>,
            shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>,
            creditCard: <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>,
            trendingUp: <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>,
            activity: <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>,
            cpu: <rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect>,
            moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>,
            sun: <circle cx="12" cy="12" r="5"></circle>,
            bell: <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>,
            fileText: <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>,
            help: <circle cx="12" cy="12" r="10"></circle>,
            logOut: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
        };

        // Add extra paths for compound icons if needed
        const extraPaths = {
            user: <circle cx="12" cy="7" r="4"></circle>,
            creditCard: <line x1="1" y1="10" x2="23" y2="10"></line>,
            trendingUp: <polyline points="17 6 23 6 23 12"></polyline>,
            fileText: <polyline points="14 2 14 8 20 8"></polyline>,
            help: <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
        };

        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                {icons[name]}
                {extraPaths[name]}
                {name === 'help' && <line x1="12" y1="17" x2="12.01" y2="17"></line>}
            </svg>
        );
    };

    const MenuSection = ({ title, children }) => (
        <div className="menu-section">
            <div className="menu-section-title">{title}</div>
            {children}
        </div>
    );

    const MenuItem = ({ icon, label, value, onClick }) => (
        <button className="menu-item" onClick={onClick}>
            <span className="menu-item-icon">
                <Icon name={icon} />
            </span>
            <span className="menu-item-label">{label}</span>
            {value && <span className="menu-item-value">{value}</span>}
        </button>
    );

    return (
        <div className="profile-dropdown">
            <div className="profile-dropdown-header">
                <div className="dropdown-avatar">
                    {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="dropdown-user-info">
                    <span className="dropdown-name">{user?.username || 'User'}</span>
                    <span className="dropdown-handle">{user?.email || 'user@example.com'}</span>
                    <span className="account-badge">Pro Trader</span>
                </div>
            </div>

            <div className="profile-dropdown-content">
                <MenuSection title="Account">
                    <MenuItem
                        icon="user"
                        label="Profile & Personal"
                        onClick={() => handleNavigate('/profile?tab=personal')}
                    />
                    <MenuItem
                        icon="shield"
                        label="KYC Status"
                        value="Verified"
                        onClick={() => handleNavigate('/profile?tab=personal')}
                    />
                    <MenuItem
                        icon="creditCard"
                        label="Linked Accounts"
                        onClick={() => handleNavigate('/profile?tab=personal')}
                    />
                </MenuSection>

                <MenuSection title="Trading Preferences">
                    <MenuItem
                        icon="trendingUp"
                        label="Default Order"
                        value="Market"
                        onClick={() => handleNavigate('/profile?tab=preferences')}
                    />
                    <MenuItem
                        icon="activity"
                        label="Risk Profile"
                        value="Balanced"
                        onClick={() => handleNavigate('/profile?tab=preferences')}
                    />
                    <MenuItem
                        icon="cpu"
                        label="AI Assistance"
                        value="High"
                        onClick={() => handleNavigate('/profile?tab=preferences')}
                    />
                </MenuSection>

                <MenuSection title="App Settings">
                    <MenuItem
                        icon={theme === 'dark' ? 'moon' : 'sun'}
                        label="Theme"
                        value={theme === 'dark' ? 'Dark' : 'Light'}
                        onClick={toggleTheme}
                    />
                    <MenuItem
                        icon="bell"
                        label="Notifications"
                        onClick={() => handleNavigate('/profile?tab=preferences')}
                    />
                </MenuSection>

                <MenuSection title="Insights">
                    <MenuItem
                        icon="fileText"
                        label="Performance Report"
                        onClick={() => handleNavigate('/portfolio-report')}
                    />
                </MenuSection>

                <MenuSection title="Security">
                    <MenuItem
                        icon="shield"
                        label="Security Settings"
                        onClick={() => handleNavigate('/profile?tab=security')}
                    />
                </MenuSection>
            </div>

            <div className="profile-dropdown-footer">
                <button className="btn-dropdown-logout" onClick={handleLogout}>
                    <Icon name="logOut" />
                    Sign Out
                </button>
                <span className="version-info">v2.4.0 • Build 2026.01</span>
            </div>
        </div>
    );
};

export default ProfileDropdown;
