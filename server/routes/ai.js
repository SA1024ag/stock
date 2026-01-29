const express = require('express');
const axios = require('axios');
const router = express.Router();
const auth = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const stockService = require('../services/stockService');
const aiService = require('../services/aiService'); // ✅ Ensure this is imported

router.use(auth);

// 1. Analyze a single stock (Fundamental Analysis)
router.post('/analyze', async (req, res) => {
  try {
    const { symbol } = req.body;
    if (!symbol) return res.status(400).json({ message: 'Stock symbol is required' });

    const stockData = await stockService.getQuote(symbol);
    let historicalData = null;
    try {
      historicalData = await stockService.getHistoricalData(symbol);
    } catch (error) {
      console.log('Could not fetch historical data, proceeding without it');
    }

    const analysis = await aiService.analyzeStock(symbol, stockData, historicalData);
    res.json({ symbol: symbol.toUpperCase(), stockData, analysis });
  } catch (error) {
    console.error('AI analyze error:', error);
    res.status(500).json({ message: 'Error analyzing stock', error: error.message });
  }
});

// 2. Analyze portfolio
router.post('/portfolio-review', async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id });
    if (portfolio.length === 0) return res.status(400).json({ message: 'Portfolio is empty' });

    const stockPrices = {};
    await Promise.all(portfolio.map(async (holding) => {
      try {
        const quote = await stockService.getQuote(holding.symbol);
        stockPrices[holding.symbol] = quote.price;
      } catch (error) {
        stockPrices[holding.symbol] = holding.averagePrice;
      }
    }));

    const analysis = await aiService.analyzePortfolio(portfolio, stockPrices);
    res.json(analysis);
  } catch (error) {
    console.error('AI portfolio review error:', error);
    res.status(500).json({ message: 'Error reviewing portfolio', error: error.message });
  }
});

// 3. AI Tutor
router.post('/tutor', async (req, res) => {
  try {
    const { message, context } = req.body;
    const response = await aiService.askTutor(message, { ...context, userQuestion: message });
    res.json(response);
  } catch (error) {
    console.error('AI tutor error:', error);
    res.status(500).json({ message: 'Error getting tutor response', error: error.message });
  }
});

// 4. Simulate market scenario (Portfolio Wide)
router.post('/simulate', async (req, res) => {
  try {
    const { scenario } = req.body;
    const portfolio = await Portfolio.find({ user: req.user._id });
    if (portfolio.length === 0) return res.status(400).json({ message: 'Portfolio is empty' });

    const stockPrices = {};
    await Promise.all(portfolio.map(async (holding) => {
      try {
        const quote = await stockService.getQuote(holding.symbol);
        stockPrices[holding.symbol] = quote.price;
      } catch (e) { stockPrices[holding.symbol] = holding.averagePrice; }
    }));

    const simulationResult = await aiService.simulateScenario(portfolio, stockPrices, scenario);
    res.json(simulationResult);
  } catch (error) {
    console.error('AI simulation error:', error);
    res.status(500).json({ message: 'Error running simulation', error: error.message });
  }
});

// =================================================================
// ✅ NEW ROUTE: Future Price Simulator (Uses Groq/Llama Internally)
// This fixes the 503 error by NOT calling the Python Service
// =================================================================
router.post('/predict-groq', async (req, res) => {
  try {
    const { symbol, currentPrice, parameters } = req.body;

    if (!symbol) {
      return res.status(400).json({ message: 'Stock symbol is required' });
    }

    // Call your internal AI Service directly
    const prediction = await aiService.predictStockPrice(symbol, currentPrice, parameters);

    res.json(prediction);
  } catch (error) {
    console.error('Groq Prediction Error:', error);
    res.status(500).json({ message: 'Error generating simulation', error: error.message });
  }
});

// =================================================================
// ⚠️ EXISTING ROUTE: LSTM Prediction (Uses Python FastAPI)
// Only used for the "AI Insights" Graph
// =================================================================
router.post('/predict', async (req, res) => {
  const { symbol } = req.body;
  console.log(`🔮 Node.js proxying prediction request for: ${symbol}`);

  try {
    const PYTHON_SERVICE_URL = process.env.PYTHON_API_URL || 'http://localhost:8000/api/predict';
    const payload = { ticker: symbol, lookback: 60, train_size: 1000 };

    const response = await axios.post(PYTHON_SERVICE_URL, payload, { timeout: 120000 });
    res.json(response.data);
  } catch (error) {
    if (error.response) {
      console.error(`❌ Python Service Error: ${error.response.status}`);
      return res.status(error.response.status).json({ message: 'AI Model Error', details: error.response.data });
    }
    console.error('❌ Python Service Unreachable');
    res.status(503).json({ message: 'Prediction service unavailable' });
  }
});

module.exports = router;