<?php
$navbarType = $navbarType ?? 'guest';
$activeLink = $activeLink ?? '';

$current_user = null;
if (class_exists('AuthMiddleware') && method_exists('AuthMiddleware', 'isLoggedIn') && AuthMiddleware::isLoggedIn()) {
    $current_user = AuthMiddleware::getCurrentUser();
}
?>

<nav class="navbar <?= $navbarType === 'seller' ? 'seller-navbar' : '' ?>">
    <div class="container navbar-container">
        <div class="navbar-left">
            <?php if ($navbarType === 'guest'): ?>
                <a href="/" class="navbar-brand">Nimonspedia</a>
            <?php elseif ($navbarType === 'buyer'): ?>
                <a href="/home" class="navbar-brand">Nimonspedia</a>
                <div class="balance-display" id="balanceDisplay">
                    <span class="balance-label" id="balanceAmount">Balance: Rp <?= number_format($current_user['balance'] ?? 0, 0, ',', '.') ?></span>
                    <button type="button" class="balance-topup-btn" data-action="open-topup">Top Up</button>
                </div>
            <?php elseif ($navbarType === 'seller'): ?>
                <a href="/seller/dashboard" class="navbar-brand">Nimonspedia</a>
                <?php if (isset($store) && $store): ?>
                <div class="balance-display seller-balance-display">
                    <span class="balance-label" id="storeBalanceAmount">
                        Store Balance: Rp <?= number_format($store['balance'] ?? 0, 0, ',', '.') ?>
                    </span>
                </div>
                <?php endif; ?>
                <button class="burger-menu" id="mobileMenuToggle">
                    <span></span>
                    <span></span>
                    <span></span>
                </button>
                <div class="navbar-links" id="navbarMenu">
                    <?php 
                    $sellerLinks = [
                        ['href' => '/seller/dashboard', 'label' => 'Dashboard', 'key' => 'dashboard'],
                        ['href' => '/seller/products', 'label' => 'Produk', 'key' => 'products'],
                        ['href' => '/seller/orders', 'label' => 'Orders', 'key' => 'orders'],
                        ['href' => '/auctions', 'label' => '🔨 Auctions', 'key' => 'auctions'],
                    ];
                    ?>
                    <?php foreach ($sellerLinks as $link): ?>
                        <a href="<?= htmlspecialchars($link['href']) ?>" 
                           class="navbar-link <?= ($activeLink === $link['key']) ? 'active' : '' ?>">
                            <?= htmlspecialchars($link['label']) ?>
                        </a>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>
        </div>
        
        <div class="navbar-right">
            <?php if ($navbarType === 'guest'): ?>
                <div class="auth-links">
                    <a href="/auth/login" class="navbar-link">Login</a>
                    <a href="/auth/register" class="navbar-link">Daftar</a>
                </div>
            <?php elseif ($navbarType === 'buyer'): ?>
                <a href="/cart" class="cart-icon" title="Shopping Cart">
                    <span class="cart-badge" id="cartBadge">0</span>
                    <svg class="cart-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="9" cy="21" r="1"></circle>
                        <circle cx="20" cy="21" r="1"></circle>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                    </svg>
                </a>
                <div class="user-dropdown">
                    <button class="user-profile-btn" id="userProfileBtn">
                        <div class="user-avatar" id="userAvatar"><?= substr($current_user['name'] ?? 'U', 0, 1) ?></div>
                        <span class="user-name" id="userName"><?= htmlspecialchars($current_user['name'] ?? 'User') ?></span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="user-dropdown-menu" id="userDropdownMenu">
                        <a href="/buyer/profile" class="dropdown-item">Profile</a>
                        <a href="/buyer/order-history" class="dropdown-item">Order History</a>
                        <a href="/auctions" class="dropdown-item">Live Auctions</a>
                        <button type="button" class="dropdown-item" onclick="openLogoutModal();">Logout</button>
                    </div>
                </div>
            <?php elseif ($navbarType === 'seller'): ?>
                <button type="button" class="navbar-link logout-link" onclick="openLogoutModal();">Logout</button>
            <?php endif; ?>
        </div>
    </div>
</nav>

<!-- Logout Confirmation Modal -->
<div id="logoutConfirmModal" class="modal-overlay logout-modal-overlay" aria-hidden="true">
    <div class="modal-content logout-modal-content" role="dialog" aria-modal="true" aria-labelledby="logoutModalTitle">
        <h2 id="logoutModalTitle">Confirm Logout</h2>
        <p>Are you sure you want to logout? You will need to login again to access your account.</p>
        <div class="modal-actions">
            <button type="button" class="modal-btn modal-btn-secondary" onclick="closeLogoutModal()">Cancel</button>
            <button type="button" class="modal-btn modal-btn-danger" onclick="confirmLogout()">Logout</button>
        </div>
    </div>
</div>

<script>
function openLogoutModal() {
    const modal = document.getElementById('logoutConfirmModal');
    if (modal) {
        modal.classList.add('is-visible');
        modal.setAttribute('aria-hidden', 'false');
    }
}

function closeLogoutModal() {
    const modal = document.getElementById('logoutConfirmModal');
    if (modal) {
        modal.classList.remove('is-visible');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function confirmLogout() {
    window.location.href = '/auth/logout';
}

// Close modal when clicking on overlay
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('logoutConfirmModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeLogoutModal();
            }
        });
        
        // Close on Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && modal.classList.contains('is-visible')) {
                closeLogoutModal();
            }
        });
    }
});
</script>
