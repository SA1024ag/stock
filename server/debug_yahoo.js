const yahooFinanceService = require('./services/yahooFinanceService');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// Suppress notices to clean output
yahooFinance.suppressNotices(['yahooSurvey', 'ripHistorical']);

async function testYahoo() {
    console.log('Testing Yahoo Finance Service directly...');
    console.log('Type of yahooFinance:', typeof yahooFinance);
    console.log('Keys:', Object.keys(yahooFinance));

    try {
        const movers = await yahooFinanceService.getTopMovers();
        console.log('Top Movers Result:');
        console.log(`Gainers: ${movers.gainers.length}`);
        console.log(`Losers: ${movers.losers.length}`);

        if (movers.gainers.length > 0) {
            console.log('Sample Gainer:', movers.gainers[0]);
        }

        if (movers.error) {
            const fs = require('fs');
            fs.writeFileSync('error_log.txt', JSON.stringify(movers.error, null, 2));
            fs.writeFileSync('error_msg.txt', movers.error.toString());
            console.error('Error logged to error_log.txt and error_msg.txt');
        }

    } catch (error) {
        console.error('Test Failed (FULL):', error);
    }
}

testYahoo();
