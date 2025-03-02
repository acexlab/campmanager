
// Resources page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Load camps for dropdowns
    loadCampsForDropdowns();
    
    // Load high priority requests
    loadHighPriorityRequests();
    
    // Set up event listeners for forms
    setupResourceForms();
    
    // Refresh high priority requests every 30 seconds
    setInterval(loadHighPriorityRequests, 30000);
});

function loadCampsForDropdowns() {
    const camps = getCamps();
    const requestCampDropdown = document.getElementById('requestCamp');
    const donateCampDropdown = document.getElementById('donateCamp');
    
    // Clear existing options except first one
    while (requestCampDropdown.options.length > 1) {
        requestCampDropdown.remove(1);
    }
    
    while (donateCampDropdown.options.length > 1) {
        donateCampDropdown.remove(1);
    }
    
    // Add camp options
    camps.forEach(camp => {
        const requestOption = document.createElement('option');
        requestOption.value = camp.name;
        requestOption.textContent = camp.name;
        requestCampDropdown.appendChild(requestOption);
        
        const donateOption = document.createElement('option');
        donateOption.value = camp.name;
        donateOption.textContent = camp.name;
        donateCampDropdown.appendChild(donateOption);
    });
}

function loadHighPriorityRequests() {
    const requests = getRequests();
    const highPriorityList = document.getElementById('highPriorityList');
    
    // Filter for pending high priority requests
    const highPriorityRequests = requests.filter(req => 
        req.status === 'pending' && req.priority === 'High'
    );
    
    // Clear the list
    highPriorityList.innerHTML = '';
    
    if (highPriorityRequests.length === 0) {
        highPriorityList.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No high priority requests</td></tr>';
        return;
    }
    
    // Add to the list
    highPriorityRequests.forEach(request => {
        const row = document.createElement('tr');
        row.className = 'high-priority';
        
        row.innerHTML = `
            <td>${request.campName}</td>
            <td>${request.resourceType}</td>
            <td>${request.quantity}</td>
            <td>${request.name}</td>
            <td>
                <button class="btn btn-sm btn-success fulfill-btn" data-request-id="${request.id}">
                    <i class="fas fa-check me-1"></i>Fulfill
                </button>
            </td>
        `;
        
        highPriorityList.appendChild(row);
    });
    
    // Add event listeners to fulfill buttons
    document.querySelectorAll('.fulfill-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const requestId = this.getAttribute('data-request-id');
            fulfillRequestById(requestId);
        });
    });
}

function setupResourceForms() {
    // Request form submission
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const request = {
                name: document.getElementById('requestName').value,
                contact: document.getElementById('requestContact').value,
                resourceType: document.getElementById('requestResourceType').value,
                quantity: parseInt(document.getElementById('requestQuantity').value),
                priority: document.getElementById('requestPriority').value,
                campName: document.getElementById('requestCamp').value,
                directDelivery: document.getElementById('directDelivery').checked
            };
            
            saveRequest(request);
            
            // Reset form
            requestForm.reset();
            
            // Update high priority list if needed
            if (request.priority === 'High') {
                loadHighPriorityRequests();
            }
            
            alert('Request submitted successfully!');
        });
    }
    
    // Donate form submission
    const donateForm = document.getElementById('donateForm');
    if (donateForm) {
        donateForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const donation = {
                name: document.getElementById('donateName').value,
                contact: document.getElementById('donateContact').value,
                resourceType: document.getElementById('donateResourceType').value,
                quantity: parseInt(document.getElementById('donateQuantity').value),
                campName: document.getElementById('donateCamp').value
            };
            
            saveDonation(donation);
            
            // Reset form
            donateForm.reset();
            
            // Reload high priority requests (might be fulfilled by this donation)
            loadHighPriorityRequests();
            
            alert('Donation recorded successfully! Thank you for your contribution.');
        });
    }
}

function fulfillRequestById(requestId) {
    if (confirm('Mark this request as fulfilled?')) {
        if (fulfillRequest(requestId)) {
            loadHighPriorityRequests();
        } else {
            alert('Error fulfilling request.');
        }
    }
}
