// Alerts page functionality

let alertMap;
let alertMarkers = [];
let alertCircles = [];
let alertSelectedLocation = null;
let alertUserMarker;
// Variables to store user location elements for alerts map
let alertUserLocationMarker = null;
let alertUserLocationCircle = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    initAlertMap();

    // Show user location initially
    showUserCurrentLocationOnAlertMap();

    // Load alerts
    loadAlerts();

    // Show admin controls if logged in
    if (checkLoggedIn()) {
        document.getElementById('addAlertCard').classList.remove('d-none');
    }

    // Set up event listeners
    setupAlertEventListeners();

    // Refresh alerts every 30 seconds
    setInterval(loadAlerts, 300000);

    // Refresh user location every minute
   // setInterval(showUserCurrentLocationOnAlertMap, 60000);
});

function initAlertMap() {
    // Create a map centered on default location (will be updated)
    alertMap = L.map('alertMap').setView([34.0522, -118.2437], 10);

    // Add the tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(alertMap);

    // Add click handler for map when logged in
    if (checkLoggedIn()) {
        alertMap.on('click', function(e) {
            alertSelectedLocation = e.latlng;
            document.getElementById('alertLat').value = alertSelectedLocation.lat.toFixed(6);
            document.getElementById('alertLng').value = alertSelectedLocation.lng.toFixed(6);

            // Update radius visualization
            updateAlertRadiusPreview();
        });
    }
}

function updateAlertRadiusPreview() {
    // Remove existing preview
    if (alertUserMarker) {
        alertMap.removeLayer(alertUserMarker);
    }

    if (!alertSelectedLocation) return;

    // Get radius value
    const radius = parseInt(document.getElementById('alertRadius').value) * 1000; // Convert to meters

    // Create preview circle
    alertUserMarker = L.circle(alertSelectedLocation, {
        color: '#ff9800',
        fillColor: '#ff9800',
        fillOpacity: 0.2,
        radius: radius
    }).addTo(alertMap);
}

function loadAlerts() {
    const alerts = getAlerts();
    const alertsList = document.getElementById('alertsList');

    // Clear existing markers and circles
    alertMarkers.forEach(marker => alertMap.removeLayer(marker));
    alertCircles.forEach(circle => alertMap.removeLayer(circle));
    alertMarkers = [];
    alertCircles = [];

    // Clear alerts list
    alertsList.innerHTML = '';

    if (alerts.length === 0) {
        alertsList.innerHTML = '<li class="list-group-item text-center text-muted">No active alerts</li>';
        return;
    }

    // Filter for active alerts
    const activeAlerts = alerts.filter(alert => alert.active);

    if (activeAlerts.length === 0) {
        alertsList.innerHTML = '<li class="list-group-item text-center text-muted">No active alerts</li>';
        return;
    }

    // Add active alerts to map and list
    activeAlerts.forEach(alert => {
        // Add to map
        const marker = L.marker([alert.location.lat, alert.location.lng], {
            title: alert.title,
            icon: L.divIcon({
                className: 'emergency-alert-marker',
                html: '<i class="fas fa-exclamation-triangle" style="font-size: 24px; color: red;"></i>',
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })
        }).addTo(alertMap);

        marker.bindPopup(`
            <strong>${alert.title}</strong><br>
            Type: ${alert.type}<br>
            <p>${alert.description}</p>
            <small>Posted: ${formatDate(alert.createdAt)}</small>
        `);

        alertMarkers.push(marker);

        // Add circle for affected area
        const circle = L.circle([alert.location.lat, alert.location.lng], {
            color: 'red',
            fillColor: '#f03',
            fillOpacity: 0.2,
            radius: alert.radius * 1000 // Convert to meters
        }).addTo(alertMap);

        alertCircles.push(circle);

        // Add to list
        const alertItem = document.createElement('li');
        alertItem.className = `list-group-item alert-list-item ${alert.type.toLowerCase()}`;

        alertItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${alert.title}</strong>
                    <div class="small"><span class="badge bg-danger">${alert.type}</span></div>
                    <div class="small text-muted mt-1">${alert.description.substring(0, 100)}${alert.description.length > 100 ? '...' : ''}</div>
                </div>
            </div>
        `;

        // Add delete button if logged in
        if (checkLoggedIn()) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger ms-2';
            deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
            deleteBtn.setAttribute('data-alert-id', alert.id);
            deleteBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                deleteAlertById(alert.id);
            });

            alertItem.querySelector('.d-flex').appendChild(deleteBtn);
        }

        alertItem.addEventListener('click', function() {
            // Center map on alert location and open popup
            alertMap.setView([alert.location.lat, alert.location.lng], 12);
            alertMarkers.forEach(m => {
                if (m.getLatLng().lat === alert.location.lat && 
                    m.getLatLng().lng === alert.location.lng) {
                    m.openPopup();
                }
            });
        });

        alertsList.appendChild(alertItem);
    });

    // Fit map to show all alerts
    if (alertMarkers.length > 0) {
        const group = L.featureGroup([...alertMarkers, ...alertCircles]);
        alertMap.fitBounds(group.getBounds().pad(0.1));
    }
    // Don't call showUserCurrentLocationOnAlertMap() here to avoid duplicating the marker
}

function setupAlertEventListeners() {
    // Radius input change
    const alertRadius = document.getElementById('alertRadius');
    if (alertRadius) {
        alertRadius.addEventListener('input', updateAlertRadiusPreview);
    }

    // Update map from coordinates button
    const updateAlertMapFromCoordsBtn = document.getElementById('updateAlertMapFromCoords');
    if (updateAlertMapFromCoordsBtn) {
        updateAlertMapFromCoordsBtn.addEventListener('click', function() {
            const lat = parseFloat(document.getElementById('alertLat').value);
            const lng = parseFloat(document.getElementById('alertLng').value);

            if (!isNaN(lat) && !isNaN(lng)) {
                alertSelectedLocation = L.latLng(lat, lng);

                // Update radius visualization
                updateAlertRadiusPreview();

                // Center map on new coordinates
                alertMap.panTo(alertSelectedLocation);
            } else {
                alert('Please enter valid coordinates');
            }
        });
    }

    // Add alert form submission
    const addAlertForm = document.getElementById('addAlertForm');
    if (addAlertForm) {
        addAlertForm.addEventListener('submit', function(e) {
            e.preventDefault();

            if (!alertSelectedLocation) {
                alert('Please select a location on the map.');
                return;
            }

            const alertTitle = document.getElementById('alertTitle').value;
            const alertType = document.getElementById('alertType').value;
            const alertDescription = document.getElementById('alertDescription').value;
            const alertRadius = document.getElementById('alertRadius').value;

            const newAlert = {
                title: alertTitle,
                type: alertType,
                description: alertDescription,
                location: {
                    lat: alertSelectedLocation.lat,
                    lng: alertSelectedLocation.lng
                },
                radius: parseInt(alertRadius)
            };

            saveAlert(newAlert);

            // Reset form
            addAlertForm.reset();
            if (alertUserMarker) {
                alertMap.removeLayer(alertUserMarker);
                alertUserMarker = null;
            }
            alertSelectedLocation = null;

            // Reload alerts
            loadAlerts();

            alert('Emergency alert added successfully!');
        });
    }

    //Use My Location button
    const useLocationBtn = document.getElementById('useLocationForAlertBtn');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', function() {
            navigator.geolocation.getCurrentPosition(function(position) {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                document.getElementById('alertLat').value = lat.toFixed(6);
                document.getElementById('alertLng').value = lng.toFixed(6);
                alertSelectedLocation = L.latLng(lat, lng);
                updateAlertRadiusPreview();
            }, function(error) {
                console.error('Error getting location:', error.message);
                alert('Could not get your location. Please try again later.');
            });
        });
    }
}

function deleteAlertById(alertId) {
    if (confirm('Are you sure you want to dismiss this alert?')) {
        if (deleteAlert(alertId)) {
            loadAlerts();
        } else {
            alert('Error dismissing alert.');
        }
    }
}


function showUserCurrentLocationOnAlertMap() {
    // Remove existing user location elements if they exist
    if (alertUserLocationMarker) {
        alertMap.removeLayer(alertUserLocationMarker);
        alertUserLocationMarker = null;
    }
    if (alertUserLocationCircle) {
        alertMap.removeLayer(alertUserLocationCircle);
        alertUserLocationCircle = null;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            // Create a custom marker for user location
            //alertUserLocationMarker = L.marker([lat, lng], {
              //  icon: L.divIcon({
                //    className: 'user-location-marker',
                  //  html: '<div class="user-location-dot"></div>',
                    //iconSize: [12, 12],
                    //iconAnchor: [6, 6]
                //}),
                //zIndexOffset: 1000
            //}).addTo(alertMap);

            // Add a circle to indicate accuracy range
            alertUserLocationCircle = L.circle([lat, lng], {
                radius: position.coords.accuracy,
                color: '#007BFF',
                fillColor: '#007BFF',
                fillOpacity: 0.2
            }).addTo(alertMap);

            // Add a popup to the marker
            //alertUserLocationMarker.bindPopup("Your current location").openPopup();
            alertUserLocationMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: '<div class="user-location-dot"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                }),
                zIndexOffset: 1000
            }).addTo(alertMap);
            
            // Center the map on user's location
            alertMap.setView([lat, lng], 14);
            

        }, function(error) {
            console.error('Error getting location:', error.message);

            // Show an error message to the user
            if (error.code === 1) {
                alert('Please allow location access to see your position on the map.');
            } else if (error.code === 2 || error.code === 3) {
                alert('Could not determine your location. Please try again later.');
            }
        }, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}