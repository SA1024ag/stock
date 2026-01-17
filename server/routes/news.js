const express = require('express');
const newsService = require('../services/newsService');
const newsPersonalizationService = require('../services/newsPersonalizationService');
const User = require('../models/User');
const auth = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/news
 * Fetch general market news
 * Query params:
 *   - limit: number of articles (default: 10, max: 50)
 */
router.get('/', async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const news = await newsService.getMarketNews(limit);

        res.json({
            success: true,
            count: news.length,
            data: news
        });
    } catch (error) {
        console.error('Market news error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching market news',
            error: error.message
        });
    }
});

/**
 * GET /api/news/personalized
 * Fetch personalized news based on user's portfolio, watchlist, and preferences
 * Requires authentication
 * Query params:
 *   - limit: number of articles (default: 20, max: 100)
 *   - category: filter by category (Company, Market, Global, Policy)
 *   - sector: filter by sector (IT, Banking, Pharma, etc.)
 *   - sentiment: filter by sentiment (Positive, Negative, Neutral)
 */
router.get('/personalized', auth, async (req, res) => {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);
        const { category, sector, sentiment } = req.query;

        // Fetch user with preferences
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Fetch raw news
        let news = await newsService.getMarketNews(limit);

        // Personalize and rank news
        news = await newsPersonalizationService.personalizeNews(news, user);

        // Apply filters if provided
        if (category) {
            news = newsPersonalizationService.filterByCategory(news, category);
        }

        if (sector) {
            news = newsPersonalizationService.filterBySector(news, sector);
        }

        if (sentiment) {
            news = newsPersonalizationService.filterBySentiment(news, sentiment);
        }

        res.json({
            success: true,
            count: news.length,
            data: news
        });
    } catch (error) {
        console.error('Personalized news error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching personalized news',
            error: error.message
        });
    }
});

/**
 * GET /api/news/by-category/:category
 * Fetch news by category
 * Params:
 *   - category: Company, Market, Global, Policy
 * Query params:
 *   - limit: number of articles (default: 20, max: 100)
 */
router.get('/by-category/:category', auth, async (req, res) => {
    try {
        const { category } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const user = await User.findById(req.user.userId);
        let news = await newsService.getMarketNews(limit);

        // Personalize first
        news = await newsPersonalizationService.personalizeNews(news, user);

        // Filter by category
        news = newsPersonalizationService.filterByCategory(news, category);

        res.json({
            success: true,
            category,
            count: news.length,
            data: news
        });
    } catch (error) {
        console.error(`Category news error for ${req.params.category}:`, error);
        res.status(500).json({
            success: false,
            message: `Error fetching ${req.params.category} news`,
            error: error.message
        });
    }
});

/**
 * GET /api/news/by-sector/:sector
 * Fetch news by sector
 * Params:
 *   - sector: IT, Banking, Pharma, Auto, Energy, FMCG, Telecom
 * Query params:
 *   - limit: number of articles (default: 20, max: 100)
 */
router.get('/by-sector/:sector', auth, async (req, res) => {
    try {
        const { sector } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const user = await User.findById(req.user.userId);
        let news = await newsService.getMarketNews(limit);

        // Personalize first
        news = await newsPersonalizationService.personalizeNews(news, user);

        // Filter by sector
        news = newsPersonalizationService.filterBySector(news, sector);

        res.json({
            success: true,
            sector,
            count: news.length,
            data: news
        });
    } catch (error) {
        console.error(`Sector news error for ${req.params.sector}:`, error);
        res.status(500).json({
            success: false,
            message: `Error fetching ${req.params.sector} sector news`,
            error: error.message
        });
    }
});

/**
 * GET /api/news/stock/:symbol
 * Fetch stock-specific news
 * Params:
 *   - symbol: stock ticker symbol
 * Query params:
 *   - limit: number of articles (default: 10, max: 50)
 */
router.get('/stock/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);

        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Stock symbol is required'
            });
        }

        const news = await newsService.getStockNews(symbol, limit);

        res.json({
            success: true,
            symbol: symbol.toUpperCase(),
            count: news.length,
            data: news
        });
    } catch (error) {
        console.error(`Stock news error for ${req.params.symbol}:`, error);
        res.status(500).json({
            success: false,
            message: `Error fetching news for ${req.params.symbol}`,
            error: error.message
        });
    }
});

/**
 * GET /api/news/preferences
 * Get user's news preferences
 * Requires authentication
 */
router.get('/preferences', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user.newsPreferences || {
                sectors: [],
                indices: ['NIFTY', 'SENSEX'],
                notificationsEnabled: true
            }
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching news preferences',
            error: error.message
        });
    }
});

/**
 * POST /api/news/preferences
 * Save user's news preferences
 * Requires authentication
 * Body:
 *   - sectors: array of sector names
 *   - indices: array of index names
 *   - notificationsEnabled: boolean
 */
router.post('/preferences', auth, async (req, res) => {
    try {
        const { sectors, indices, notificationsEnabled } = req.body;

        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update preferences
        user.newsPreferences = {
            sectors: sectors || user.newsPreferences?.sectors || [],
            indices: indices || user.newsPreferences?.indices || ['NIFTY', 'SENSEX'],
            notificationsEnabled: notificationsEnabled !== undefined
                ? notificationsEnabled
                : user.newsPreferences?.notificationsEnabled ?? true
        };

        await user.save();

        res.json({
            success: true,
            message: 'News preferences saved successfully',
            data: user.newsPreferences
        });
    } catch (error) {
        console.error('Save preferences error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving news preferences',
            error: error.message
        });
    }
});

/**
 * POST /api/news/clear-cache
 * Clear the news cache (for testing/debugging)
 */
router.post('/clear-cache', (req, res) => {
    try {
        newsService.clearCache();
        res.json({
            success: true,
            message: 'News cache cleared successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error clearing cache',
            error: error.message
        });
    }
});

module.exports = router;
