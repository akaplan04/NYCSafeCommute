class SafeCommuteApp {
    constructor() {
        this.map = null;
        this.heatLayer = null;
        this.markers = L.layerGroup(); // Add markers for debugging
        this.initMap();
        this.loadCrimeData();
    }

    initMap() {
        this.map = L.map('map').setView([40.7831, -73.9712], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.heatLayer = L.heatLayer([], {
            radius: 30,      // Increased radius
            blur: 20,        // Increased blur
            maxZoom: 15,     // Adjusted max zoom
            max: 1.0,        // Maximum point intensity
            minOpacity: 0.5  // Minimum opacity
        }).addTo(this.map);

        this.markers.addTo(this.map);
    }

    async loadCrimeData() {
        try {
            console.log('Fetching crime data...');
            const response = await fetch('/api/crime-data');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('Received data:', result);
            
            if (result.data && Array.isArray(result.data)) {
                const points = result.data.map(crime => {
                    const intensity = this.getSeverityIntensity(crime.severity);
                    return [crime.latitude, crime.longitude, intensity];
                });

                console.log('Heatmap points:', points);
                this.heatLayer.setLatLngs(points);

                this.markers.clearLayers();
                result.data.forEach(crime => {
                    const color = this.getSeverityColor(crime.severity);
                    L.circleMarker([crime.latitude, crime.longitude], {
                        radius: 8,
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.7
                    })
                    .bindPopup(`Type: ${crime.severity}<br>Location: [${crime.latitude}, ${crime.longitude}]`)
                    .addTo(this.markers);
                });

                const bounds = L.latLngBounds(result.data.map(crime => [crime.latitude, crime.longitude]));
                this.map.fitBounds(bounds);
            }
        } catch (error) {
            console.error('Error loading crime data:', error);
        }
    }

    getSeverityIntensity(severity) {
        switch (severity) {
            case 'FELONY': return 1.0;
            case 'MISDEMEANOR': return 0.7;
            case 'VIOLATION': return 0.4;
            default: return 0.5;
        }
    }

    getSeverityColor(severity) {
        switch (severity) {
            case 'FELONY': return '#ff0000';
            case 'MISDEMEANOR': return '#ffa500';
            case 'VIOLATION': return '#ffff00';
            default: return '#808080';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SafeCommuteApp();
}); 