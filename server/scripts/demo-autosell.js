const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Portfolio = require('../models/Portfolio');
const User = require('../models/User');
const priceMonitorService = require('../services/priceMonitorService');
const stockService = require('../services/stockService');

// Load environment variables
dotenv.config({ path: __dirname + '/../.env' });

async function verifyAutoSell() {
    console.log('\n🔵 STARTING AUTO-SELL DEMONSTRATION 🔵\n');

    try {
        // 1. Connect to Database
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 2. Create Test User
        const testUser = new User({
            username: 'demo_user_' + Date.now(),
            email: `demo_autosell_${Date.now()}@example.com`,
            password: 'password123',
            virtualBalance: 1000
        });
        await testUser.save();
        console.log(`✅ Created Test User: ${testUser.username} (Balance: $1000)`);

        // 3. Create Test Portfolio with Stop Loss
        // Buy 1 share of DEMO_STOCK at $100. Stop Loss at $95.
        const symbol = 'DEMO_STOCK';
        const shares = 1;
        const buyPrice = 100;
        const stopLoss = 95;

        const portfolio = new Portfolio({
            user: testUser._id,
            symbol: symbol,
            shares: shares,
            averagePrice: buyPrice,
            totalInvested: buyPrice * shares,
            stopLoss: stopLoss,
            autoSellEnabled: true
        });
        await portfolio.save();
        console.log(`\n📦 User Buys Stock:
    - Symbol: ${symbol}
    - Shares: ${shares}
    - Buy Price: $${buyPrice}
    - STOP LOSS SET AT: $${stopLoss} 🛑`);

        // 4. Mock Stock Price to Trigger Stop Loss
        // Price drops to $90 (below $95)
        const currentPrice = 90;

        // Override getQuote to return our mocked price
        const originalGetQuote = stockService.getQuote;
        stockService.getQuote = async (sym) => {
            if (sym === symbol) {
                return { price: currentPrice };
            }
            return originalGetQuote(sym);
        };

        console.log(`\n📉 MARKET UPDATE: ${symbol} price drops to $${currentPrice}!`);
        console.log(`   (This is below the Stop Loss of $${stopLoss})`);

        // 5. Run Price Monitor Check
        console.log('\n🔍 Services Running: Price Monitor checking prices...');
        await priceMonitorService.checkPrices();

        // 6. Verify Results
        const updatedPortfolio = await Portfolio.findOne({ user: testUser._id, symbol: symbol });
        const updatedUser = await User.findById(testUser._id);

        console.log('\n📋 --- RESULTS ---');

        // Check if portfolio is sold
        if (!updatedPortfolio || updatedPortfolio.shares === 0) {
            console.log('✅ SUCCESS: Stock was AUTOMATICALLY SOLD.');
        } else {
            console.error('❌ FAILURE: Stock was NOT sold.');
        }

        // Check Balance Update
        // Start: 1000. 
        // We manually created portfolio without deducting balance (simulating pre-existing).
        // Sell: 1 * 90 = +90.
        // End Balance: 1090.
        console.log(`💰 User Balance: $${updatedUser.virtualBalance} (Started with $1000, +$90 from sell)`);

        // 7. Cleanup
        await User.findByIdAndDelete(testUser._id);
        if (updatedPortfolio) await Portfolio.findByIdAndDelete(updatedPortfolio._id);
        console.log('\n🧹 Cleanup complete.');

    } catch (error) {
        console.error('Verification Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Run verification
verifyAutoSell();
