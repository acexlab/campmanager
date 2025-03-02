
// Login page functionality

document.addEventListener('DOMContentLoaded', function() {
    // Check if already logged in
    if (localStorage.getItem('currentUser')) {
        window.location.href = 'index.html';
    }
    
    // Set up login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            if (validateLogin(username, password)) {
                // Set current user in localStorage
                localStorage.setItem('currentUser', username);
                
                // Add to activity feed
                addActivity(`User ${username} logged in`, 'user');
                
                // Redirect to dashboard
                window.location.href = 'index.html';
            } else {
                // Show error
                document.getElementById('loginError').classList.remove('d-none');
                setTimeout(() => {
                    document.getElementById('loginError').classList.add('d-none');
                }, 3000);
            }
        });
    }
});

function validateLogin(username, password) {
    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users')) || [];
    
    // Check if username and password match
    return users.some(user => 
        user.username === username && user.password === password
    );
}
