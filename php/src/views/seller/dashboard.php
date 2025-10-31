<?php $mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Seller Dashboard</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
</head>
<body class="seller-dashboard">
    <nav class="navbar seller-navbar">
        <div class="container navbar-container">
            <a href="/seller/dashboard" class="navbar-brand">Nimonspedia</a>
            <div class="seller-tabs" id="navbarMenu">
                <a href="/seller/dashboard" class="navbar-link active">Dashboard</a>
                <a href="javascript:void(0);" class="navbar-link">Product Management</a>
                <a href="javascript:void(0);" class="navbar-link">Order Management</a>
                <a href="/seller/profile" class="navbar-link">Profile</a>
            </div>
            <div class="navbar-right">
                <div class="user-profile" id="userProfile" style="display: none;">
                    <div class="user-avatar" id="userAvatar">S</div>
                    <span class="user-name" id="userName">Seller</span>
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

    <main class="dashboard-content">
        <div class="container">
            <header class="dashboard-header">
                <h1>Dashboard</h1>
                <p class="dashboard-subtitle">Welcome back! Here's a quick look at how your store is doing.</p>
            </header>

            <section class="dashboard-summary">
                <div class="summary-card">
                    <span class="summary-title">Total unique products</span>
                    <span class="summary-value"><?= htmlspecialchars(number_format($stats['total_products'])) ?></span>
                </div>
                <div class="summary-card">
                    <span class="summary-title">Pending orders</span>
                    <span class="summary-value"><?= htmlspecialchars(number_format($stats['pending_orders'])) ?></span>
                </div>
                <div class="summary-card">
                    <span class="summary-title">Products under 10 stock</span>
                    <span class="summary-value"><?= htmlspecialchars(number_format($stats['low_stock'])) ?></span>
                </div>
                <div class="summary-card">
                    <span class="summary-title">Total revenue</span>
                    <span class="summary-value">Rp <?= htmlspecialchars(number_format($stats['total_revenue'])) ?></span>
                </div>
            </section>

            <section class="dashboard-grid">
                <div class="dashboard-panel">
                    <h2>Store Activity</h2>
                    <p class="panel-description">Track recent orders, fulfillment performance, and customer activity.</p>
                    <div class="panel-placeholder" aria-hidden="true">Analytics coming soon</div>
                </div>
                <div class="dashboard-actions">
                    <a class="action-card" href="javascript:void(0);">
                        <h3>Product Management</h3>
                        <p>Keep your catalog up to date with the latest items.</p>
                    </a>
                    <a class="action-card" href="javascript:void(0);">
                        <h3>Order Management</h3>
                        <p>Review new orders and keep customers informed.</p>
                    </a>
                    <a class="action-card" href="javascript:void(0);">
                        <h3>Add Product</h3>
                        <p>Quickly list a new product and reach buyers faster.</p>
                    </a>
                </div>
            </section>
        </div>
    </main>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/main.js"></script>
</body>
</html>
