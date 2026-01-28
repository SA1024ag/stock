const axios = require('axios');
const UpstoxToken = require('../models/UpstoxToken');

class UpstoxAuthService {
    constructor() {
        this.apiKey = process.env.UPSTOX_API_KEY;
        this.apiSecret = process.env.UPSTOX_API_SECRET;
        this.redirectUri = process.env.UPSTOX_REDIRECT_URI;
        this.accessToken = null;
        this.refreshToken = null;
        
        // Note: We cannot await in a constructor. 
        // Token loading is now handled lazily in getAccessToken() 
        // or explicitly via init() if called from server startup.
    }

    // Optional: Call this from index.js if you want to preload tokens
    async init() {
        await this.loadTokens();
    }

    getLoginUrl() {
        return `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${this.apiKey}&redirect_uri=${this.redirectUri}`;
    }

    async generateToken(code) {
        try {
            const params = new URLSearchParams();
            params.append('code', code);
            params.append('client_id', this.apiKey);
            params.append('client_secret', this.apiSecret);
            params.append('redirect_uri', this.redirectUri);
            params.append('grant_type', 'authorization_code');

            const response = await axios.post('https://api.upstox.com/v2/login/authorization/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
            });

            await this.saveTokens(response.data);
            return response.data;
        } catch (error) {
            console.error('Error generating Upstox token:', error.response?.data || error.message);
            throw error;
        }
    }

    async refreshAccessToken() {
        // Ensure we have the latest tokens from DB before trying to refresh
        if (!this.refreshToken) {
            await this.loadTokens();
        }

        if (!this.refreshToken) {
            console.log('No refresh token available. Cannot auto-refresh.');
            return false;
        }

        try {
            console.log('Refreshing Upstox Access Token...');
            const params = new URLSearchParams();
            params.append('refresh_token', this.refreshToken);
            params.append('client_id', this.apiKey);
            params.append('client_secret', this.apiSecret);
            params.append('redirect_uri', this.redirectUri);
            params.append('grant_type', 'refresh_token');

            const response = await axios.post('https://api.upstox.com/v2/login/authorization/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
            });

            await this.saveTokens(response.data);
            console.log('Upstox Token Refreshed Successfully');
            return true;
        } catch (error) {
            console.error('Error refreshing Upstox token:', error.response?.data || error.message);
            return false;
        }
    }

    async saveTokens(data) {
        this.accessToken = data.access_token;
        if (data.refresh_token) this.refreshToken = data.refresh_token;

        try {
            // Upsert: Update if exists, Insert if not
            // We use a static ID or empty filter because we only need ONE active token pair for the app
            await UpstoxToken.findOneAndUpdate(
                {}, 
                { 
                    access_token: this.accessToken,
                    refresh_token: this.refreshToken,
                    timestamp: Date.now()
                },
                { upsert: true, new: true }
            );
            console.log('✅ Upstox tokens saved to MongoDB.');
        } catch (err) {
            console.error('Failed to save tokens to DB:', err.message);
        }
    }

    async loadTokens() {
        try {
            // Get the most recent token document
            const data = await UpstoxToken.findOne().sort({ timestamp: -1 });
            
            if (data) {
                this.accessToken = data.access_token;
                this.refreshToken = data.refresh_token;
                // console.log('Loaded Upstox tokens from MongoDB');
            }
        } catch (err) {
            console.error('Failed to load tokens from DB:', err.message);
        }
    }

    async getAccessToken() {
        // 1. If no token in memory, try loading from DB
        if (!this.accessToken) {
            await this.loadTokens();
        }

        // 2. If still no token, we can't proceed
        if (!this.accessToken) {
             // Try one last attempt to refresh if we have a refresh token loaded
            if (this.refreshToken) {
                const success = await this.refreshAccessToken();
                if (success) return this.accessToken;
            }
            throw new Error('No access token. Please visit /api/auth/upstox/login to initialize.');
        }

        // 3. Check expiry
        if (this.isTokenExpired()) {
             // If we have a refresh token, try to refresh
            if (this.refreshToken) {
                const success = await this.refreshAccessToken();
                if (success) return this.accessToken;
            }
             // If refresh failed or no refresh token, throw
             throw new Error('Token expired and refresh failed. Please re-login.');
        }

        return this.accessToken;
    }

    // Check if token is expired
    isTokenExpired() {
        if (!this.accessToken) return true;

        try {
            const decoded = this.decodeToken(this.accessToken);
            if (!decoded || !decoded.exp) return true;

            // Check if expired (with 5 minute buffer)
            const now = Math.floor(Date.now() / 1000);
            return now >= decoded.exp;
        } catch (error) {
            console.error('Error checking token expiry:', error.message);
            return true;
        }
    }

    // Decode JWT token without verification
    decodeToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;

            const payload = parts[1];
            const decoded = Buffer.from(payload, 'base64').toString('utf8');
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Error decoding token:', error.message);
            return null;
        }
    }

    // Get token expiry timestamp
    getTokenExpiry() {
        if (!this.accessToken) return null;

        try {
            const decoded = this.decodeToken(this.accessToken);
            return decoded?.exp ? decoded.exp * 1000 : null; // Convert to milliseconds
        } catch (error) {
            return null;
        }
    }

    // Get comprehensive token status
    getTokenStatus() {
        if (!this.accessToken) {
            return {
                hasToken: false,
                isExpired: true,
                expiresAt: null,
                timeRemaining: 0,
                needsReauth: true
            };
        }

        const expiry = this.getTokenExpiry();
        const isExpired = this.isTokenExpired();
        const now = Date.now();
        const timeRemaining = expiry ? Math.max(0, expiry - now) : 0;

        return {
            hasToken: true,
            isExpired,
            expiresAt: expiry,
            timeRemaining,
            needsReauth: isExpired,
            expiresIn: timeRemaining > 0 ? Math.floor(timeRemaining / 1000 / 60) : 0 // minutes
        };
    }
}

module.exports = new UpstoxAuthService();
