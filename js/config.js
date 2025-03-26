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
        NYC_CRIME_DATA: '/api/crime-data',
        // News API endpoint
        NEWS_API: '/api/news'
    }
};

// Make CONFIG available globally
window.CONFIG = CONFIG; 