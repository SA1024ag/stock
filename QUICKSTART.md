# Quick Start Guide

Get up and running in 5 minutes!

## 1. Install Dependencies

```bash
npm run install-all
```

## 2. Set Up Environment Variables

### Server (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stock-simulator
JWT_SECRET=change-this-to-a-random-string
ALPHA_VANTAGE_API_KEY=your-key-here
GROQ_API_KEY=your-key-here
GROQ_MODEL=llama3-70b-8192
NODE_ENV=development
```

**Get API Keys:**
- Alpha Vantage: https://www.alphavantage.co/support/#api-key (Free)
- Groq: https://console.groq.com/keys

**Note:** The app works with mock data if API keys are not provided (development mode only).

### Client (`client/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

## 3. Start MongoDB

**Local:**
```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

**Or use MongoDB Atlas (cloud):**
- Sign up at https://www.mongodb.com/cloud/atlas
- Get connection string and update `MONGODB_URI` in `server/.env`

## 4. Run the App

```bash
npm run dev
```

This starts:
- Backend server on http://localhost:5000
- Frontend app on http://localhost:3000

## 5. Create Your Account

1. Open http://localhost:3000
2. Click "Register"
3. Create an account (you'll start with $10,000 virtual money)
4. Start trading!

## Features to Try

✅ **Search Stocks**: Click "Search Stocks" and try searching for "AAPL" or "Apple"
✅ **Buy Stocks**: View a stock and click "Buy" to add it to your portfolio
✅ **View Portfolio**: See all your holdings and performance
✅ **AI Analysis**: Click "Get AI Portfolio Review" for insights
✅ **Stock Analysis**: View any stock to see AI-powered explanations

## Troubleshooting

**"Cannot connect to MongoDB"**
- Make sure MongoDB is running
- Check your `MONGODB_URI` in `server/.env`

**"API limit reached"**
- Alpha Vantage free tier: 5 calls/minute
- Wait a minute or upgrade your API plan

**"Groq API error"**
- Check your API key is valid
- The app will use fallback analysis if Groq is unavailable

**Port already in use**
- Change `PORT` in `server/.env` to a different port
- Update `REACT_APP_API_URL` in `client/.env` accordingly

## Next Steps

- Read `SETUP.md` for detailed setup instructions
- Check `README.md` for full documentation
- Explore the codebase to understand the architecture

Happy trading! 📈
