const CONFIG = {
    MAP: {
        CENTER: [40.7831, -73.9712], // Manhattan center
        ZOOM: 12,
        MAX_ZOOM: 19
    },
    HEATMAP: {
        RADIUS: 20,
        BLUR: 25,
        MAX_ZOOM: 17
    },
    API: {
        // NYPD Complaint Data Current (Year To Date)
        NYC_CRIME_DATA: 'https://data.cityofnewyork.us/resource/5uac-w243.json',
        NYC_CRIME_DATA_HEADERS: {
            'X-App-Token': process.env.NYC_OPEN_DATA_TOKEN
        },
        // News API endpoint
        NEWS_API: 'https://newsdata.io/api/1/news',
        NEWS_API_PARAMS: {
            apikey: process.env.NEWS_API_KEY,
            country: 'us',
            category: 'crime',
            language: 'en'
        }
    }
};

module.exports = CONFIG; 