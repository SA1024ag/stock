const axios = require('axios');

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
        console.log('📊 Yahoo Finance Service initialized (Real API - no auth required)');
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

    // Get quote for a single stock using Yahoo Finance API v7
    async getQuote(symbol) {
        try {
            const yahooSymbol = this.toYahooSymbol(symbol);
            const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooSymbol}`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const quote = response.data?.quoteResponse?.result?.[0];
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
            console.log('📈 Fetching real-time top movers from Yahoo Finance...');

            // Fetch quotes for all NIFTY 50 stocks in batches
            const symbols = NIFTY_50_SYMBOLS.join(',');
            const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json'
                },
                timeout: 15000
            });

            const quotes = response.data?.quoteResponse?.result || [];
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

            // If Yahoo Finance fails, return empty instead of mock
            return {
                gainers: [],
                losers: [],
                error: error.message,
                source: 'yahoo-finance'
            };
        }
    }

    // Get historical data from Yahoo Finance
    async getHistoricalData(symbol, timeframe = '1M') {
        try {
            const yahooSymbol = this.toYahooSymbol(symbol);
            const now = Math.floor(Date.now() / 1000);
            let period1;
            let interval = '1d';

            // Determine date range based on timeframe
            switch (timeframe) {
                case '1D':
                    period1 = now - (1 * 24 * 60 * 60);
                    interval = '5m';
                    break;
                case '1W':
                    period1 = now - (7 * 24 * 60 * 60);
                    interval = '30m';
                    break;
                case '1M':
                    period1 = now - (30 * 24 * 60 * 60);
                    interval = '1d';
                    break;
                case '1Y':
                    period1 = now - (365 * 24 * 60 * 60);
                    interval = '1d';
                    break;
                default:
                    period1 = now - (30 * 24 * 60 * 60);
                    interval = '1d';
            }

            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?period1=${period1}&period2=${now}&interval=${interval}`;

            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 15000
            });

            const result = response.data?.chart?.result?.[0];
            if (!result || !result.timestamp) {
                throw new Error('No historical data available');
            }

            const timestamps = result.timestamp;
            const quotes = result.indicators?.quote?.[0];

            if (!quotes) {
                throw new Error('No quote data in response');
            }

            const data = [];
            for (let i = 0; i < timestamps.length; i++) {
                if (quotes.open[i] && quotes.high[i] && quotes.low[i] && quotes.close[i]) {
                    data.push({
                        date: new Date(timestamps[i] * 1000).toISOString(),
                        open: quotes.open[i],
                        high: quotes.high[i],
                        low: quotes.low[i],
                        close: quotes.close[i],
                        volume: quotes.volume[i] || 0
                    });
                }
            }

            console.log(`✅ Fetched ${data.length} historical candles for ${symbol} from Yahoo Finance`);
            return data;

        } catch (error) {
            console.error(`Yahoo Finance Historical Error (${symbol}):`, error.message);
            return [];
        }
    }

    // Search stocks (basic implementation)
    async searchStocks(query) {
        if (!query) return [];

        const upperQuery = query.toUpperCase();

        // Simple search through NIFTY 50
        const results = NIFTY_50_SYMBOLS
            .filter(symbol => {
                const cleanSymbol = this.fromYahooSymbol(symbol);
                return cleanSymbol.includes(upperQuery);
            })
            .slice(0, 10)
            .map(symbol => ({
                symbol: this.fromYahooSymbol(symbol),
                name: this.fromYahooSymbol(symbol),
                exchange: 'NSE',
                type: 'EQ',
                source: 'yahoo-finance'
            }));

        return results;
    }
}

module.exports = new YahooFinanceService();
