class SafeCommuteApp {
    constructor() {
        this.map = null;
        this.heatLayer = null;
        this.currentRoute = null;
        this.crimeData = [];
        this.routingControl = null;
        
        // Default configuration if window.CONFIG is not available
        this.config = window.CONFIG || {
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
                NYC_CRIME_DATA: '/api/crime-data',
                NEWS_API: '/api/news',
                MTA_API_KEY: '',
                MTA_GTFS_URL: 'https://api.mta.info/gtfs/nyct/gtfs.json'
            }
        };
        
        this.initMap();
        this.initEventListeners();
    }

    initMap() {
        // Initialize Leaflet map
        this.map = L.map('map', {
            center: this.config.MAP.CENTER,
            zoom: this.config.MAP.ZOOM,
            zoomControl: false // We'll add it back in a different position
        });
        
        // Add a cleaner, grayish map style
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
            maxZoom: this.config.MAP.MAX_ZOOM,
            attribution: '© OpenStreetMap contributors & © CartoDB'
        }).addTo(this.map);

        // Add zoom control to top right
        L.control.zoom({
            position: 'topright'
        }).addTo(this.map);

        // Initialize heat layer with reduced opacity
        this.heatLayer = L.heatLayer([], {
            radius: this.config.HEATMAP.RADIUS,
            blur: this.config.HEATMAP.BLUR,
            maxZoom: this.config.HEATMAP.MAX_ZOOM,
            max: 0.5,
            gradient: {
                0.2: 'blue',
                0.4: 'lime',
                0.6: 'yellow',
                0.8: 'red'
            }
        }).addTo(this.map);

        // Force a map refresh
        this.map.invalidateSize();
    }

    initEventListeners() {
        document.getElementById('findRoute').addEventListener('click', () => {
            this.findRoute();
        });
    }

    async loadCrimeData() {
        try {
            const response = await fetch(this.config.API.NYC_CRIME_DATA);
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

        try {
            // Parse coordinates from input strings
            const [originLat, originLng] = origin.split(',').map(coord => parseFloat(coord.trim()));
            const [destLat, destLng] = destination.split(',').map(coord => parseFloat(coord.trim()));

            // Validate coordinates
            if (isNaN(originLat) || isNaN(originLng) || isNaN(destLat) || isNaN(destLng)) {
                throw new Error('Invalid coordinates. Please enter in format: latitude,longitude');
            }

            // Clear existing route if any
            if (this.routingControl) {
                this.map.removeControl(this.routingControl);
            }

            // Create routing control with multiple alternatives
            this.routingControl = L.Routing.control({
                waypoints: [
                    L.latLng(originLat, originLng),
                    L.latLng(destLat, destLng)
                ],
                routeWhileDragging: false,
                showAlternatives: true,
                alternatives: true,
                lineOptions: {
                    styles: [
                        { color: '#FF0000', weight: 6, opacity: 1, dashArray: '5, 10' }, // Red dashed
                        { color: '#0000FF', weight: 6, opacity: 1, dashArray: '10, 10' }, // Blue dashed
                        { color: '#00FF00', weight: 6, opacity: 1, dashArray: '15, 10' }  // Green dashed
                    ]
                },
                createMarker: function() { return null; }, // Don't create markers
                addWaypoints: false,
                draggableWaypoints: false,
                fitSelectedRoutes: true,
                showTraffic: false
            }).addTo(this.map);

            // Handle route found event
            this.routingControl.on('routesfound', (e) => {
                const routes = e.routes;
                const routeInfoElement = document.getElementById('route-info');
                routeInfoElement.innerHTML = `
                    <h3>Available Driving Routes:</h3>
                    <div class="route-legend">
                        <div class="legend-item">
                            <span class="color-box" style="background: #FF0000"></span>
                            <span>Route 1</span>
                        </div>
                        <div class="legend-item">
                            <span class="color-box" style="background: #0000FF"></span>
                            <span>Route 2</span>
                        </div>
                        <div class="legend-item">
                            <span class="color-box" style="background: #00FF00"></span>
                            <span>Route 3</span>
                        </div>
                    </div>
                `;
                
                routes.forEach((route, index) => {
                    const duration = Math.round(route.summary.totalTime / 60);
                    const distance = Math.round(route.summary.totalDistance / 1000 * 10) / 10;
                    
                    // Extract route instructions
                    const instructions = this.extractRouteInfo(route.instructions);
                    
                    routeInfoElement.innerHTML += `
                        <div class="route-option">
                            <h4>Route ${index + 1}</h4>
                            <p>Duration: ${duration} minutes</p>
                            <p>Distance: ${distance} km</p>
                            <div class="transit-details">
                                <h5>Directions:</h5>
                                ${instructions}
                            </div>
                        </div>
                    `;
                });
            });

            // Handle routing errors
            this.routingControl.on('routingerror', (e) => {
                console.error('Routing error:', e);
                alert('Could not find a route between these points. Please try different coordinates.');
            });

        } catch (error) {
            console.error('Error finding route:', error);
            alert(error.message || 'Error finding route. Please check your input and try again.');
        }
    }

    extractRouteInfo(instructions) {
        if (!instructions) return '<p>No route information available</p>';
        
        let routeInfo = '<ul class="transit-list">';
        instructions.forEach(instruction => {
            routeInfo += `
                <li>
                    <strong>${instruction.modifier || ''}</strong>
                    <span>${instruction.text}</span>
                </li>
            `;
        });
        routeInfo += '</ul>';
        return routeInfo;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new SafeCommuteApp();
    app.loadCrimeData();
}); 