const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// Get Watchlist
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user.watchlist);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add to Watchlist
router.post('/add', auth, async (req, res) => {
    try {
        const { symbol, price } = req.body; // Price optional, mostly for initial
        const user = await User.findById(req.user.id);

        if (user.watchlist.some(item => item.symbol === symbol)) {
            return res.status(400).json({ message: 'Stock already in watchlist' });
        }

        user.watchlist.push({ symbol });
        await user.save();
        res.json(user.watchlist);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Remove from Watchlist
router.delete('/remove/:symbol', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        user.watchlist = user.watchlist.filter(item => item.symbol !== req.params.symbol);
        await user.save();
        res.json(user.watchlist);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update alert targets for a stock
router.put('/update/:symbol', auth, async (req, res) => {
    try {
        const { targetLow, targetHigh } = req.body;
        const user = await User.findById(req.user.id);

        const stockIndex = user.watchlist.findIndex(item => item.symbol === req.params.symbol);
        if (stockIndex > -1) {
            // Explicitly handle clearing targets (if value is null/undefined logic from frontend)
            // But usually patching. 
            // If passed as undefined in body, it might not update. 
            // We want to be able to unset.

            if (targetLow !== undefined) user.watchlist[stockIndex].targetLow = targetLow;
            if (targetHigh !== undefined) user.watchlist[stockIndex].targetHigh = targetHigh;

            await user.save();
            res.json(user.watchlist);
        } else {
            res.status(404).json({ message: 'Stock not in watchlist' });
        }
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
