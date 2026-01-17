import React, { useState } from 'react';
import Card from '../../components/common/Card';
import '../UserProfile.css';

function Settings() {
    const [preferences, setPreferences] = useState({
        orderType: 'Market',
        riskProfile: 'Balanced',
        aiLevel: 'High',
        notifications: true
    });

    const handlePreferenceChange = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="profile-page-container">
            <div className="page-header">
                <h1>App & Trading Settings</h1>
                <p className="text-secondary">Customize your trading experience and app preferences</p>
            </div>
            <div className="profile-content">
                <Card className="glass-panel profile-form-card">
                    <div className="preferences-section">
                        <h3>Trading Preferences</h3>
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

                        <h3 className="mt-4">App Preferences</h3>
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
                </Card>
            </div>
        </div>
    );
}

export default Settings;
