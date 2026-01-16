const Portfolio = require('../models/Portfolio');

/**
 * News Personalization Service
 * Handles ranking and filtering news based on user's portfolio, watchlist, and preferences
 */
class NewsPersonalizationService {

    /**
     * Get user's portfolio stock symbols
     */
    async getUserPortfolioStocks(userId) {
        try {
            const portfolioItems = await Portfolio.find({ user: userId });
            return portfolioItems.map(item => item.symbol.toUpperCase());
        } catch (error) {
            console.error('Error fetching user portfolio:', error);
            return [];
        }
    }

    /**
     * Extract stock tickers from news content
     */
    extractTickers(article) {
        const tickers = new Set();

        // Add tickers from article.tickers if available
        if (article.tickers && Array.isArray(article.tickers)) {
            article.tickers.forEach(ticker => tickers.add(ticker.toUpperCase()));
        }

        // Extract tickers from ticker_sentiment if available
        if (article.ticker_sentiment && Array.isArray(article.ticker_sentiment)) {
            article.ticker_sentiment.forEach(ts => {
                if (ts.ticker) tickers.add(ts.ticker.toUpperCase());
            });
        }

        // Common Indian stock patterns (e.g., TCS, INFY, RELIANCE)
        const tickerPattern = /\b([A-Z]{2,10})\b/g;
        const text = `${article.title} ${article.summary}`;
        const matches = text.match(tickerPattern) || [];

        // Filter to likely stock tickers (2-6 letters, common stocks)
        const commonStocks = ['TCS', 'INFY', 'RELIANCE', 'HDFC', 'ICICI', 'SBI', 'ITC',
            'WIPRO', 'BHARTI', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA'];
        matches.forEach(match => {
            if (match.length >= 2 && match.length <= 6 && commonStocks.includes(match)) {
                tickers.add(match);
            }
        });

        return Array.from(tickers);
    }

    /**
     * Categorize news article
     */
    categorizeNews(article) {
        const title = article.title.toLowerCase();
        const summary = article.summary?.toLowerCase() || '';
        const content = `${title} ${summary}`;

        // Company-specific keywords
        const companyKeywords = ['earnings', 'ceo', 'merger', 'acquisition', 'ipo', 'dividend',
            'quarterly', 'revenue', 'profit', 'loss', 'stock split'];

        // Market-wide keywords
        const marketKeywords = ['market', 'index', 'nifty', 'sensex', 'nasdaq', 'dow jones',
            'rally', 'crash', 'bull', 'bear', 'trading'];

        // Global keywords
        const globalKeywords = ['global', 'international', 'world', 'forex', 'crude',
            'gold', 'commodity', 'fed', 'ecb'];

        // Policy keywords
        const policyKeywords = ['rbi', 'government', 'policy', 'regulation', 'tax',
            'budget', 'inflation', 'gdp'];

        // Sector keywords
        const sectorKeywords = {
            'IT': ['technology', 'software', 'it sector', 'tech', 'digital'],
            'Banking': ['bank', 'banking', 'financial', 'nbfc', 'loan'],
            'Pharma': ['pharma', 'pharmaceutical', 'drug', 'healthcare', 'medicine'],
            'Auto': ['auto', 'automobile', 'car', 'vehicle', 'ev', 'electric vehicle'],
            'Energy': ['energy', 'power', 'oil', 'gas', 'renewable'],
            'FMCG': ['fmcg', 'consumer goods', 'retail'],
            'Telecom': ['telecom', 'telecommunication', '5g', 'network']
        };

        // Determine primary category
        let category = 'Market';
        let sector = null;

        if (companyKeywords.some(kw => content.includes(kw))) {
            category = 'Company';
        } else if (globalKeywords.some(kw => content.includes(kw))) {
            category = 'Global';
        } else if (policyKeywords.some(kw => content.includes(kw))) {
            category = 'Policy';
        }

        // Determine sector
        for (const [sectorName, keywords] of Object.entries(sectorKeywords)) {
            if (keywords.some(kw => content.includes(kw))) {
                sector = sectorName;
                break;
            }
        }

        return { category, sector };
    }

    /**
     * Calculate relevance score for a news article
     */
    calculateRelevanceScore(article, user, portfolioStocks) {
        let score = 0;
        const tickers = this.extractTickers(article);
        const { category, sector } = this.categorizeNews(article);

        // Portfolio stocks (highest priority)
        const portfolioMatch = tickers.some(t => portfolioStocks.includes(t));
        if (portfolioMatch) {
            score += 100;
        }

        // Watchlist stocks
        const watchlistMatch = user.watchlist && tickers.some(t =>
            user.watchlist.map(w => w.toUpperCase()).includes(t)
        );
        if (watchlistMatch) {
            score += 75;
        }

        // Preferred sectors
        if (sector && user.newsPreferences?.sectors?.includes(sector)) {
            score += 50;
        }

        // Followed indices
        const indexKeywords = user.newsPreferences?.indices || [];
        const hasIndexMatch = indexKeywords.some(idx =>
            article.title.toUpperCase().includes(idx.toUpperCase()) ||
            (article.summary && article.summary.toUpperCase().includes(idx.toUpperCase()))
        );
        if (hasIndexMatch) {
            score += 40;
        }

        // Recency boost (newer articles get higher scores)
        const publishedAt = new Date(this.parseAlphaVantageDate(article.time_published));
        const hoursOld = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
        const recencyBoost = Math.max(0, 30 - hoursOld);
        score += recencyBoost;

        // Sentiment impact boost
        const sentimentScore = parseFloat(article.overall_sentiment_score) || 0;
        if (Math.abs(sentimentScore) > 0.5) {
            score += 20;
        }

        // Base score for all news
        score += 25;

        return score;
    }

    /**
     * Parse Alpha Vantage date format (YYYYMMDDTHHMMSS)
     */
    parseAlphaVantageDate(timestamp) {
        if (!timestamp) return new Date();

        const year = timestamp.substring(0, 4);
        const month = timestamp.substring(4, 6);
        const day = timestamp.substring(6, 8);
        const hour = timestamp.substring(9, 11);
        const minute = timestamp.substring(11, 13);
        const second = timestamp.substring(13, 15);

        return `${year}-${month}-${day}T${hour}:${minute}:${second}Z`;
    }

    /**
     * Generate "Why am I seeing this?" explanation
     */
    generateExplanation(article, user, portfolioStocks) {
        const tickers = this.extractTickers(article);
        const { sector } = this.categorizeNews(article);
        const reasons = [];

        // Check portfolio match
        const portfolioMatches = tickers.filter(t => portfolioStocks.includes(t));
        if (portfolioMatches.length > 0) {
            reasons.push(`You hold ${portfolioMatches.join(', ')} in your portfolio`);
        }

        // Check watchlist match
        if (user.watchlist) {
            const watchlistMatches = tickers.filter(t =>
                user.watchlist.map(w => w.toUpperCase()).includes(t)
            );
            if (watchlistMatches.length > 0) {
                reasons.push(`${watchlistMatches.join(', ')} is in your watchlist`);
            }
        }

        // Check sector preference
        if (sector && user.newsPreferences?.sectors?.includes(sector)) {
            reasons.push(`You follow ${sector} sector`);
        }

        // Default reason
        if (reasons.length === 0) {
            reasons.push('General market news');
        }

        return reasons.join(' • ');
    }

    /**
     * Rank and personalize news for a user
     */
    async personalizeNews(newsArticles, user) {
        try {
            const portfolioStocks = await this.getUserPortfolioStocks(user._id);

            const enrichedNews = newsArticles.map(article => {
                const tickers = this.extractTickers(article);
                const { category, sector } = this.categorizeNews(article);
                const relevanceScore = this.calculateRelevanceScore(article, user, portfolioStocks);
                const explanation = this.generateExplanation(article, user, portfolioStocks);

                return {
                    ...article,
                    tickers,
                    category,
                    sector,
                    relevanceScore,
                    explanation
                };
            });

            // Sort by relevance score (highest first)
            enrichedNews.sort((a, b) => b.relevanceScore - a.relevanceScore);

            return enrichedNews;
        } catch (error) {
            console.error('Error personalizing news:', error);
            return newsArticles;
        }
    }

    /**
     * Filter news by category
     */
    filterByCategory(newsArticles, category) {
        return newsArticles.filter(article => article.category === category);
    }

    /**
     * Filter news by sector
     */
    filterBySector(newsArticles, sector) {
        return newsArticles.filter(article => article.sector === sector);
    }

    /**
     * Filter news by sentiment
     */
    filterBySentiment(newsArticles, sentiment) {
        return newsArticles.filter(article => {
            const score = parseFloat(article.overall_sentiment_score) || 0;
            if (sentiment === 'Positive') return score > 0.3;
            if (sentiment === 'Negative') return score < -0.3;
            if (sentiment === 'Neutral') return Math.abs(score) <= 0.3;
            return true;
        });
    }
}

module.exports = new NewsPersonalizationService();
