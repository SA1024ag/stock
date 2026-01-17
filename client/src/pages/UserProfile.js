import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './UserProfile.css';

function UserProfile() {
    const { user, updateUser } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'personal';

    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    // Preferences State (Mock)
    const [preferences, setPreferences] = useState({
        orderType: 'Market',
        riskProfile: 'Balanced',
        aiLevel: 'High',
        notifications: true
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePreferenceChange = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            const response = await api.put('/auth/update', formData);
            updateUser(response.data.user);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (error) {
            console.error('Profile update error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to update profile'
            });
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'personal', label: 'Personal Details' },
        { id: 'settings', label: 'App & Settings' },
        { id: 'security', label: 'Security' },
        { id: 'help', label: 'Help & Support' }
    ];

    return (
        <div className="profile-page-container">
            <div className="page-header">
                <h1>Account Settings</h1>
                <p className="text-secondary">Manage your profile and application preferences</p>
            </div>

            <div className="profile-tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        className={`profile-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setSearchParams({ tab: tab.id })}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="profile-content">
                <Card className="glass-panel profile-form-card">
                    {activeTab === 'personal' && (
                        <>
                            <div className="avatar-section">
                                <div className="profile-avatar-xl">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </div>
                                <div className="avatar-info">
                                    <h3>{user?.username}</h3>
                                    <span className="text-secondary">{user?.email}</span>
                                    <div className="kyc-badge verified">KYC Verified</div>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="profile-form">
                                {message.text && (
                                    <div className={`alert alert-${message.type} mb-4`}>
                                        {message.text}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label>Username</label>
                                    <input
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="premium-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="premium-input"
                                        required
                                    />
                                </div>

                                <div className="form-group mt-4">
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        fullWidth
                                        isLoading={loading}
                                        disabled={loading}
                                    >
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}

                    {activeTab === 'security' && (
                        <div className="security-section">
                            <h3>Security Settings</h3>
                            <p className="text-secondary mb-4">Manage your password and authentication methods.</p>

                            <div className="form-group">
                                <label>Current Password</label>
                                <input type="password" placeholder="••••••••" className="premium-input" />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" placeholder="New password" className="premium-input" />
                            </div>
                            <div className="form-group mt-4">
                                <Button variant="primary" fullWidth>Update Password</Button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'settings' && (
                        <div className="preferences-section">
                            <h3>App & Trading Preferences</h3>
                            <p className="text-secondary mb-4">Customize your trading experience.</p>

                            <div className="form-group">
                                <label>Default Order Type</label>
                                <select
                                    className="premium-input"
                                    value={preferences.orderType}
                                    onChange={(e) => handlePreferenceChange('orderType', e.target.value)}
                                >
                                    <option>Market</option>
                                    <option>Limit</option>
                                    <option>Stop Loss</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Risk Profile</label>
                                <select
                                    className="premium-input"
                                    value={preferences.riskProfile}
                                    onChange={(e) => handlePreferenceChange('riskProfile', e.target.value)}
                                >
                                    <option>Conservative</option>
                                    <option>Balanced</option>
                                    <option>Aggressive</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>AI Assistance Level</label>
                                <select
                                    className="premium-input"
                                    value={preferences.aiLevel}
                                    onChange={(e) => handlePreferenceChange('aiLevel', e.target.value)}
                                >
                                    <option>Low (Insights only)</option>
                                    <option>Medium (Suggestions)</option>
                                    <option>High (Auto-trading)</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Notifications</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                                    <input
                                        type="checkbox"
                                        checked={preferences.notifications}
                                        onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    <span className="text-secondary">Enable push notifications for trade alerts</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'help' && (
                        <div className="help-section">
                            <h3>Help & Support</h3>
                            <p className="text-secondary mb-4">How can we assist you today?</p>

                            <div className="help-card glass-panel" style={{ padding: '20px', marginBottom: '20px', borderRadius: '12px' }}>
                                <h4>Documentation</h4>
                                <p className="text-secondary">Read our detailed guides on how to use the platform.</p>
                                <Button variant="secondary" className="mt-2">View Docs</Button>
                            </div>

                            <div className="help-card glass-panel" style={{ padding: '20px', borderRadius: '12px' }}>
                                <h4>Contact Support</h4>
                                <p className="text-secondary">Need direct help? Our team is available 24/7.</p>
                                <Button variant="primary" className="mt-2">Chat with Support</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}

export default UserProfile;
