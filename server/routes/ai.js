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

// Simulate market scenario
router.post('/simulate', async (req, res) => {
  try {
    const { scenario } = req.body;

    if (!scenario) {
      return res.status(400).json({ message: 'Scenario text is required' });
    }

    const portfolio = await Portfolio.find({ user: req.user._id });

    if (portfolio.length === 0) {
      // Allow simulation even with empty portfolio? Probably valid to just say "No stocks affected" but the prompt expects a portfolio.
      // Let's return a specific message so frontend handles it or just pass empty list.
      // Prompt says "The user owns a stock portfolio", so let's error if empty for now for simplicity, or handle graceful empty.
      return res.status(400).json({ message: 'Portfolio is empty. Add stocks to your portfolio to run simulations.' });
    }

    // Get current prices for all holdings
    const stockPrices = {};
    await Promise.all(
      portfolio.map(async (holding) => {
        try {
          // Optimization: could just use cached prices or skip if we have many
          const quote = await stockService.getQuote(holding.symbol);
          stockPrices[holding.symbol] = quote.price;
        } catch (error) {
          console.error(`Error fetching price for ${holding.symbol}:`, error.message);
          stockPrices[holding.symbol] = holding.averagePrice;
        }
      })
    );

    // Get Simulation
    const simulationResult = await aiService.simulateScenario(portfolio, stockPrices, scenario);

    res.json(simulationResult);
  } catch (error) {
    console.error('AI simulation error:', error);
    res.status(500).json({
      message: 'Error running simulation',
      error: error.message,
      details: error.response?.data || 'No external API details'
    });
  }
});

// Predict stock price
router.post('/predict', async (req, res) => {
  try {
    const { symbol, currentPrice, parameters } = req.body;

    if (!symbol || !parameters) {
      return res.status(400).json({ message: 'Symbol and parameters are required' });
    }

    const prediction = await aiService.predictStockPrice(symbol, currentPrice, parameters);
    res.json(prediction);
  } catch (error) {
    console.error('AI prediction error:', error);
    res.status(500).json({ message: 'Error predicting stock price', error: error.message });
  }
});

module.exports = router;
