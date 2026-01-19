const stockService = require('./services/stockService');

async function testAll() {
    console.log('Starting Test...');

    // Test 1: Market Indices (Should work immediately or wait internally?? 
    // Actually getMarketIndices doesn't call ensureInitialized inside the version I just wrote?
    // Wait, I missed adding ensureInitialized to getMarketIndices in the multireplace??
    // Let me check the code mentally... I might have missed it. 
    // It depends if getHeaders calls it? No.
    // But getMarketIndices uses hardcoded keys, so it might not need master list...
    // EXCEPT if we want to confirm keys are valid? 
    // Actually the keys are hardcoded in the function: NSE_INDEX|Nifty 50 etc.
    // So master list is not needed for indices if keys are static.

    console.log('Fetching Market Indices...');
    const indices = await stockService.getMarketIndices();
    console.log('Indices:', JSON.stringify(indices, null, 2));

    console.log('Fetching Top Movers (Should wait for init automatically)...');
    const movers = await stockService.getTopMovers();
    console.log('Gainers:', movers.gainers.length);
    console.log('Losers:', movers.losers.length);
    if (movers.gainers.length > 0) {
        console.log('Sample Gainer:', movers.gainers[0]);
    }
}

testAll();
