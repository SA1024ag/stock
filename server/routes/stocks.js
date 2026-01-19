const express = require('express');
const stockService = require('../services/stockService');
const router = express.Router();

// Search stocks
router.get('/debug/instruments', async (req, res) => {
  try {
    const result = await stockService.downloadMasterList();
    res.json({ is_updated: true, ...result });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/debug/quote/:symbol', async (req, res) => {
  try {
    const quote = await stockService.getQuote(req.params.symbol);
    res.json(quote);
  } catch (e) {
    res.status(500).json({ error: e.message, stack: e.stack });
  }
});

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

// Get major market indices
router.get('/market/indices', async (req, res) => {
  try {
    const indices = await stockService.getMarketIndices();
    res.json(indices);
  } catch (error) {
    console.error('Get indices error:', error);
    res.status(500).json({ message: 'Error fetching indices', error: error.message });
  }
});

// Get top movers (gainers/losers)
router.get('/market/movers', async (req, res) => {
  try {
    const movers = await stockService.getTopMovers();
    res.json(movers);
  } catch (error) {
    console.error('Get movers error:', error);
    res.status(500).json({ message: 'Error fetching top movers', error: error.message });
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
