const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// NIFTY 50 stocks with Yahoo Finance symbols
const NIFTY_50_SYMBOLS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'ICICIBANK.NS', 'INFY.NS',
    'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS',
    'LT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'HCLTECH.NS',
    'SUNPHARMA.NS', 'BAJFINANCE.NS', 'TITAN.NS', 'ULTRACEMCO.NS', 'WIPRO.NS',
    'NESTLEIND.NS', 'ONGC.NS', 'NTPC.NS', 'TATAMOTORS.NS', 'POWERGRID.NS',
    'M&M.NS', 'TECHM.NS', 'ADANIPORTS.NS', 'COALINDIA.NS', 'BAJAJFINSV.NS',
    'DIVISLAB.NS', 'DRREDDY.NS', 'EICHERMOT.NS', 'GRASIM.NS', 'HEROMOTOCO.NS',
    'HINDALCO.NS', 'INDUSINDBK.NS', 'JSWSTEEL.NS', 'CIPLA.NS', 'BRITANNIA.NS',
    'TATACONSUM.NS', 'TATASTEEL.NS', 'UPL.NS', 'APOLLOHOSP.NS', 'BAJAJ-AUTO.NS',
    'BPCL.NS', 'HDFCLIFE.NS', 'SBILIFE.NS', 'ADANIENT.NS', 'LTIM.NS'
];

class YahooFinanceService {
    constructor() {
        console.log('📊 Yahoo Finance Service initialized (Using yahoo-finance2 library)');
        // Suppress console warnings from the library if needed
        // yahooFinance.suppressNotices(['yahooSurvey']); 
    }

    // Convert NSE symbol to Yahoo Finance format
    toYahooSymbol(symbol) {
        if (symbol.includes('.NS') || symbol.includes('.BO')) {
            return symbol;
        }
        return `${symbol.toUpperCase()}.NS`;
    }

    // Convert Yahoo symbol back to simple format
    fromYahooSymbol(yahooSymbol) {
        return yahooSymbol.replace('.NS', '').replace('.BO', '');
    }

    // Get quote for a single stock using yahoo-finance2
    async getQuote(symbol) {
        try {
            const yahooSymbol = this.toYahooSymbol(symbol);
            const quote = await yahooFinance.quote(yahooSymbol);

            if (!quote) {
                throw new Error(`No data found for ${symbol}`);
            }

            const price = quote.regularMarketPrice || 0;
            const prevClose = quote.regularMarketPreviousClose || price;
            const change = price - prevClose;
            const changePercent = prevClose ? (change / prevClose * 100) : 0;

            return {
                symbol: this.fromYahooSymbol(yahooSymbol),
                price: price,
                change: change,
                changePercent: changePercent,
                volume: quote.regularMarketVolume || 0,
                high: quote.regularMarketDayHigh || price,
                low: quote.regularMarketDayLow || price,
                open: quote.regularMarketOpen || price,
                previousClose: prevClose,
                marketCap: quote.marketCap || 0,
                source: 'yahoo-finance'
            };
        } catch (error) {
            console.error(`Yahoo Finance Quote Error (${symbol}):`, error.message);
            throw error;
        }
    }

    // Get top movers (gainers and losers) from NIFTY 50
    async getTopMovers() {
        try {
            console.log('📈 Fetching real-time top movers from Yahoo Finance via yahoo-finance2...');

            // Fetch quotes for all NIFTY 50 stocks
            // yahoo-finance2 supports array of symbols in quote
            const quotes = await yahooFinance.quote(NIFTY_50_SYMBOLS);

            const processedQuotes = [];

            for (const quote of quotes) {
                if (!quote || !quote.regularMarketPrice) continue;

                const price = quote.regularMarketPrice;
                const prevClose = quote.regularMarketPreviousClose || price;
                const change = price - prevClose;
                const changePercent = prevClose ? (change / prevClose * 100) : 0;

                processedQuotes.push({
                    symbol: this.fromYahooSymbol(quote.symbol),
                    price: price,
                    change: change,
                    changePercent: changePercent,
                    open: quote.regularMarketOpen || price,
                    high: quote.regularMarketDayHigh || price,
                    low: quote.regularMarketDayLow || price,
                    volume: quote.regularMarketVolume || 0,
                    source: 'yahoo-finance'
                });
            }

            // Sort by change percentage
            processedQuotes.sort((a, b) => b.changePercent - a.changePercent);

            console.log(`✅ Fetched ${processedQuotes.length} real stocks from Yahoo Finance`);

            return {
                gainers: processedQuotes.slice(0, 5),
                losers: processedQuotes.slice(-5).reverse(),
                source: 'yahoo-finance',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('Yahoo Finance Top Movers Error:', error.message);

            return {
                gainers: [],
                losers: [],
                error: error.message,
                source: 'yahoo-finance'
            };
        }
    }

    // Get historical data using yahoo-finance2
    async getHistoricalData(symbol, timeframe = '1M') {
        try {
            const yahooSymbol = this.toYahooSymbol(symbol);

            // Map timeframe to period1 (start date) and interval
            const now = new Date();
            let period1;
            let interval = '1d';

            switch (timeframe) {
                case '1D':
                    period1 = new Date(now.getTime() - (1 * 24 * 60 * 60 * 1000)); // 1 day ago
                    interval = '5m';
                    break;
                case '1W':
                    period1 = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days ago
                    interval = '30m';
                    break;
                case '1M':
                    period1 = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000)); // 30 days ago
                    interval = '1d';
                    break;
                case '1Y':
                    period1 = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000)); // 1 year ago
                    interval = '1d';
                    break;
                default:
                    period1 = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                    interval = '1d';
            }

            const queryOptions = {
                period1: period1, // Date object or string
                // period2 defaults to new Date()
                interval: interval
            };

            const result = await yahooFinance.chart(yahooSymbol, queryOptions);
            // Result structure: { meta: { ... }, quotes: [ ... ] } or simple array depending on version/endpoint
            // yahooFinance.chart usually returns { meta, quotes } or throws

            const quotes = result?.quotes || [];

            const data = quotes
                .filter(q => q.open !== null && q.high !== null && q.low !== null && q.close !== null) // Filter incomplete candles
                .map(q => ({
                    date: q.date.toISOString(),
                    open: q.open,
                    high: q.high,
                    low: q.low,
                    close: q.close,
                    volume: q.volume || 0
                }));

            console.log(`✅ Fetched ${data.length} historical candles for ${symbol} from Yahoo Finance`);
            return data;

        } catch (error) {
            console.error(`Yahoo Finance Historical Error (${symbol}):`, error.message);
            return [];
        }
    }

    // Search stocks using yahoo-finance2 search
    async searchStocks(query) {
        if (!query) return [];

        try {
            const results = await yahooFinance.search(query);

            return results.quotes
                .filter(q => q.exchange === 'NSI' || q.symbol.endsWith('.NS')) // Filter for NSE/India
                .slice(0, 10)
                .map(q => ({
                    symbol: this.fromYahooSymbol(q.symbol),
                    name: q.longname || q.shortname || q.symbol,
                    exchange: 'NSE',
                    type: 'EQ',
                    source: 'yahoo-finance'
                }));
        } catch (error) {
            console.error('Yahoo Search Error:', error.message);
            // Fallback to local NIFTY search if API fails
            const upperQuery = query.toUpperCase();
            return NIFTY_50_SYMBOLS
                .filter(symbol => symbol.includes(upperQuery))
                .slice(0, 10)
                .map(symbol => ({
                    symbol: this.fromYahooSymbol(symbol),
                    name: this.fromYahooSymbol(symbol),
                    exchange: 'NSE',
                    type: 'EQ',
                    source: 'yahoo-finance'
                }));
        }
    }
}

module.exports = new YahooFinanceService();
