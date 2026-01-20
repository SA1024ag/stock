const cron = require('node-cron');
const User = require('../models/User');
const { sendEmail } = require('./emailService');
const yahooFinance = require('yahoo-finance2').default; // Use same library as stockService

const startAlertMonitor = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        console.log('Running alert monitor...');
        try {
            const users = await User.find({ 'watchlist.0': { $exists: true } });

            for (const user of users) {
                for (const stock of user.watchlist) {
                    if (!stock.targetLow && !stock.targetHigh) continue;

                    try {
                        const quote = await yahooFinance.quote(stock.symbol);
                        const currentPrice = quote.regularMarketPrice;

                        let alertTriggered = false;
                        let alertType = '';

                        if (stock.targetLow && currentPrice <= stock.targetLow) {
                            alertTriggered = true;
                            alertType = 'dropped below';
                        } else if (stock.targetHigh && currentPrice >= stock.targetHigh) {
                            alertTriggered = true;
                            alertType = 'risen above';
                        }

                        if (alertTriggered) {
                            // Check cooldown (e.g., 1 hour)
                            const cooldown = 60 * 60 * 1000;
                            const lastSent = stock.lastAlertSentAt ? new Date(stock.lastAlertSentAt).getTime() : 0;

                            if (Date.now() - lastSent > cooldown) {
                                // Send Email
                                const subject = `Price Alert: ${stock.symbol}`;
                                const html = `
                                    <h3>Price Alert for ${stock.symbol}</h3>
                                    <p>The stock price has <strong>${alertType}</strong> your target.</p>
                                    <p>Current Price: <strong>$${currentPrice}</strong></p>
                                    <p>Target Low: ${stock.targetLow || 'N/A'}</p>
                                    <p>Target High: ${stock.targetHigh || 'N/A'}</p>
                                    <a href="http://localhost:3000/watchlist">Check Watchlist</a>
                                `;

                                await sendEmail(user.email, subject, html);

                                // Update cooldown
                                stock.lastAlertSentAt = new Date();
                                await user.save();
                                console.log(`Alert sent for ${stock.symbol} to ${user.email}`);
                            }
                        }
                    } catch (err) {
                        console.error(`Error checking price for ${stock.symbol}:`, err.message);
                    }
                }
            }
        } catch (err) {
            console.error('Error in alert monitor:', err);
        }
    });
};

module.exports = { startAlertMonitor };
