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
                console.log(`Total Items: ${json.length}`);

                // EXACT FILTER FROM stockService.js
                const filtered = json.filter(item =>
                ((item.exchange === 'NSE' || item.exchange === 'BSE') &&
                    (item.instrument_type === 'EQ' || item.instrument_type === 'INDEX'))
                );

                console.log(`Filtered Items: ${filtered.length}`);

                const eq = filtered.find(i => i.trading_symbol === 'RELIANCE');
                if (eq) {
                    console.log('Reliance SURVIVED filter:', eq);
                } else {
                    console.log('Reliance REJECTED by filter.');
                    // Find it in raw
                    const raw = json.find(i => i.trading_symbol === 'RELIANCE');
                    if (raw) {
                        console.log('Raw Reliance:', raw);
                        console.log(`EXCHANGE PROPERTY: '${raw.exchange}'`);
                        console.log(`TYPE PROPERTY: '${raw.instrument_type}'`);
                    }
                }

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
