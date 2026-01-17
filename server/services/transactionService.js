
// This file extracts the sell logic from routes/portfolio.js to be shared
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const stockService = require('./stockService');

exports.sellStock = async (userId, symbol, shares, price = null, reason = 'MANUAL') => {
    // If price is not provided, fetch it
    if (!price) {
        const quote = await stockService.getQuote(symbol);
        price = quote.price;
    }

    // Find portfolio entry
    const portfolio = await Portfolio.findOne({
        user: userId,
        symbol: symbol.toUpperCase()
    });

    if (!portfolio || portfolio.shares < shares) {
        throw new Error(`Insufficient shares. You have ${portfolio?.shares || 0} shares of ${symbol.toUpperCase()}`);
    }

    const totalValue = price * shares;

    // Update user balance
    const user = await User.findById(userId);
    user.virtualBalance += totalValue;
    await user.save();

    // Update portfolio
    portfolio.shares -= shares;
    portfolio.totalInvested = portfolio.averagePrice * portfolio.shares;

    // If selling all shares, remove SL/TP
    if (portfolio.shares === 0) {
        portfolio.stopLoss = null;
        portfolio.takeProfit = null;
        portfolio.autoSellEnabled = false;
    }

    // Add transaction
    portfolio.transactions.push({
        type: 'sell',
        shares: shares,
        price: price,
        reason: reason,
        timestamp: new Date()
    });

    let resultPortfolio = null;
    // Remove portfolio entry if no shares left
    if (portfolio.shares === 0) {
        await Portfolio.findByIdAndDelete(portfolio._id);
    } else {
        await portfolio.save();
        resultPortfolio = portfolio;
    }

    return {
        portfolio: resultPortfolio,
        remainingBalance: user.virtualBalance,
        sellPrice: price,
        sharesSold: shares,
        reason: reason
    };
};
