const express = require('express');
const stockService = require('../services/stockService');
const router = express.Router();

// Search stocks
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const results = await stockService.searchStocks(q);
    res.json(results);
  } catch (error) {
    console.error('Stock search error:', error);
    res.status(500).json({ message: 'Error searching stocks', error: error.message });
  }
});

// Get company news (General or Specific)
router.get('/news/:symbol?', async (req, res) => {
  try {
    const { symbol } = req.params;
    const news = await stockService.getCompanyNews(symbol);
    res.json(news);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ message: 'Error fetching news', error: error.message });
  }
});


// Get stock quote
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const quote = await stockService.getQuote(symbol);
    res.json(quote);
  } catch (error) {
    console.error('Get quote error:', error);
    res.status(500).json({ message: 'Error fetching stock quote', error: error.message });
  }
});

// Get historical data
router.get('/:symbol/history', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { timeframe = '1M' } = req.query; // Default to 1 month
    const history = await stockService.getHistoricalData(symbol, timeframe);
    res.json(history);
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ message: 'Error fetching historical data', error: error.message });
  }
});

module.exports = router;
