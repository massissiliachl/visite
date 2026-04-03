// ===== INTERACTIVE MAPS SYSTEM WITH LEAFLET =====

class InteractiveMapManager {
    constructor() {
        this.maps = {};
        this.destinations = [
            {
                id: 'gouraya',
                name: 'Parc National de Gouraya',
                lat: 36.7528,
                lng: 4.6721,
                description: 'Parc côtier avec plages magnifiques et faune riche',
                icon: '🏞️',
                activities: ['Randonnée', 'Baignade', 'Photographie'],
                website: '#'
            },
            {
                id: 'capcarbon',
                name: 'Cap Carbon',
                lat: 36.7380,
                lng: 4.7069,
                description: 'Phare historique avec vue spectaculaire sur la mer',
                icon: '🔴',
                activities: ['Randonnée', 'Coucher de soleil'],
                website: '#'
            },
            {
                id: 'aokas',
                name: 'Plage d\'Aokas',
                lat: 36.7619,
                lng: 4.5278,
                description: 'Plage paradisiaque à 40 km de Béjaïa',
                icon: '🏖️',
                activities: ['Baignade', 'Pique-nique', 'Paddle'],
                website: '#'
            },
            {
                id: 'tamentout',
                name: 'Tamentout',
                lat: 36.7450,
                lng: 4.6600,
                description: 'Village côtier traditionnel avec restaurants fresh',
                icon: '🍽️',
                activities: ['Gastronomie', 'Baignade', 'Bateau'],
                website: '#'
            },
            {
                id: 'archadive',
                name: 'Réserve Marine d\'Archadive',
                lat: 36.7478,
                lng: 4.6689,
                description: 'Zone protégée pour la plongée et l\'observation marine',
                icon: '🤿',
                activities: ['Plongée', 'Snorkeling', 'Bateau'],
                website: '#'
            },
            {
                id: 'villebejaia',
                name: 'Vieux Béjaïa',
                lat: 36.7527,
                lng: 4.6696,
                description: 'Centre historique avec casbah et remparts ottomans',
                icon: '🏛️',
                activities: ['Visite guidée', 'Photographie', 'Shopping'],
                website: '#'
            }
        ];

        this.initMap();
    }

    initMap() {
        // Create main map container if needed
        const mainMapContainer = document.getElementById('mainMap');
        if (mainMapContainer) {
            this.createMap('mainMap', 36.7527, 4.6696, 'Béjaïa - Algérie');
        }

        // Check for activity-specific map containers
        this.createActivityMaps();
    }

    createActivityMaps() {
        // Create maps for destination pages if containers exist
        document.querySelectorAll('[data-map-destination]').forEach(element => {
            const destId = element.getAttribute('data-map-destination');
            const destination = this.destinations.find(d => d.id === destId);
            
            if (destination) {
                this.createMap(element.id, destination.lat, destination.lng, destination.name);
            }
        });
    }

    createMap(containerId, lat, lng, title) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Check if Leaflet is available
        if (typeof L === 'undefined') {
            console.warn('Leaflet library not loaded. Loading...');
            this.loadLeafletLibrary(() => this.initializeMap(containerId, lat, lng, title));
            return;
        }

        this.initializeMap(containerId, lat, lng, title);
    }

    initializeMap(containerId, lat, lng, title) {
        // Create map
        const map = L.map(containerId).setView([lat, lng], 13);

        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Add markers for all destinations
        this.destinations.forEach(dest => {
            const marker = L.circleMarker([dest.lat, dest.lng], {
                radius: 8,
                fillColor: '#d32f2f',
                color: '#1a3a6b',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);

            // Create popup content
            const popupContent = `
                <div class="map-popup">
                    <h4>${dest.icon} ${dest.name}</h4>
                    <p>${dest.description}</p>
                    <div class="activities-list">
                        <strong>Activités:</strong><br>
                        ${dest.activities.join(', ')}
                    </div>
                    <button class="popup-btn" onclick="window.location.href='#'">
                        Voir plus
                    </button>
                </div>
            `;

            marker.bindPopup(popupContent);
        });

        // Add zoom controls
        L.control.zoom({ position: 'topright' }).addTo(map);

        // Add scale control
        L.control.scale().addTo(map);

        // Store map reference
        this.maps[containerId] = map;

        // Inject styles
        this.injectMapStyles();
    }

    loadLeafletLibrary(callback) {
        // Load CSS
        const linkCSS = document.createElement('link');
        linkCSS.rel = 'stylesheet';
        linkCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(linkCSS);

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = callback;
        document.body.appendChild(script);
    }

    injectMapStyles() {
        const styles = `
            #mainMap {
                width: 100%;
                height: 500px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.15);
                margin: 2rem 0;
                z-index: 1;
            }

            [data-map-destination] {
                width: 100%;
                height: 400px;
                border-radius: 15px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.12);
                margin: 1.5rem 0;
                z-index: 1;
            }

            .leaflet-container {
                background: #f0f0f0;
                font-family: 'Montserrat', sans-serif;
            }

            .leaflet-popup-content-wrapper {
                background: white;
                border-radius: 10px;
                box-shadow: 0 5px 20px rgba(0,0,0,0.2);
            }

            .leaflet-popup-content {
                width: auto !important;
                margin: 0;
            }

            .map-popup {
                padding: 0.5rem;
                min-width: 250px;
            }

            .map-popup h4 {
                margin: 0 0 0.5rem 0;
                color: #1a3a6b;
                font-size: 1rem;
                border-bottom: 2px solid #d32f2f;
                padding-bottom: 0.5rem;
            }

            .map-popup p {
                margin: 0.5rem 0;
                color: #666;
                font-size: 0.9rem;
                line-height: 1.4;
            }

            .activities-list {
                margin: 0.8rem 0;
                padding: 0.8rem;
                background: #f9f9f9;
                border-left: 3px solid #d32f2f;
                border-radius: 5px;
                font-size: 0.85rem;
                color: #666;
            }

            .activities-list strong {
                color: #1a3a6b;
            }

            .popup-btn {
                width: 100%;
                padding: 0.6rem;
                margin-top: 0.8rem;
                background: linear-gradient(135deg, #1a3a6b, #d32f2f);
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                font-size: 0.85rem;
                transition: transform 0.3s ease;
            }

            .popup-btn:hover {
                transform: scale(1.05);
            }

            .leaflet-control-zoom {
                background: white !important;
                border: 1px solid #ddd !important;
                border-radius: 8px !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
            }

            .leaflet-control-zoom-in,
            .leaflet-control-zoom-out {
                background: white !important;
                color: #1a3a6b !important;
                font-weight: bold !important;
                border: none !important;
            }

            .leaflet-control-zoom-in:hover,
            .leaflet-control-zoom-out:hover {
                background: #f0f0f0 !important;
            }

            .leaflet-control-scale {
                background: white !important;
                border: 1px solid #ddd !important;
                border-radius: 5px !important;
            }

            .leaflet-control-attribution {
                background: rgba(255,255,255,0.8) !important;
                font-size: 0.75rem !important;
            }

            @media (max-width: 768px) {
                #mainMap {
                    height: 350px;
                }

                [data-map-destination] {
                    height: 300px;
                }

                .map-popup {
                    min-width: 200px;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    addMarker(lat, lng, title, description) {
        Object.values(this.maps).forEach(map => {
            const marker = L.circleMarker([lat, lng], {
                radius: 8,
                fillColor: '#d32f2f',
                color: '#1a3a6b',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(map);

            marker.bindPopup(`<div class="map-popup"><h4>${title}</h4><p>${description}</p></div>`);
        });
    }

    centerMap(containerId, lat, lng, zoom = 13) {
        if (this.maps[containerId]) {
            this.maps[containerId].setView([lat, lng], zoom);
        }
    }

    getDestinationInfo(destId) {
        return this.destinations.find(d => d.id === destId);
    }
}

// Initialize map manager
document.addEventListener('DOMContentLoaded', () => {
    window.mapManager = new InteractiveMapManager();
});
