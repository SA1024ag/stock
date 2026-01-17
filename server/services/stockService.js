const axios = require('axios');
const upstoxAuthService = require('./upstoxAuthService');
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');

// Upstox API Base URL V3
const BASE_URL_V3 = 'https://api.upstox.com/v3';

// Search results suggest .gz is the standard
const MASTER_LIST_URLS = [
  'https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz',
  'https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz'
];

// In-memory Instrument Database
let instrumentList = [];

class StockService {
  constructor() {
    // Download master list on startup
    this.downloadMasterList();
  }

  get instrumentList() {
    return instrumentList;
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
  // --- 1. Master List Management ---

  async downloadMasterList() {
    console.log('Downloading Upstox Instrument Master Lists...');
    instrumentList = []; // Reset
    let errors = [];

    for (const url of MASTER_LIST_URLS) {
      try {
        const response = await axios.get(url, {
          responseType: 'arraybuffer' // Important for binary GZ
        });

        const buffer = response.data;
        // Decompress
        const decompressed = zlib.gunzipSync(buffer);
        const jsonString = decompressed.toString('utf-8');
        const data = JSON.parse(jsonString);

        if (Array.isArray(data)) {
          console.log(`Sample item:`, data[0]);
          const filtered = data.filter(item =>
          ((item.exchange === 'NSE' || item.exchange === 'BSE') &&
            (item.instrument_type === 'EQ' || item.instrument_type === 'INDEX'))
          );

          // Normalize items for unified structure
          const normalized = filtered.map(item => ({
            ...item,
            name: item.name || item.short_name || item.trading_symbol // Fallback for name
          }));

          instrumentList.push(...normalized);
          console.log(`Loaded ${filtered.length} instruments from ${url}`);
        } else {
          errors.push({ url, error: 'Not an array', type: typeof data });
        }
      } catch (error) {
        console.error(`Failed to download master list from ${url}:`, error.message);
        errors.push({ url, error: error.message });
      }
    }
    console.log(`Total Instruments Loaded: ${instrumentList.length}`);
    return { count: instrumentList.length, errors, debug: 'Enhanced Debug' };
  }

  // Helper to get headers with Access Token
  async getHeaders() {
    const token = await upstoxAuthService.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    };
  }

  // --- 2. Search (Local In-Memory) ---

  async searchStocks(keywords) {
    if (!keywords || instrumentList.length === 0) return [];

    const query = keywords.toUpperCase();

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
    // Simple filter
    // Prioritize startsWith, then includes
    const results = instrumentList.filter(item => {
      // Safe check for properties
      const symbol = item.trading_symbol || '';
      const name = item.name || '';
      return symbol.includes(query) || name.toUpperCase().includes(query);
    });

    // Sort: Exact match -> Starts with -> Others
    results.sort((a, b) => {
      const aSym = a.trading_symbol || '';
      const bSym = b.trading_symbol || '';
      if (aSym === query) return -1;
      if (bSym === query) return 1;
      if (aSym.startsWith(query) && !bSym.startsWith(query)) return -1;
      if (bSym.startsWith(query) && !aSym.startsWith(query)) return 1;
      return 0;
    });

    // Limit to 20
    return results.slice(0, 20).map(item => ({
      symbol: item.trading_symbol,
      name: item.name,
      exchange: item.exchange, // 'NSE' or 'BSE'
      instrument_key: item.instrument_key,
      type: item.instrument_type
    }));
  }

  // Helper: Get Instrument Key perfectly
  getInstrumentKeySync(symbol) {
    if (symbol.includes('|')) return symbol;
    const upper = symbol.toUpperCase();
    const match = instrumentList.find(i => i.trading_symbol === upper && i.exchange === 'NSE');
    return match ? match.instrument_key : null;
  }

  // --- 3. Market Quotes (V3) ---

  async getQuote(symbol) {
    try {
      let instrumentKey = this.getInstrumentKeySync(symbol);
      if (!instrumentKey) {
        instrumentKey = `NSE_EQ|${symbol.toUpperCase()}`;
        const search = await this.searchStocks(symbol);
        if (search.length > 0) instrumentKey = search[0].instrument_key;
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
      const headers = await this.getHeaders();

      // Parallel call to LTP and OHLC to build a "Full Quote"
      // V3 LTP: /market-quote/ltp
      // V3 OHLC: /market-quote/ohlc

      try {
        // Promise.allSettled ...
        const results = await Promise.allSettled([
          axios.get(`${BASE_URL_V3}/market-quote/ltp`, { headers, params: { instrument_key: instrumentKey } }),
          axios.get(`${BASE_URL_V3}/market-quote/ohlc`, { headers, params: { instrument_key: instrumentKey, interval: '1d' } })
        ]);

        const ltpRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const ohlcRes = results[1].status === 'fulfilled' ? results[1].value : null;

        // CRITICAL FIX: Upstox API response might use "NSE_EQ:SYMBOL" format as key 
        // even if we requested with "NSE_EQ|INE..." key.
        // We need to try multiple keys or iterate.

        const findData = (response, key, symbol) => {
          if (!response?.data?.data) return null;
          const data = response.data.data;

          // 1. Try exact instrument key
          if (data[key]) return data[key];

          // 2. Try Exchange:Symbol format (e.g. NSE_EQ:RELIANCE)
          // We need to derive this.
          // We can infer exchange and symbol from instrumentList if available, or guess.
          // But simpler: just find the first key in data object if we requested only one!
          if (Object.keys(data).length > 0) {
            return Object.values(data)[0];
          }
          return null;
        };

        const ltpData = findData(ltpRes, instrumentKey, symbol);
        const ohlcData = findData(ohlcRes, instrumentKey, symbol);

        // DEBUG logging for failures
        if (!ltpData && results[0].status === 'rejected') {
          console.log(`[DEBUG] LTP Failed for ${instrumentKey}:`, results[0].reason?.response?.status);
        }
        if (!ohlcData && results[1].status === 'rejected') {
          console.log(`[DEBUG] OHLC Failed for ${instrumentKey}:`, results[1].reason?.response?.status);
        }

        // fallback checks
        if (!ltpData && !ohlcData) {
          throw new Error(`No data from Upstox V3 for key: ${instrumentKey}`);
        }

        const price = ltpData ? ltpData.last_price : 0;
        const prevClose = ohlcData && ohlcData.previous_close ? ohlcData.previous_close : (ltpData?.last_price || 0);

        // OHLC data often has 'ohlc' object inside
        const ohlc = ohlcData && ohlcData.ohlc ? ohlcData.ohlc : {};

        return {
          symbol: symbol.toUpperCase(),
          price: price,
          change: price - prevClose,
          changePercent: prevClose ? ((price - prevClose) / prevClose * 100) : 0,
          volume: ohlcData ? ohlcData.volume : 0,
          high: ohlc.high || price,
          low: ohlc.low || price,
          open: ohlc.open || price,
          previousClose: prevClose,
          instrument_key: instrumentKey
        };

      } catch (apiError) {
        // Special handling for US Stocks (Legacy Portfolio support)
        // If 404/400 and looks like a US symbol, return mock to avoid crash
        if (!this.getInstrumentKeySync(symbol) && symbol.match(/^[A-Z]{1,5}$/)) {
          console.warn(`Assuming US/Legacy Stock for ${symbol}. Returning Mock.`);
          return this.getMockQuote(symbol);
        }
        throw apiError;
      }

    } catch (error) {
      console.error(`Upstox V3 Quote Error (${symbol}):`, error.response?.data || error.message);
      if (process.env.NODE_ENV === 'development' && !upstoxAuthService.accessToken) {
        return this.getMockQuote(symbol);
      }
      throw error;
    }
  }

  // --- 4. Indices (V3) ---

  async getMarketIndices() {
    // Keys: NSE_INDEX|Nifty 50, BSE_INDEX|SENSEX
    // These formats usually persist in V3.
    const indices = [
      { name: 'NIFTY 50', key: 'NSE_INDEX|Nifty 50' },
      { name: 'SENSEX', key: 'BSE_INDEX|SENSEX' }
    ];

    try {
      const headers = await this.getHeaders();
      const keys = indices.map(i => i.key).join(',');

      const response = await axios.get(`${BASE_URL_V3}/market-quote/quotes`, {
        headers,
        params: { instrument_key: keys }
      });

      const data = response.data.data;
      return indices.map(idx => {
        const d = data[idx.key];
        if (!d) return { name: idx.name, price: 0, change: 0, changePercent: 0 };
        return {
          name: idx.name,
          price: d.last_price,
          change: d.net_change,
          changePercent: d.net_change && d.last_price ? (d.net_change / (d.last_price - d.net_change) * 100) : 0,
          // Or calc from OHLC close if available
          isOpen: true
        };
      });

    } catch (error) {
      console.error('Upstox V3 Indices Error:', error.message);
      // dev mock
      if (process.env.NODE_ENV === 'development') return [
        { name: 'NIFTY 50', price: 22000, change: 100, changePercent: 0.5 },
        { name: 'SENSEX', price: 73000, change: 300, changePercent: 0.4 }
      ];
      return [];
    }
  }

  // --- 5. Historical Data (V3? V2?) ---
  // Assuming V2/Historical-Candle works or finding V3 equivalent.
  // Docs often keep historical separate. Let's try V2 endpoint but with V3 Auth, 
  // OR look for V3 if exists. Most likely it shares the endpoint structure.

  async getHistoricalData(symbol, timeframe = '1M') {
    // Reuse logic but ensure key is correct
    const instrumentKey = this.getInstrumentKeySync(symbol) || `NSE_EQ|${symbol.toUpperCase()}`;

    // ... (Rest of logic similar to previous V2, as Historical often persists)
    // We will assume the V2 path works for now, or check for V3 path.
    // Docs: https://api.upstox.com/v2/historical-candle/... is standard.
    // Let's keep the existing logic but ensure Error logging is verbose.

    // ... (Previous getHistoricalData code here, ensuring headers are set) 
    return this._getHistoricalDataLogic(instrumentKey, timeframe);
  }

  async _getHistoricalDataLogic(instrumentKey, timeframe) {
    try {
      const headers = await this.getHeaders();

      const now = new Date();
      let fromDate = new Date();
      let intervalUnit = 'minute';
      let intervalValue = '1';

      // Mapping Timeframe to V3 Inputs
      switch (timeframe) {
        case '1D':
          fromDate.setDate(now.getDate() - 5);
          intervalUnit = 'minute';
          intervalValue = '1';
          break;
        case '1W':
          fromDate.setDate(now.getDate() - 7);
          intervalUnit = 'minute';
          intervalValue = '30';
          break;
        case '1M':
          fromDate.setMonth(now.getMonth() - 1);
          intervalUnit = 'day';
          intervalValue = '1';  // For 'day', interval usually not needed or is implicit? V3 path has it.
          break;
        case '1Y':
          fromDate.setFullYear(now.getFullYear() - 1);
          intervalUnit = 'day';
          intervalValue = '1';
          break;
        default:
          fromDate.setMonth(now.getMonth() - 1);
          intervalUnit = 'day';
          intervalValue = '1';
      }

      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = now.toISOString().split('T')[0];

      // V3 Historical Endpoint: /historical-candle/{instrumentKey}/{intervalUnit}/{interval}/{to_date}/{from_date}
      // Note: intervalUnit = '1minute' (V2) vs 'minute' (V3)
      // V3 Docs: intervalUnit is 'minute', 'day' etc.
      // But verify: search result says unit can be `minutes`, `days`. Plural?
      // Let's try 'minute' first, or check docs closely. 
      // Search result: "intervalUnit... can be minutes, hours, days..." 
      // Okay, let's use plural 'minutes', 'days'.

      const unitMap = {
        'minute': 'minutes',
        'day': 'days',
        'week': 'weeks',
        'month': 'months'
      };

      const finalUnit = unitMap[intervalUnit] || intervalUnit;

      const url = `${BASE_URL_V3}/historical-candle/${instrumentKey}/${finalUnit}/${intervalValue}/${toDateStr}/${fromDateStr}`;

      const response = await axios.get(url, { headers });

      if (!response.data?.data?.candles) return [];

      return response.data.data.candles.map(c => ({
        date: c[0],
        open: c[1],
        high: c[2],
        low: c[3],
        close: c[4],
        volume: c[5]
      })).reverse();

    } catch (e) {
      console.error('Historical Data Error:', e.response?.data || e.message);
      return [];
    }
  }

  // Wrappers for mock compat
  getMockQuote(symbol) { return { symbol, price: 500, change: 10, changePercent: 2, volume: 5000, high: 510, low: 490, open: 495, previousClose: 490 }; }
  getMockSearchResults(q) { return [{ symbol: 'MOCK', name: 'Mock Stock', exchange: 'NSE', instrument_key: 'NSE_EQ|MOCK' }]; }


}

module.exports = new StockService();
