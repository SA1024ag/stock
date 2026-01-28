import React from 'react';
import { Mail, Phone, ChevronRight, MessageCircle, HeadphonesIcon } from 'lucide-react';
import './Help.css';

function Help() {
    return (
        <div className="help-page-container">
            <div className="help-card-premium">
                <div className="help-header">
                    <div className="icon-box" style={{ width: '60px', height: '60px', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', color: 'white' }}>
                        <HeadphonesIcon size={32} />
                    </div>
                    <h1 className="gradient-text">Help & Support</h1>
                    <p className="subtitle">We're here to help you 24/7</p>
                </div>

                <div className="contact-grid">
                    <a href="mailto:sarthakag1024@gmail.com" className="contact-item">
                        <div className="icon-box">
                            <Mail size={24} />
                        </div>
                        <div className="contact-details">
                            <span className="contact-label">Email Us</span>
                            <span className="contact-value">sarthakag1024@gmail.com</span>
                        </div>
                        <ChevronRight className="arrow-icon" size={20} />
                    </a>

                    <a href="tel:+918815551046" className="contact-item">
                        <div className="icon-box">
                            <Phone size={24} />
                        </div>
                        <div className="contact-details">
                            <span className="contact-label">Call Us</span>
                            <span className="contact-value">+91-8815551046</span>
                        </div>
                        <ChevronRight className="arrow-icon" size={20} />
                    </a>
                </div>

                <div className="quick-faq">
                    <p className="faq-note">
                        <MessageCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                        Typical response time: <span className="highlight">Under 1 hour</span>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Help;
