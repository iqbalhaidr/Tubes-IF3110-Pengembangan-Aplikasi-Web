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
        mobileMenuToggle.classList.toggle('active');
        navbarMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    const navLinks = navbarMenu.querySelectorAll('a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            navbarMenu.classList.remove('active');
        });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!mobileMenuToggle.contains(e.target) && !navbarMenu.contains(e.target)) {
            mobileMenuToggle.classList.remove('active');
            navbarMenu.classList.remove('active');
        }
    });
}

// User Dropdown Functionality
const userProfileBtn = document.getElementById('userProfileBtn');
const userDropdown = document.querySelector('.user-dropdown');

if (userProfileBtn && userDropdown) {
    userProfileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userDropdown.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
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

// Toast Notification
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.className = 'toast show';
    if (type === 'error') {
        toast.style.backgroundColor = 'var(--error-red)';
    } else {
        toast.style.backgroundColor = 'var(--text-dark)';
    }

    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// Cart badge counter
async function updateGlobalCartBadge() {
    const cartBadge = document.getElementById('cartBadge');
    if (!cartBadge) return;

    try {
        const response = await window.api.get('/api/cartcounter');
        
        if (response && response.success && response.data) {
            const uniqueItemCount = response.data.unique_item_count || 0;
            
            cartBadge.textContent = uniqueItemCount;
            if (uniqueItemCount > 0) {
                cartBadge.style.display = 'flex';
            } else {
                cartBadge.style.display = 'none';
            }
        } else {
            cartBadge.style.display = 'none';
        }
    } catch (error) {
        console.error('Failed to fetch cart badge count:', error);
        if (cartBadge) cartBadge.style.display = 'none';
    }
}

// Check if user is logged in and update cart badge counter
async function checkCartBadgeCounter() {
    if (!window.api || typeof window.api.get !== 'function') {
        return;
    }

    const data = await window.api.get('/auth/me');
    
    if (data && data.success && data.data) {
        if (data.data.role === 'BUYER') {
            updateGlobalCartBadge();
        }
    }      
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
    checkCartBadgeCounter();
});
