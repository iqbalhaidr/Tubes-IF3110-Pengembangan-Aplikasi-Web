// Main JavaScript for Nimonspedia

// DOM Elements
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navbarMenu = document.getElementById('navbarMenu');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const priceFilter = document.getElementById('priceFilter');
const productsGrid = document.getElementById('productsGrid');
const logoutBtn = document.getElementById('logoutBtn');

// Mobile Menu Toggle
if (mobileMenuToggle && navbarMenu) {
    mobileMenuToggle.addEventListener('click', () => {
        navbarMenu.classList.toggle('active');
    });
}

// Logout Functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        // Use normal navigation for logout to avoid JSON parsing issues
        window.location.href = '/auth/logout';
    });
}

// Check if user is logged in and update navbar
async function checkAuthStatus() {
    try {
        if (!window.api || typeof window.api.get !== 'function') {
            showAuthLinks();
            return;
        }

        const data = await window.api.get('/auth/me');
        
        if (data && data.success && data.data) {
            showUserMenu(data.data);
        } else {
            showAuthLinks();
        }
    } catch (error) {
        showAuthLinks();
    }
}

function showUserMenu(userData) {
    const userProfile = document.getElementById('userProfile');
    const authLinks = document.getElementById('authLinks');
    const userName = document.getElementById('userName');
    const userAvatar = document.getElementById('userAvatar');
    const balanceAmount = document.getElementById('balanceAmount');

    if (userProfile && authLinks) {
        userProfile.style.display = 'flex';
        authLinks.style.display = 'none';
        
        if (userName) {
            userName.textContent = userData.name || 'User';
        }
        
        if (userAvatar && userData.name) {
            userAvatar.textContent = userData.name.charAt(0).toUpperCase();
        }
        
        // Update balance amount if element exists (buyer pages only)
        if (balanceAmount && userData.role === 'BUYER' && userData.balance !== undefined) {
            balanceAmount.textContent = formatCurrency(userData.balance);
        }
    }
}

function showAuthLinks() {
    const userProfile = document.getElementById('userProfile');
    const authLinks = document.getElementById('authLinks');

    if (userProfile && authLinks) {
        userProfile.style.display = 'none';
        authLinks.style.display = 'flex';
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
