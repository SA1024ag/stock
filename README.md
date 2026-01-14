# AI-Powered Stock Market Simulator

An AI-powered stock market simulator built with the MERN stack, designed to help users learn and practice investing without using real money. The application provides real-time stock prices, virtual portfolio management, and AI-powered analysis features.

## Features

- 📈 **Real-time Stock Prices**: Get live stock market data via market APIs
- 💼 **Virtual Portfolio Management**: Buy and sell stocks using virtual funds
- 🤖 **AI-Powered Analysis**: 
  - Stock trend analysis
  - Market movement explanations in simple language
  - Portfolio risk and diversification evaluation
- 📊 **Paper Trading**: Practice investing in a risk-free environment
- 🎓 **Educational**: Perfect for beginners learning about stock markets

## Tech Stack

- **Frontend**: React, React Router, Axios
- **Backend**: Node.js, Express
- **Database**: MongoDB with Mongoose
- **AI**: Groq (Llama) for market analysis
- **Stock Data**: Alpha Vantage / Yahoo Finance API

## Project Structure

```
├── server/          # Backend Express server
│   ├── models/      # MongoDB models
│   ├── routes/      # API routes
│   ├── controllers/ # Route controllers
│   ├── middleware/  # Custom middleware
│   ├── services/    # Business logic (AI, stock APIs)
│   └── config/      # Configuration files
├── client/          # React frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
└── package.json
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm run install-all
   ```

3. Set up environment variables:
   - Create `server/.env` with your MongoDB connection string and API keys
   - Create `client/.env` with API endpoint URLs

4. Start the development servers:
   ```bash
   npm run dev
   ```

## Environment Variables

### Server (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stock-simulator
JWT_SECRET=your-secret-key
ALPHA_VANTAGE_API_KEY=your-api-key
GROQ_API_KEY=your-groq-key
GROQ_MODEL=llama3-70b-8192
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

## Usage

1. Register/Login to create an account
2. Start with virtual funds (e.g., $10,000)
3. Browse stocks and view real-time prices
4. Buy and sell stocks to build your portfolio
5. Use AI analysis to understand market trends
6. Monitor your portfolio performance and risk

## API Endpoints

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/stocks/search` - Search stocks
- `GET /api/stocks/:symbol` - Get stock details
- `GET /api/portfolio` - Get user portfolio
- `POST /api/portfolio/buy` - Buy stocks
- `POST /api/portfolio/sell` - Sell stocks
- `POST /api/ai/analyze` - AI stock analysis
- `POST /api/ai/portfolio-review` - AI portfolio evaluation

## License

MIT
