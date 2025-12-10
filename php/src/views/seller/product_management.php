<?php $mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css'); ?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manajemen Produk</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/product_management.css">
    <link rel="stylesheet" href="/public/css/logout-modal.css">
</head>
<body class="seller-page">
    
    <?php require __DIR__ . '/../components/navbar.php'; ?>

    <main class="container">
        <div class="page-header">
            <h1>Manajemen Produk</h1>
            <a href="/seller/products/add" class="btn btn-primary">Tambah Produk Baru</a>
        </div>

        <div class="filters-bar">
            <div class="search-wrapper">
                <label for="searchInput" class="sr-only">Cari nama produk</label>
                <input type="text" id="searchInput" class="search-input" placeholder="Cari nama produk...">
            </div>
            <label for="categoryFilter" class="sr-only">Filter berdasarkan kategori</label>
            <select id="categoryFilter" class="filter-select">
                <option value="">Semua Kategori</option>
                <?php foreach ($categories as $category): ?>
                    <option value="<?= $category['category_id'] ?>"><?= htmlspecialchars($category['category_name']) ?></option>
                <?php endforeach; ?>
            </select>
            <label for="sortFilter" class="sr-only">Urutkan produk</label>
            <select id="sortFilter" class="filter-select">
                <option value="name:ASC">Nama (A-Z)</option>
                <option value="name:DESC">Nama (Z-A)</option>
                <option value="price:DESC">Harga (Tertinggi)</option>
                <option value="price:ASC">Harga (Terendah)</option>
                <option value="stock:ASC">Stok (Tersedikit)</option>
                <option value="stock:DESC">Stok (Terbanyak)</option>
            </select>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Foto</th>
                        <th>Nama Produk</th>
                        <th>Kategori</th>
                        <th>Harga</th>
                        <th>Stok</th>
                        <th>Aksi</th>
                    </tr>
                </thead>
                <tbody id="productsTableBody">
                </tbody>
            </table>
        </div>
        
        <div id="loadingState" style="display: none;">
            <div class="skeleton-row"></div>
            <div class="skeleton-row"></div>
        </div>

        <div id="emptyState" class="empty-state" style="display: none;">
            <h3>Anda belum memiliki produk</h3>
            <p>Ayo mulai jual produk pertama Anda!</p>
            <a href="/seller/products/add" class="btn btn-primary">Tambah Produk Pertama</a>
        </div>

        <div class="pagination" id="pagination"></div>
    </main>

    <div id="deleteModal" class="modal-overlay hidden">
        <div class="modal-content">
            <div class="modal-header">
                <h4>Hapus Produk</h4>
                <button class="modal-close-btn" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body">
                <p>Anda yakin ingin menghapus produk <strong id="productNameDelete"></strong>?</p>
                <p>Tindakan ini tidak dapat dibatalkan (soft delete).</p>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="modalCancelBtn">Batal</button>
                <button class="btn btn-danger" id="modalConfirmDeleteBtn">Ya, Hapus</button>
            </div>
        </div>
    </div>
    
    <div id="toast" class="toast"></div>

    <!-- Create Auction Modal -->
    <div id="createAuctionModal" class="modal-overlay hidden">
        <div class="modal-content create-auction-modal">
            <div class="modal-header">
                <h4>Create Auction</h4>
                <button class="modal-close-btn" id="auctionModalCloseBtn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="product-preview" id="auctionProductPreview">
                    <!-- Product info will be injected here by JS -->
                </div>
                <form id="createAuctionForm">
                    <input type="hidden" name="product_id" id="auctionProductId">
                    <div class="form-group">
                        <label for="initialBid">Initial Bid</label>
                        <input type="number" id="initialBid" name="initial_bid" class="form-control" required min="0" step="1000" placeholder="e.g., 100000">
                    </div>
                    <div class="form-group">
                        <label for="minBidIncrement">Min. Bid Increment</label>
                        <input type="number" id="minBidIncrement" name="min_bid_increment" class="form-control" required min="1000" step="1000" value="10000">
                    </div>
                    <div class="form-group">
                        <label for="auctionQuantity">Quantity</label>
                        <input type="number" id="auctionQuantity" name="auction_quantity" class="form-control" required min="1" value="1">
                        <small id="quantityHelp" class="form-text"></small>
                    </div>
                    <div class="form-group">
                        <label for="startTime">Start Time (Optional)</label>
                        <input type="datetime-local" id="startTime" name="start_time" class="form-control">
                        <small class="form-text">Leave blank to start immediately.</small>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="auctionModalCancelBtn">Cancel</button>
                <button class="btn btn-primary" id="auctionModalSubmitBtn">Create Auction</button>
            </div>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script src="/public/js/api.js"></script>
    <script src="/public/js/main.js"></script>
    <script src="/public/js/product_management.js"></script> 
</body>
</html>