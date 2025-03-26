require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();
const CONFIG = require('../js/config');

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Endpoint to fetch crime data
app.get('/api/crime-data', async (req, res) => {
    try {
        const response = await fetch(CONFIG.API.NYC_CRIME_DATA, {
            headers: CONFIG.API.NYC_CRIME_DATA_HEADERS
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching crime data:', error);
        res.status(500).json({ error: 'Failed to fetch crime data' });
    }
});

// Endpoint to fetch news
app.get('/api/news', async (req, res) => {
    try {
        const params = new URLSearchParams(CONFIG.API.NEWS_API_PARAMS);
        const response = await fetch(`${CONFIG.API.NEWS_API}?${params}`);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 