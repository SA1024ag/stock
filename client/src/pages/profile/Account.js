import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import '../UserProfile.css';

function Account() {
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
        username: user?.username || '',
        email: user?.email || ''
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="profile-page-container">
            <div className="page-header">
                <h1>Account Details</h1>
                <p className="text-secondary">Manage your personal information and account status</p>
            </div>
            <div className="profile-content">
                <Card className="glass-panel profile-form-card">
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
                            <Button type="submit" variant="primary" fullWidth isLoading={loading} disabled={loading}>
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}

export default Account;
