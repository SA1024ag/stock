const newsService = require('../services/newsService');

async function testNews() {
    try {
        console.log('Testing News Service...');
        const news = await newsService.getMarketNews(5);
        if (news.length > 0) {
            console.log('✅ Successfully fetched news items:');
            news.forEach((item, index) => {
                console.log(`${index + 1}. [${item.source}] ${item.title}`);
            });
        } else {
            console.log('❌ No news items found.');
        }
    } catch (error) {
        console.error('❌ Error fetching news:', error.message);
    }
}

testNews();
