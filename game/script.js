// Replace 'YOUR_MAPBOX_ACCESS_TOKEN' with your Mapbox token
mapboxgl.accessToken = 'pk.eyJ1IjoiZGV2ZWxvcGVybWFwc3Rlc3QiLCJhIjoiY200cmkxdDY0MDVhZDJpc2V1ZWRsbmE0eCJ9.ZeJtn0qumV8gNDXa50E2GA';

// Coordinates of the person in the photo (Mogadishu, Somalia)
const correctCoordinates = { lng: 139.839478, lat: 35.652832 };

// Sound effects
const clickSound = new Audio('click-sound.mp3');
const resultSound = new Audio('result-sound.mp3');
const backgroundMusic = new Audio('background.mp3');
backgroundMusic.loop = true;

// Function to start background music on user interaction
function startBackgroundMusic() {
    if (backgroundMusic.paused) {
        backgroundMusic.play();
    }
}

// Start background music after user clicks anywhere
window.addEventListener('click', startBackgroundMusic, { once: true });

// Main Map with Globe View
const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/satellite-streets-v12', // Use a style with labels
    projection: 'globe', // Enable globe projection
    center: [0, 0],
    zoom: 2 // Further zoom out for star visibility
});

// Add fog to create the globe atmosphere effect
map.on('style.load', () => {
    map.setFog({
        color: 'rgba(186, 210, 235, 1)', // Atmosphere color
        highColor: 'rgba(36, 92, 223, 0.2)', // High atmosphere color
        horizonBlend: 0.5, // Horizon blend intensity
        spaceColor: 'rgba(11, 11, 25, 1)', // Space color (background stars)
        starIntensity: 1.0 // Increase intensity of background stars
    });

    // Add country labels explicitly if needed
    const layers = map.getStyle().layers;
    for (const layer of layers) {
        if (layer.id.includes('country-label')) {
            map.setLayoutProperty(layer.id, 'visibility', 'visible');
        }
    }
});

// Variable to store the user's marker
let userMarker = null;
let userGuessCoordinates = null;

// Add marker on map click
map.on('click', (e) => {
    startBackgroundMusic(); // Start music on first interaction

    // Remove previous marker
    if (userMarker) userMarker.remove();

    // Place new marker
    userMarker = new mapboxgl.Marker()
        .setLngLat(e.lngLat)
        .addTo(map);

    clickSound.play();

    // Store user's guess coordinates
    userGuessCoordinates = e.lngLat;
});

// Function to calculate distance using the Haversine formula
function calculateDistance(coord1, coord2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km

    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    const lat1 = toRad(coord1.lat);
    const lat2 = toRad(coord2.lat);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Guess button logic
document.getElementById('guess-btn').addEventListener('click', () => {
    if (!userGuessCoordinates) {
        alert('Please place a marker on the map first!');
        return;
    }

    // Stop background music and play result sound
    backgroundMusic.pause();
    resultSound.play();

    // Calculate distance
    const distance = calculateDistance(userGuessCoordinates, correctCoordinates);
    const roundedDistance = distance.toFixed(2);

    // Hide main map and show results page
    document.getElementById('map').style.display = 'none';
    document.getElementById('photo').style.display = 'none';
    document.getElementById('guess-btn').style.display = 'none';
    document.getElementById('result-container').style.display = 'block';

    // Display distance text
    document.getElementById('distance-text').innerText = `You were ${roundedDistance} km away!`;

    // Display result map with a globe projection and satellite-streets terrain
    const resultMap = new mapboxgl.Map({
        container: 'result-map',
        style: 'mapbox://styles/mapbox/satellite-streets-v12', // Use the same style as the main map
        projection: 'globe', // Enable globe projection
        center: [correctCoordinates.lng, correctCoordinates.lat],
        zoom: 2
    });

    // Add fog to create the globe atmosphere effect
    resultMap.on('style.load', () => {
        resultMap.setFog({
            color: 'rgba(186, 210, 235, 1)', // Atmosphere color
            highColor: 'rgba(36, 92, 223, 0.2)', // High atmosphere color
            horizonBlend: 0.5, // Horizon blend intensity
            spaceColor: 'rgba(11, 11, 25, 1)', // Space color (background stars)
            starIntensity: 1.0 // Increase intensity of background stars
        });
    });

    // Add user's marker
    new mapboxgl.Marker({ color: 'red' })
        .setLngLat([userGuessCoordinates.lng, userGuessCoordinates.lat])
        .addTo(resultMap);

    // Add correct location marker
    new mapboxgl.Marker({ color: 'green' })
        .setLngLat([correctCoordinates.lng, correctCoordinates.lat])
        .addTo(resultMap);

    // Draw line between the two points
    resultMap.on('load', () => {
        resultMap.addSource('line', {
            type: 'geojson',
            data: {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [userGuessCoordinates.lng, userGuessCoordinates.lat],
                        [correctCoordinates.lng, correctCoordinates.lat]
                    ]
                }
            }
        });

        resultMap.addLayer({
            id: 'line-layer',
            type: 'line',
            source: 'line',
            layout: {},
            paint: {
                'line-color': '#ff0000',
                'line-width': 4
            }
        });
    });
});