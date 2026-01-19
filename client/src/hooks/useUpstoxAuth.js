import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

/**
 * Custom hook to monitor Upstox token status and handle re-authentication
 */
export const useUpstoxAuth = () => {
    const [tokenStatus, setTokenStatus] = useState({
        hasToken: false,
        isExpired: true,
        needsReauth: true,
        expiresAt: null,
        timeRemaining: 0,
        expiresIn: 0
    });
    const [isChecking, setIsChecking] = useState(false);
    const [authWindow, setAuthWindow] = useState(null);

    // Check token status
    const checkTokenStatus = useCallback(async () => {
        try {
            setIsChecking(true);
            const response = await api.get('/auth/upstox/status');
            setTokenStatus(response.data);
            return response.data;
        } catch (error) {
            console.error('Error checking token status:', error);
            setTokenStatus({
                hasToken: false,
                isExpired: true,
                needsReauth: true,
                expiresAt: null,
                timeRemaining: 0,
                expiresIn: 0
            });
            return null;
        } finally {
            setIsChecking(false);
        }
    }, []);

    // Open re-authentication popup
    const openAuthPopup = useCallback(() => {
        const width = 600;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
            `${api.defaults.baseURL}/auth/upstox/login`,
            'UpstoxAuth',
            `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no,scrollbars=yes`
        );

        setAuthWindow(popup);

        // Monitor popup close
        const checkPopupClosed = setInterval(() => {
            if (popup && popup.closed) {
                clearInterval(checkPopupClosed);
                setAuthWindow(null);
                // Re-check token status after popup closes
                setTimeout(() => {
                    checkTokenStatus();
                }, 1000);
            }
        }, 500);

        return popup;
    }, [checkTokenStatus]);

    // Handle message from auth popup
    useEffect(() => {
        const handleMessage = (event) => {
            // Verify origin for security
            const apiUrl = api.defaults.baseURL || 'http://localhost:5000';
            if (!event.origin.startsWith(apiUrl.split('/api')[0])) {
                return;
            }

            if (event.data.type === 'UPSTOX_LOGIN_SUCCESS') {
                console.log('✅ Upstox authentication successful!');
                // Close auth window if still open
                if (authWindow && !authWindow.closed) {
                    authWindow.close();
                }
                // Re-check token status
                checkTokenStatus();
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [authWindow, checkTokenStatus]);

    // Poll token status every 60 seconds
    useEffect(() => {
        // Initial check
        checkTokenStatus();

        // Set up polling
        const interval = setInterval(() => {
            checkTokenStatus();
        }, 60000); // Check every 60 seconds

        // Listen for 401 errors from API interceptor
        const handleTokenExpired = () => {
            console.log('🔔 Received token expired event from API');
            checkTokenStatus();
        };

        window.addEventListener('upstox-token-expired', handleTokenExpired);

        return () => {
            clearInterval(interval);
            window.removeEventListener('upstox-token-expired', handleTokenExpired);
        };
    }, [checkTokenStatus]);

    return {
        tokenStatus,
        isChecking,
        checkTokenStatus,
        openAuthPopup,
        needsReauth: tokenStatus.needsReauth
    };
};

export default useUpstoxAuth;
