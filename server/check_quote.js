const axios = require('axios');
const fs = require('fs');
const path = require('path');

const TOKEN_FILE = path.join(__dirname, 'upstox_tokens.json');

async function testQuote() {
    try {
        if (!fs.existsSync(TOKEN_FILE)) {
            console.error('Token file not found!');
            return;
        }

        const tokens = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
        const accessToken = tokens.access_token;

        console.log('Using Access Token:', accessToken.substring(0, 10) + '...');

        const instrumentKey = 'NSE_EQ|INE002A01018'; // Reliance
        // const instrumentKey = 'NSE_INDEX|Nifty 50'; 

        console.log(`Fetching OHLC for ${instrumentKey}...`);

        const url = `https://api.upstox.com/v3/market-quote/ohlc?instrument_key=${encodeURIComponent(instrumentKey)}&interval=1d`;

        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Accept': 'application/json'
                }
            });
            console.log('Response Status:', response.status);
            if (response.data.data) {
                console.log('Response Keys:', Object.keys(response.data.data));
            }
            console.log('Response Data:', JSON.stringify(response.data, null, 2));
        } catch (e) {
            console.error('API Request Failed:', e.message);
            if (e.response) {
                console.error('Status:', e.response.status);
                console.error('Data:', JSON.stringify(e.response.data, null, 2));
            }
        }

    } catch (err) {
        console.error('Script Error:', err);
    }
}

testQuote();
