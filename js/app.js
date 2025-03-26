class SafeCommuteApp {
    constructor() {
        this.map = null;
        this.heatLayer = null;
        this.currentRoute = null;
        this.crimeData = [];
        
        this.initMap();
        this.initEventListeners();
    }

    initMap() {
        // Initialize Leaflet map
        this.map = L.map('map', {
            center: window.CONFIG.MAP.CENTER,
            zoom: window.CONFIG.MAP.ZOOM
        });
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: window.CONFIG.MAP.MAX_ZOOM,
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        // Initialize heat layer
        this.heatLayer = L.heatLayer([], {
            radius: window.CONFIG.HEATMAP.RADIUS,
            blur: window.CONFIG.HEATMAP.BLUR,
            maxZoom: window.CONFIG.HEATMAP.MAX_ZOOM
        }).addTo(this.map);
    }

    initEventListeners() {
        document.getElementById('findRoute').addEventListener('click', () => {
            this.findRoute();
        });
    }

    async loadCrimeData() {
        try {
            const response = await fetch(window.CONFIG.API.NYC_CRIME_DATA);
            const data = await response.json();
            this.crimeData = data;
            this.updateHeatmap();
        } catch (error) {
            console.error('Error loading crime data:', error);
        }
    }

    updateHeatmap() {
        const heatPoints = this.crimeData.map(crime => {
            const lat = parseFloat(crime.latitude);
            const lng = parseFloat(crime.longitude);
            return [lat, lng, 0.5];
        }).filter(point => point[0] && point[1]);

        this.heatLayer.setLatLngs(heatPoints);
    }

    async findRoute() {
        const origin = document.getElementById('origin').value;
        const destination = document.getElementById('destination').value;
        // TODO: Implement routing logic
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new SafeCommuteApp();
    app.loadCrimeData();
}); 