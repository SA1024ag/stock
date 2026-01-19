const axios = require('axios');
const xml2js = require('xml2js');

class NewsService {
    constructor() {
        this.baseUrl = 'https://news.google.com/rss/search';
        this.parser = new xml2js.Parser({ explicitArray: false });
        this.cache = {
            data: null,
            timestamp: null
        };
        this.cacheDuration = 15 * 60 * 1000; // 15 minutes
    }

    async getMarketNews(limit = 20, timeRange = '1d') {
        try {
            // Create a unique cache key based on params
            const cacheKey = `news_${timeRange}_${limit}`;

            if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.cacheDuration) {
                return this.cache[cacheKey].data;
            }

            console.log(`Fetching news from Google RSS (India) for ${timeRange}...`);
            const response = await axios.get(this.baseUrl, {
                params: { q: `stock market finance india NSE BSE when:${timeRange}`, hl: 'en-IN', gl: 'IN', ceid: 'IN:en' }
            });

            const result = await this.parser.parseStringPromise(response.data);
            const items = result?.rss?.channel?.item || [];
            const newsItems = Array.isArray(items) ? items : [items];

            const formattedNews = newsItems.map(item => ({
                title: item.title,
                link: item.link,
                pubDate: new Date(item.pubDate).toISOString(),
                source: item.source ? (item.source._ || item.source) : 'Google News',
                snippet: this._stripHtml(item.description || '')
            })).sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

            if (!this.cache) this.cache = {}; // Initialize if somehow null

            this.cache[cacheKey] = {
                data: formattedNews.slice(0, limit),
                timestamp: Date.now()
            };

            return formattedNews.slice(0, limit);
        } catch (error) {
            console.error('News fetch error:', error.message);
            return this.cache.data ? this.cache.data.slice(0, limit) : [];
        }
    }

    _stripHtml(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>?/gm, '');
    }
}

module.exports = new NewsService();
