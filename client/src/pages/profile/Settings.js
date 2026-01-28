import React, { useState } from 'react';
import Card from '../../components/common/Card';
import '../UserProfile.css';

function Settings() {
    const [preferences, setPreferences] = useState({
        notifications: true,
        theme: 'dark'
    });

    const handlePreferenceChange = (key, value) => {
        setPreferences(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="profile-page-container">
            <div className="page-header">
                <h1>App Settings</h1>
                <p className="text-secondary">Customize your app preferences</p>
            </div>
            <div className="profile-content">
                <Card className="glass-panel profile-form-card">
                    <div className="preferences-section">
                        <h3>App Preferences</h3>
                        <div className="form-group">
                            <label>Notifications</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                                <input
                                    type="checkbox"
                                    checked={preferences.notifications}
                                    onChange={(e) => handlePreferenceChange('notifications', e.target.checked)}
                                    style={{ width: '20px', height: '20px' }}
                                />
                                <span className="text-secondary">Enable push notifications</span>
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Settings;
