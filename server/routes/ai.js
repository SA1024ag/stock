const express = require('express');
const auth = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const stockService = require('../services/stockService');
const aiService = require('../services/aiService');
const router = express.Router();

// All routes require authentication
router.use(auth);

// Analyze a single stock
router.post('/analyze', async (req, res) => {
  try {
    const { symbol } = req.body;

    if (!symbol) {
      return res.status(400).json({ message: 'Stock symbol is required' });
    }

    // Get stock data
    const stockData = await stockService.getQuote(symbol);
    let historicalData = null;

    try {
      historicalData = await stockService.getHistoricalData(symbol);
    } catch (error) {
      console.log('Could not fetch historical data, proceeding without it');
    }

    // Get AI analysis
    const analysis = await aiService.analyzeStock(symbol, stockData, historicalData);

    res.json({
      symbol: symbol.toUpperCase(),
      stockData,
      analysis
    });
  } catch (error) {
    console.error('AI analyze error:', error);
    res.status(500).json({ message: 'Error analyzing stock', error: error.message });
  }
});

// Analyze portfolio
router.post('/portfolio-review', async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id });

    if (portfolio.length === 0) {
      return res.status(400).json({ message: 'Portfolio is empty' });
    }

    // Get current prices for all holdings
    const stockPrices = {};
    await Promise.all(
      portfolio.map(async (holding) => {
        try {
          const quote = await stockService.getQuote(holding.symbol);
          stockPrices[holding.symbol] = quote.price;
        } catch (error) {
          console.error(`Error fetching price for ${holding.symbol}:`, error.message);
          stockPrices[holding.symbol] = holding.averagePrice;
        }
      })
    );

    // Get AI analysis
    const analysis = await aiService.analyzePortfolio(portfolio, stockPrices);

    res.json(analysis);
  } catch (error) {
    console.error('AI portfolio review error:', error);
    res.status(500).json({ message: 'Error reviewing portfolio', error: error.message });
  }
});

// AI Tutor for Study Buddy Chatbot
router.post('/tutor', async (req, res) => {
  try {
    const { message, context } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Call AI tutor with context
    const response = await aiService.askTutor(message, {
      ...context,
      userQuestion: message
    });

    res.json(response);
  } catch (error) {
    console.error('AI tutor error:', error);
    res.status(500).json({
      message: 'Error getting tutor response',
      error: error.message
    });
  }
});

module.exports = router;
