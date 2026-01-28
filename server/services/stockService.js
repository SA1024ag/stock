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
  { url: 'https://assets.upstox.com/market-quote/instruments/exchange/NSE.json.gz', exchange: 'NSE' },
  { url: 'https://assets.upstox.com/market-quote/instruments/exchange/BSE.json.gz', exchange: 'BSE' }
];

// In-memory Instrument Database
let instrumentList = [];

class StockService {
  constructor() {
    // Download master list on startup
    this.initPromise = this.downloadMasterList();
  }

  async ensureInitialized() {
    if (this.initPromise) await this.initPromise;
  }

  get instrumentList() {
    return instrumentList;
  }

  // --- 1. Master List Management ---

  async downloadMasterList() {
    console.log('Downloading Upstox Instrument Master Lists...');
    instrumentList = []; // Reset
    let errors = [];

    for (const source of MASTER_LIST_URLS) {
      try {
        const response = await axios.get(source.url, {
          responseType: 'arraybuffer' // Important for binary GZ
        });

        const buffer = response.data;
        // Decompress
        const decompressed = zlib.gunzipSync(buffer);
        const jsonString = decompressed.toString('utf-8');
        const data = JSON.parse(jsonString);

        if (Array.isArray(data)) {
          // console.log(`Sample item from ${source.exchange}:`, data[0]);
          const filtered = data.filter(item =>
            // Filter for Equities and Indices
            (item.instrument_type === 'EQ' || item.instrument_type === 'INDEX')
          );

          // Normalize items for unified structure and INJECT exchange
          const normalized = filtered.map(item => ({
            ...item,
            exchange: source.exchange, // Explicitly set based on source
            name: item.name || item.short_name || item.trading_symbol // Fallback for name
          }));

          instrumentList.push(...normalized);
          console.log(`✅ Loaded ${filtered.length} instruments from ${source.exchange}`);
        } else {
          errors.push({ url: source.url, error: 'Not an array', type: typeof data });
        }
      } catch (error) {
        console.error(`Failed to download master list from ${source.url}:`, error.message);
        errors.push({ url: source.url, error: error.message });
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
    if (!this.initPromise) this.initPromise = this.downloadMasterList();
    await this.initPromise;

    if (!keywords || instrumentList.length === 0) return [];

    const query = keywords.toUpperCase();

    // Simple filter: Prioritize startsWith, then includes
    const results = instrumentList.filter(item => {
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

    // Limit to 20 results
    return results.slice(0, 20).map(item => ({
      symbol: item.trading_symbol,
      name: item.name,
      exchange: item.exchange,
      instrument_key: item.instrument_key,
      type: item.instrument_type
    }));
  }

  // Helper: Get Instrument Key perfectly
  getInstrumentKeySync(symbol) {
    if (!symbol) return null;
    if (symbol.includes('|')) return symbol;
    const upper = symbol.toUpperCase();
    const match = instrumentList.find(i => i.trading_symbol === upper && i.exchange === 'NSE');
    return match ? match.instrument_key : null;
  }

  // --- 3. Market Quotes (Smart Fallback Logic) ---

  async getQuote(symbol) {
    // STRATEGY: 
    // 1. Try Upstox (Official API)
    // 2. If 401 (Auth Error), trigger refresh and switch to Yahoo
    // 3. If other error, switch to Yahoo
    
    let useUpstox = false;
    try {
        // Check if we have a token (don't force refresh yet, just check availability)
        // We use the internal property or a lightweight check if available, 
        // but calling getAccessToken() handles DB loading lazily which is good.
        await upstoxAuthService.getAccessToken(); 
        useUpstox = true;
    } catch (e) {
        // No token available, proceed directly to Yahoo
        useUpstox = false;
    }

    if (useUpstox) {
      try {
        return await this.getQuoteFromUpstox(symbol);
      } catch (error) {
        const status = error.response?.status;
        console.warn(`⚠️ Upstox quote failed for ${symbol} (Status: ${status}).`);
        
        // If Unauthorized, try to refresh token for NEXT time
        if (status === 401) {
            console.log("🔄 Triggering auto-refresh of Upstox token...");
            upstoxAuthService.refreshAccessToken().catch(e => console.error("Auto-refresh failed:", e.message));
        }
        // Proceed to Yahoo Fallback
      }
    }

    // Fallback to Yahoo Finance
    // console.log(`🌐 using Yahoo Finance fallback for ${symbol}`);
    const yahooFinanceService = require('./yahooFinanceService');
    return await yahooFinanceService.getQuote(symbol);
  }

  // Original Upstox implementation
  async getQuoteFromUpstox(symbol) {
    try {
      let instrumentKey = this.getInstrumentKeySync(symbol);
      if (!instrumentKey) {
        // Wait for init if not found immediately
        await this.ensureInitialized();
        instrumentKey = this.getInstrumentKeySync(symbol);
      }

      // If still not found in master list, try dynamic search or construct default
      if (!instrumentKey) {
        const search = await this.searchStocks(symbol);
        if (search.length > 0) {
            instrumentKey = search[0].instrument_key;
        } else {
             // Blind guess for NSE Equity
            instrumentKey = `NSE_EQ|${symbol.toUpperCase()}`;
        }
      }

      const headers = await this.getHeaders();
      
      // Parallel fetch: LTP and OHLC
      const results = await Promise.allSettled([
        axios.get(`${BASE_URL_V3}/market-quote/ltp`, { headers, params: { instrument_key: instrumentKey } }),
        axios.get(`${BASE_URL_V3}/market-quote/ohlc`, { headers, params: { instrument_key: instrumentKey, interval: '1d' } })
      ]);

      const ltpRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const ohlcRes = results[1].status === 'fulfilled' ? results[1].value : null;

      const findData = (response, key) => {
        if (!response?.data?.data) return null;
        const data = response.data.data;
        // The API might return key like "NSE_EQ|RELIANCE" or "NSE_EQ:RELIANCE"
        if (data[key]) return data[key];
        // Return first key if exact match missing
        if (Object.keys(data).length > 0) return Object.values(data)[0];
        return null;
      };

      const ltpData = findData(ltpRes, instrumentKey);
      const ohlcData = findData(ohlcRes, instrumentKey);

      if (!ltpData && !ohlcData) {
        throw new Error(`No data from Upstox V3 for key: ${instrumentKey}`);
      }

      const price = ltpData ? ltpData.last_price : 0;
      const prevClose = ohlcData && ohlcData.previous_close ? ohlcData.previous_close : (ltpData?.last_price || 0);
      const ohlc = ohlcData ? (ohlcData.ohlc || ohlcData.live_ohlc || {}) : {};

      return {
        symbol: symbol.toUpperCase(),
        price: price,
        change: price - prevClose,
        changePercent: prevClose ? ((price - prevClose) / prevClose * 100) : 0,
        volume: ohlc.volume || (ohlcData ? ohlcData.volume : 0),
        high: ohlc.high || price,
        low: ohlc.low || price,
        open: ohlc.open || price,
        previousClose: prevClose,
        instrument_key: instrumentKey,
        source: 'upstox'
      };

    } catch (error) {
      // Re-throw so getQuote can catch and fallback
      throw error; 
    }
  }

  // --- 4. Indices & Movers (V3) ---

  async getMarketIndices() {
    // 1. Try Alpha Vantage first (if configured)
    try {
      const alphaVantageService = require('./alphaVantageService');
      const indices = await alphaVantageService.getIndices();
      // Basic validation
      if (indices && indices.length > 0 && indices.some(i => i.price > 0)) {
        return indices;
      }
    } catch (error) {
      // console.warn('Alpha Vantage failed, trying Upstox...');
    }

    // 2. Try Upstox
    try {
       // Check token existence without throwing
       if (upstoxAuthService.accessToken || await upstoxAuthService.loadTokens().then(() => upstoxAuthService.accessToken)) {
           return await this.getMarketIndicesFromUpstox();
       }
    } catch (error) {
       console.warn('⚠️ Upstox Indices failed:', error.message);
    }

    // 3. Ultimate Mock Fallback
    return [
      { name: 'NIFTY 50', price: 22145.65, change: 124.35, changePercent: 0.56, isOpen: true },
      { name: 'SENSEX', price: 73158.24, change: 376.12, changePercent: 0.52, isOpen: true },
      { name: 'BANK NIFTY', price: 46987.10, change: -150.25, changePercent: -0.32, isOpen: true },
      { name: 'FINNIFTY', price: 20854.30, change: 45.80, changePercent: 0.22, isOpen: true }
    ];
  }

  async getMarketIndicesFromUpstox() {
    const indices = [
      { name: 'NIFTY 50', key: 'NSE_INDEX|Nifty 50' },
      { name: 'SENSEX', key: 'BSE_INDEX|SENSEX' },
      { name: 'BANK NIFTY', key: 'NSE_INDEX|Nifty Bank' }
    ];

    const headers = await this.getHeaders();
    const keys = indices.map(i => i.key).join(',');

    const [ltpRes, ohlcRes] = await Promise.allSettled([
      axios.get(`${BASE_URL_V3}/market-quote/ltp`, { headers, params: { instrument_key: keys } }),
      axios.get(`${BASE_URL_V3}/market-quote/ohlc`, { headers, params: { instrument_key: keys, interval: '1d' } })
    ]);

    const ltpData = ltpRes.status === 'fulfilled' ? ltpRes.value.data.data : {};
    const ohlcData = ohlcRes.status === 'fulfilled' ? ohlcRes.value.data.data : {};

    const findInResponse = (dataObj, key) => {
      if (!dataObj) return null;
      if (dataObj[key]) return dataObj[key];
      const altKey = key.replace('|', ':');
      if (dataObj[altKey]) return dataObj[altKey];
      return null;
    };

    const finalIndices = indices.map(idx => {
      const ltp = findInResponse(ltpData, idx.key);
      const ohlc = findInResponse(ohlcData, idx.key);

      const price = ltp ? ltp.last_price : 0;
      const prevClose = ltp && ltp.cp ? ltp.cp : (ohlc && ohlc.previous_close ? ohlc.previous_close : price);
      const change = price - prevClose;
      const changePercent = prevClose ? (change / prevClose * 100) : 0;

      return {
        name: idx.name,
        price: price,
        change: change,
        changePercent: changePercent,
        isOpen: true
      };
    });

    if (!finalIndices.some(i => i.price > 0)) throw new Error('Invalid Upstox Indices Data');
    return finalIndices;
  }

  // Get Top Gainers and Losers
  async getTopMovers() {
    // 1. Try Upstox
    try {
        await upstoxAuthService.getAccessToken(); // Ensure token
        console.log('📊 Fetching top movers from Upstox...');
        return await this.getTopMoversFromUpstox();
    } catch (e) {
        if (e.response?.status === 401) {
             upstoxAuthService.refreshAccessToken().catch(() => {});
        }
        console.warn('⚠️ Upstox movers failed, falling back to Yahoo Finance');
    }

    // 2. Fallback to Yahoo Finance
    const yahooFinanceService = require('./yahooFinanceService');
    const validData = await yahooFinanceService.getTopMovers();

    if (validData && (validData.gainers.length > 0 || validData.losers.length > 0)) {
      return validData;
    }

    // 3. Mock Data Fallback
    console.warn('⚠️ All APIs failed. Using Mock Data for Top Movers.');
    return {
      gainers: [
        { symbol: 'RELIANCE', price: 2987.50, change: 45.20, changePercent: 1.54 },
        { symbol: 'TCS', price: 4120.00, change: 80.50, changePercent: 1.99 },
        { symbol: 'INFY', price: 1650.75, change: 25.10, changePercent: 1.54 },
        { symbol: 'HDFCBANK', price: 1450.00, change: 15.00, changePercent: 1.05 },
        { symbol: 'TATAMOTORS', price: 980.50, change: 12.30, changePercent: 1.27 }
      ],
      losers: [
        { symbol: 'WIPRO', price: 480.20, change: -10.50, changePercent: -2.14 },
        { symbol: 'TECHM', price: 1250.00, change: -25.00, changePercent: -1.96 },
        { symbol: 'SBIN', price: 760.40, change: -8.20, changePercent: -1.07 },
        { symbol: 'LICI', price: 950.00, change: -5.00, changePercent: -0.52 },
        { symbol: 'ONGC', price: 270.10, change: -1.50, changePercent: -0.55 }
      ]
    };
  }

  async getTopMoversFromUpstox() {
    const POPULAR_SYMBOLS = [
      'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY',
      'SBIN', 'BHARTIARTL', 'ITC', 'LICI', 'LT',
      'TATAMOTORS', 'AXISBANK', 'HCLTECH', 'MARUTI', 'SUNPHARMA'
    ];

    const keysToFetch = [];
    const symbolMap = {};

    await this.ensureInitialized();

    POPULAR_SYMBOLS.forEach(sym => {
      const key = this.getInstrumentKeySync(sym);
      if (key) {
        keysToFetch.push(key);
        symbolMap[key] = sym;
      }
    });

    if (keysToFetch.length === 0) throw new Error("No instrument keys found for top movers");

    const headers = await this.getHeaders();
    const params = { instrument_key: keysToFetch.join(',') };

    const [ltpRes, ohlcRes] = await Promise.allSettled([
      axios.get(`${BASE_URL_V3}/market-quote/ltp`, { headers, params }),
      axios.get(`${BASE_URL_V3}/market-quote/ohlc`, { headers, params: { ...params, interval: '1d' } })
    ]);

    const ltpData = ltpRes.status === 'fulfilled' ? ltpRes.value.data.data : {};
    const ohlcData = ohlcRes.status === 'fulfilled' ? ohlcRes.value.data.data : {};

    const quotes = [];

    const findInResponse = (dataObj, key, sym) => {
      if (!dataObj) return null;
      if (dataObj[key]) return dataObj[key];
      const altKey = `NSE_EQ:${sym}`;
      if (dataObj[altKey]) return dataObj[altKey];
      return null;
    };

    keysToFetch.forEach(key => {
      const sym = symbolMap[key];
      const ltp = findInResponse(ltpData, key, sym);
      const ohlc = findInResponse(ohlcData, key, sym);

      if (ltp) {
        const price = ltp.last_price;
        const prevClose = ltp.cp || (ohlc && ohlc.previous_close ? ohlc.previous_close : price);
        const change = price - prevClose;
        const changePercent = prevClose ? (change / prevClose * 100) : 0;

        quotes.push({
          symbol: sym,
          price: price,
          change: change,
          changePercent: changePercent,
          open: ohlc?.ohlc?.open || price,
          high: ohlc?.ohlc?.high || price,
          low: ohlc?.ohlc?.low || price,
          volume: ohlc?.volume || 0,
          source: 'upstox'
        });
      }
    });

    quotes.sort((a, b) => b.changePercent - a.changePercent);

    return {
      gainers: quotes.slice(0, 5),
      losers: quotes.slice(-5).reverse(),
      source: 'upstox'
    };
  }

  // --- 5. Historical Data ---

  async getHistoricalData(symbol, timeframe = '1M') {
    // Strategy: Yahoo First (Better stability for history), then Upstox
    const yahooFinanceService = require('./yahooFinanceService');

    try {
      console.log(`🌐 Fetching historical data from Yahoo Finance: ${symbol} (${timeframe})`);
      const data = await yahooFinanceService.getHistoricalData(symbol, timeframe);
      if (data && data.length > 0) return data;
    } catch (error) {
      console.warn(`⚠️ Yahoo Finance historical failed for ${symbol}, trying Upstox...`);
    }

    // Fallback to Upstox
    try {
        await upstoxAuthService.getAccessToken(); // Ensure token logic
        const instrumentKey = this.getInstrumentKeySync(symbol) || `NSE_EQ|${symbol.toUpperCase()}`;
        return await this._getHistoricalDataLogic(instrumentKey, timeframe);
    } catch (error) {
        console.error(`❌ Both Yahoo Finance and Upstox failed for ${symbol}`);
    }

    return [];
  }

  async _getHistoricalDataLogic(instrumentKey, timeframe) {
    try {
      const headers = await this.getHeaders();
      const now = new Date();
      let fromDate = new Date();
      let intervalUnit = 'minute';
      let intervalValue = '1';

      switch (timeframe) {
        case '1D': fromDate.setDate(now.getDate() - 5); intervalUnit = 'minute'; intervalValue = '1'; break;
        case '1W': fromDate.setDate(now.getDate() - 7); intervalUnit = 'minute'; intervalValue = '30'; break;
        case '1M': fromDate.setMonth(now.getMonth() - 1); intervalUnit = 'day'; intervalValue = '1'; break;
        case '1Y': fromDate.setFullYear(now.getFullYear() - 1); intervalUnit = 'day'; intervalValue = '1'; break;
        default: fromDate.setMonth(now.getMonth() - 1); intervalUnit = 'day'; intervalValue = '1';
      }

      const fromDateStr = fromDate.toISOString().split('T')[0];
      const toDateStr = now.toISOString().split('T')[0];

      // Map unit to V3 API format
      const unitMap = { 'minute': 'minutes', 'day': 'days', 'week': 'weeks', 'month': 'months' };
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
      throw e;
    }
  }

  getMockQuote(symbol) { return { symbol, price: 500, change: 10, changePercent: 2, volume: 5000, high: 510, low: 490, open: 495, previousClose: 490 }; }
  getMockSearchResults(q) { return [{ symbol: 'MOCK', name: 'Mock Stock', exchange: 'NSE', instrument_key: 'NSE_EQ|MOCK' }]; }
}

module.exports = new StockService();
