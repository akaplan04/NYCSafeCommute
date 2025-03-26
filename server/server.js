import 'dotenv/config';
import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import SERVER_CONFIG from './config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Add this function to help with debugging
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

// API routes
app.get('/api/crime-data', async (req, res) => {
    try {
        // Simpler query - just get recent Manhattan records
        const url = 'https://data.cityofnewyork.us/resource/qb7u-rbmr.json';
        const params = new URLSearchParams({
            '$limit': '1000',
            '$where': "boro_nm='MANHATTAN'"
        });

        console.log('Fetching from URL:', `${url}?${params}`);

        const response = await fetch(`${url}?${params}`);
        
        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();
        console.log(`Received ${data.length} records`);

        // Simple transformation
        const transformedData = data
            .filter(crime => crime.latitude && crime.longitude)
            .map(crime => ({
                latitude: parseFloat(crime.latitude),
                longitude: parseFloat(crime.longitude),
                severity: crime.law_cat_cd || 'UNKNOWN'
            }))
            .filter(crime => 
                !isNaN(crime.latitude) && 
                !isNaN(crime.longitude)
            );

        console.log(`Transformed ${transformedData.length} records`);
        
        res.json({ data: transformedData });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ 
            error: 'Failed to fetch crime data',
            details: error.message
        });
    }
});

app.get('/api/news', async (req, res) => {
    try {
        const params = new URLSearchParams(SERVER_CONFIG.API.NEWS_API_PARAMS);
        const response = await fetch(`${SERVER_CONFIG.API.NEWS_API}?${params}`);
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