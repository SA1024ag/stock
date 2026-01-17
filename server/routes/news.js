const express = require('express');
const newsService = require('../services/newsService');
const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const news = await newsService.getMarketNews(20);
        res.json({ success: true, count: news.length, data: news });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
