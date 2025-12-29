// Resources page functionality
document.addEventListener('DOMContentLoaded', function () {
    loadCampsForDropdowns();
    loadHighPriorityRequests();
    setupResourceForms();
    setInterval(loadHighPriorityRequests, 30000);
});

function loadCampsForDropdowns() {
    const camps = getCamps();
    const requestCampDropdown = document.getElementById('requestCamp');
    const donateCampDropdown = document.getElementById('donateCamp');

    while (requestCampDropdown.options.length > 1) requestCampDropdown.remove(1);
    while (donateCampDropdown.options.length > 1) donateCampDropdown.remove(1);

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

// Updated: Save multiple high-priority requests instead of overwriting
function saveRequest(request) {
    let requests = JSON.parse(localStorage.getItem('highPriorityRequests')) || [];

    if (request.priority === 'High') {
        requests.push(request);
        localStorage.setItem('highPriorityRequests', JSON.stringify(requests));
        loadHighPriorityRequests();
    }
}

// Updated: Load all high-priority requests from storage
function loadHighPriorityRequests() {
    const highPriorityList = document.getElementById('highPriorityList');
    const requests = JSON.parse(localStorage.getItem('highPriorityRequests')) || [];

    highPriorityList.innerHTML = '';

    if (requests.length === 0) {
        highPriorityList.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No high priority requests</td></tr>';
        return;
    }

    requests.forEach(request => {
        const row = document.createElement('tr');
        row.className = 'high-priority';

        row.innerHTML = `
            <td>${request.campName}</td>
            <td>${request.resourceType}</td>
            <td>${request.quantity}</td>
            <td>${request.name}</td>
            <td>
                <button class="btn btn-sm btn-success fulfill-btn" data-camp="${request.campName}" 
                    data-resource="${request.resourceType}" data-quantity="${request.quantity}">
                    <i class="fas fa-check me-1"></i> Fulfill
                </button>
            </td>
        `;

        highPriorityList.appendChild(row);
    });
}

function setupResourceForms() {
    const requestForm = document.getElementById('requestForm');
    if (requestForm) {
        requestForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const contact = document.getElementById('requestContact').value.trim();
            if (!/^\d{10}$/.test(contact)) {
                alert('Please enter a valid 10-digit contact number in the Request Form.');
                return;
            }

            const request = {
                id: Date.now(), // Unique ID for tracking
                name: document.getElementById('requestName').value,
                contact: contact,
                resourceType: document.getElementById('requestResourceType').value,
                quantity: parseInt(document.getElementById('requestQuantity').value),
                priority: document.getElementById('requestPriority').value,
                campName: document.getElementById('requestCamp').value,
                directDelivery: document.getElementById('directDelivery').checked
            };

            saveRequest(request);
            requestForm.reset();

            alert('Request submitted successfully!');
        });
    }

    const donateForm = document.getElementById('donateForm');
    if (donateForm) {
        donateForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const contact = document.getElementById('donateContact').value.trim();
            if (!/^\d{10}$/.test(contact)) {
                alert('Please enter a valid 10-digit contact number in the Donate Form.');
                return;
            }

            const donatedCamp = document.getElementById('donateCamp').value;
            const donatedResourceType = document.getElementById('donateResourceType').value;
            const donatedQuantity = parseInt(document.getElementById('donateQuantity').value);

            saveDonation({
                campName: donatedCamp,
                resourceType: donatedResourceType,
                quantity: donatedQuantity
            });

            removeFulfilledHighPriorityRequest(donatedCamp, donatedResourceType, donatedQuantity);

            donateForm.reset();
            alert('Donation submitted successfully!');
        });
    }
}

// Updated: Ensure high-priority requests update correctly
function removeFulfilledHighPriorityRequest(campName, resourceType, quantity) {
    let requests = JSON.parse(localStorage.getItem('highPriorityRequests')) || [];

    for (let i = 0; i < requests.length; i++) {
        if (requests[i].campName === campName && requests[i].resourceType === resourceType) {
            if (requests[i].quantity > quantity) {
                requests[i].quantity -= quantity; // Deduct quantity
            } else {
                requests.splice(i, 1); // Remove if fully fulfilled
            }
            break;
        }
    }

    localStorage.setItem('highPriorityRequests', JSON.stringify(requests));
    loadHighPriorityRequests();
}

// Updated: Fulfill button now updates the donation form correctly
document.getElementById('highPriorityList').addEventListener('click', function (event) {
    if (event.target.classList.contains('fulfill-btn')) {
        const camp = event.target.getAttribute('data-camp');
        const resourceType = event.target.getAttribute('data-resource');
        const quantity = event.target.getAttribute('data-quantity');

        document.getElementById('donateCamp').value = camp;
        document.getElementById('donateResourceType').value = resourceType;
        document.getElementById('donateQuantity').value = quantity;

        const donateTab = new bootstrap.Tab(document.querySelector('#donate-tab'));
        donateTab.show();

        document.getElementById('donateForm').scrollIntoView({ behavior: 'smooth' });
    }
});