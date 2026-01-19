const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');

class ContentScraperService {
    constructor() {
        this.curriculumPath = path.join(__dirname, '../data/curriculum.json');
        console.log('📚 Content Scraper Service initialized');
    }

    // Scrape Investopedia for term definition
    async scrapeInvestopedia(term) {
        try {
            const searchUrl = `https://www.investopedia.com/search?q=${encodeURIComponent(term)}`;
            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);

            // Try to find the first search result link
            const firstResult = $('.card-content a').first().attr('href');

            if (firstResult) {
                return {
                    url: firstResult,
                    source: 'investopedia'
                };
            }

            return null;
        } catch (error) {
            console.error(`Investopedia scrape error for ${term}:`, error.message);
            return null;
        }
    }

    // Search YouTube for educational videos
    async searchYouTube(term) {
        try {
            // YouTube search suggestions (using suggested channels)
            const channels = [
                'Zerodha Varsity',
                'CA Rachana Ranade',
                'Pranjal Kamra',
                'Labour Law Advisor'
            ];

            // Generate search query
            const query = `${term} stock market explained ${channels[Math.floor(Math.random() * channels.length)]}`;
            const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

            const response = await axios.get(searchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);

            // Extract video ID from the page (YouTube's structure changes frequently)
            const scriptTags = $('script').toArray();
            let videoId = null;

            for (const script of scriptTags) {
                const content = $(script).html();
                if (content && content.includes('videoId')) {
                    const match = content.match(/"videoId":"([^"]+)"/);
                    if (match) {
                        videoId = match[1];
                        break;
                    }
                }
            }

            if (videoId) {
                return `https://www.youtube.com/watch?v=${videoId}`;
            }

            // Fallback: Return a search URL
            return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;

        } catch (error) {
            console.error(`YouTube search error for ${term}:`, error.message);
            // Return a generic search URL as fallback
            return `https://www.youtube.com/results?search_query=${encodeURIComponent(term + ' stock market')}`;
        }
    }

    // Update curriculum with scraped content
    async updateCurriculumWithScrapedContent() {
        try {
            console.log('📥 Loading curriculum...');
            const curriculumData = await fs.readFile(this.curriculumPath, 'utf-8');
            const curriculum = JSON.parse(curriculumData);

            let updatedCount = 0;

            for (const module of curriculum.modules) {
                console.log(`\n📖 Processing module: ${module.title}`);

                for (const termObj of module.keyTerms) {
                    console.log(`  🔍 Searching for: ${termObj.term}`);

                    // Search YouTube for video
                    const videoUrl = await this.searchYouTube(termObj.term);
                    if (videoUrl && videoUrl !== termObj.videoUrl) {
                        termObj.videoUrl = videoUrl;
                        updatedCount++;
                        console.log(`    ✅ Updated video URL`);
                    }

                    // Add delay to avoid rate limiting
                    await this.delay(2000);
                }
            }

            // Save updated curriculum
            await fs.writeFile(
                this.curriculumPath,
                JSON.stringify(curriculum, null, 2),
                'utf-8'
            );

            console.log(`\n✅ Updated ${updatedCount} video URLs in curriculum`);
            return {
                success: true,
                updatedCount,
                message: `Successfully updated ${updatedCount} video URLs`
            };

        } catch (error) {
            console.error('Error updating curriculum:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Scrape content for a specific term
    async scrapeTermContent(term) {
        try {
            const [investopediaResult, youtubeUrl] = await Promise.allSettled([
                this.scrapeInvestopedia(term),
                this.searchYouTube(term)
            ]);

            return {
                term,
                investopedia: investopediaResult.status === 'fulfilled' ? investopediaResult.value : null,
                videoUrl: youtubeUrl.status === 'fulfilled' ? youtubeUrl.value : null,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error(`Error scraping content for ${term}:`, error);
            throw error;
        }
    }

    // Helper: Add delay
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Get curriculum
    async getCurriculum() {
        try {
            const data = await fs.readFile(this.curriculumPath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading curriculum:', error);
            throw error;
        }
    }

    // Get specific module
    async getModule(moduleId) {
        try {
            const curriculum = await this.getCurriculum();
            const module = curriculum.modules.find(m => m.id === parseInt(moduleId));

            if (!module) {
                throw new Error(`Module ${moduleId} not found`);
            }

            return module;
        } catch (error) {
            console.error(`Error getting module ${moduleId}:`, error);
            throw error;
        }
    }
}

module.exports = new ContentScraperService();
