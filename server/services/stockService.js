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
          console.log(`Sample item from ${source.exchange}:`, data[0]);
          const filtered = data.filter(item =>
            // item.exchange might be missing in V3 files, so we rely on source.exchange context
            // checking instrument_type is still valid?
            (item.instrument_type === 'EQ' || item.instrument_type === 'INDEX')
          );

          // Normalize items for unified structure and INJECT exchange
          const normalized = filtered.map(item => ({
            ...item,
            exchange: source.exchange, // Explicitly set based on source
            name: item.name || item.short_name || item.trading_symbol // Fallback for name
          }));

          instrumentList.push(...normalized);
          console.log(`Loaded ${filtered.length} instruments from ${source.exchange}`);
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
    // Try Upstox first if token is available
    const hasValidToken = upstoxAuthService.accessToken && !upstoxAuthService.isTokenExpired();

    if (hasValidToken) {
      try {
        return await this.getQuoteFromUpstox(symbol);
      } catch (error) {
        console.warn(`⚠️ Upstox quote failed for ${symbol}, falling back to Yahoo Finance:`, error.message);
        // Fall through to Yahoo Finance
      }
    }

    // Fallback to Yahoo Finance
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

      if (!instrumentKey) {
        instrumentKey = `NSE_EQ|${symbol.toUpperCase()}`;
        const search = await this.searchStocks(symbol);
        if (search.length > 0) instrumentKey = search[0].instrument_key;
      }

      const headers = await this.getHeaders();
      const results = await Promise.allSettled([
        axios.get(`${BASE_URL_V3}/market-quote/ltp`, { headers, params: { instrument_key: instrumentKey } }),
        axios.get(`${BASE_URL_V3}/market-quote/ohlc`, { headers, params: { instrument_key: instrumentKey, interval: '1d' } })
      ]);

      const ltpRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const ohlcRes = results[1].status === 'fulfilled' ? results[1].value : null;

      const findData = (response, key, symbol) => {
        if (!response?.data?.data) return null;
        const data = response.data.data;
        if (data[key]) return data[key];
        if (Object.keys(data).length > 0) return Object.values(data)[0];
        return null;
      };

      const ltpData = findData(ltpRes, instrumentKey, symbol);
      const ohlcData = findData(ohlcRes, instrumentKey, symbol);

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
      console.error(`Upstox V3 Quote Error (${symbol}):`, error.response?.data || error.message);
      throw error;
    }
  }

  // --- 4. Indices & Movers (V3) ---

  async getMarketIndices() {
    // Keys: NSE_INDEX|Nifty 50, BSE_INDEX|SENSEX
    // These formats usually persist in V3.
    const indices = [
      { name: 'NIFTY 50', key: 'NSE_INDEX|Nifty 50' },
      { name: 'SENSEX', key: 'BSE_INDEX|SENSEX' },
      { name: 'BANK NIFTY', key: 'NSE_INDEX|Nifty Bank' }
    ];

    try {
      const headers = await this.getHeaders();
      const keys = indices.map(i => i.key).join(',');

      // Parallel LTP & OHLC Fetch (Batch Quotes endpoint is unreliable)
      const [ltpRes, ohlcRes] = await Promise.allSettled([
        axios.get(`${BASE_URL_V3}/market-quote/ltp`, { headers, params: { instrument_key: keys } }),
        axios.get(`${BASE_URL_V3}/market-quote/ohlc`, { headers, params: { instrument_key: keys, interval: '1d' } })
      ]);

      const ltpData = ltpRes.status === 'fulfilled' ? ltpRes.value.data.data : {};
      const ohlcData = ohlcRes.status === 'fulfilled' ? ohlcRes.value.data.data : {};

      // Helper to find data matching a key
      const findInResponse = (dataObj, key) => {
        if (!dataObj) return null;
        // Exact match
        if (dataObj[key]) return dataObj[key];
        // Try replacing | with : (API often returns : format e.g. NSE_INDEX:Nifty 50)
        const altKey = key.replace('|', ':');
        if (dataObj[altKey]) return dataObj[altKey];
        return null;
      };

      return indices.map(idx => {
        const ltp = findInResponse(ltpData, idx.key);
        const ohlc = findInResponse(ohlcData, idx.key);

        const price = ltp ? ltp.last_price : 0;
        // LTP endpoint gives 'cp' (Close Price / Previous Close)
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

  // Get Top Gainers and Losers from a curated NIFTY list
  async getTopMovers() {
    // Try Upstox first if token is available and not expired
    const hasValidToken = upstoxAuthService.accessToken && !upstoxAuthService.isTokenExpired();

    if (hasValidToken) {
      try {
        console.log('📊 Fetching top movers from Upstox...');
        return await this.getTopMoversFromUpstox();
      } catch (e) {
        console.warn('⚠️ Upstox failed, falling back to Yahoo Finance:', e.message);
        // Fall through to Yahoo Finance
      }
    } else {
      console.log('🌐 Using Yahoo Finance (Upstox token not available)');
    }

    // Fallback to Yahoo Finance
    const yahooFinanceService = require('./yahooFinanceService');
    return await yahooFinanceService.getTopMovers();
  }

  // Original Upstox implementation (renamed)
  async getTopMoversFromUpstox() {
    const POPULAR_SYMBOLS = [
      'RELIANCE', 'TCS', 'HDFCBANK', 'ICICIBANK', 'INFY',
      'SBIN', 'BHARTIARTL', 'ITC', 'LICI', 'LT',
      'TATAMOTORS', 'AXISBANK', 'HCLTECH', 'MARUTI', 'SUNPHARMA'
    ];

    const quotes = [];
    const keysToFetch = [];
    const symbolMap = {};

    // 1. Resolve Keys (After ensuring Init)
    await this.ensureInitialized();

    POPULAR_SYMBOLS.forEach(sym => {
      const key = this.getInstrumentKeySync(sym);
      if (key) {
        keysToFetch.push(key);
        symbolMap[key] = sym;
      }
    });

    if (keysToFetch.length === 0) return { gainers: [], losers: [] };

    try {
      const headers = await this.getHeaders();
      const params = { instrument_key: keysToFetch.join(',') };

      // 2. Batch Fetch LTP and OHLC in parallel
      // Note: 'quotes' endpoint failed, so we construct it manually
      const [ltpRes, ohlcRes] = await Promise.allSettled([
        axios.get(`${BASE_URL_V3}/market-quote/ltp`, { headers, params }),
        axios.get(`${BASE_URL_V3}/market-quote/ohlc`, { headers, params: { ...params, interval: '1d' } })
      ]);

      const ltpData = ltpRes.status === 'fulfilled' ? ltpRes.value.data.data : {};
      const ohlcData = ohlcRes.status === 'fulfilled' ? ohlcRes.value.data.data : {};

      // Helper to find data matching a key (handles NSE_EQ:SYMBOL format vs keys)
      const findInResponse = (dataObj, key, sym) => {
        if (!dataObj) return null;
        if (dataObj[key]) return dataObj[key]; // Exact match
        // Try format NSE_EQ:SYMBOL
        const altKey = `NSE_EQ:${sym}`;
        if (dataObj[altKey]) return dataObj[altKey];
        return null;
      };

      // 3. Process & Merge
      keysToFetch.forEach(key => {
        const sym = symbolMap[key];
        const ltp = findInResponse(ltpData, key, sym);
        const ohlc = findInResponse(ohlcData, key, sym);

        if (ltp) {
          const price = ltp.last_price;
          // Use 'cp' from LTP data for previous close
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

      // 4. Sort
      quotes.sort((a, b) => b.changePercent - a.changePercent);

      return {
        gainers: quotes.slice(0, 5),
        losers: quotes.slice(-5).reverse(),
        source: 'upstox'
      };

    } catch (e) {
      console.error('getTopMoversFromUpstox Error:', e.message);

      // Check if it's an authentication error
      if (e.response?.status === 401) {
        console.error('❌ Upstox Token Expired! Please re-authenticate at: http://localhost:5000/api/auth/upstox/login');
      } else if (e.response) {
        console.error('API Error Data:', JSON.stringify(e.response.data, null, 2));
      }

      throw e; // Throw to trigger fallback
    }
  }

  // --- 5. Historical Data (V3? V2?) ---
  // Assuming V2/Historical-Candle works or finding V3 equivalent.
  // Docs often keep historical separate. Let's try V2 endpoint but with V3 Auth, 
  // OR look for V3 if exists. Most likely it shares the endpoint structure.

  async getHistoricalData(symbol, timeframe = '1M') {
    // Always use Yahoo Finance for historical data to get fresh data
    console.log(`🌐 Fetching historical data from Yahoo Finance: ${symbol} (${timeframe})`);
    const yahooFinanceService = require('./yahooFinanceService');

    try {
      const data = await yahooFinanceService.getHistoricalData(symbol, timeframe);
      if (data && data.length > 0) {
        return data;
      }
    } catch (error) {
      console.warn(`⚠️ Yahoo Finance failed for ${symbol}, trying Upstox...`);
    }

    // Fallback to Upstox if Yahoo Finance fails
    const hasValidToken = upstoxAuthService.accessToken && !upstoxAuthService.isTokenExpired();
    if (hasValidToken) {
      try {
        const instrumentKey = this.getInstrumentKeySync(symbol) || `NSE_EQ|${symbol.toUpperCase()}`;
        return await this._getHistoricalDataLogic(instrumentKey, timeframe);
      } catch (error) {
        console.error(`❌ Both Yahoo Finance and Upstox failed for ${symbol}`);
      }
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
