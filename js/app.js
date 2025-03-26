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
     
        this.markers = L.layerGroup(); // Add markers for debugging
        this.initMap();
        this.loadCrimeData();
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

    getSeverityColor(severity) {
        switch (severity) {
            case 'FELONY': return '#ff0000';
            case 'MISDEMEANOR': return '#ffa500';
            case 'VIOLATION': return '#ffff00';
            default: return '#808080';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SafeCommuteApp();
}); 