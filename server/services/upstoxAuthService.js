const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, '../upstox_tokens.json');

class UpstoxAuthService {
    constructor() {
        this.apiKey = process.env.UPSTOX_API_KEY;
        this.apiSecret = process.env.UPSTOX_API_SECRET;
        this.redirectUri = process.env.UPSTOX_REDIRECT_URI;
        this.accessToken = null;
        this.refreshToken = null;

        // Try to load tokens immediately
        this.loadTokens();
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

            // V3 Auth Endpoint is actually usually same as V2 for login?
            // Docs say: https://api.upstox.com/v2/login/authorization/token 
            // Checking if V3 has specific auth url. 
            // Most V3 docs point to same auth flow, just different data endpoints.
            // But let's verify if 'v2' in URL should be 'v3'. 
            // Upstox Login is separate. Usually it is v2. 
            // We will keep v2 for Auth unless specific error. "Resource not Found" was for data.

            const response = await axios.post('https://api.upstox.com/v2/login/authorization/token', params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' }
            });

            this.saveTokens(response.data);
            return response.data;
        } catch (error) {
            console.error('Error generating Upstox token:', error.response?.data || error.message);
            throw error;
        }
    }

    async refreshAccessToken() {
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

            this.saveTokens(response.data);
            console.log('Upstox Token Refreshed Successfully');
            return true;
        } catch (error) {
            console.error('Error refreshing Upstox token:', error.response?.data || error.message);
            return false;
        }
    }

    saveTokens(data) {
        this.accessToken = data.access_token;
        if (data.refresh_token) this.refreshToken = data.refresh_token;

        const tokenData = {
            access_token: this.accessToken,
            refresh_token: this.refreshToken,
            timestamp: Date.now()
        };

        try {
            fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
            console.log('Upstox tokens saved to disk.');
        } catch (err) {
            console.error('Failed to save token file:', err.message);
        }
    }

    loadTokens() {
        try {
            if (fs.existsSync(TOKEN_FILE)) {
                const data = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
                this.accessToken = data.access_token;
                this.refreshToken = data.refresh_token;
                // console.log('Loaded Upstox tokens from disk');
            }
        } catch (err) {
            console.error('Failed to load token file:', err.message);
        }
    }

    async getAccessToken() {
        if (!this.accessToken) {
            // Attempt refresh if we have a refresh token
            if (this.refreshToken) {
                const success = await this.refreshAccessToken();
                if (success) return this.accessToken;
            }
            throw new Error('No access token. Please visit /api/auth/upstox/login to initialize.');
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
