import React from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import '../UserProfile.css';

function Help() {
    return (
        <div className="profile-page-container">
            <div className="page-header">
                <h1>Help & Support</h1>
                <p className="text-secondary">How can we assist you today?</p>
            </div>
            <div className="profile-content">
                <Card className="glass-panel profile-form-card">
                    <div className="help-section">
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

                        <div className="help-card glass-panel" style={{ padding: '20px', marginTop: '20px', borderRadius: '12px' }}>
                            <h4>Report a Bug</h4>
                            <p className="text-secondary">Found an issue? Let us know so we can fix it.</p>
                            <Button variant="danger" className="mt-2">Report Issue</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

export default Help;
