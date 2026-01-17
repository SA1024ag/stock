const dotenv = require('dotenv');
// Load env vars explicitly
dotenv.config({ path: __dirname + '/../.env' });

const stockService = require('../services/stockService');

async function debugSearch() {
    console.log('--- DEBUG INFO ---');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('API KEY:', process.env.ALPHA_VANTAGE_API_KEY);

    try {
        console.log('Attempting search for "tesla"...');
        const results = await stockService.searchStocks('tesla');
        console.log('Search Result:', JSON.stringify(results, null, 2));
    } catch (error) {
        console.error('SEARCH FAILED:', error);
    }
}

debugSearch();
