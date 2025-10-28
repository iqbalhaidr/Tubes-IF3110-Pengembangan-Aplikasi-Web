<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Marketplace for Nimons</title>
    <link rel="stylesheet" href="/public/css/main.css">
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

        <?php if (!empty($categories)): ?>
        <section class="landing-section landing-categories">
            <div class="container">
                <div class="section-heading">
                    <h2>Kategori populer</h2>
                    <p class="section-subtitle">Mulai eksplorasi dari kategori yang paling diminati oleh komunitas Nimons.</p>
                </div>
                <div class="category-pills">
                    <?php foreach ($categories as $category): ?>
                        <span class="pill">
                            <?= htmlspecialchars($category['name']) ?>
                        </span>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>
        <?php endif; ?>
    </main>

    <footer class="landing-footer">
        <div class="container">
            <p>Copyright <?= date('Y') ?> Nimonspedia. Dibuat untuk komunitas Nimons dengan penuh semangat.</p>
        </div>
    </footer>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/main.js"></script>
</body>
</html>