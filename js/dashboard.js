// Dashboard page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Update dashboard stats
    updateDashboardStats();

    // Load activity feed
    loadActivityFeed();

    // Set up clear activity button
    const clearActivityBtn = document.getElementById('clearActivityBtn');
    if (clearActivityBtn) {
        clearActivityBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to clear all activities?')) {
                localStorage.setItem('activities', JSON.stringify([]));
                loadActivityFeed();
            }
        });
    }

    // Setup refresh dashboard button
    const refreshBtn = document.getElementById('refreshDashboard');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            updateDashboardStats();
            loadActivityFeed();
            updateLastUpdated();
        });
    }

    // Set initial last updated time
    updateLastUpdated();

    // Refresh dashboard every 30 seconds
    setInterval(updateDashboardStats, 30000);
    setInterval(loadActivityFeed, 30000);
});

function updateDashboardStats() {
    // Update camp count
    const camps = getCamps();
    document.getElementById('totalCamps').textContent = camps.length;

    // Update resource counts
    const resources = getResources();
    document.getElementById('foodCount').textContent = resources.food || 0;
    document.getElementById('shelterCount').textContent = resources.shelter || 0;
    document.getElementById('clothesCount').textContent = resources.clothes || 0;
    document.getElementById('medicineCount').textContent = resources.medicine || 0;
}

function loadActivityFeed() {
    const activities = getActivities();
    const activityFeed = document.getElementById('activityFeed');

    if (activities.length === 0) {
        activityFeed.innerHTML = '<li class="list-group-item text-center text-muted">No recent activities</li>';
        return;
    }

    activityFeed.innerHTML = '';

    activities.forEach(activity => {
        const activityItem = document.createElement('li');
        activityItem.className = 'list-group-item activity-item';

        let iconClass = 'fas fa-info-circle';
        let iconBgClass = 'bg-info';

        switch (activity.type) {
            case 'resource':
                iconClass = 'fas fa-box';
                iconBgClass = 'bg-primary';
                break;
            case 'camp':
                iconClass = 'fas fa-campground';
                iconBgClass = 'bg-success';
                break;
            case 'alert':
                iconClass = 'fas fa-exclamation-triangle';
                iconBgClass = 'bg-danger';
                break;
            case 'user':
                iconClass = 'fas fa-user';
                iconBgClass = 'bg-secondary';
                break;
        }

        // Format timestamp as relative time
        const timestamp = new Date(activity.timestamp);
        const now = new Date();
        const diffMs = now - timestamp;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        let timeStr;
        if (diffDay > 0) {
            timeStr = diffDay + (diffDay === 1 ? ' day ago' : ' days ago');
        } else if (diffHour > 0) {
            timeStr = diffHour + (diffHour === 1 ? ' hour ago' : ' hours ago');
        } else if (diffMin > 0) {
            timeStr = diffMin + (diffMin === 1 ? ' minute ago' : ' minutes ago');
        } else {
            timeStr = 'just now';
        }

        activityItem.innerHTML = `
            <div class="activity-icon ${iconBgClass}">
                <i class="${iconClass}"></i>
            </div>
            <div class="activity-content">
                <div>${activity.message}</div>
                <div class="activity-time">${timeStr}</div>
            </div>
        `;

        activityFeed.appendChild(activityItem);
    });
}

// Update the "last updated" time
function updateLastUpdated() {
    const lastUpdatedEl = document.getElementById('lastUpdated');
    if (lastUpdatedEl) {
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        lastUpdatedEl.textContent = timeStr;
    }
}

// Placeholder functions -  Replace with your actual implementations
function getCamps() { return []; }
function getResources() { return {}; }
function getActivities() { return []; }