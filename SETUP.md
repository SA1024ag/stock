# Setup Instructions

Follow these steps to get the AI Stock Market Simulator up and running.

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas account)
- Alpha Vantage API key (free tier available at https://www.alphavantage.co/support/#api-key)
- Groq API key (for Llama AI features, get one from Groq)

## Step 1: Install Dependencies

From the project root directory, run:

```bash
npm run install-all
```

This will install dependencies for both the server and client.

## Step 2: Configure Environment Variables

### Server Configuration

1. Navigate to the `server` directory
2. Create a `.env` file (copy from `.env.example` if it exists)
3. Add the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stock-simulator
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-api-key-here
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama3-70b-8192
NODE_ENV=development
```

**For MongoDB Atlas (cloud):**
- Replace `MONGODB_URI` with your Atlas connection string
- Format: `mongodb+srv://username:password@cluster.mongodb.net/stock-simulator`

**For local MongoDB:**
- Ensure MongoDB is running on your machine
- Default connection: `mongodb://localhost:27017/stock-simulator`

### Client Configuration

1. Navigate to the `client` directory
2. Create a `.env` file
3. Add:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Step 3: Start MongoDB

### Local MongoDB:
```bash
# On Windows
mongod

# On macOS/Linux
sudo systemctl start mongod
# or
brew services start mongodb-community
```

### MongoDB Atlas:
- No local setup needed, just use your connection string

## Step 4: Run the Application

From the project root directory:

```bash
npm run dev
```

This will start both the backend server (port 5000) and frontend React app (port 3000).

Alternatively, run them separately:

**Terminal 1 (Backend):**
```bash
npm run server
```

**Terminal 2 (Frontend):**
```bash
npm run client
```

## Step 5: Access the Application

Open your browser and navigate to:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## First Steps

1. Register a new account
2. You'll start with $10,000 in virtual funds
3. Search for stocks (try "AAPL" or "Apple")
4. Buy some stocks to build your portfolio
5. Use the AI analysis features to learn about stocks

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running
- Check your connection string in `.env`
- Verify network access if using Atlas

### API Key Issues
- Alpha Vantage: Free tier has rate limits (5 API calls per minute)
- Groq: Ensure your API key is valid
- The app includes fallback mock data for development

### Port Already in Use
- Change `PORT` in server `.env` if 5000 is taken
- React will automatically use the next available port

### CORS Errors
- Ensure the frontend `.env` has the correct `REACT_APP_API_URL`
- Check that the backend server is running

## Development Notes

- Stock prices refresh every 30 seconds on the stock detail page
- The app uses mock data when API keys are not configured (development mode)
- All trading is virtual - no real money is involved
- Portfolio data persists in MongoDB

## Production Deployment

1. Set `NODE_ENV=production` in server `.env`
2. Build the React app: `npm run build`
3. Serve the `client/build` folder with a static file server
4. Use environment variables for all sensitive data
5. Configure proper CORS settings for your domain
6. Use a production MongoDB instance
