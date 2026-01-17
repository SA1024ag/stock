const axios = require('axios');

// Using Alpha Vantage API (free tier available)
// Alternative: Yahoo Finance API or Polygon.io
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

// Timeframe configuration (aligned with standard TradingView timeframes)
const TIMEFRAME_CONFIG = {
  '1D': { days: 1, resolution: '5min', apiFunction: 'TIME_SERIES_INTRADAY', interval: '5min' },
  '1W': { days: 7, resolution: '30min', apiFunction: 'TIME_SERIES_INTRADAY', interval: '30min' },
  '1M': { days: 30, resolution: 'daily', apiFunction: 'TIME_SERIES_DAILY' },
  '1Y': { days: 365, resolution: 'daily', apiFunction: 'TIME_SERIES_DAILY' }
};

// In-memory mock database to ensure consistency
const mockDatabase = {};

class StockService {
  // Get real-time stock quote
  async getQuote(symbol) {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });

      if (response.data['Error Message'] || response.data['Note']) {
        throw new Error('API limit reached or invalid symbol');
      }

      const quote = response.data['Global Quote'];
      if (!quote || !quote['05. price']) {
        throw new Error('Stock data not available');
      }

      return {
        symbol: quote['01. symbol'],
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open']),
        previousClose: parseFloat(quote['08. previous close'])
      };
    } catch (error) {
      console.error('Error fetching stock quote:', error.message);
      // Fallback: Return mock data for development
      if (process.env.NODE_ENV !== 'production') {
        return this.getMockQuote(symbol);
      }
      throw error;
    }
  }

  // Search for stocks
  async searchStocks(keywords) {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'SYMBOL_SEARCH',
          keywords: keywords,
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });

      if (response.data['Error Message'] || response.data['Note']) {
        throw new Error('API limit reached');
      }

      const matches = response.data.bestMatches || [];
      return matches.map(match => ({
        symbol: match['1. symbol'],
        name: match['2. name'],
        type: match['3. type'],
        region: match['4. region']
      }));
    } catch (error) {
      console.error('Error searching stocks:', error.message);
      // Fallback: Return mock data for development
      if (process.env.NODE_ENV !== 'production') {
        return this.getMockSearchResults(keywords);
      }
      throw error;
    }
  }

  // Get historical data with timeframe support
  async getHistoricalData(symbol, timeframe = '1M') {
    const config = TIMEFRAME_CONFIG[timeframe];
    if (!config) {
      throw new Error(`Invalid timeframe: ${timeframe}`);
    }

    try {
      // For intraday data (1D, 1W)
      if (config.apiFunction === 'TIME_SERIES_INTRADAY') {
        return await this.getIntradayData(symbol, config);
      }

      // For daily data (1M, 3M, 1Y)
      return await this.getDailyData(symbol, config);
    } catch (error) {
      console.error('Error fetching historical data:', error.message);

      // Fallback to mock data
      if (process.env.NODE_ENV !== 'production') {
        // Ensure we have a base price in the database or fetch it/create it
        let currentPrice;
        if (mockDatabase[symbol]) {
          currentPrice = mockDatabase[symbol].price;
        } else {
          // If not in DB, try to get a quote first to initialize it
          const quote = await this.getQuote(symbol); // This will handle mock initialization
          currentPrice = quote.price;
        }
        return this.getMockHistoricalData(symbol, config.days, config.resolution, currentPrice);
      }
      throw error;
    }
  }

  async getIntradayData(symbol, config) {
    const response = await axios.get(BASE_URL, {
      params: {
        function: config.apiFunction,
        symbol: symbol.toUpperCase(),
        interval: config.interval,
        apikey: ALPHA_VANTAGE_API_KEY,
        outputsize: 'full'
      }
    });

    if (response.data['Error Message'] || response.data['Note']) {
      throw new Error('API limit reached or invalid symbol');
    }

    const timeSeriesKey = `Time Series (${config.interval})`;
    const timeSeries = response.data[timeSeriesKey];

    if (!timeSeries) {
      throw new Error('Intraday data not available');
    }

    // Filter to requested timeframe
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.days);

    return Object.keys(timeSeries)
      .filter(datetime => new Date(datetime) >= cutoffDate)
      .map(datetime => ({
        date: datetime,
        open: parseFloat(timeSeries[datetime]['1. open']),
        high: parseFloat(timeSeries[datetime]['2. high']),
        low: parseFloat(timeSeries[datetime]['3. low']),
        close: parseFloat(timeSeries[datetime]['4. close']),
        volume: parseInt(timeSeries[datetime]['5. volume'])
      }))
      .reverse();
  }

  async getDailyData(symbol, config) {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: symbol.toUpperCase(),
        apikey: ALPHA_VANTAGE_API_KEY,
        outputsize: config.days > 100 ? 'full' : 'compact'
      }
    });

    if (response.data['Error Message'] || response.data['Note']) {
      throw new Error('API limit reached or invalid symbol');
    }

    const timeSeries = response.data['Time Series (Daily)'];
    if (!timeSeries) {
      throw new Error('Historical data not available');
    }

    // Filter to requested timeframe
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.days);

    return Object.keys(timeSeries)
      .filter(date => new Date(date) >= cutoffDate)
      .map(date => ({
        date,
        open: parseFloat(timeSeries[date]['1. open']),
        high: parseFloat(timeSeries[date]['2. high']),
        low: parseFloat(timeSeries[date]['3. low']),
        close: parseFloat(timeSeries[date]['4. close']),
        volume: parseInt(timeSeries[date]['5. volume'])
      }))
      .reverse();
  }

  // Enhanced mock data generator with resolution support
  getMockHistoricalData(symbol, days, resolution, currentPrice) {
    const data = [];
    const now = new Date();

    // Use the current price as the anchor point (end of the graph)
    // If no current price is provided, generate a random one
    let closePrice = currentPrice || (100 + Math.random() * 200);

    // Calculate interval based on resolution
    let intervalMs;
    let pointsPerDay;
    let volatility; // Price volatility based on timeframe

    switch (resolution) {
      case '5min':
        intervalMs = 5 * 60 * 1000;
        pointsPerDay = (24 * 60) / 5; // 288 points per day
        volatility = 0.3; // Lower volatility for shorter timeframes
        break;
      case '30min':
        intervalMs = 30 * 60 * 1000;
        pointsPerDay = (24 * 60) / 30; // 48 points per day
        volatility = 0.5;
        break;
      case 'daily':
      default:
        intervalMs = 24 * 60 * 60 * 1000;
        pointsPerDay = 1;
        volatility = 2; // Higher volatility for daily data
    }

    // Generate data points BACKWARDS from now
    const totalPoints = resolution === 'daily' ? days : Math.floor(days * pointsPerDay);

    for (let i = 0; i < totalPoints; i++) {
      const timestamp = new Date(now.getTime() - (i * intervalMs));

      // Skip weekends for daily data
      if (resolution === 'daily' && (timestamp.getDay() === 0 || timestamp.getDay() === 6)) {
        continue;
      }

      // We are walking backwards, so:
      // current loop 'closePrice' is essentially the 'close' of this candle.
      // We need to generate the 'open', 'high', 'low' relative to this close, 
      // AND determine the 'close' of the PREVIOUS candle (which is the 'open' of this one approx).

      // Let's generate the candle properties for the current point (i)

      const change = (Math.random() - 0.5) * volatility * 2;
      const openPrice = closePrice - change; // Reverse the change to find open

      // High and low relative to max/min of open/close
      const maxBody = Math.max(openPrice, closePrice);
      const minBody = Math.min(openPrice, closePrice);

      const highPrice = maxBody + Math.random() * volatility;
      const lowPrice = minBody - Math.random() * volatility;

      data.push({
        date: resolution === 'daily'
          ? timestamp.toISOString().split('T')[0]
          : timestamp.toISOString().replace('T', ' ').substring(0, 19),
        open: parseFloat(openPrice.toFixed(2)),
        high: parseFloat(highPrice.toFixed(2)),
        low: parseFloat(lowPrice.toFixed(2)),
        close: parseFloat(closePrice.toFixed(2)),
        volume: Math.floor(Math.random() * 10000000)
      });

      // Set the close price for the NEXT iteration (which is the previous candle in time)
      // Ideally, the previous candle's close should be close to this candle's open.
      // We add a small random gap/noise for realism
      closePrice = openPrice + (Math.random() - 0.5) * (volatility * 0.2);
    }

    return data.reverse(); // Reverse back to chronological order
  }

  // Mock data for development/testing
  getMockQuote(symbol) {
    // Check if we already have this stock in memory
    if (mockDatabase[symbol]) {
      // Update price slightly to simulate real-time movement
      const currentData = mockDatabase[symbol];
      const change = (Math.random() - 0.5) * 0.5; // Small random movement
      let newPrice = currentData.price + change;
      newPrice = Math.max(newPrice, 1.00); // Minimum price

      // Update database
      mockDatabase[symbol] = {
        ...currentData,
        price: parseFloat(newPrice.toFixed(2)),
        change: parseFloat((newPrice - currentData.previousClose).toFixed(2)),
        changePercent: parseFloat(((newPrice - currentData.previousClose) / currentData.previousClose * 100).toFixed(2))
      };

      return mockDatabase[symbol];
    }

    // Initialize new stock in mock database
    const basePrice = 100 + Math.random() * 200;
    const change = (Math.random() - 0.5) * 10;
    const stockData = {
      symbol: symbol.toUpperCase(),
      price: parseFloat(basePrice.toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(((change / basePrice) * 100).toFixed(2)),
      volume: Math.floor(Math.random() * 10000000),
      high: parseFloat((basePrice + Math.random() * 5).toFixed(2)),
      low: parseFloat((basePrice - Math.random() * 5).toFixed(2)),
      open: parseFloat((basePrice + (Math.random() - 0.5) * 3).toFixed(2)),
      previousClose: parseFloat((basePrice - change).toFixed(2))
    };

    mockDatabase[symbol] = stockData;
    return stockData;
  }

  getMockSearchResults(keywords) {
    const mockStocks = [
      { symbol: 'AAPL', name: 'Apple Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'Equity', region: 'United States' },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'TSLA', name: 'Tesla Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'META', name: 'Meta Platforms Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'Equity', region: 'United States' },
      { symbol: 'NFLX', name: 'Netflix Inc.', type: 'Equity', region: 'United States' },
      { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'Equity', region: 'United States' },
      { symbol: 'DIS', name: 'The Walt Disney Company', type: 'Equity', region: 'United States' }
    ];

    // In dev, we return this small list if API fails, but the main goal is to use the real API
    const query = keywords.toLowerCase();
    return mockStocks.filter(stock =>
      stock.symbol.toLowerCase().includes(query) ||
      stock.name.toLowerCase().includes(query)
    );
  }
}

module.exports = new StockService();
