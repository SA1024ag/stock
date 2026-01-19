const express = require('express');
const newsService = require('../services/newsService');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const timeRange = req.query.timeRange || '1d';
        const news = await newsService.getMarketNews(20, timeRange);
        res.json({ success: true, count: news.length, data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
