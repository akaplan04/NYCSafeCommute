require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const SERVER_CONFIG = require('./config');
const app = express();

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// API routes
app.get('/api/crime-data', async (req, res) => {
    try {
        const response = await fetch(SERVER_CONFIG.API.NYC_CRIME_DATA, {
            headers: SERVER_CONFIG.API.NYC_CRIME_DATA_HEADERS
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching crime data:', error);
        res.status(500).json({ error: 'Failed to fetch crime data' });
    }
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message || typeof message !== 'string') {
            return res.status(400).json({ 
                error: 'Invalid message format',
                response: 'Please provide a valid message.'
            });
        }
        
        // Simple response logic based on keywords
        let response = '';
        
        // Convert message to lowercase for easier matching
        const lowerMessage = message.toLowerCase();
        
        // Crime type detection
        if (lowerMessage.includes('felony')) {
            response = "Felonies are serious crimes in NYC. Common felonies include robbery, assault, and burglary. To stay safe:\n" +
                      "1. Stay in well-lit, populated areas\n" +
                      "2. Be aware of your surroundings\n" +
                      "3. Keep valuables out of sight\n" +
                      "4. Travel with others when possible";
        } else if (lowerMessage.includes('misdemeanor')) {
            response = "Misdemeanors are less serious crimes but still important to be aware of. Common examples include petty theft and minor assaults. Safety tips:\n" +
                      "1. Keep your belongings secure\n" +
                      "2. Don't leave items unattended\n" +
                      "3. Be cautious in crowded areas\n" +
                      "4. Report suspicious activity to authorities";
        } else if (lowerMessage.includes('violation')) {
            response = "Violations are minor offenses like noise complaints or public urination. While less serious, they can indicate areas to avoid. Tips:\n" +
                      "1. Avoid areas with frequent violations\n" +
                      "2. Stay on main streets\n" +
                      "3. Be mindful of local ordinances\n" +
                      "4. Report ongoing issues to 311";
        } else if (lowerMessage.includes('safe') || lowerMessage.includes('safety')) {
            response = "Here are some general safety tips for NYC:\n" +
                      "1. Plan your route in advance\n" +
                      "2. Stay in well-lit, populated areas\n" +
                      "3. Keep your phone charged and accessible\n" +
                      "4. Trust your instincts - if an area feels unsafe, avoid it\n" +
                      "5. Use the subway during peak hours when possible\n" +
                      "6. Keep valuables out of sight\n" +
                      "7. Stay alert and aware of your surroundings";
        } else if (lowerMessage.includes('route') || lowerMessage.includes('directions')) {
            response = "When planning your route:\n" +
                      "1. Use the heatmap to identify high-crime areas\n" +
                      "2. Choose well-lit, main streets over shortcuts\n" +
                      "3. Consider using public transportation during late hours\n" +
                      "4. Plan alternative routes in case of detours\n" +
                      "5. Share your route with someone you trust";
        } else {
            response = "I can help you with information about crime types (felonies, misdemeanors, violations), safety tips, and route planning. What would you like to know more about?";
        }
        
        // Replace newlines with HTML line breaks for proper display
        response = response.replace(/\n/g, '<br>');
        
        res.json({ response });
    } catch (error) {
        console.error('Chat Error:', error);
        res.status(500).json({ 
            error: 'Failed to process chat message',
            response: 'I apologize, but I encountered an error. Please try again.'
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

const PORT = SERVER_CONFIG.PORT;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 