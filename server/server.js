const express = require('express');
const fetch = require('node-fetch');
const app = express();

app.use(express.json());
app.use(express.static('../'));

// Endpoint to fetch crime data
app.get('/api/crime-data', async (req, res) => {
    try {
        const response = await fetch(CONFIG.API.NYC_CRIME_DATA);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching crime data:', error);
        res.status(500).json({ error: 'Failed to fetch crime data' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 