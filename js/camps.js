
// Camps page functionality

let map;
let markers = [];
let userMarker;
let selectedLocation = null;

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
            
            // Show a temporary marker
            if (userMarker) {
                map.removeLayer(userMarker);
            }
            
            userMarker = L.marker(selectedLocation, {
                icon: L.divIcon({
                    className: 'selected-location-marker',
                    html: '<div style="background-color: #ff9800; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                    iconSize: [12, 12],
                    iconAnchor: [6, 6]
                })
            }).addTo(map);
        });
    }
}

function loadCamps() {
    const camps = getCamps();
    const campList = document.getElementById('campList');
    
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
        // Add to map
        const marker = L.marker([camp.location.lat, camp.location.lng], {
            title: camp.name
        }).addTo(map);
        
        marker.bindPopup(`
            <strong>${camp.name}</strong><br>
            Capacity: ${camp.capacity} people<br>
            <button class="btn btn-sm btn-primary mt-2 view-camp-btn" data-camp-id="${camp.id}">View Details</button>
        `);
        
        markers.push(marker);
        
        // Add to list
        const campItem = document.createElement('li');
        campItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        campItem.innerHTML = `
            <div>
                <strong>${camp.name}</strong>
                <div class="small text-muted">Capacity: ${camp.capacity} people</div>
            </div>
        `;
        
        // Add delete button if logged in
        if (checkLoggedIn()) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
            deleteBtn.setAttribute('data-camp-id', camp.id);
            deleteBtn.addEventListener('click', function() {
                deleteCampById(camp.id);
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
}

function setupEventListeners() {
    // Use current location button
    const useLocationBtn = document.getElementById('useLocationBtn');
    if (useLocationBtn) {
        useLocationBtn.addEventListener('click', function() {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    
                    selectedLocation = { lat, lng };
                    document.getElementById('campLat').value = lat.toFixed(6);
                    document.getElementById('campLng').value = lng.toFixed(6);
                    
                    if (userMarker) {
                        map.removeLayer(userMarker);
                    }
                    
                    userMarker = L.marker([lat, lng], {
                        icon: L.divIcon({
                            className: 'selected-location-marker',
                            html: '<div style="background-color: #ff9800; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>',
                            iconSize: [12, 12],
                            iconAnchor: [6, 6]
                        })
                    }).addTo(map);
                    
                    map.setView([lat, lng], 13);
                }, function(error) {
                    alert('Error getting location: ' + error.message);
                });
            } else {
                alert('Geolocation is not supported by this browser.');
            }
        });
    }
    
    // Clear location button
    const clearLocationBtn = document.getElementById('clearLocationBtn');
    if (clearLocationBtn) {
        clearLocationBtn.addEventListener('click', function() {
            if (userMarker) {
                map.removeLayer(userMarker);
                userMarker = null;
            }
            
            selectedLocation = null;
            document.getElementById('campLat').value = '';
            document.getElementById('campLng').value = '';
        });
    }
    
    // Add camp form submission
    const addCampForm = document.getElementById('addCampForm');
    if (addCampForm) {
        addCampForm.addEventListener('submit', function(e) {
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
            
            saveCamp(newCamp);
            
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
        });
    }
}

function deleteCampById(campId) {
    if (confirm('Are you sure you want to delete this camp?')) {
        if (deleteCamp(campId)) {
            loadCamps();
        } else {
            alert('Error deleting camp.');
        }
    }
}
