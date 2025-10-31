<?php 
$mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css');
$navbarType = 'buyer';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Product Discovery</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
</head>
<body class="buyer-home">
    <?php include __DIR__ . '/../components/navbar.php'; ?>

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
