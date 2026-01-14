const express = require('express');
const auth = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const stockService = require('../services/stockService');
const router = express.Router();

// All routes require authentication
router.use(auth);

// Get user portfolio
router.get('/', async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id });
    res.json(portfolio);
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ message: 'Error fetching portfolio' });
  }
});

// Get portfolio with current values
router.get('/summary', async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id });
    const user = await User.findById(req.user._id);
    
    // Get current prices for all holdings
    const portfolioWithPrices = await Promise.all(
      portfolio.map(async (holding) => {
        try {
          const quote = await stockService.getQuote(holding.symbol);
          const currentValue = holding.shares * quote.price;
          const gainLoss = currentValue - holding.totalInvested;
          const gainLossPercent = ((gainLoss / holding.totalInvested) * 100);
          
          return {
            ...holding.toObject(),
            currentPrice: quote.price,
            currentValue: currentValue,
            gainLoss: gainLoss,
            gainLossPercent: gainLossPercent
          };
        } catch (error) {
          // If we can't get current price, use average price
          return {
            ...holding.toObject(),
            currentPrice: holding.averagePrice,
            currentValue: holding.shares * holding.averagePrice,
            gainLoss: 0,
            gainLossPercent: 0
          };
        }
      })
    );

    const totalValue = portfolioWithPrices.reduce((sum, h) => sum + h.currentValue, 0);
    const totalInvested = portfolio.reduce((sum, h) => sum + h.totalInvested, 0);
    const totalGainLoss = totalValue - totalInvested;

    res.json({
      holdings: portfolioWithPrices,
      totalValue,
      totalInvested,
      totalGainLoss,
      totalGainLossPercent: totalInvested > 0 ? ((totalGainLoss / totalInvested) * 100) : 0,
      virtualBalance: user.virtualBalance
    });
  } catch (error) {
    console.error('Get portfolio summary error:', error);
    res.status(500).json({ message: 'Error fetching portfolio summary' });
  }
});

// Buy stocks
router.post('/buy', async (req, res) => {
  try {
    const { symbol, shares } = req.body;

    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({ message: 'Symbol and valid number of shares required' });
    }

    // Get current stock price
    const quote = await stockService.getQuote(symbol);
    const totalCost = quote.price * shares;

    // Check if user has enough balance
    const user = await User.findById(req.user._id);
    if (user.virtualBalance < totalCost) {
      return res.status(400).json({ 
        message: `Insufficient funds. Need $${totalCost.toFixed(2)}, have $${user.virtualBalance.toFixed(2)}` 
      });
    }

    // Update user balance
    user.virtualBalance -= totalCost;
    await user.save();

    // Find or create portfolio entry
    let portfolio = await Portfolio.findOne({ user: req.user._id, symbol: symbol.toUpperCase() });

    if (portfolio) {
      // Update existing holding
      const newTotalShares = portfolio.shares + shares;
      const newTotalInvested = portfolio.totalInvested + totalCost;
      portfolio.averagePrice = newTotalInvested / newTotalShares;
      portfolio.shares = newTotalShares;
      portfolio.totalInvested = newTotalInvested;
    } else {
      // Create new holding
      portfolio = new Portfolio({
        user: req.user._id,
        symbol: symbol.toUpperCase(),
        shares: shares,
        averagePrice: quote.price,
        totalInvested: totalCost
      });
    }

    // Add transaction
    portfolio.transactions.push({
      type: 'buy',
      shares: shares,
      price: quote.price,
      timestamp: new Date()
    });

    await portfolio.save();

    res.json({
      message: `Successfully bought ${shares} shares of ${symbol.toUpperCase()} at $${quote.price.toFixed(2)}`,
      portfolio: portfolio,
      remainingBalance: user.virtualBalance
    });
  } catch (error) {
    console.error('Buy stock error:', error);
    res.status(500).json({ message: 'Error buying stock', error: error.message });
  }
});

// Sell stocks
router.post('/sell', async (req, res) => {
  try {
    const { symbol, shares } = req.body;

    if (!symbol || !shares || shares <= 0) {
      return res.status(400).json({ message: 'Symbol and valid number of shares required' });
    }

    // Find portfolio entry
    const portfolio = await Portfolio.findOne({ 
      user: req.user._id, 
      symbol: symbol.toUpperCase() 
    });

    if (!portfolio || portfolio.shares < shares) {
      return res.status(400).json({ 
        message: `Insufficient shares. You have ${portfolio?.shares || 0} shares of ${symbol.toUpperCase()}` 
      });
    }

    // Get current stock price
    const quote = await stockService.getQuote(symbol);
    const totalValue = quote.price * shares;

    // Update user balance
    const user = await User.findById(req.user._id);
    user.virtualBalance += totalValue;
    await user.save();

    // Update portfolio
    portfolio.shares -= shares;
    portfolio.totalInvested = portfolio.averagePrice * portfolio.shares;

    // Add transaction
    portfolio.transactions.push({
      type: 'sell',
      shares: shares,
      price: quote.price,
      timestamp: new Date()
    });

    // Remove portfolio entry if no shares left
    if (portfolio.shares === 0) {
      await Portfolio.findByIdAndDelete(portfolio._id);
      res.json({
        message: `Successfully sold ${shares} shares of ${symbol.toUpperCase()} at $${quote.price.toFixed(2)}`,
        portfolio: null,
        remainingBalance: user.virtualBalance
      });
    } else {
      await portfolio.save();
      res.json({
        message: `Successfully sold ${shares} shares of ${symbol.toUpperCase()} at $${quote.price.toFixed(2)}`,
        portfolio: portfolio,
        remainingBalance: user.virtualBalance
      });
    }
  } catch (error) {
    console.error('Sell stock error:', error);
    res.status(500).json({ message: 'Error selling stock', error: error.message });
  }
});

module.exports = router;
