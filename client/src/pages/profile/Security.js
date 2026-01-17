import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import '../UserProfile.css';
import api from '../../services/api';

function Security() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleUpdatePassword = async (e) => {
        e.preventDefault(); // Stop event propagation and default form submission

        if (newPassword !== confirmPassword) {
            alert("New passwords don't match");
            return;
        }

        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters");
            return;
        }

        setLoading(true);
        try {
            await api.put('/auth/password', {
                currentPassword,
                newPassword
            });
            alert('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            console.error('Password update error:', error);
            alert(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page-container">
            <div className="page-header">
                <h1>Security Settings</h1>
                <p className="text-secondary">Manage your password and authentication methods</p>
            </div>
            <div className="profile-content">
                <Card className="glass-panel profile-form-card">
                    <div className="security-section">
                        <h3>Password Management</h3>
                        <form onSubmit={handleUpdatePassword}>
                            <div className="form-group">
                                <label>Current Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="premium-input"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    placeholder="New password"
                                    className="premium-input"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input
                                    type="password"
                                    placeholder="Confirm new password"
                                    className="premium-input"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group mt-4">
                                <Button
                                    variant="primary"
                                    fullWidth
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? 'Updating...' : 'Update Password'}
                                </Button>
                            </div>
                        </form>

                        <h3 className="mt-4">Two-Factor Authentication</h3>
                        <p className="text-secondary mb-2">Add an extra layer of security to your account.</p>
                        <Button variant="secondary" fullWidth>Enable 2FA</Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Security;
