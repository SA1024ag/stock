const Portfolio = require('../models/Portfolio');
const stockService = require('./stockService');
const transactionService = require('./transactionService');

const CHECK_INTERVAL_MS = 60000; // Check every 1 minute

class PriceMonitorService {
    constructor() {
        this.intervalId = null;
        this.isRunning = false;
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log('Price Monitor Service started...');

        // Initial check
        this.checkPrices();

        // Schedule periodic checks
        this.intervalId = setInterval(() => this.checkPrices(), CHECK_INTERVAL_MS);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('Price Monitor Service stopped');
    }

    async checkPrices() {
        try {
            // Find all portfolios with auto-sell enabled
            const portfolios = await Portfolio.find({
                autoSellEnabled: true,
                shares: { $gt: 0 }
            });

            if (portfolios.length === 0) return;

            // Get unique symbols to minimize API calls
            const symbols = [...new Set(portfolios.map(p => p.symbol))];

            // Fetch prices for all symbols
            const priceMap = new Map();
            for (const symbol of symbols) {
                try {
                    const quote = await stockService.getQuote(symbol);
                    priceMap.set(symbol, quote.price);
                } catch (err) {
                    console.error(`Failed to fetch price for ${symbol}:`, err.message);
                }
            }

            // Check conditions
            for (const portfolio of portfolios) {
                const currentPrice = priceMap.get(portfolio.symbol);

                if (!currentPrice) continue;

                let shouldSell = false;
                let reason = '';

                // Check Stop Loss
                if (portfolio.stopLoss && currentPrice <= portfolio.stopLoss) {
                    shouldSell = true;
                    reason = 'STOP_LOSS';
                }
                // Check Take Profit
                else if (portfolio.takeProfit && currentPrice >= portfolio.takeProfit) {
                    shouldSell = true;
                    reason = 'TAKE_PROFIT';
                }

                if (shouldSell) {
                    console.log(`Triggering auto-sell for ${portfolio.symbol} (User: ${portfolio.user}). Reason: ${reason}. Price: ${currentPrice}`);
                    try {
                        await transactionService.sellStock(
                            portfolio.user,
                            portfolio.symbol,
                            portfolio.shares,
                            currentPrice,
                            reason
                        );
                    } catch (err) {
                        // If we hit an error (e.g. concurrent modification), log it
                        console.error(`Auto-sell failed for ${portfolio.symbol}:`, err.message);
                    }
                }
            }

        } catch (error) {
            console.error('Error in Price Monitor Service:', error);
        }
    }
}

module.exports = new PriceMonitorService();
