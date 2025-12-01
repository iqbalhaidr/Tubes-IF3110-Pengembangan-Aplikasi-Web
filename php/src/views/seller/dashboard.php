<?php 
$mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css');
$dashboardCssVersion = filemtime(__DIR__ . '/../../public/css/dashboard.css');
$navbarType = 'seller';
$activeLink = 'dashboard';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Seller Dashboard</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/dashboard.css?v=<?= $dashboardCssVersion ?>">
    <link rel="stylesheet" href="/public/css/logout-modal.css">
    <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
</head>
<body class="seller-dashboard">
    <?php include __DIR__ . '/../components/navbar.php'; ?>

    <main class="dashboard-content">
        <div class="container">
            <!-- Store Header Info Section -->
            <header class="dashboard-header">
                <div class="store-header-content">
                    <div class="store-header-left">
                        <div class="store-logo-container">
                            <?php if (!empty($store['store_logo_path'])): ?>
                                <img src="<?= htmlspecialchars('/' . $store['store_logo_path']) ?>" alt="<?= htmlspecialchars($store['store_name']) ?>" class="store-header-logo">
                            <?php else: ?>
                                <div class="store-logo-placeholder">
                                    <span><?= strtoupper(substr($store['store_name'], 0, 2)) ?></span>
                                </div>
                            <?php endif; ?>
                        </div>
                        <div class="store-header-info">
                            <h1><?= htmlspecialchars($store['store_name']) ?></h1>
                            <p class="store-header-status">Store Status: <span class="status-badge status-active">Active</span></p>
                            <p class="store-header-member-since" aria-label="Member since <?= date('F Y', strtotime($store['created_at'])) ?>">Member since <?= date('F Y', strtotime($store['created_at'])) ?></p>
                        </div>
                    </div>
                    <div class="store-header-right">
                        <a href="/seller/export-performance" class="btn btn-primary" style="text-decoration: none; margin-right: 10px;">Export CSV</a>
                        <button type="button" class="btn btn-secondary" id="editStoreBtn">Edit Store Info</button>
                    </div>
                </div>
            </header>

            <section class="dashboard-summary">
                <div class="summary-card" aria-label="Total unique products">
                    <span class="summary-title">Total unique products</span>
                    <span class="summary-value"><?= htmlspecialchars(number_format($stats['total_products'])) ?></span>
                </div>
                <div class="summary-card" aria-label="Pending orders">
                    <span class="summary-title">Pending orders</span>
                    <span class="summary-value"><?= htmlspecialchars(number_format($stats['pending_orders'])) ?></span>
                </div>
                <div class="summary-card" aria-label="Products under 10 stock">
                    <span class="summary-title">Products under 10 stock</span>
                    <span class="summary-value"><?= htmlspecialchars(number_format($stats['low_stock'])) ?></span>
                </div>
                <div class="summary-card" aria-label="Total revenue">
                    <span class="summary-title">Total revenue</span>
                    <span class="summary-value">Rp <?= htmlspecialchars(number_format($stats['total_revenue'])) ?></span>
                </div>
            </section>

            <section class="dashboard-grid">
                <div class="dashboard-actions">
                    <a class="action-card" href="/seller/products">
                        <div class="action-icon">📦</div>
                        <h2>Kelola Produk</h2>
                        <p>Manage your product catalog, update prices, and monitor stock levels.</p>
                        <span class="action-link">View All →</span>
                    </a>
                    <a class="action-card" href="/seller/orders">
                        <div class="action-icon">📋</div>
                        <h2>Lihat Orders</h2>
                        <p>Review new orders, approve, reject, and set delivery times.</p>
                        <span class="action-link">View All →</span>
                    </a>
                    <a class="action-card" href="/seller/products/add">
                        <div class="action-icon">➕</div>
                        <h2>Tambah Produk Baru</h2>
                        <p>Create a new product listing and reach more buyers faster.</p>
                        <span class="action-link">Add Now →</span>
                    </a>
                    <a class="action-card" href="/auctions">
                        <div class="action-icon">🔨</div>
                        <h2>Live Auctions</h2>
                        <p>Create and manage product auctions. Bid in real-time with other users.</p>
                        <span class="action-link">View Auctions →</span>
                    </a>
                </div>
            </section>
        </div>
    </main>

    <div id="editStoreModal" class="modal hidden">
        <div class="modal-overlay" id="editStoreOverlay"></div>
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>Edit Store Information</h2>
                <button type="button" class="modal-close" id="editStoreClose">&times;</button>
            </div>
            <form id="editStoreForm" class="modal-form" enctype="multipart/form-data">
                <div class="form-group">
                    <label for="edit_store_name">Store Name</label>
                    <input type="text" id="edit_store_name" name="store_name" required 
                        placeholder="Your store name" maxlength="100">
                    <div class="error-message" id="edit_store_nameError"></div>
                </div>
                
                <div class="form-group">
                    <label for="edit_store_logo">Store Logo (Optional, Max 2MB)</label>
                    <div id="current-logo-preview" class="logo-current-preview">
                    </div>
                    <input type="file" id="edit_store_logo" name="store_logo" 
                        accept="image/jpeg,image/png,image/webp">
                    <div id="logo-preview-new" class="logo-upload-preview" style="display:none;">
                        <img id="logo-preview-img" src="" alt="New logo preview">
                    </div>
                    <small>JPG, PNG, or WEBP. Max 2MB</small>
                    <div class="error-message" id="edit_store_logoError"></div>
                </div>
                <div class="form-group">
                    <label for="quill-editor-store">Store Description (Max 1000 karakter)</label>
                    <div id="quill-editor-store"></div>
                    <textarea id="edit_store_description" name="store_description" 
                            style="display:none;"></textarea>
                    <div id="store-desc-error" class="validation-error"></div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" id="editStoreCancel">Cancel</button>
                    <button type="submit" class="btn btn-primary" id="editStoreSubmit">Save Changes</button>
                </div>
            </form>
        </div>
    </div>

    <script src="https://cdn.quilljs.com/1.3.7/quill.min.js"></script>
    <script src="/public/js/api.js"></script>
    <script src="/public/js/main.js"></script>
    <script src="/public/js/dashboard.js"></script>
    <script src="/public/js/dashboard-edit-store.js"></script>
</body>
</html>
