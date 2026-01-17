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

    async getMarketNews(limit = 20) {
        try {
            if (this.cache.timestamp && Date.now() - this.cache.timestamp < this.cacheDuration) {
                return this.cache.data.slice(0, limit);
            }

            console.log('Fetching news from Google RSS...');
            const response = await axios.get(this.baseUrl, {
                params: { q: 'stock market finance business', hl: 'en-US', gl: 'US', ceid: 'US:en' }
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
            }));

            this.cache = {
                data: formattedNews,
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
