// Main JavaScript for Nimonspedia

// DOM Elements
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navbarMenu = document.getElementById('navbarMenu');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const priceFilter = document.getElementById('priceFilter');
const productsGrid = document.getElementById('productsGrid');
const logoutBtn = document.getElementById('logoutBtn');
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');

// Mobile Menu Toggle
if (mobileMenuToggle && navbarMenu) {
    mobileMenuToggle.addEventListener('click', () => {
        navbarMenu.classList.toggle('active');
    });
}

// Search Functionality
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });

    // Also trigger search on input (debounced would be better in production)
    searchInput.addEventListener('input', () => {
        // TODO: Add debounced search functionality
    });
}

function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        console.log('Searching for:', query);
        // TODO: Implement search functionality
        // This will be implemented when the backend is ready
    }
}

// Filter Functionality
if (categoryFilter) {
    categoryFilter.addEventListener('click', () => {
        console.log('Category filter clicked');
        // TODO: Implement category filter
    });
}

if (priceFilter) {
    priceFilter.addEventListener('click', () => {
        console.log('Price filter clicked');
        // TODO: Implement price filter
    });
}

// Logout Functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        // Use normal navigation for logout to avoid JSON parsing issues
        window.location.href = '/auth/logout';
    });
}

// Pagination
if (prevPageBtn) {
    prevPageBtn.addEventListener('click', () => {
        console.log('Previous page clicked');
        // TODO: Implement pagination
    });
}

if (nextPageBtn) {
    nextPageBtn.addEventListener('click', () => {
        console.log('Next page clicked');
        // TODO: Implement pagination
    });
}

// Check if user is logged in and update navbar
async function checkAuthStatus() {
    try {
        if (!window.api || typeof window.api.get !== 'function') {
            console.error('API helper not available');
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
                balanceDisplay.textContent = `Balance: Rp. ${formatCurrency(userData.balance)}`;
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

// Load products (placeholder for when backend is ready)
function loadProducts() {
    // TODO: Implement product loading from backend
    console.log('Loading products...');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    // loadProducts(); // Uncomment when backend is ready
});

// Add to cart functionality (placeholder)
document.addEventListener('click', (e) => {
    const addButton = e.target.closest('[data-action="add-to-cart"]');
    if (addButton) {
        console.log('Add to cart clicked');
        // TODO: Implement add to cart
    }
});
