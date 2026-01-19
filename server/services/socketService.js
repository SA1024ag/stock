const WebSocket = require('ws');
const upstoxAuthService = require('./upstoxAuthService');
const axios = require('axios');

// Upstox Feed URL (V2)
// const FEED_URL = 'wss://api.upstox.com/v2/feed/market-data-feed'; // This constant is no longer needed

class SocketService {
    constructor() {
        this.ws = null;
        this.subscriptions = new Set(); // Set of instrument keys
        this.reconnectTimer = null;
    }

    // Initialize and connect
    async connect() {
        try {
            const accessToken = await upstoxAuthService.getAccessToken();

            // Step 1: Get Authorized WebSocket URL (V3)
            // GET https://api.upstox.com/v3/feed/market-data-feed/authorize
            const response = await axios.get('https://api.upstox.com/v3/feed/market-data-feed/authorize', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });

            const authorizedUrl = response.data.data.authorized_redirect_uri;
            console.log('Connecting to Upstox Feed:', authorizedUrl);

            // Step 2: Connect to the authorized URL
            this.ws = new WebSocket(authorizedUrl);

            this.ws.on('open', () => {
                console.log('Connected to Upstox WebSocket Feed');
                this.resubscribe();
            });

            this.ws.on('message', (data) => {
                this.handleMessage(data);
            });

            this.ws.on('error', (error) => {
                console.error('Upstox WS Error:', error.message);
            });

            this.ws.on('close', () => {
                console.log('Upstox WS Disconnected. Reconnecting in 5s...');
                this.scheduleReconnect();
            });

        } catch (error) {
            if (error.message.includes('No access token')) {
                console.log('Upstox WebSocket: Waiting for user login...');
                this.scheduleReconnect(30000); // Wait 30s if not logged in
            } else if (error.response?.status === 401) {
                console.error('❌ Upstox Token Expired! Please re-authenticate at: http://localhost:5000/api/auth/upstox/login');
                this.scheduleReconnect(60000); // Wait 60s before retry to avoid spam
            } else {
                console.error('Failed to connect to Upstox WS:', error.message);
                this.scheduleReconnect();
            }
        }
    }

    scheduleReconnect(delay = 5000) {
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
            this.connect();
        }, delay);
    }

    // Subscribe to instruments
    subscribe(instrumentKeys) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            instrumentKeys.forEach(k => this.subscriptions.add(k));
            return;
        }

        const payload = {
            guid: "some-guid",
            method: "sub",
            data: {
                mode: "full", // or 'ltp'
                instrumentKeys: instrumentKeys
            }
        };

        this.ws.send(JSON.stringify(payload));
        instrumentKeys.forEach(k => this.subscriptions.add(k));
    }

    // Resubscribe all (on reconnect)
    resubscribe() {
        if (this.subscriptions.size > 0) {
            this.subscribe(Array.from(this.subscriptions));
        }
    }

    handleMessage(data) {
        // Process binary or JSON data
        // Upstox V2 feed sends binary (Protobuf) or JSON depending on config?
        // Usually it requires decoding. 
        // For this implementation, we assume we might need a protobuf decoder or check if we can request JSON.
        // If complex decoding is needed, we might rely on 'upstox-js-sdk'. 
        // Let's assume for now we use the SDK's socket method if possible, but manual WS is requested.
        // To keep it simple, we'll log the size for now. 
        // Implementing full protobuf decoding without the proto file is hard.

        // Suggestion: Use 'upstox-js-sdk' for Feed if possible.
        // Let's try to verify if we can use the SDK in a future step.
        console.log(`Received Upstox Data: ${data.length} bytes`);
    }
}

module.exports = new SocketService();
