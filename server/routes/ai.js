const express = require('express');
const axios = require('axios'); // 📦 Make sure to run: npm install axios
const router = express.Router();
const auth = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const stockService = require('../services/stockService');
const aiService = require('../services/aiService');

// All routes require authentication
router.use(auth);

// 1. Analyze a single stock (Groq/Llama)
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

// 2. Analyze portfolio (Groq/Llama)
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

// 3. AI Tutor for Study Buddy Chatbot
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

// 4. Simulate market scenario
router.post('/simulate', async (req, res) => {
  try {
    const { scenario } = req.body;

    if (!scenario) {
      return res.status(400).json({ message: 'Scenario text is required' });
    }

    const portfolio = await Portfolio.find({ user: req.user._id });

    if (portfolio.length === 0) {
      return res.status(400).json({ message: 'Portfolio is empty. Add stocks to your portfolio to run simulations.' });
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

    // Get Simulation
    const simulationResult = await aiService.simulateScenario(portfolio, stockPrices, scenario);

    res.json(simulationResult);
  } catch (error) {
    console.error('AI simulation error:', error);
    res.status(500).json({
      message: 'Error running simulation',
      error: error.message
    });
  }
});

// 5. Predict stock price (The "Showstopper" Feature)
// This connects to your Python Microservice running on Port 8000
router.post('/predict', async (req, res) => {
  const { symbol } = req.body;

  if (!symbol) {
    return res.status(400).json({ message: 'Symbol is required' });
  }

  console.log(`🔮 Node.js proxying prediction request for: ${symbol}`);

  try {
    // URL of your Python FastAPI Service
    const PYTHON_SERVICE_URL = process.env.PYTHON_API_URL || 'http://localhost:8000/api/predict';

    const payload = {
      ticker: symbol,
      lookback: 60,
      train_size: 1000
    };

    // Forward request to Python with extended timeout
    const response = await axios.post(PYTHON_SERVICE_URL, payload, {
      timeout: 120000 // 120 seconds (2 mins) to allow for LSTM training
    });

    res.json(response.data);

  } catch (error) {
    // Detailed Error Handling
    if (error.response) {
        // The Python server responded with a status code (like 400, 403, 500)
        console.error(`❌ Python Service Error: ${error.response.status} -`, error.response.data);
        return res.status(error.response.status).json({ 
            message: 'AI Model Error', 
            details: error.response.data.detail || error.message 
        });
    } else if (error.request) {
        // The request was made but no response was received (Python server down)
        console.error('❌ Python Service Unreachable. Is uvicorn running on port 8000?');
        return res.status(503).json({ 
            message: 'Prediction service unavailable. Please start the Python API.' 
        });
    } else {
        // Something happened in setting up the request
        console.error('❌ Request Setup Error:', error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  }
});

module.exports = router;