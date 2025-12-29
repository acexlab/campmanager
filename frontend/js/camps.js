// Camps page functionality

let map;
let markers = [];
let userMarker;
let selectedLocation = null;
// Variables to store user location elements
let userLocationMarker = null;
let userLocationCircle = null;

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the map
    initMap();

    // Load camps into list and map
    loadCamps();

    // Show admin controls if logged in
    if (checkLoggedIn()) {
        document.getElementById('addCampCard').classList.remove('d-none');
    }

    // Set up event listeners
    setupEventListeners();
    showUserCurrentLocation(); //Added to show location on load
});

function initMap() {
    // Create a map centered on default location (will be updated)
    map = L.map('map').setView([34.0522, -118.2437], 10);

    // Add the tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add click handler for map when logged in
    if (checkLoggedIn()) {
        map.on('click', function(e) {
            selectedLocation = e.latlng;
            document.getElementById('campLat').value = selectedLocation.lat.toFixed(6);
            document.getElementById('campLng').value = selectedLocation.lng.toFixed(6);

            updateSelectedLocationMarker(selectedLocation);
        });
    }
}

function updateSelectedLocationMarker(location) {
    // Show a temporary marker
    if (userMarker) {
        map.removeLayer(userMarker);
    }

    userMarker = L.marker(location, {
        icon: L.divIcon({
            className: 'selected-location-marker',
            html: '<div style="background-color: #ff9800; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
            iconSize: [12, 12],
            iconAnchor: [6, 6]
        })
    }).addTo(map);

    // Pan the map to the selected location
    map.panTo(location);
}

async function loadCamps() {
    const campList = document.getElementById('campList');

    try {
        console.log('Fetching camps from API...');
        const response = await fetch('http://localhost:5001/api/camps');
        if (!response.ok) {
            throw new Error('Failed to fetch camps');
        }

        const camps = await response.json();
        console.log('Camps fetched:', camps);

        // Clear existing markers
        markers.forEach(marker => map.removeLayer(marker));
        markers = [];

        // Clear camp list
        campList.innerHTML = '';

        if (camps.length === 0) {
            campList.innerHTML = '<li class="list-group-item text-center text-muted">No camps available</li>';
            return;
        }

        // Add camps to map and list
        camps.forEach(camp => {
            // Check if location is valid
            if (!camp.location || typeof camp.location.lat !== 'number' || typeof camp.location.lng !== 'number') {
                console.error('Invalid location for camp:', camp);
                return;
            }

            // Add to map
            const marker = L.marker([camp.location.lat, camp.location.lng], {
                title: camp.name
            }).addTo(map);

            marker.bindPopup(`
                <strong>${camp.name}</strong><br>
                Capacity: ${camp.capacity} people<br>
                <button class="btn btn-sm btn-primary mt-2 view-camp-btn" data-camp-id="${camp._id}">View Details</button>
            `);

            markers.push(marker);

            // Add to list
            const campItem = document.createElement('li');
            campItem.className = 'list-group-item d-flex justify-content-between align-items-center';

            campItem.innerHTML = `
                <div>
                    <strong>${camp.name}</strong>
                    <div class="small text-muted">Capacity: ${camp.capacity} people</div>
                    <button class="btn btn-sm btn-success mt-2 get-directions-btn" data-lat="${camp.location.lat}" data-lng="${camp.location.lng}">
                        <i class="fas fa-directions"></i> Directions
                    </button>
                </div>
            `;

            // Add delete button if logged in
            if (checkLoggedIn()) {
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn btn-sm btn-danger';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
                deleteBtn.setAttribute('data-camp-id', camp._id);
                deleteBtn.addEventListener('click', function() {
                    deleteCampById(camp._id);
                });

                campItem.appendChild(deleteBtn);
            }

            campItem.addEventListener('click', function() {
                // Center map on camp location and open popup
                map.setView([camp.location.lat, camp.location.lng], 13);
                markers.forEach(m => {
                    if (m.getLatLng().lat === camp.location.lat && 
                        m.getLatLng().lng === camp.location.lng) {
                        m.openPopup();
                    }
                });
            });

            campList.appendChild(campItem);
        });

        // Fit map to show all markers
        if (markers.length > 0) {
            const group = L.featureGroup(markers);
            map.fitBounds(group.getBounds().pad(0.1));
        }

        // Add event listeners to get directions buttons after they are added to the DOM
        const directionsButtons = document.querySelectorAll('.get-directions-btn');
        directionsButtons.forEach(button => {
            button.addEventListener('click', function() {
                const lat = parseFloat(this.dataset.lat);
                const lng = parseFloat(this.dataset.lng);
                // Implement your navigation logic here. Example using Google Maps:
                window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
            });
        });
    } catch (error) {
        console.error('Error loading camps:', error);
        campList.innerHTML = '<li class="list-group-item text-center text-muted">Failed to load camps</li>';
    }
}

function setupEventListeners() {
    // Use current location button
    const useLocationBtn = document.getElementById('useLocationBtn');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', function() {
            showUserCurrentLocation();
        });
    }

    // Update map from coordinates button
    const updateMapFromCoordsBtn = document.getElementById('updateMapFromCoords');
    if (updateMapFromCoordsBtn) {
        updateMapFromCoordsBtn.addEventListener('click', function() {
            const lat = parseFloat(document.getElementById('campLat').value);
            const lng = parseFloat(document.getElementById('campLng').value);

            if (!isNaN(lat) && !isNaN(lng)) {
                selectedLocation = L.latLng(lat, lng);
                updateSelectedLocationMarker(selectedLocation);
            } else {
                alert('Please enter valid coordinates');
            }
        });
    }

    // Add camp form submission
    const addCampForm = document.getElementById('addCampForm');
    if (addCampForm) {
        addCampForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            if (!selectedLocation) {
                alert('Please select a location on the map or use your current location.');
                return;
            }

            const campName = document.getElementById('campName').value;
            const campCapacity = document.getElementById('campCapacity').value;

            const newCamp = {
                name: campName,
                capacity: parseInt(campCapacity),
                location: {
                    lat: selectedLocation.lat,
                    lng: selectedLocation.lng
                }
            };

            try {
                const response = await fetch('http://localhost:5001/api/camps', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newCamp)
                });

                if (!response.ok) {
                    throw new Error('Failed to add camp');
                }

                const result = await response.json();
                console.log('Camp added:', result);

                // Reset form
                addCampForm.reset();
                if (userMarker) {
                    map.removeLayer(userMarker);
                    userMarker = null;
                }
                selectedLocation = null;

                // Reload camps
                loadCamps();

                alert('Camp added successfully!');
            } catch (error) {
                console.error('Error adding camp:', error);
                alert('Failed to add camp. Please try again.');
            }
        });
    }
}

function deleteCampById(campId) {
    if (confirm('Are you sure you want to delete this camp?')) {
        fetch(`http://localhost:5001/api/camps/${campId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete camp');
            }
            return response.json();
        })
        .then(result => {
            console.log('Camp deleted:', result);

            // Reload camps after successful deletion
            loadCamps();
        })
        .catch(error => {
            console.error('Error deleting camp:', error);
            alert('Failed to delete camp. Please try again.');
        });
    }
}

function showUserCurrentLocation() {
    // Remove existing user location elements if they exist
    if (userLocationMarker) {
        map.removeLayer(userLocationMarker);
        userLocationMarker = null;
    }
    if (userLocationCircle) {
        map.removeLayer(userLocationCircle);
        userLocationCircle = null;
    }

    // Also clear selected location marker if exists
    if (userMarker) {
        map.removeLayer(userMarker);
        userMarker = null;
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            userLocationMarker = L.marker([lat, lng], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: '<div class="user-location-dot"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                }),
                zIndexOffset: 1000
            }).addTo(map);
            
            userLocationCircle = L.circle([lat, lng], {
                radius: position.coords.accuracy,
                color: '#007BFF',
                fillColor: '#007BFF',
                fillOpacity: 0.2
            }).addTo(map);
            
            map.setView([lat, lng], 14); // ✅ Add this line to center the map on the user
            

            // Set the coordinates in the input fields and update selected location
            document.getElementById('campLat').value = lat.toFixed(6);
            document.getElementById('campLng').value = lng.toFixed(6);
            selectedLocation = L.latLng(lat, lng);

        }, function(error) {
            alert('Error getting location: ' + error.message);
        });
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}