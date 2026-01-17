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
    const { symbol, shares, stopLoss, takeProfit } = req.body;

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

    const autoSellEnabled = !!(stopLoss || takeProfit);

    if (portfolio) {
      // Update existing holding
      const newTotalShares = portfolio.shares + shares;
      const newTotalInvested = portfolio.totalInvested + totalCost;
      portfolio.averagePrice = newTotalInvested / newTotalShares;
      portfolio.shares = newTotalShares;
      portfolio.totalInvested = newTotalInvested;

      // Update SL/TP only if provided (allows overriding)
      if (stopLoss !== undefined) portfolio.stopLoss = stopLoss;
      if (takeProfit !== undefined) portfolio.takeProfit = takeProfit;
      if (autoSellEnabled) portfolio.autoSellEnabled = true;

    } else {
      // Create new holding
      portfolio = new Portfolio({
        user: req.user._id,
        symbol: symbol.toUpperCase(),
        shares: shares,
        averagePrice: quote.price,
        totalInvested: totalCost,
        stopLoss: stopLoss || null,
        takeProfit: takeProfit || null,
        autoSellEnabled: autoSellEnabled
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

    const { transactionService } = require('../services/transactionService');
    // Note: Since transactionService is exported as exports.sellStock in the file I viewed earlier, 
    // I should check how it is imported. 
    // Actually, looking at previous summary, I see `const transactionService = require('../services/transactionService');`
    // was added to imports. Let me check the imports of this file again.
    // The view_file output did NOT show transactionService imported.
    // I will use `require` inline or add it to top. Inline is safer to avoid modifying top of file blindly.

    const transactionServiceModule = require('../services/transactionService');

    const result = await transactionServiceModule.sellStock(
      req.user._id,
      symbol,
      shares,
      null, // Fetch current price inside service
      'MANUAL'
    );

    res.json({
      message: `Successfully sold ${result.sharesSold} shares of ${symbol.toUpperCase()} at $${result.sellPrice.toFixed(2)}`,
      portfolio: result.portfolio,
      remainingBalance: result.remainingBalance
    });

  } catch (error) {
    console.error('Sell stock error:', error);
    res.status(500).json({ message: 'Error selling stock', error: error.message });
  }
});

// Get all transactions
router.get('/transactions', async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id });

    // Collect all transactions from all holdings
    const allTransactions = [];
    portfolio.forEach(holding => {
      if (holding.transactions && holding.transactions.length > 0) {
        holding.transactions.forEach(transaction => {
          allTransactions.push({
            symbol: holding.symbol,
            type: transaction.type,
            shares: transaction.shares,
            price: transaction.price,
            createdAt: transaction.timestamp || transaction.createdAt,
            _id: transaction._id
          });
        });
      }
    });

    // Sort by date, most recent first
    allTransactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(allTransactions);
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

// Get portfolio performance history
router.get('/history', async (req, res) => {
  try {
    const portfolio = await Portfolio.find({ user: req.user._id });
    const user = await User.findById(req.user._id);

    // Collect all transactions with timestamps
    const allTransactions = [];
    portfolio.forEach(holding => {
      if (holding.transactions && holding.transactions.length > 0) {
        holding.transactions.forEach(transaction => {
          allTransactions.push({
            symbol: holding.symbol,
            type: transaction.type,
            shares: transaction.shares,
            price: transaction.price,
            date: transaction.timestamp || transaction.createdAt,
            totalCost: transaction.shares * transaction.price
          });
        });
      }
    });

    // Sort transactions by date
    allTransactions.sort((a, b) => new Date(a.date) - new Date(b.date));

    if (allTransactions.length === 0) {
      // No transactions yet, return current balance only
      return res.json([{
        date: new Date().toISOString(),
        value: user.virtualBalance
      }]);
    }

    // Get the first transaction date
    const firstTransactionDate = new Date(allTransactions[0].date);
    const now = new Date();
    const daysSinceFirst = Math.ceil((now - firstTransactionDate) / (1000 * 60 * 60 * 24));

    // Determine appropriate interval based on history length
    let interval, dataPoints;
    if (daysSinceFirst <= 7) {
      interval = 1; // Daily for 1 week or less
      dataPoints = Math.max(daysSinceFirst, 7);
    } else if (daysSinceFirst <= 30) {
      interval = 1; // Daily for 1 month or less
      dataPoints = 30;
    } else if (daysSinceFirst <= 90) {
      interval = 2; // Every 2 days for 3 months
      dataPoints = 45;
    } else {
      interval = Math.ceil(daysSinceFirst / 60); // Scale to ~60 points
      dataPoints = 60;
    }

    // Calculate portfolio value at each interval
    const historyData = [];
    const holdings = {}; // Track shares owned at each point
    let transactionIndex = 0;

    for (let i = 0; i < dataPoints; i++) {
      const targetDate = new Date(firstTransactionDate.getTime() + (i * interval * 24 * 60 * 60 * 1000));

      // Process all transactions up to this date
      while (transactionIndex < allTransactions.length &&
        new Date(allTransactions[transactionIndex].date) <= targetDate) {
        const tx = allTransactions[transactionIndex];

        if (!holdings[tx.symbol]) {
          holdings[tx.symbol] = 0;
        }

        if (tx.type === 'buy') {
          holdings[tx.symbol] += tx.shares;
        } else if (tx.type === 'sell') {
          holdings[tx.symbol] -= tx.shares;
        }

        transactionIndex++;
      }

      // Calculate total portfolio value at this point
      let totalValue = 0;

      // Get current prices for all holdings
      for (const symbol in holdings) {
        if (holdings[symbol] > 0) {
          try {
            const quote = await stockService.getQuote(symbol);
            totalValue += holdings[symbol] * quote.price;
          } catch (error) {
            // If we can't get current price, skip this holding
            console.error(`Error getting price for ${symbol}:`, error.message);
          }
        }
      }

      historyData.push({
        date: targetDate.toISOString(),
        value: totalValue
      });
    }

    // Add current value as the last point
    const currentValue = await calculateCurrentPortfolioValue(portfolio);
    historyData.push({
      date: now.toISOString(),
      value: currentValue
    });

    res.json(historyData);
  } catch (error) {
    console.error('Get portfolio history error:', error);
    res.status(500).json({ message: 'Error fetching portfolio history' });
  }
});

// Helper function to calculate current portfolio value
async function calculateCurrentPortfolioValue(portfolio) {
  let totalValue = 0;

  for (const holding of portfolio) {
    try {
      const quote = await stockService.getQuote(holding.symbol);
      totalValue += holding.shares * quote.price;
    } catch (error) {
      // Use average price if current price unavailable
      totalValue += holding.shares * holding.averagePrice;
    }
  }

  return totalValue;
}

// Reset portfolio
router.post('/reset', async (req, res) => {
  try {
    // Delete all portfolio entries for the user
    await Portfolio.deleteMany({ user: req.user._id });

    // Reset user balance to 10000
    const user = await User.findById(req.user._id);
    user.virtualBalance = 10000;
    await user.save();

    res.json({
      message: 'Portfolio reset successfully',
      balance: user.virtualBalance
    });
  } catch (error) {
    console.error('Reset portfolio error:', error);
    res.status(500).json({ message: 'Error resetting portfolio' });
  }
});

module.exports = router;
