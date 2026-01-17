import api from './api';

/**
 * Fetch general market news
 * @param {number} limit - Number of articles to fetch (default: 10)
 * @returns {Promise<Array>} Array of news articles
 */
export const getMarketNews = async (limit = 10) => {
    try {
        const response = await api.get(`/news?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching market news:', error);
        throw error;
    }
};

/**
 * Fetch personalized news based on user's portfolio and preferences
 * @param {Object} filters - Filter options (category, sector, sentiment)
 * @param {number} limit - Number of articles to fetch (default: 20)
 * @returns {Promise<Object>} Personalized news response
 */
export const getPersonalizedNews = async (filters = {}, limit = 20) => {
    try {
        const params = new URLSearchParams({ limit, ...filters });
        const response = await api.get(`/news/personalized?${params}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching personalized news:', error);
        throw error;
    }
};

/**
 * Fetch news by category
 * @param {string} category - Category (Company, Market, Global, Policy)
 * @param {number} limit - Number of articles to fetch (default: 20)
 * @returns {Promise<Object>} Category news response
 */
export const getNewsByCategory = async (category, limit = 20) => {
    try {
        const response = await api.get(`/news/by-category/${category}?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${category} news:`, error);
        throw error;
    }
};

/**
 * Fetch news by sector
 * @param {string} sector - Sector (IT, Banking, Pharma, etc.)
 * @param {number} limit - Number of articles to fetch (default: 20)
 * @returns {Promise<Object>} Sector news response
 */
export const getNewsBySector = async (sector, limit = 20) => {
    try {
        const response = await api.get(`/news/by-sector/${sector}?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching ${sector} sector news:`, error);
        throw error;
    }
};

/**
 * Fetch stock-specific news
 * @param {string} symbol - Stock ticker symbol
 * @param {number} limit - Number of articles to fetch (default: 10)
 * @returns {Promise<Array>} Array of news articles
 */
export const getStockNews = async (symbol, limit = 10) => {
    try {
        const response = await api.get(`/news/stock/${symbol}?limit=${limit}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching news for ${symbol}:`, error);
        throw error;
    }
};

/**
 * Get user's news preferences
 * @returns {Promise<Object>} User preferences
 */
export const getNewsPreferences = async () => {
    try {
        const response = await api.get('/news/preferences');
        return response.data;
    } catch (error) {
        console.error('Error fetching news preferences:', error);
        throw error;
    }
};

/**
 * Save user's news preferences
 * @param {Object} preferences - User preferences (sectors, indices, notificationsEnabled)
 * @returns {Promise<Object>} Success response
 */
export const saveNewsPreferences = async (preferences) => {
    try {
        const response = await api.post('/news/preferences', preferences);
        return response.data;
    } catch (error) {
        console.error('Error saving news preferences:', error);
        throw error;
    }
};

/**
 * Clear news cache on server
 * @returns {Promise<Object>} Success response
 */
export const clearNewsCache = async () => {
    try {
        const response = await api.post('/news/clear-cache');
        return response.data;
    } catch (error) {
        console.error('Error clearing news cache:', error);
        throw error;
    }
};
