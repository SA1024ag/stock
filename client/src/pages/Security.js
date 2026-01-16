import React, { useState } from 'react';
import api from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import './UserProfile.css'; // Reusing styles

function Security() {
    const [passData, setPassData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setPassData({
            ...passData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        if (passData.newPassword !== passData.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match' });
            setLoading(false);
            return;
        }

        try {
            await api.put('/auth/change-password', {
                currentPassword: passData.currentPassword,
                newPassword: passData.newPassword
            });
            setMessage({ type: 'success', text: 'Password changed successfully' });
            setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to change password'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page-container">
            <div className="page-header">
                <h1>Security</h1>
                <p className="text-secondary">Protect your account</p>
            </div>

            <div className="profile-content">
                <Card className="glass-panel profile-form-card">
                    <h2 className="mb-4 text-center">Change Password</h2>

                    <form onSubmit={handleSubmit} className="profile-form">
                        {message.text && (
                            <div className={`alert alert-${message.type} mb-4`}>
                                {message.text}
                            </div>
                        )}

                        <div className="form-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={passData.currentPassword}
                                onChange={handleChange}
                                className="premium-input"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={passData.newPassword}
                                onChange={handleChange}
                                className="premium-input"
                                required
                                minLength="6"
                            />
                        </div>

                        <div className="form-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                value={passData.confirmPassword}
                                onChange={handleChange}
                                className="premium-input"
                                required
                                minLength="6"
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
                                Update Password
                            </Button>
                        </div>
                    </form>

                    <div className="mt-5 pt-5 border-t border-glass">
                        <div className="flex justify-between items-center">
                            <div>
                                <h3>Two-Factor Authentication</h3>
                                <p className="text-secondary text-sm">Add an extra layer of security</p>
                            </div>
                            <div className="toggle-switch"></div>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Security;
