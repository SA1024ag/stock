const axios = require('axios');
const zlib = require('zlib');

const urls = [
    'https://assets.upstox.com/market-quote/instruments/exchange/NSE.json',
    'https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz'
];

async function check() {
    for (const url of urls) {
        try {
            console.log(`Checking ${url}...`);
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            console.log(`Status: ${response.status}`);
            console.log(`Size: ${response.data.length} bytes`);

            try {
                const decompressed = zlib.gunzipSync(response.data);
                const json = JSON.parse(decompressed.toString('utf-8'));
                console.log('First Item Keys:', Object.keys(json[0]));
                console.log('First Item Values:', json[0]);

                const eq = json.find(i => i.symbol === 'RELIANCE' || i.trading_symbol === 'RELIANCE');
                if (eq) console.log('Reliance Item:', eq);
            } catch (e) {
                console.log('Not GZIP, trying string...');
                const text = response.data.toString('utf-8');
                console.log('First 100 chars:', text.substring(0, 100));
            }
        } catch (e) {
            console.log(`Failed: ${e.message}`);
        }
        console.log('---');
    }
}

check();
