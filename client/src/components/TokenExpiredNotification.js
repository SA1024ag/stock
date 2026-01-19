import React, { useEffect, useState } from 'react';
import './TokenExpiredNotification.css';

const TokenExpiredNotification = ({ tokenStatus, onReauthenticate, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        // Show notification if token is expired or expiring soon (< 30 minutes)
        const shouldShow = tokenStatus.needsReauth || (tokenStatus.expiresIn > 0 && tokenStatus.expiresIn < 30);
        setIsVisible(shouldShow);
    }, [tokenStatus]);

    useEffect(() => {
        if (tokenStatus.expiresIn > 0) {
            const hours = Math.floor(tokenStatus.expiresIn / 60);
            const minutes = tokenStatus.expiresIn % 60;

            if (hours > 0) {
                setTimeLeft(`${hours}h ${minutes}m`);
            } else {
                setTimeLeft(`${minutes}m`);
            }
        } else {
            setTimeLeft('Expired');
        }
    }, [tokenStatus.expiresIn]);

    if (!isVisible) return null;

    const isExpired = tokenStatus.isExpired;
    const isExpiringSoon = !isExpired && tokenStatus.expiresIn < 30;

    return (
        <div className={`token-notification ${isExpired ? 'expired' : 'warning'}`}>
            <div className="token-notification-content">
                <div className="token-notification-icon">
                    {isExpired ? '🔒' : '⚠️'}
                </div>
                <div className="token-notification-text">
                    <h4>
                        {isExpired ? 'Upstox Connection Expired' : 'Upstox Token Expiring Soon'}
                    </h4>
                    <p>
                        {isExpired
                            ? 'Your Upstox authentication has expired. Real-time data is unavailable.'
                            : `Your Upstox token will expire in ${timeLeft}. Re-authenticate to avoid interruption.`
                        }
                    </p>
                </div>
                <div className="token-notification-actions">
                    <button
                        className="btn-reauth"
                        onClick={onReauthenticate}
                    >
                        {isExpired ? 'Re-authenticate Now' : 'Refresh Token'}
                    </button>
                    {!isExpired && (
                        <button
                            className="btn-dismiss"
                            onClick={() => setIsVisible(false)}
                        >
                            Dismiss
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TokenExpiredNotification;
