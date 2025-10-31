<?php $mainCssVersion = filemtime(__DIR__ . '/../public/css/main.css'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($product['name']); ?></title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/product_detail.css">
</head>
<body class="product-detail-page">

    <nav class="navbar">
        <div class="container navbar-container">
            <a href="/buyer/home" class="navbar-brand">Nimonspedia</a>
            <div class="navbar-left">
                <?php if ($isUserLoggedIn): ?>
                <div class="balance-display" id="balanceDisplay">
                    <span class="balance-label">Balance: Rp. <span id="balanceAmount"><?= number_format($current_user['balance'] ?? 0, 0, ',', '.') ?></span></span>
                    <button type="button" class="balance-topup-btn" data-action="open-topup">Top Up</button>
                </div>
                <?php endif; ?>
                <div class="navbar-links" id="navbarMenu">
                    <a href="/buyer/home" class="navbar-link active">Discover</a>
                    <a href="javascript:void(0);" class="navbar-link">Cart</a>
                    <a href="javascript:void(0);" class="navbar-link">Checkout</a>
                    <a href="javascript:void(0);" class="navbar-link">Orders</a>
                    <?php if ($isUserLoggedIn): ?>
                    <a href="/buyer/profile" class="navbar-link">Profile</a>
                    <?php endif; ?>
                </div>
            </div>
            <div class="navbar-right">
                <?php if ($isUserLoggedIn): ?>
                <div class="user-profile" id="userProfile" style="display: flex;">
                    <div class="user-avatar" id="userAvatar"><?= htmlspecialchars(strtoupper($current_user['name'][0])) ?></div>
                    <span class="user-name" id="userName"><?= htmlspecialchars($current_user['name']) ?></span>
                    <button class="logout-icon" id="logoutBtn" title="Logout">Logout</button>
                </div>
                <?php else: ?>
                <div class="auth-links" id="authLinks" style="display: flex;">
                    <a href="/auth/login" class="navbar-link">Login</a>
                    <a href="/auth/register" class="navbar-link">Register</a>
                </div>
                <?php endif; ?>
            </div>
            <button class="mobile-menu-toggle" id="mobileMenuToggle" aria-label="Toggle navigation">
                <span class="menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
            </button>
        </div>
    </nav>

    <main class="container">
        <div class="product-detail-container">
            
            <div class="product-gallery">
                <img src="<?php echo htmlspecialchars($product['image']); ?>" 
                     alt="<?php echo htmlspecialchars($product['name']); ?>"
                     onerror="this.style.display='none'; this.parentElement.innerHTML='🛒'">
            </div>

            <div class="product-details">
                <h1><?php echo htmlspecialchars($product['name']); ?></h1>
                
                <div class="product-price-main">
                    Rp. <?php echo number_format($product['price']); ?>
                </div>

                <div class="product-meta">
                    <span>Kategori: <strong><?php echo htmlspecialchars($categories); ?></strong></span>
                </div>

                <div class="product-description">
                    <h3>Deskripsi Produk</h3>
                    <p><?php echo nl2br(htmlspecialchars($product['description'])); ?></p>
                </div>
                
                <div class="store-info">
                    <h3>Info Toko</h3>
                    <div class="store-info-header">
                        <h4><?php echo htmlspecialchars($store['name']); ?></h4>
                        <a href="/store/<?php echo htmlspecialchars($product['store_id']); ?>" class="btn btn-secondary">
                            Kunjungi Toko
                        </a>
                    </div>
                    <p class="store-desc"><?php echo nl2br(htmlspecialchars($store['description'])); ?></p>
                </div>
            </div>

            <div class="action-card">
                <h4>Atur Jumlah</h4>
                
                <?php if ($isUserLoggedIn): ?>
                    <div id="cartForm">
                        <div class="quantity-selector">
                            <button id="qty-minus" class="qty-btn" disabled>–</button>
                            <input type="number" id="qty-input" value="1" min="1" 
                                   max="<?php echo $product['stock']; ?>" 
                                   data-max-stock="<?php echo $product['stock']; ?>">
                            <button id="qty-plus" class="qty-btn" 
                                   <?php echo ($product['stock'] <= 1) ? 'disabled' : ''; ?>>+</button>
                        </div>
                        <span class="stock-info">
                            Stok tersisa: <strong><?php echo $product['stock']; ?></strong>
                        </span>

                        <button id="addToCartBtn" class="btn btn-primary" 
                                <?php echo ($product['stock'] == 0) ? 'disabled' : ''; ?>
                                data-product-id="<?php echo $product['id']; ?>">
                            <?php echo ($product['stock'] == 0) ? 'Stok Habis' : 'Tambah ke Keranjang'; ?>
                        </button>
                    </div>
                
                <?php else: ?>
                    <div class="guest-message">
                        <p>Silakan <a href="/auth/login">Login</a> untuk menambahkan ke keranjang.</p>
                    </div>
                <?php endif; ?>
            </div>

        </div>
    </main>
    
    <div id="toast" class="toast"></div>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/main.js"></script>
    <script src="/public/js/product_detail.js"></script> 
</body>
</html>