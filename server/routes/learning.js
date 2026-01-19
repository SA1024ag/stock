const express = require('express');
const router = express.Router();
const contentScraperService = require('../services/contentScraperService');
const aiService = require('../services/aiService');
const auth = require('../middleware/auth');

// Get full curriculum
router.get('/curriculum', async (req, res) => {
    try {
        const curriculum = await contentScraperService.getCurriculum();
        res.json(curriculum);
    } catch (error) {
        console.error('Error fetching curriculum:', error);
        res.status(500).json({ message: 'Error fetching curriculum', error: error.message });
    }
});

// Get specific module
router.get('/module/:id', async (req, res) => {
    try {
        const module = await contentScraperService.getModule(req.params.id);
        res.json(module);
    } catch (error) {
        console.error('Error fetching module:', error);
        res.status(404).json({ message: 'Module not found', error: error.message });
    }
});

// Ask AI Tutor
router.post('/ask-tutor', auth, async (req, res) => {
    try {
        const { term, definition, analogy, userQuestion } = req.body;

        if (!term) {
            return res.status(400).json({ message: 'Term is required' });
        }

        const response = await aiService.askTutor(term, {
            definition,
            analogy,
            userQuestion
        });

        res.json(response);
    } catch (error) {
        console.error('Error in AI tutor:', error);
        res.status(500).json({ message: 'Error getting AI explanation', error: error.message });
    }
});

// Scrape content for a specific term
router.post('/scrape-term', auth, async (req, res) => {
    try {
        const { term } = req.body;

        if (!term) {
            return res.status(400).json({ message: 'Term is required' });
        }

        const scrapedContent = await contentScraperService.scrapeTermContent(term);
        res.json(scrapedContent);
    } catch (error) {
        console.error('Error scraping term content:', error);
        res.status(500).json({ message: 'Error scraping content', error: error.message });
    }
});

// Update curriculum with scraped content (admin only)
router.post('/update-curriculum', auth, async (req, res) => {
    try {
        const result = await contentScraperService.updateCurriculumWithScrapedContent();
        res.json(result);
    } catch (error) {
        console.error('Error updating curriculum:', error);
        res.status(500).json({ message: 'Error updating curriculum', error: error.message });
    }
});

// Get module content for detail page
router.get('/module-content/:moduleId', async (req, res) => {
    try {
        const fs = require('fs').promises;
        const path = require('path');

        const contentPath = path.join(__dirname, '../data/contentData.json');
        const contentData = JSON.parse(await fs.readFile(contentPath, 'utf-8'));

        const moduleId = req.params.moduleId;
        const moduleContent = contentData.modules[moduleId];

        if (!moduleContent) {
            return res.status(404).json({ message: 'Module not found' });
        }

        res.json(moduleContent);
    } catch (error) {
        console.error('Error fetching module content:', error);
        res.status(500).json({ message: 'Error fetching module content', error: error.message });
    }
});

module.exports = router;
