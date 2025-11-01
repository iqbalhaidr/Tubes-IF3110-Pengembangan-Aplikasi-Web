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
                <div class="navbar-links" id="navbarMenu">
                    <?php 
                    $defaultSellerLinks = [
                        ['href' => '/seller/dashboard', 'label' => 'Dashboard', 'key' => 'dashboard'],
                        ['href' => '/seller/products', 'label' => 'Produk', 'key' => 'products'],
                        ['href' => 'javascript:void(0);', 'label' => 'Orders', 'key' => 'orders'],
                        ['href' => '/seller/profile', 'label' => 'Profile', 'key' => 'profile'],
                    ];
                    $sellerLinks = $navLinks ?? $defaultSellerLinks;
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
                    🛒
                </a>
                <div class="user-dropdown">
                    <button class="user-profile-btn" id="userProfileBtn">
                        <div class="user-avatar" id="userAvatar"><?= substr($current_user['name'] ?? 'U', 0, 1) ?></div>
                        <span class="user-name" id="userName"><?= htmlspecialchars($current_user['name'] ?? 'User') ?></span>
                        <span class="dropdown-arrow">▼</span>
                    </button>
                    <div class="user-dropdown-menu" id="userDropdownMenu">
                        <a href="/buyer/profile" class="dropdown-item">Profile</a>
                        <a href="javascript:void(0);" class="dropdown-item">Order History</a>
                        <a href="/auth/logout" class="dropdown-item">Logout</a>
                    </div>
                </div>
            <?php elseif ($navbarType === 'seller'): ?>
                <a href="/auth/logout" class="navbar-link logout-link">Logout</a>
            <?php endif; ?>
        </div>
    </div>
</nav>
