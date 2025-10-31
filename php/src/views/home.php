<?php
$mainCssVersion = filemtime(__DIR__ . '/../public/css/main.css');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Product Discovery</title>
    <link rel="stylesheet" href="/public/css/main.css">
    <link rel="stylesheet" href="/public/css/home.css">
    <link rel="stylesheet" href="/public/css/product-card.css">
</head>
<?php $basePath = '/home'; ?>
<body class="landing" data-base-path="<?= $basePath ?>">
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

    <div class="filter-bar">
    <div class="container filter-container">
        
        <div class="search-wrapper">
            <input type="text" id="searchInput" class="search-input" 
                   placeholder="Cari produk atau toko..." 
                   value="<?php echo htmlspecialchars($_GET['search'] ?? ''); ?>">
        </div>

        <button class="filter-button" id="categoryFilter">
            <?php 
                // Nanti ini bisa dibuat lebih canggih
                echo !empty($_GET['category']) ? 'Kategori Terpilih' : 'Filter Kategori'; 
            ?>
        </button>
        
        <?php
            $minPrice = $_GET['min_price'] ?? '';
            $maxPrice = $_GET['max_price'] ?? '';
            $isPriceFilterActive = !empty($minPrice) || !empty($maxPrice);

            $filterText = "Filter Harga";
            if ($isPriceFilterActive) {
                if (!empty($minPrice) && !empty($maxPrice)) {
                    $filterText = 'Rp ' . number_format($minPrice) . ' - ' . 'Rp ' . number_format($maxPrice);
                } elseif (!empty($minPrice)) {
                    $filterText = '> Rp ' . number_format($minPrice);
                } elseif (!empty($maxPrice)) {
                    $filterText = '< Rp ' . number_format($maxPrice);
                }
            }
        ?>

        <button class="filter-button <?php echo $isPriceFilterActive ? 'active' : ''; ?>" id="openPriceModalBtn">
            <?php echo htmlspecialchars($filterText); ?>
        </button>

        <?php if ($isPriceFilterActive): ?>
            <button class="filter-reset-button" id="resetPriceFilter" title="Reset filter harga">
                &times; 
            </button>
        <?php endif; ?>

    </div>
</div>

    <main class="main-content">
        <div class="container">
            <div class="products-grid" id="productsGrid">
                
                <?php if (!empty($products)): ?>
                    <?php foreach ($products as $product): ?>
                        <?php
                        $stockClass = ($product['stock'] == 0) ? 'out-of-stock' : '';
                        // Ambil SEMUA kategori (tidak di-explode)
                        $allCategories = htmlspecialchars($product['categories']);
                        ?>

                        <a class="product-card <?= $stockClass; ?>" 
                        href="/product/<?= htmlspecialchars($product['id']); ?>" 
                        title="<?= htmlspecialchars($product['name']); ?>">

                            <div class="product-image">
                                <img src="<?= htmlspecialchars($product['image']); ?>" 
                                    alt="<?= htmlspecialchars($product['name']); ?>" 
                                    loading="lazy" 
                                    onerror="this.style.display='none'; this.parentElement.innerHTML='🛒'">
                            </div>

                            <div class="product-info">
                                <div class="product-name"><?= htmlspecialchars($product['name']); ?></div>
                                <div class="product-price">Rp. <?= number_format($product['price']); ?></div>

                                <div class="product-extra-info">
                                    <div class="product-category">
                                        <span class="info-label">Kategori:</span>
                                        <span class="info-value"><?= $allCategories; ?></span>
                                    </div>
                                    <div class="product-store">
                                        <span class="info-label">Nama Toko:</span>
                                        <span class="info-value"><?= htmlspecialchars($product['store']); ?></span>
                                    </div>
                                </div>
                            </div>
                        </a>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p style="grid-column: 1 / -1; text-align: center;">Produk tidak ditemukan.</p>
                <?php endif; ?>
            </div>

            <div class="pagination" id="pagination">
    
                <span class="pagination-info">
                    <?php echo htmlspecialchars($resultText); ?>
                </span>

                <div class="pagination-nav">
                    <?php foreach ($paginationLinks as $link): ?>
                        
                        <?php if ($link['type'] == 'prev'): ?>
                            <a href="/home?page=<?= $link['page']; ?>"
                            class="pagination-button <?= $link['disabled'] ? 'disabled' : ''; ?>"
                            data-page="<?= $link['page']; ?>">
                                ◀
                            </a>
                        
                        <?php elseif ($link['type'] == 'page'): ?>
                            <a href="/home?page=<?= $link['page']; ?>"
                            class="pagination-button <?= $link['active'] ? 'active' : ''; ?>"
                            data-page="<?= $link['page']; ?>">
                                <?= $link['page']; ?>
                            </a>

                        <?php elseif ($link['type'] == 'ellipsis'): ?>
                            <span class="pagination-ellipsis">...</span>

                        <?php elseif ($link['type'] == 'next'): ?>
                            <a href="/home?page=<?= $link['page']; ?>"
                            class="pagination-button <?= $link['disabled'] ? 'disabled' : ''; ?>"
                            data-page="<?= $link['page']; ?>">
                                ▶
                            </a>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </div>

                <div class="page-size-selector">
                    <label for="pageSizeSelector">Per Halaman:</label>
                    <select id="pageSizeSelector" class="filter-select">
                        <?php
                        $limits = [5, 10, 15, 20];
                        foreach ($limits as $lim):
                            // $currentLimit disiapkan oleh HomeController
                            $selected = ($lim == $currentLimit) ? 'selected' : '';
                            echo "<option value=\"{$lim}\" {$selected}>{$lim}</option>";
                        endforeach;
                        ?>
                    </select>
                </div>
            </div>
        </div>
    </main>

    <div id="categoryModal" class="modal">
        <div class="modal-content">
            <span class="modal-close-btn" id="categoryModalClose">&times;</span>
            <h2>Filter Kategori</h2>
            <ul id="categoryList" class="category-list">
                <li><a href="#" data-category-id="">Semua Kategori</a></li>
                </ul>
        </div>
    </div>

    <div id="priceModal" class="modal-overlay hidden">
        <div class="modal-content">
            
            <div class="modal-header">
                <h4>Atur Filter Harga</h4>
                <button class="modal-close-btn" id="modalCloseBtn">&times;</button>
            </div>

            <div class="modal-body">
                <div class="price-inputs">
                    <div class="input-group">
                        <label for="modal_min_price">Harga Minimum</label>
                        <input type="number" id="modal_min_price" placeholder="Rp 0" 
                            value="<?php echo htmlspecialchars($minPrice); ?>">
                    </div>
                    <div class="input-group">
                        <label for="modal_max_price">Harga Maksimum</label>
                        <input type="number" id="modal_max_price" placeholder="Rp 10.000.000"
                            value="<?php echo htmlspecialchars($maxPrice); ?>">
                    </div>
                </div>

                <div class="quick-filters">
                    <button class="quick-filter-btn" data-min="0" data-max="100000">
                        &lt; Rp 100rb
                    </button>
                    <button class="quick-filter-btn" data-min="100000" data-max="500000">
                        Rp 100rb - 500rb
                    </button>
                    <button class="quick-filter-btn" data-min="500000" data-max="1000000">
                        Rp 500rb - 1jt
                    </button>
                    <button class="quick-filter-btn" data-min="1000000" data-max="">
                        &gt; Rp 1jt
                    </button>
                </div>
            </div>

            <div class="modal-footer">
                <button class="modal-button-clear" id="modalClearBtn">Hapus</button>
                <button class="modal-button-apply" id="modalApplyBtn">Terapkan</button>
            </div>
        </div>
    </div>

    <footer class="landing-footer">
        <div class="container">
            <p>Copyright <?= date('Y') ?> Nimonspedia. Dibuat untuk komunitas Nimons dengan penuh semangat.</p>
        </div>
    </footer>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/balance.js"></script>
    <script src="/public/js/main.js"></script>
    <script src="/public/js/home.js"></script>
    <script src="/public/js/api.js"></script>
</body>
</html>
