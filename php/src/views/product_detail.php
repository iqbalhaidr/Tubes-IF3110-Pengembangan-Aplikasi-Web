<?php $mainCssVersion = filemtime(__DIR__ . '/../public/css/main.css'); ?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($product['name']); ?></title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/product_detail.css">
    <link rel="stylesheet" href="/public/css/logout-modal.css">
</head>
<body class="product-detail-page">

    <?php
        require __DIR__ . '/components/navbar.php'; 
    ?>

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
                    <div class="description-content"><?php echo $clean_description; ?></div>
                </div>
                
                <div class="store-info">
                    <h3>Info Toko</h3>
                    <div class="store-info-header">
                        <a href="/store/<?php echo htmlspecialchars($product['store_id']); ?>" style="text-decoration: none; color: inherit;">
                            <h4><?php echo htmlspecialchars($store['name']); ?></h4>
                        </a>
                        <a href="/store/<?php echo htmlspecialchars($product['store_id']); ?>" class="btn btn-secondary">
                            Kunjungi Toko
                        </a>
                    </div>
                    <div class="store-desc">
                        <?php 
                        $clean_store_description = Helper::sanitizeRichText($store['description']); 
                        echo $clean_store_description;
                        ?>
                    </div>
                </div>
            </div>

            <div class="action-card">
                <h4>Atur Jumlah</h4>
                
                <?php if ($isUserLoggedIn): ?>
                    <?php
                        if (!class_exists('FeatureFlag')) {
                            require_once __DIR__ . '/../../utils/FeatureFlag.php';
                        }
                        $userId = $current_user['user_id'] ?? null;
                    ?>
                    <?php if (FeatureFlag::isEnabled(FeatureFlag::CHECKOUT_ENABLED, $userId)): ?>
                        <div id="cartForm">
                            <div class="quantity-selector">
                                <button id="qty-minus" class="qty-btn" disabled aria-label="Kurangi jumlah">–</button>
                                <label for="qty-input" class="sr-only">Jumlah produk</label>
                                <input type="number" id="qty-input" value="1" min="1" 
                                       max="<?php echo $product['stock']; ?>" 
                                       data-max-stock="<?php echo $product['stock']; ?>"
                                       aria-label="Jumlah produk yang ingin ditambahkan">
                                <button id="qty-plus" class="qty-btn" 
                                       aria-label="Tambah jumlah"
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
                            <p>Fitur checkout sedang tidak tersedia saat ini.</p>
                        </div>
                    <?php endif; ?>
                
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
    <script src="/public/js/balance.js"></script>
    <script src="/public/js/main.js"></script>
    <script src="/public/js/product_detail.js"></script> 
</body>
</html>