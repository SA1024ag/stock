const express = require('express');
const router = express.Router();
const upstoxAuthService = require('../services/upstoxAuthService');

// GET /api/auth/upstox/login
// Redirects user to Upstox Login Page
router.get('/login', (req, res) => {
    const loginUrl = upstoxAuthService.getLoginUrl();
    console.log('Redirecting to Upstox:', loginUrl);
    res.redirect(loginUrl);
});

// GET /api/auth/upstox/callback
// Handles the redirect from Upstox with the auth code
router.get('/callback', async (req, res) => {
    const { code, error } = req.query;

    if (error) {
        return res.status(400).json({ message: 'Upstox login failed', error });
    }

    if (!code) {
        return res.status(400).json({ message: 'No authorization code received' });
    }

    try {
        const tokenData = await upstoxAuthService.generateToken(code);
        // res.json({ message: 'Upstox Login Successful', tokenData });
        // In a real app, you might redirect to a success page or close the popup
        res.send(`
      <html>
        <body>
          <h1>Login Successful</h1>
          <p>You can close this window now.</p>
          <script>
            window.opener.postMessage({ type: 'UPSTOX_LOGIN_SUCCESS', token: '${tokenData.access_token}' }, '*');
            window.close();
          </script>
        </body>
      </html>
    `);
    } catch (err) {
        console.error('Error in Upstox Callback:', err);
        res.status(500).json({ message: 'Failed to generate token' });
    }
});

module.exports = router;
