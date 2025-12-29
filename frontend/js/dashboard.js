document.addEventListener('DOMContentLoaded', function () {
    // Update dashboard stats
    updateDashboardStats();

    // Load activity feed
    loadActivityFeed();

    // Set up clear activity button
    const clearActivityBtn = document.getElementById('clearActivityBtn');
    if (clearActivityBtn) {
        clearActivityBtn.addEventListener('click', function () {
            if (confirm('Are you sure you want to clear all activities?')) {
                localStorage.setItem('activities', JSON.stringify([]));
                loadActivityFeed();
            }
        });
    }

    // Refresh dashboard every 30 seconds
    setInterval(updateDashboardStats, 30000);
    setInterval(loadActivityFeed, 30000);
});

async function updateDashboardStats() {
    try {
        const response = await fetch("http://localhost:5001/api/dashboard/stats");
        const data = await response.json();

        document.getElementById('totalCamps').textContent = data.camps.active || 0;
        document.getElementById('foodCount').textContent = data.resources.byType.donated.food || 0;
        document.getElementById('shelterCount').textContent = data.resources.byType.donated.shelter || 0;
        document.getElementById('clothesCount').textContent = data.resources.byType.donated.clothes || 0;
        document.getElementById('medicineCount').textContent = data.resources.byType.donated.medicine || 0;
    } catch (error) {
        console.error("Error fetching dashboard stats:", error);
    }
}

async function loadActivityFeed() {
    try {
        const response = await fetch("http://localhost:5001/api/dashboard/recent-activities");
        const data = await response.json();
        const activityFeed = document.getElementById('activityFeed');

        if (!activityFeed) return;

        const activities = [
            ...data.resources.map(r => ({ type: 'resource', message: `${r.quantity} units of ${r.type} ${r.status}`, timestamp: r.createdAt })),
            ...data.alerts.map(a => ({ type: 'alert', message: `Alert: ${a.title} at ${a.location}`, timestamp: a.createdAt })),
            ...data.camps.map(c => ({ type: 'camp', message: `New camp: ${c.name} at ${c.location}`, timestamp: c.createdAt }))
        ];

        if (activities.length === 0) {
            activityFeed.innerHTML = '<li class="list-group-item text-center text-muted">No recent activities</li>';
            return;
        }

        activityFeed.innerHTML = '';

        activities.forEach(activity => {
            const activityItem = document.createElement('li');
            activityItem.className = 'list-group-item activity-item';

            const { iconClass, iconBgClass } = getActivityIcon(activity.type);
            const timeStr = formatTimeAgo(activity.timestamp);

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
    } catch (error) {
        console.error("Error fetching activity feed:", error);
    }
}

function getActivityIcon(type) {
    const icons = {
        resource: { iconClass: 'fas fa-box', iconBgClass: 'bg-primary' },
        camp: { iconClass: 'fas fa-campground', iconBgClass: 'bg-success' },
        alert: { iconClass: 'fas fa-exclamation-triangle', iconBgClass: 'bg-danger' },
        user: { iconClass: 'fas fa-user', iconBgClass: 'bg-secondary' },
        default: { iconClass: 'fas fa-info-circle', iconBgClass: 'bg-info' }
    };
    return icons[type] || icons.default;
}

function formatTimeAgo(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) return `${diffDay} day${diffDay === 1 ? '' : 's'} ago`;
    if (diffHour > 0) return `${diffHour} hour${diffHour === 1 ? '' : 's'} ago`;
    if (diffMin > 0) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    return 'just now';
}