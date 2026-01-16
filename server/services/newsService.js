const axios = require('axios');

class NewsService {
    constructor() {
        this.apiKey = process.env.ALPHA_VANTAGE_API_KEY;
        this.baseUrl = 'https://www.alphavantage.co/query';
        this.cache = {
            marketNews: { data: null, timestamp: null },
            stockNews: new Map()
        };
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes cache
    }

    /**
     * Check if cached data is still valid
     */
    isCacheValid(timestamp) {
        if (!timestamp) return false;
        return Date.now() - timestamp < this.cacheDuration;
    }

    /**
     * Fetch general market news
     */
    async getMarketNews(limit = 10) {
        try {
            // Check cache first
            if (this.isCacheValid(this.cache.marketNews.timestamp)) {
                console.log('Returning cached market news');
                return this.cache.marketNews.data.slice(0, limit);
            }

            // Check for valid API key before even trying
            if (!this.apiKey || this.apiKey.includes('your-') || this.apiKey.length < 5) {
                throw new Error('Invalid or missing API key');
            }

            console.log('Fetching fresh market news from Alpha Vantage');
            const response = await axios.get(this.baseUrl, {
                params: {
                    function: 'NEWS_SENTIMENT',
                    apikey: this.apiKey,
                    topics: 'financial_markets,economy_macro,technology,finance',
                    limit: 50 // Fetch more to cache
                }
            });

            if (response.data.feed) {
                const formattedNews = this.formatNewsData(response.data.feed);

                // Update cache
                this.cache.marketNews = {
                    data: formattedNews,
                    timestamp: Date.now()
                };

                return formattedNews.slice(0, limit);
            } else if (response.data["Information"]) {
                // Rate limit hit
                throw new Error("Alpha Vantage API rate limit reached");
            }

            throw new Error('No news feed in response');
        } catch (error) {
            console.error('Error fetching market news:', error.message);
            console.log('Switching to MOCK DATA fallback for market news');

            // Return cached data if available, even if expired
            if (this.cache.marketNews.data) {
                console.log('Returning expired cache as priority fallback');
                return this.cache.marketNews.data.slice(0, limit);
            }

            // Fallback to robust mock data
            const mockNews = this._getMockMarketNews();
            // Update cache with mock data so we don't spam logs? 
            // Better to not cache mock data in main cache to allow recovery, but for now just return it.
            return mockNews.slice(0, limit);
        }
    }

    /**
     * Fetch stock-specific news
     */
    async getStockNews(symbol, limit = 10) {
        try {
            const cacheKey = symbol.toUpperCase();
            const cachedData = this.cache.stockNews.get(cacheKey);

            // Check cache first
            if (cachedData && this.isCacheValid(cachedData.timestamp)) {
                console.log(`Returning cached news for ${symbol}`);
                return cachedData.data.slice(0, limit);
            }

            // Check for valid API key
            if (!this.apiKey || this.apiKey.includes('your-') || this.apiKey.length < 5) {
                throw new Error('Invalid or missing API key');
            }

            console.log(`Fetching fresh news for ${symbol} from Alpha Vantage`);
            const response = await axios.get(this.baseUrl, {
                params: {
                    function: 'NEWS_SENTIMENT',
                    tickers: symbol.toUpperCase(),
                    apikey: this.apiKey,
                    limit: 50
                }
            });

            if (response.data.feed) {
                const formattedNews = this.formatNewsData(response.data.feed);

                // Update cache
                this.cache.stockNews.set(cacheKey, {
                    data: formattedNews,
                    timestamp: Date.now()
                });

                return formattedNews.slice(0, limit);
            }

            throw new Error('No news feed in response');
        } catch (error) {
            console.error(`Error fetching news for ${symbol}:`, error.message);

            // Return cached data if available
            const cachedData = this.cache.stockNews.get(symbol.toUpperCase());
            if (cachedData) {
                return cachedData.data.slice(0, limit);
            }

            console.log(`Generating MOCK DATA for ${symbol}`);
            return this._getMockStockNews(symbol, limit);
        }
    }

    /**
     * Format news data for frontend consumption
     */
    formatNewsData(newsArray) {
        return newsArray.map(article => ({
            title: article.title,
            url: article.url,
            source: article.source,
            publishedAt: article.time_published,
            summary: article.summary,
            sentiment: article.overall_sentiment_label,
            sentimentScore: article.overall_sentiment_score,
            imageUrl: article.banner_image || null,
            tickers: article.ticker_sentiment?.map(t => t.ticker) || []
        }));
    }

    /**
     * Clear cache (useful for testing or manual refresh)
     */
    clearCache() {
        this.cache.marketNews = { data: null, timestamp: null };
        this.cache.stockNews.clear();
        console.log('News cache cleared');
    }

    /**
     * PRIVATE: Generate robust mock market news
     */
    _getMockMarketNews() {
        const now = new Date();
        const getRate = (h) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString().replace(/[-:T.]/g, '').slice(0, 14);

        return [
            {
                title: "Global Markets Rally as Tech Stocks Lead Surge",
                url: "#",
                source: "MarketWatch",
                publishedAt: getRate(1),
                summary: "Major indices hit new highs today as technology sector earnings exceeded expectations, driving investor confidence across global markets.",
                sentiment: "Bullish",
                sentimentScore: 0.65,
                imageUrl: "https://images.unsplash.com/photo-1611974765215-fadbf09d10ae?auto=format&fit=crop&q=80&w=1000",
                tickers: ["AAPL", "NVDA", "MSFT", "QQQ"]
            },
            {
                title: "Federal Reserve Signals Potential Rate Cuts in Q3",
                url: "#",
                source: "Bloomberg",
                publishedAt: getRate(3),
                summary: "Central bank officials engaged in discussions about monetary policy easing, suggesting that inflation targets are nearing acceptable levels.",
                sentiment: "Somewhat-Bullish",
                sentimentScore: 0.45,
                imageUrl: "https://images.unsplash.com/photo-1526304640152-d4619684e484?auto=format&fit=crop&q=80&w=1000",
                tickers: ["SPY", "TLT", "USD"]
            },
            {
                title: "Energy Sector Faces Headwinds Amid Oil Price Volatility",
                url: "#",
                source: "Reuters",
                publishedAt: getRate(5),
                summary: "Crude oil prices fluctuated wildly today as geopolitical tensions offset supply chain improvements, impacting major energy stocks.",
                sentiment: "Neutral",
                sentimentScore: -0.1,
                imageUrl: "https://images.unsplash.com/photo-1518458028785-8fbcd101ebb9?auto=format&fit=crop&q=80&w=1000",
                tickers: ["XOM", "CVX", "USO"]
            },
            {
                title: "India's NIFTY 50 Hits Life-Time High",
                url: "#",
                source: "Economic Times",
                publishedAt: getRate(2),
                summary: "Positive domestic flows and strong quarterly results from banking majors pushed the benchmark index to fresh record highs.",
                sentiment: "Bullish",
                sentimentScore: 0.8,
                imageUrl: "https://images.unsplash.com/photo-1535320903710-d9cf788d4dcd?auto=format&fit=crop&q=80&w=1000",
                tickers: ["NIFTY", "HDFCBANK", "RELIANCE"]
            },
            {
                title: "Crypto Markets see strong recovery",
                url: "#",
                source: "CoinDesk",
                publishedAt: getRate(4),
                summary: "Bitcoin and Ethereum surged past key resistance levels as institutional interest continues to grow.",
                sentiment: "Bullish",
                sentimentScore: 0.6,
                imageUrl: "https://images.unsplash.com/photo-1518546305927-5a44870c2c80?auto=format&fit=crop&q=80&w=1000",
                tickers: ["BTC", "ETH", "COIN"]
            },
            {
                title: "Consumer Spending Metrics Show Resilience",
                url: "#",
                source: "WSJ",
                publishedAt: getRate(8),
                summary: "Despite inflationary pressures, retail sales data indicates that consumer spending remains robust heading into the holiday season.",
                sentiment: "Somewhat-Bullish",
                sentimentScore: 0.3,
                imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=1000",
                tickers: ["XRT", "WMT", "AMZN"]
            },
            {
                title: "Pharma Giants Announce Strategic Partnership",
                url: "#",
                source: "CNBC",
                publishedAt: getRate(12),
                summary: "Two leading pharmaceutical companies have agreed to collaborate on next-generation biotech therapies.",
                sentiment: "Bullish",
                sentimentScore: 0.5,
                imageUrl: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=1000",
                tickers: ["PFE", "MRK", "XLV"]
            }
        ];
    }

    /**
     * PRIVATE: Generate mock stock news
     */
    _getMockStockNews(symbol, limit) {
        const s = symbol.toUpperCase();
        const now = new Date();
        const getRate = (h) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString().replace(/[-:T.]/g, '').slice(0, 14);

        return [
            {
                title: `${s} Reports Strong Quarterly Earnings Growth`,
                url: "#",
                source: "Financial News",
                publishedAt: getRate(2),
                summary: `${s} exceeded analyst expectations with revenue growing 15% year-over-year, driven by strong demand in key segments.`,
                sentiment: "Bullish",
                sentimentScore: 0.75,
                imageUrl: "https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&q=80&w=1000",
                tickers: [s]
            },
            {
                title: `Analyst Upgrades ${s} to 'Buy'`,
                url: "#",
                source: "Market Insider",
                publishedAt: getRate(5),
                summary: `Top equity researchers have upgraded their price target for ${s}, citing improved operational efficiency and market share gains.`,
                sentiment: "Somewhat-Bullish",
                sentimentScore: 0.4,
                imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
                tickers: [s]
            },
            {
                title: `${s} Expands into New Markets`,
                url: "#",
                source: "Business Wire",
                publishedAt: getRate(24),
                summary: `${s} announced strategic expansion plans into emerging markets to diversify its revenue streams.`,
                sentiment: "Neutral",
                sentimentScore: 0.1,
                imageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000",
                tickers: [s]
            }
        ];
    }
}

module.exports = new NewsService();
