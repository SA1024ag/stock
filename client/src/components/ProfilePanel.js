import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import Button from './common/Button';
import './ProfilePanel.css';

const ProfilePanel = ({ isOpen, onClose, anchorRef }) => {
    const { user, logout, updateUser } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const panelRef = useRef(null);

    // Local Settings State (persisted in localStorage)
    const [settings, setSettings] = useState(() => ({
        aiAssisted: localStorage.getItem('s_aiAssisted') === 'true',
        priceAlerts: localStorage.getItem('s_priceAlerts') === 'true',
        fractional: localStorage.getItem('s_fractional') === 'true',
        sound: localStorage.getItem('s_sound') !== 'false', // Default true
        animations: localStorage.getItem('s_animations') !== 'false' // Default true
    }));

    const toggleSetting = (key) => {
        const newVal = !settings[key];
        setSettings(prev => ({ ...prev, [key]: newVal }));
        localStorage.setItem(`s_${key}`, newVal);
    };

    const handleResetPortfolio = async () => {
        if (window.confirm('Are you sure you want to reset your portfolio? This action cannot be undone.')) {
            try {
                const res = await api.post('/portfolio/reset');
                // Update user context with new balance
                updateUser({
                    ...user,
                    virtualBalance: res.data.virtualBalance
                });
                alert('Portfolio has been reset successfully.');
                window.location.reload(); // Refresh to clear states
            } catch (err) {
                alert('Failed to reset portfolio.');
            }
        }
    };

    const handleDownloadHistory = async () => {
        try {
            // Quick fetch of summary to get transactions
            const res = await api.get('/portfolio/summary');
            const holdings = res.data.holdings || [];
            // Flatten transactions
            const transactions = holdings.flatMap(h =>
                (h.transactions || []).map(t => ({
                    symbol: h.symbol,
                    type: t.type,
                    shares: t.shares,
                    price: t.price,
                    date: t.timestamp
                }))
            );

            if (transactions.length === 0) {
                alert('No trading history to download.');
                return;
            }

            // Convert to CSV
            const headers = ['Symbol,Type,Shares,Price,Date\n'];
            const csv = headers.concat(
                transactions.map(t =>
                    `${t.symbol},${t.type},${t.shares},${t.price},${new Date(t.date).toISOString()}`
                )
            ).join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `trade_history_${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (err) {
            console.error(err);
            alert('Error downloading history');
        }
    };

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                anchorRef.current &&
                !anchorRef.current.contains(event.target)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, anchorRef]);

    if (!isOpen) return null;

    const NavItem = ({ icon, label, action, trailing }) => (
        <div className="profile-menu-item" onClick={action}>
            <div className="menu-item-left">
                <span className="menu-icon">{icon}</span>
                <span className="menu-label">{label}</span>
            </div>
            {trailing && <div className="menu-item-right">{trailing}</div>}
        </div>
    );

    const SectionHeader = ({ title }) => (
        <div className="section-header">{title}</div>
    );

    const Toggle = ({ active, onToggle }) => (
        <div
            className={`toggle-switch ${active ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onToggle(); }}
        ></div>
    );

    return (
        <div className="profile-panel glass-panel" ref={panelRef}>
            {/* Header */}
            <div className="profile-header">
                <div className="profile-avatar-large">
                    {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="profile-info">
                    <h3>{user?.username}</h3>
                    <span className="account-badge">PRO TRADER</span>
                </div>
                <div className="profile-balance">
                    <span className="label">Net Worth</span>
                    <span className="value text-green">
                        ₹{(user?.virtualBalance || 0).toLocaleString('en-IN')}
                    </span>
                </div>
            </div>

            <div className="profile-scroll-content">
                {/* Section 1: Account */}
                <SectionHeader title="Account" />
                <NavItem
                    icon="👤"
                    label="My Profile"
                    action={() => { onClose(); navigate('/profile'); }}
                />
                <NavItem
                    icon="🔒"
                    label="Security"
                    action={() => { onClose(); navigate('/security'); }}
                />
                {/* Mock link */}
                <NavItem icon="📱" label="Linked Devices" />

                {/* Section 2: Trading Preferences */}
                <SectionHeader title="Trading Preferences" />
                <NavItem
                    icon="⚡"
                    label="Risk Level"
                    trailing={<span className="settings-value">Balanced</span>}
                />
                <NavItem
                    icon="🤖"
                    label="AI-Assisted Trades"
                    trailing={<Toggle active={settings.aiAssisted} onToggle={() => toggleSetting('aiAssisted')} />}
                />
                <NavItem
                    icon="🔔"
                    label="Price Alerts"
                    trailing={<Toggle active={settings.priceAlerts} onToggle={() => toggleSetting('priceAlerts')} />}
                />

                {/* Section 3: Financial Settings */}
                <SectionHeader title="Financial Settings" />
                <NavItem icon="💰" label="Currency" trailing={<span className="settings-value">USD</span>} />
                <NavItem
                    icon="🥧"
                    label="Fractional Shares"
                    trailing={<Toggle active={settings.fractional} onToggle={() => toggleSetting('fractional')} />}
                />
                <NavItem
                    icon="🔄"
                    label="Reset Portfolio"
                    action={handleResetPortfolio}
                />

                {/* Section 4: App Settings */}
                <SectionHeader title="App Settings" />
                <NavItem
                    icon={theme === 'dark' ? '🌙' : '☀️'}
                    label="Theme"
                    action={toggleTheme}
                    trailing={<span className="settings-value capitalized">{theme}</span>}
                />
                <NavItem
                    icon="🔉"
                    label="Sound Effects"
                    trailing={<Toggle active={settings.sound} onToggle={() => toggleSetting('sound')} />}
                />
                <NavItem
                    icon="✨"
                    label="Animations"
                    trailing={<Toggle active={settings.animations} onToggle={() => toggleSetting('animations')} />}
                />

                {/* Section 5: Data & History */}
                <SectionHeader title="Data & History" />
                <NavItem
                    icon="📥"
                    label="Download History"
                    action={handleDownloadHistory}
                />
                <NavItem icon="📊" label="Performance Reports" />
                <div className="divider"></div>

                <div className="p-3">
                    <Button
                        variant="danger"
                        fullWidth
                        onClick={() => {
                            logout();
                            onClose();
                            navigate('/login');
                        }}
                    >
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProfilePanel;
