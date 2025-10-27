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
                <h1>Belanja dan berjualan untuk Nimons, dalam satu platform.</h1>
                <p>Nimonspedia menghubungkan para pembeli dan penjual Nimons dengan pengalaman e-commerce yang sederhana, cepat, dan menyenangkan.</p>
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
                <h2>Mengapa memilih Nimonspedia?</h2>
                <div class="feature-grid">
                    <div class="feature-card">
                        <h3>Produk Kurasi Nimons</h3>
                        <p>Temukan barang unik dan inovatif dari para kreator Nimons di seluruh belahan dunia.</p>
                    </div>
                    <div class="feature-card">
                        <h3>Pengelolaan Toko Mudah</h3>
                        <p>Kelola stok, pantau pesanan, dan monitor pendapatan dengan dashboard yang intuitif.</p>
                    </div>
                    <div class="feature-card">
                        <h3>Pengalaman Aman</h3>
                        <p>Autentikasi modern dan sistem transaksi yang menjaga keamanan data Nimons.</p>
                    </div>
                </div>
            </div>
        </section>

        <section class="landing-section landing-roles">
            <div class="container">
                <h2>Portal yang sesuai dengan peranmu</h2>
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
                <h2>Kategori populer</h2>
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
            <p>© <?= date('Y') ?> Nimonspedia. Dibuat untuk komunitas Nimons dengan penuh semangat.</p>
        </div>
    </footer>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/main.js"></script>
</body>
</html>