// Main JavaScript for Nimonspedia

// DOM Elements
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navbarMenu = document.getElementById('navbarMenu');
const logoutBtn = document.getElementById('logoutBtn');

// Mobile Menu Toggle
if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navbarMenu.classList.toggle('active');
    });
}

// Logout Functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/auth/logout', {
                method: 'GET'
            });

            if (response.ok) {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
}

// Check if user is logged in and update navbar
async function checkAuthStatus() {
    try {
        const response = await fetch('/auth/me', {
            method: 'GET'
        });

        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
                // User is logged in
                showUserMenu(data.data);
            } else {
                // User is not logged in
                showAuthLinks();
            }
        } else {
            // User is not logged in
            showAuthLinks();
        }
    } catch (error) {
        console.error('Auth check error:', error);
        showAuthLinks();
    }
}

function showUserMenu(userData) {
    const userProfile = document.getElementById('userProfile');
    const authLinks = document.getElementById('authLinks');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const balanceDisplay = document.getElementById('balanceDisplay');

    if (userProfile && authLinks) {
        userProfile.style.display = 'flex';
        authLinks.style.display = 'none';
        
        if (userName) {
            userName.textContent = userData.name || 'User';
        }
        
        if (userAvatar && userData.name) {
            userAvatar.textContent = userData.name.charAt(0).toUpperCase();
        }
        
        if (balanceDisplay) {
            balanceDisplay.style.display = 'flex';
            if (userData.balance !== undefined) {
                balanceDisplay.textContent = `💰 Balance: Rp. ${formatCurrency(userData.balance)}`;
            }
        }
    }
}

function showAuthLinks() {
    const userProfile = document.getElementById('userProfile');
    const authLinks = document.getElementById('authLinks');
    const balanceDisplay = document.getElementById('balanceDisplay');

    if (userProfile && authLinks) {
        userProfile.style.display = 'none';
        authLinks.style.display = 'flex';
        
        if (balanceDisplay) {
            balanceDisplay.style.display = 'none';
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});