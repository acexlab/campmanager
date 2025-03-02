//This code snippet is incomplete and needs additional context (HTML, CSS, Javascript functions) to function correctly.  The provided change only modifies the alert display to include a directions button.  A complete implementation requires additional code to handle the button click and open a mapping application with directions.



// Example alert data (replace with your actual data)
const alerts = [
  {
    id: 1,
    title: "Campsite Closed",
    type: "closure",
    description: "Campsite 1 is closed due to maintenance.",
    radius: 5,
    location: { lat: 34.0522, lng: -118.2437 } // Example coordinates
  },
  {
    id: 2,
    title: "Fire Hazard",
    type: "hazard",
    description: "High fire risk in area. Exercise caution.",
    radius: 10,
    location: { lat: 37.7749, lng: -122.4194 } // Example coordinates
  }
  // Add more alerts as needed
];


function displayAlerts(alerts) {
  const alertsContainer = document.getElementById('alerts-container');
  alertsContainer.innerHTML = ''; // Clear previous alerts

  alerts.forEach(alert => {
    const alertHtml = `
      <div class="alert alert-warning alert-dismissible fade show" role="alert">
        <strong>${alert.title}</strong><br>
        Type: ${alert.type}<br>
        Description: ${alert.description}<br>
        Radius: ${alert.radius} km<br>
        <div class="d-flex gap-2 mt-2">
          <button class="btn btn-sm btn-danger delete-alert-btn" data-alert-id="${alert.id}">
            <i class="fas fa-trash"></i> Delete
          </button>
          <button class="btn btn-sm btn-success get-directions-btn" data-lat="${alert.location.lat}" data-lng="${alert.location.lng}">
            <i class="fas fa-directions"></i> Directions
          </button>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
      </div>
    `;
    alertsContainer.innerHTML += alertHtml;
  });


  // Add event listener for the directions button (requires additional code for actual directions functionality)
  const directionsButtons = document.querySelectorAll('.get-directions-btn');
  directionsButtons.forEach(button => {
    button.addEventListener('click', () => {
      const lat = button.dataset.lat;
      const lng = button.dataset.lng;
      // Add your directions logic here (e.g., open Google Maps with directions)
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');

    });
  });


  // Add event listeners for delete buttons (requires additional code for deleting alerts)
  const deleteButtons = document.querySelectorAll('.delete-alert-btn');
  deleteButtons.forEach(button => {
    button.addEventListener('click', () => {
      const alertId = button.dataset.alertId;
      // Add your alert deletion logic here.
      console.log("Delete alert with ID:", alertId);
    });
  });
}

displayAlerts(alerts);