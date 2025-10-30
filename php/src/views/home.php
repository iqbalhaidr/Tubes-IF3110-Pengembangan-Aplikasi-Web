<?php
$mainCssVersion = filemtime(__DIR__ . '/../public/css/main.css');

$featuredProducts = [
    [
        'name' => 'Starter Pack Nimons Plush',
        'price' => 45000,
        'store' => 'Nimons Official Store',
        'location' => 'Kota Nimopolis',
        'tag' => 'Official Store',
        'rating' => 4.9,
        'sold' => '1,2 rb',
        'label' => 'Gratis Ongkir'
    ],
    [
        'name' => 'Figur Koleksi Nimons Series 2',
        'price' => 89000,
        'store' => 'Nimon Lab',
        'location' => 'Kota Bandung',
        'tag' => 'Terlaris',
        'rating' => 4.8,
        'sold' => '870',
        'label' => 'Cashback 5%'
    ],
    [
        'name' => 'Sticker Pack Nimons Limited',
        'price' => 18000,
        'store' => 'Nimons Creative Hub',
        'location' => 'Kota Jakarta',
        'tag' => 'Promo',
        'rating' => 4.7,
        'sold' => '540',
        'label' => 'Bebas Ongkir'
    ],
    [
        'name' => 'Aksesoris Gadget Nimons',
        'price' => 62000,
        'store' => 'Nimons Tech',
        'location' => 'Kota Surabaya',
        'tag' => 'Pilihan Pembeli',
        'rating' => 4.9,
        'sold' => '2,1 rb',
        'label' => 'Cicilan 0%'
    ],
    [
        'name' => 'Apparel Nimons Everyday Tee',
        'price' => 99000,
        'store' => 'Nimons Apparel',
        'location' => 'Kota Yogyakarta',
        'tag' => 'Baru',
        'rating' => 4.6,
        'sold' => '320',
        'label' => 'Diskon 20%'
    ],
    [
        'name' => 'Poster Nimons Wall Art',
        'price' => 35000,
        'store' => 'Nimonspace Gallery',
        'location' => 'Kota Malang',
        'tag' => 'Favorit',
        'rating' => 4.8,
        'sold' => '610',
        'label' => 'Siap Kirim'
    ],
];

$fallbackCategories = [
    ['name' => 'Nimons Collectibles'],
    ['name' => 'Merchandise'],
    ['name' => 'Apparel'],
    ['name' => 'Aksesoris Gadget'],
    ['name' => 'Dekorasi'],
    ['name' => 'Peralatan Kreatif'],
    ['name' => 'Digital Goods'],
    ['name' => 'Bundel Spesial'],
];

$categoryPreviews = (is_array($categories) && !empty($categories))
    ? array_slice($categories, 0, 8)
    : $fallbackCategories;
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Marketplace for Nimons</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
</head>
<body class="landing">
    <?php $isLoggedIn = !empty($current_user); ?>
    <nav class="navbar landing-navbar">
        <div class="container navbar-container">
            <a href="/" class="navbar-brand">Nimonspedia</a>
            <div class="navbar-links" id="navbarMenu">
                <a href="/" class="navbar-link active">Home</a>
                <a href="/buyer/home" class="navbar-link">Buyer Portal</a>
                <a href="/seller/dashboard" class="navbar-link">Seller Portal</a>
            </div>
            <div class="navbar-right">
                <div class="balance-display" id="balanceDisplay" style="display: none;">
                    <span class="balance-label">Balance: Rp. <span id="balanceAmount">0</span></span>
                    <button type="button" class="balance-topup-btn" data-action="open-topup">Top Up</button>
                </div>
                <div class="user-profile" id="userProfile" style="display: none;">
                    <div class="user-avatar" id="userAvatar">N</div>
                    <span class="user-name" id="userName">Nimon</span>
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

    <header class="landing-hero">
        <div class="container">
            <div class="hero-content">
                <span class="hero-kicker">Marketplace Nimons</span>
                <h1 class="hero-title">Kelola jual beli Nimons dalam satu tempat terintegrasi.</h1>
                <p class="hero-lead">Nimonspedia menyatukan pembeli dan penjual dengan alur katalog, keranjang, serta dashboard toko yang dibuat khusus untuk kebutuhan dunia Nimons.</p>
                <div class="hero-divider" aria-hidden="true"></div>
                <ul class="hero-points">
                    <li>Akses ribuan produk Nimons yang telah dikurasi.</li>
                    <li>Kelola toko dengan metrik penjualan yang transparan.</li>
                    <li>Checkout aman dengan pelacakan pesanan real-time.</li>
                </ul>
                <div class="hero-actions">
                    <?php if ($isLoggedIn && isset($current_user['role']) && $current_user['role'] === 'BUYER'): ?>
                        <a class="btn btn-primary" href="/buyer/home">Lanjutkan Belanja</a>
                        <a class="btn btn-secondary" href="/auth/logout">Logout</a>
                    <?php elseif ($isLoggedIn && isset($current_user['role']) && $current_user['role'] === 'SELLER'): ?>
                        <a class="btn btn-primary" href="/seller/dashboard">Buka Dashboard</a>
                        <a class="btn btn-secondary" href="/auth/logout">Logout</a>
                    <?php else: ?>
                        <a class="btn btn-primary" href="/auth/register">Mulai sebagai Buyer</a>
                        <a class="btn btn-secondary" href="/auth/login">Masuk sebagai Seller</a>
                    <?php endif; ?>
                </div>
            </div>
            <div class="hero-illustration">
                <div class="illustration-card"><span class="illustration-label">Shop</span></div>
                <div class="illustration-card"><span class="illustration-label">Deliver</span></div>
                <div class="illustration-card"><span class="illustration-label">Connect</span></div>
            </div>
        </div>
    </header>

    <main class="landing-content">
        <section class="landing-section landing-categories">
            <div class="container">
                <div class="category-showcase">
                    <div class="showcase-header">
                        <h2>Eksplor kategori populer</h2>
                        <a class="showcase-link" href="/buyer/home">Lihat semua</a>
                    </div>
                    <div class="category-grid">
                        <?php foreach ($categoryPreviews as $category): ?>
                            <?php
                                $categoryName = is_array($category)
                                    ? ($category['name'] ?? 'Kategori Nimons')
                                    : (string) $category;
                            ?>
                            <article class="category-card">
                                <div class="category-icon" aria-hidden="true">
                                    <span class="icon-placeholder">Icon</span>
                                </div>
                                <div class="category-copy">
                                    <h3 class="category-name"><?= htmlspecialchars($categoryName) ?></h3>
                                    <p class="category-hint">Temukan pilihan terbaik di kategori ini.</p>
                                </div>
                            </article>
                        <?php endforeach; ?>
                    </div>
                </div>
            </div>
        </section>

        <section class="landing-section landing-product-preview">
            <div class="container">
                <div class="showcase-header">
                    <h2>Produk pilihan untuk kamu</h2>
                    <a class="showcase-link" href="/buyer/home">Lihat semua produk</a>
                </div>
                <div class="product-preview-grid">
                    <?php foreach ($featuredProducts as $product): ?>
                        <article class="product-preview-card">
                            <div class="preview-image">
                                <span class="image-placeholder">Image</span>
                                <?php if (!empty($product['tag'])): ?>
                                    <span class="preview-badge"><?= htmlspecialchars($product['tag']) ?></span>
                                <?php endif; ?>
                            </div>
                            <div class="preview-info">
                                <h3 class="preview-name"><?= htmlspecialchars($product['name']) ?></h3>
                                <p class="preview-price">Rp <?= number_format($product['price'], 0, ',', '.'); ?></p>
                                <div class="preview-meta">
                                    <span>Rating <?= number_format((float) $product['rating'], 1) ?></span>
                                    <span>|</span>
                                    <span>Terjual <?= htmlspecialchars($product['sold']) ?></span>
                                </div>
                                <div class="preview-store">
                                    <?= htmlspecialchars($product['store']) ?> | <?= htmlspecialchars($product['location']) ?>
                                </div>
                                <?php if (!empty($product['label'])): ?>
                                    <div class="preview-tags">
                                        <span class="preview-tag"><?= htmlspecialchars($product['label']) ?></span>
                                    </div>
                                <?php endif; ?>
                                <div class="preview-actions">
                                    <a class="btn btn-primary" href="/buyer/home">Lihat Detail</a>
                                    <a class="btn btn-secondary" href="/auth/register">Tambah ke Wishlist</a>
                                </div>
                            </div>
                        </article>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

        <section class="landing-section">
            <div class="container">
                <div class="section-heading">
                    <h2>Mengapa memilih Nimonspedia?</h2>
                    <p class="section-subtitle">Platform kami dirancang untuk membantu Nimons menemukan produk unik sambil memberi penjual alat kontrol penuh atas bisnisnya.</p>
                </div>
                <div class="feature-grid">
                    <article class="feature-card">
                        <h3>Produk Kurasi Nimons</h3>
                        <p>Temukan barang original dari para kreator Nimons, lengkap dengan kategori, foto, dan detail toko.</p>
                    </article>
                    <article class="feature-card">
                        <h3>Pengelolaan Toko Mudah</h3>
                        <p>Kelola stok, pantau kinerja, dan tindak lanjuti order lewat dashboard terpusat yang ringan dan informatif.</p>
                    </article>
                    <article class="feature-card">
                        <h3>Pengalaman Aman</h3>
                        <p>Autentikasi modern, notifikasi status, dan pelacakan transaksi menjaga kenyamanan jual beli Nimons.</p>
                    </article>
                </div>
            </div>
        </section>

        <section class="landing-section landing-roles">
            <div class="container">
                <div class="section-heading">
                    <h2>Portal yang sesuai dengan peranmu</h2>
                    <p class="section-subtitle">Masuk sebagai buyer atau seller dan lanjutkan aktivitas bisnis sesuai kebutuhanmu.</p>
                </div>
                <div class="role-cards">
                    <div class="role-card">
                        <h3>Untuk Buyer</h3>
                        <p>Akses produk terbaru, filter berdasarkan kategori, simpan di cart, dan checkout kapan saja.</p>
                        <a class="btn btn-primary" href="<?= $isLoggedIn && isset($current_user['role']) && $current_user['role'] === 'BUYER' ? '/buyer/home' : '/auth/register' ?>">
                            <?= $isLoggedIn && isset($current_user['role']) && $current_user['role'] === 'BUYER' ? 'Masuk ke Beranda Buyer' : 'Jelajahi Produk' ?>
                        </a>
                    </div>
                    <div class="role-card">
                        <h3>Untuk Seller</h3>
                        <p>Kelola katalog, pantau order masuk, dan tingkatkan penjualanmu melalui dashboard terpusat.</p>
                        <a class="btn btn-secondary" href="<?= $isLoggedIn && isset($current_user['role']) && $current_user['role'] === 'SELLER' ? '/seller/dashboard' : '/auth/register' ?>">
                            <?= $isLoggedIn && isset($current_user['role']) && $current_user['role'] === 'SELLER' ? 'Masuk ke Dashboard' : 'Kelola Toko' ?>
                        </a>
                    </div>
                </div>
            </div>
        </section>

    </main>

    <footer class="landing-footer">
        <div class="container">
            <p>Copyright <?= date('Y') ?> Nimonspedia. Dibuat untuk komunitas Nimons dengan penuh semangat.</p>
        </div>
    </footer>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/balance.js"></script>
    <script src="/public/js/main.js"></script>
</body>
</html>