// Global variables and utility functions shared across pages

// Check if user is logged in
function checkLoggedIn() {
    const user = localStorage.getItem('currentUser');
    if (user) {
        // Update UI for logged in user
        document.getElementById('loginNavItem').classList.add('d-none');
        document.getElementById('logoutNavItem').classList.remove('d-none');
        document.getElementById('userWelcome').classList.remove('d-none');
        document.getElementById('username').textContent = user;
        return true;
    }
    return false;
}

// Setup logout functionality
document.addEventListener('DOMContentLoaded', function() {
    checkLoggedIn();

    // Set up logout functionality
    const logoutLink = document.getElementById('logoutLink');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            // Add activity
            addActivity('User logged out', 'user');
            window.location.href = 'index.html';
        });
    }

    // Initialize dark mode
    initDarkMode();
});

// Activity management
function addActivity(message, type = 'info', details = null) {
    const activities = getActivities();

    // Create new activity
    const activity = {
        id: Date.now(),
        message: message,
        type: type,
        timestamp: new Date().toISOString(),
        details: details
    };

    // Add to beginning of array
    activities.unshift(activity);

    // Keep only latest 50 activities
    if (activities.length > 50) {
        activities.pop();
    }

    // Save to localStorage
    localStorage.setItem('activities', JSON.stringify(activities));

    return activity;
}

function getActivities() {
    const activities = localStorage.getItem('activities');
    return activities ? JSON.parse(activities) : [];
}

// Camp management
function getCamps() {
    const camps = localStorage.getItem('camps');
    return camps ? JSON.parse(camps) : [];
}

function saveCamp(camp) {
    const camps = getCamps();
    camp.id = Date.now();
    camps.push(camp);
    localStorage.setItem('camps', JSON.stringify(camps));
    addActivity(`New camp added: ${camp.name}`, 'camp', camp);
    return camp;
}

function amp(campId) {
    const camps = getCamps();
    const campIndex = camps.findIndex(camp => camp.id == campId);

    if (campIndex !== -1) {
        const campName = camps[campIndex].name;
        camps.splice(campIndex, 1);
        localStorage.setItem('camps', JSON.stringify(camps));
        addActivity(`Camp deleted: ${campName}`, 'camp');
        return true;
    }
    return false;
}

// Resource management
function getResources() {
    const resources = localStorage.getItem('resources');
    return resources ? JSON.parse(resources) : {
        food: 0,
        shelter: 0,
        clothes: 0,
        medicine: 0
    };
}

function addResource(type, quantity) {
    const resources = getResources();
    const lowerType = type.toLowerCase();

    if (lowerType in resources) {
        resources[lowerType] += parseInt(quantity);
        localStorage.setItem('resources', JSON.stringify(resources));
        return true;
    }
    return false;
}

function removeResource(type, quantity) {
    const resources = getResources();
    const lowerType = type.toLowerCase();

    if (lowerType in resources && resources[lowerType] >= quantity) {
        resources[lowerType] -= parseInt(quantity);
        localStorage.setItem('resources', JSON.stringify(resources));
        return true;
    }
    return false;
}

// Resource requests and donations
function getRequests() {
    const requests = localStorage.getItem('requests');
    return requests ? JSON.parse(requests) : [];
}

function saveRequest(request) {
    const requests = getRequests();
    request.id = Date.now();
    request.status = 'pending';
    request.createdAt = new Date().toISOString();

    requests.push(request);
    localStorage.setItem('requests', JSON.stringify(requests));

    // For high priority requests, add to activity feed
    if (request.priority === 'High') {
        addActivity(`New high priority request: ${request.resourceType} for ${request.campName}`, 'resource', request);
    }

    return request;
}

function fulfillRequest(requestId) {
    const requests = getRequests();
    const request = requests.find(req => req.id == requestId);

    if (request) {
        request.status = 'fulfilled';
        request.fulfilledAt = new Date().toISOString();
        localStorage.setItem('requests', JSON.stringify(requests));

        addActivity(`Request fulfilled: ${request.resourceType} for ${request.campName}`, 'resource', request);
        return true;
    }
    return false;
}

function getDonations() {
    const donations = localStorage.getItem('donations');
    return donations ? JSON.parse(donations) : [];
}

function saveDonation(donation) {
    const donations = getDonations();
    donation.id = Date.now();
    donation.createdAt = new Date().toISOString();

    donations.push(donation);
    localStorage.setItem('donations', JSON.stringify(donations));

    // Add resources
    addResource(donation.resourceType, donation.quantity);

    // Add to activity feed
    addActivity(`New donation: ${donation.quantity} ${donation.resourceType} items for ${donation.campName}`, 'resource', donation);

    // Check if this donation can fulfill any high priority requests
    checkAndFulfillRequests(donation.resourceType, donation.campName);

    return donation;
}

function checkAndFulfillRequests(resourceType, campName) {
    const requests = getRequests();
    const pendingHighPriority = requests.filter(req => 
        req.status === 'pending' && 
        req.priority === 'High' && 
        req.resourceType === resourceType &&
        req.campName === campName
    );

    if (pendingHighPriority.length > 0) {
        // Sort by oldest first
        pendingHighPriority.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        // Fulfill the oldest request
        fulfillRequest(pendingHighPriority[0].id);
    }
}

// Alert management
function getAlerts() {
    const alerts = localStorage.getItem('alerts');
    return alerts ? JSON.parse(alerts) : [];
}

function saveAlert(alert) {
    const alerts = getAlerts();
    alert.id = Date.now();
    alert.createdAt = new Date().toISOString();
    alert.active = true;

    alerts.push(alert);
    localStorage.setItem('alerts', JSON.stringify(alerts));

    // Add to activity feed
    addActivity(`New emergency alert: ${alert.title} (${alert.type})`, 'alert', alert);

    return alert;
}

function deleteAlert(alertId) {
    const alerts = getAlerts();
    const alertIndex = alerts.findIndex(alert => alert.id == alertId);

    if (alertIndex !== -1) {
        const alertTitle = alerts[alertIndex].title;
        alerts.splice(alertIndex, 1);
        localStorage.setItem('alerts', JSON.stringify(alerts));
        addActivity(`Alert dismissed: ${alertTitle}`, 'alert');
        return true;
    }
    return false;
}

// Format date for display
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString();
}

// Initialize app with sample data if first time
function initializeApp() {
    if (!localStorage.getItem('appInitialized')) {
        // Sample camps
        const sampleCamps = [
            {
                id: 1,
                name: "Central Relief Camp",
                capacity: 500,
                location: { lat: 34.0522, lng: -118.2437 }
            },
            {
                id: 2,
                name: "East Side Shelter",
                capacity: 250,
                location: { lat: 34.0619, lng: -118.2187 }
            },
            {
                id: 3,
                name: "Riverside Camp",
                capacity: 350,
                location: { lat: 34.0415, lng: -118.2687 }
            }
        ];
        localStorage.setItem('camps', JSON.stringify(sampleCamps));

        // Sample resources
        const sampleResources = {
            food: 1200,
            shelter: 300,
            clothes: 500,
            medicine: 800
        };
        localStorage.setItem('resources', JSON.stringify(sampleResources));

        // Sample users
        const sampleUsers = [
            { username: "admin", password: "admin123" },
            { username: "manager", password: "manager123" }
        ];
        localStorage.setItem('users', JSON.stringify(sampleUsers));

        // Sample requests
        const sampleRequests = [
            {
                id: 1,
                name: "John Smith",
                contact: "555-1234",
                resourceType: "Food",
                quantity: 100,
                priority: "High",
                campName: "East Side Shelter",
                directDelivery: true,
                status: "pending",
                createdAt: new Date(Date.now() - 86400000).toISOString() // 1 day ago
            },
            {
                id: 2,
                name: "Maria Garcia",
                contact: "555-5678",
                resourceType: "Medicine",
                quantity: 50,
                priority: "Medium",
                campName: "Central Relief Camp",
                directDelivery: false,
                status: "pending",
                createdAt: new Date(Date.now() - 43200000).toISOString() // 12 hours ago
            }
        ];
        localStorage.setItem('requests', JSON.stringify(sampleRequests));

        // Sample alerts
        const sampleAlerts = [
            {
                id: 1,
                title: "Flash Flood Warning",
                type: "Flood",
                description: "Flash flooding reported in downtown area. Avoid low-lying areas.",
                location: { lat: 34.0522, lng: -118.2837 },
                radius: 5,
                active: true,
                createdAt: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
            }
        ];
        localStorage.setItem('alerts', JSON.stringify(sampleAlerts));

        // Sample activities
        const sampleActivities = [
            {
                id: 1,
                message: "System initialized with sample data",
                type: "info",
                timestamp: new Date().toISOString()
            },
            {
                id: 2,
                message: "New emergency alert: Flash Flood Warning (Flood)",
                type: "alert",
                timestamp: new Date(Date.now() - 7200000).toISOString()
            },
            {
                id: 3,
                message: "New high priority request: Food for East Side Shelter",
                type: "resource",
                timestamp: new Date(Date.now() - 86400000).toISOString()
            }
        ];
        localStorage.setItem('activities', JSON.stringify(sampleActivities));

        // Mark as initialized
        localStorage.setItem('appInitialized', 'true');
    }
}

console.log("Local Storage Contents:", localStorage); // Log local storage contents for debugging

// Initialize app when document is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});


// Dark mode functions
function initDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');

    // Check for saved theme preference or prefer-color-scheme
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    // Set initial state
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
        darkModeToggle.checked = true;
        updateDarkModeIcons(true);
    }

    // Add event listener for toggle
    darkModeToggle.addEventListener('change', function() {
        toggleDarkMode(this.checked);
    });
}

function toggleDarkMode(isDark) {
    if (isDark) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
    }

    updateDarkModeIcons(isDark);
}

function updateDarkModeIcons(isDark) {
    const iconElement = document.querySelector('label[for="darkModeToggle"] i');
    if (iconElement) {
        iconElement.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}
// Placeholder for navigation functionality.  This needs further implementation details.
function getDirectionsToCamp(campLocation) {
    // Implement navigation logic here using a mapping API or redirection to Google Maps.
    console.log("Get directions to:", campLocation);
    // Example using Google Maps:
    // window.open(`https://www.google.com/maps/dir/?api=1&destination=${campLocation.lat},${campLocation.lng}`, '_blank');

}
