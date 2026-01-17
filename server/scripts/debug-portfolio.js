const mongoose = require('mongoose');
const Portfolio = require('../models/Portfolio');
require('dotenv').config({ path: __dirname + '/../.env' });

async function checkPortfolio() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB');

        const portfolios = await Portfolio.find({});
        console.log(`Found ${portfolios.length} holdings.`);

        portfolios.forEach(p => {
            console.log(`\nSymbol: ${p.symbol}`);
            console.log(`User: ${p.user}`);
            console.log(`Shares: ${p.shares}`);
            console.log(`StopLoss: ${p.stopLoss}`);
            console.log(`TakeProfit: ${p.takeProfit}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkPortfolio();
