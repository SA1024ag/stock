const axios = require('axios');

// Using Alpha Vantage API (free tier available)
// Alternative: Yahoo Finance API or Polygon.io
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

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
      if (process.env.NODE_ENV === 'development') {
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
      if (process.env.NODE_ENV === 'development') {
        return this.getMockSearchResults(keywords);
      }
      throw error;
    }
  }

  // Get historical data (for charts)
  async getHistoricalData(symbol, interval = 'daily') {
    try {
      const response = await axios.get(BASE_URL, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol: symbol.toUpperCase(),
          apikey: ALPHA_VANTAGE_API_KEY
        }
      });

      if (response.data['Error Message'] || response.data['Note']) {
        throw new Error('API limit reached or invalid symbol');
      }

      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) {
        throw new Error('Historical data not available');
      }

      return Object.keys(timeSeries).map(date => ({
        date,
        open: parseFloat(timeSeries[date]['1. open']),
        high: parseFloat(timeSeries[date]['2. high']),
        low: parseFloat(timeSeries[date]['3. low']),
        close: parseFloat(timeSeries[date]['4. close']),
        volume: parseInt(timeSeries[date]['5. volume'])
      })).reverse();
    } catch (error) {
      console.error('Error fetching historical data:', error.message);
      throw error;
    }
  }

  // Mock data for development/testing
  getMockQuote(symbol) {
    const basePrice = 100 + Math.random() * 200;
    const change = (Math.random() - 0.5) * 10;
    return {
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
