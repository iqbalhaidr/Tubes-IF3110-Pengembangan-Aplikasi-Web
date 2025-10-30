<?php $mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Product Discovery</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
</head>
<body class="buyer-home">
    <nav class="navbar">
        <div class="container navbar-container">
            <a href="/buyer/home" class="navbar-brand">Nimonspedia</a>
            <div class="navbar-left">
                <div class="balance-display" id="balanceDisplay">
                    <span class="balance-label">Balance: Rp. <span id="balanceAmount"><?= number_format($current_user['balance'] ?? 0, 0, ',', '.') ?></span></span>
                    <button type="button" class="balance-topup-btn" data-action="open-topup">Top Up</button>
                </div>
                <div class="navbar-links" id="navbarMenu">
                    <a href="/buyer/home" class="navbar-link active">Discover</a>
                    <a href="javascript:void(0);" class="navbar-link">Cart</a>
                    <a href="javascript:void(0);" class="navbar-link">Checkout</a>
                    <a href="javascript:void(0);" class="navbar-link">Orders</a>
                    <a href="/buyer/profile" class="navbar-link">Profile</a>
                </div>
            </div>
            <div class="navbar-right">
                <div class="user-profile" id="userProfile" style="display: none;">
                    <div class="user-avatar" id="userAvatar">U</div>
                    <span class="user-name" id="userName">User</span>
                    <button class="logout-icon" id="logoutBtn" title="Logout">Logout</button>
                </div>
                <div class="auth-links" id="authLinks">
                    <a href="/auth/login" class="navbar-link">Login</a>
                    <a href="/auth/register" class="navbar-link">Register</a>
                </div>
            </div>
            <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle navigation">
                <span class="menu-icon" aria-hidden="true">
                    <span></span>
                    <span></span>
                    <span></span>
                </span>
            </button>
        </div>
    </nav>

    <div class="filter-bar">
        <div class="container">
            <div class="filter-container">
                <div class="search-wrapper">
                    <span class="search-icon" aria-hidden="true"></span>
                    <input type="text" class="search-input" id="searchInput" placeholder="Search for products or stores">
                </div>
                <button class="filter-button" id="categoryFilter">Filter by Category</button>
                <button class="filter-button" id="priceFilter">Filter by Price</button>
            </div>
            <?php if (!empty($categories)): ?>
            <div class="category-pills" id="categoryPills">
                <?php foreach ($categories as $category): ?>
                    <button class="pill" data-category-id="<?= htmlspecialchars($category['category_id']) ?>">
                        <?= htmlspecialchars($category['name']) ?>
                    </button>
                <?php endforeach; ?>
            </div>
            <?php endif; ?>
        </div>
    </div>

    <main class="main-content">
        <div class="container">
            <div class="products-grid" id="productsGrid">
                <?php for ($i = 0; $i < 6; $i++): ?>
                <div class="product-card">
                    <div class="product-image">
                        <span class="image-placeholder">Image Preview</span>
                    </div>
                    <div class="product-info">
                        <div class="product-name">Product Name</div>
                        <div class="product-price">Rp 0</div>
                        <div class="product-meta">
                            <span class="meta-badge" aria-hidden="true">✔</span>
                            <span class="meta-text">Kota Jakarta</span>
                        </div>
                    </div>
                </div>
                <?php endfor; ?>
            </div>
            <div class="pagination" id="pagination">
                <button class="pagination-button" id="prevPage">Previous</button>
                <span class="page-info">1</span>
                <button class="pagination-button" id="nextPage">Next</button>
            </div>
        </div>
    </main>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/balance.js"></script>
    <script src="/public/js/main.js"></script>
</body>
</html>
