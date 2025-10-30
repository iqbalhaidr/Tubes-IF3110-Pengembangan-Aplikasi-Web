<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Nimonspedia - Your Cart</title>
        <!-- Link global styles (navbar, base) -->
        <link rel="stylesheet" href="/public/css/main.css">
        <!-- Link cart-specific styles -->
        <link rel="stylesheet" href="/public/css/cart.css">
    </head>
    <body>
        <!-- Navigation Bar (copied from home.php) -->
        <nav class="navbar">
            <div class="container navbar-container">
                <!-- Left Side: Balance + Navigation Links -->
                <div class="navbar-left">
                    <div class="balance-display" id="balanceDisplay" style="display: none;">
                        💰 Balance: Rp. 5000
                    </div>
                    
                    <div class="navbar-links" id="navbarLinks">
                        <!-- Set "Discover" to inactive -->
                        <a href="/" class="navbar-link">Discover</a>
                        <!-- Set "Cart" to active -->
                        <a href="/cart" class="navbar-link active">Cart</a>
                        <a href="/checkout" class="navbar-link">Checkout</a>
                        <a href="/orders" class="navbar-link">Orders</a>
                    </div>
                </div>

                <!-- Right Side: User Profile / Auth Links -->
                <div class="navbar-right">
                    <!-- User Profile (if logged in) -->
                    <div class="user-profile" id="userProfile" style="display: none;">
                        <div class="user-avatar" id="userAvatar">R</div>
                        <span class="user-name" id="userName">Rafif Farras</span>
                        <button class="logout-icon" id="logoutBtn" title="Logout">➜</button>
                    </div>

                    <!-- Auth Links (if not logged in) -->
                    <div class="auth-links" id="authLinks">
                        <a href="/auth/login" class="navbar-link">Login</a>
                        <a href="/auth/register" class="navbar-link">Register</a>
                    </div>
                </div>

                <!-- Mobile Menu Toggle -->
                <button class="mobile-menu-toggle" id="mobileMenuToggle">☰</button>
            </div>
        </nav>
        <!-- End Navigation Bar -->

        <!-- Main Content -->
        <main class="main-content">
            <div class="container">

                <!-- 
                This container wraps the entire page logic.
                We use this to easily switch between the "empty" and "filled" cart states.
                -->
                <div class="cart-page-wrapper">
                
                    <!-- Empty State -->
                    <div class="cart-empty-state" id="cart-empty-state" <?php if ($cartData["grandtotal_items"] > 0): ?>style="display: none;"<?php endif; ?>>
                        <img src="/public/asset/empty_cart.png" alt="Empty Cart" class="empty-cart-image">
                        <h2 class="empty-state-title">Your Cart is Empty</h2>
                        <p class="empty-state-subtitle">Looks like you haven't added anything yet. Let's shop!</p>
                        <a href="/" class="button-primary start-shopping-btn">Start Shopping</a>
                    </div>
            
                    <div class="cart-content-container" id="cart-content-container" <?php if ($cartData["grandtotal_items"] === 0): ?>style="display: none;"<?php endif; ?>>
            
                        <div class="cart-items-list" id="cart-items-list">
                            <?php foreach ($cartData['stores'] as $storeId => $storeData): ?>
                                <!-- Items grouped by store -->
                                <div class="cart-store-group" data-store-id="<?php echo htmlspecialchars($storeId); ?>">
                                        
                                    <!-- Store header -->
                                    <div class="store-header">
                                        <img 
                                            src="<?php echo htmlspecialchars($storeData['store_logo_path']); ?>" 
                                            alt="<?php echo htmlspecialchars($storeData['store_name']); ?> Logo" 
                                            class="store-logo"
                                        >
                                        <h3 class="store-name"><?php echo htmlspecialchars($storeData['store_name']); ?></h3>
                                    </div>
            
                                    <div class="store-items">
                                        <?php foreach ($storeData['items'] as $itemId => $itemData): ?>
                                            <div class="cart-item" 
                                                data-item-id="<?php echo htmlspecialchars($itemId); ?>"
                                                data-unit-price="<?php echo htmlspecialchars($itemData['price']); ?>"
                                                data-stock="<?php echo htmlspecialchars($itemData['stock']); ?>">
            
                                                <!-- Column 1: Image -->
                                                <div class="item-col-image">
                                                    <img 
                                                        src="<?php echo htmlspecialchars($itemData['main_image_path']); ?>" 
                                                        alt="<?php echo htmlspecialchars($itemData['product_name']); ?>" 
                                                        class="cart-item-image"
                                                    >
                                                </div>
            
                                                <!-- Column 2: Product Info -->
                                                <div class="item-col-info">
                                                    <p class="product-name"><?php echo htmlspecialchars($itemData['product_name']); ?></p>
                                                    <p class="product-price">Rp <?php echo number_format($itemData['price'], 0, ',', '.'); ?></p>
                                                </div>
            
                                                <!-- Column 3: Alter -->
                                                <div class="item-col-alter">
                                                    <button class="delete-item-btn" aria-label="Delete item <?php echo htmlspecialchars($itemData['product_name']); ?>">
                                                        <!-- Inlined SVG for trash icon is reliable and easy to style -->
                                                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                            <line x1="10" y1="11" x2="10" y2="17"></line>
                                                            <line x1="14" y1="11" x2="14" y2="17"></line>
                                                        </svg>
                                                    </button>
                                                    <div class="quantity-selector">
                                                        <button class="quantity-btn quantity-minus" aria-label="Decrease quantity">-</button>
                                                        <input 
                                                            class="quantity-value"
                                                            id="quantity-<?php echo htmlspecialchars($itemId); ?>"
                                                            type="number" 
                                                            value="<?php echo htmlspecialchars($itemData['quantity']); ?>"
                                                            min="1"
                                                            max="<?php echo htmlspecialchars($itemData['stock']); ?>"
                                                            aria-label="Quantity for <?php echo htmlspecialchars($itemData['product_name']); ?>"
                                                        >
                                                        <button class="quantity-btn quantity-plus" aria-label="Increase quantity">+</button>
                                                    </div>
                                                </div>
                                                
                                            </div> <!-- .cart-item -->
                                        <?php endforeach; ?>
                                    </div> <!-- .store-items -->
                                        
                                    <!-- Summary per store -->
                                    <div class="store-summary">
                                        <div class="summary-line total-item">
                                            <span class="summary-label">Total Items:</span>
                                            <span class="summary-value store-total-items">
                                                <?php echo htmlspecialchars($storeData['total_items']); ?>
                                            </span>
                                        </div>
            
                                        <div class="summary-line total-price">
                                            <span class="summary-label">Total Price:</span>
                                            <span class="summary-value store-total-price">
                                                Rp <?php echo number_format($storeData['total_price']); ?>
                                            </span>
                                        </div>
                                    </div>
            
                                </div> <!-- .cart-store-group -->
                            <?php endforeach; ?>
                        </div> <!-- .cart-items-list -->
            
                        <div class="cart-summary" id="cart-summary">
                            <div class="summary-details">
                                <div class="summary-line grandtotal-items">
                                    <span class="summary-label">Grandtotal Item:</span>
                                    <span class="summary-value" id="summary-grandtotal-items">
                                        <?php echo htmlspecialchars($cartData['grandtotal_items']); ?>
                                    </span>
                                </div>
            
                                <div class="summary-line grandtotal-price">
                                    <span class="summary-label">Grandtotal price:</span>
                                    <span class="summary-value total-price" id="summary-grandtotal-price">
                                        Rp <?php echo number_format($cartData['grandtotal_price']); ?>
                                    </span>
                                </div>
                            </div>
            
                            <div class="summary-actions">
                                <button id="checkout-button" class="button-primary checkout-btn">
                                    Checkout (<?php echo htmlspecialchars($cartData['grandtotal_items']); ?>)
                                </button>
                            </div>
                        </div> <!-- .cart-summary-panel -->
            
                    </div> <!-- .cart-content-container -->
                
                
                </div> <!-- .cart-page-wrapper -->
                
                
                <!-- Confirmation Dialog -->
                <div id="delete-confirm-modal" class="modal-backdrop" role="dialog" aria-labelledby="modal-title" aria-modal="true" hidden>
                    <div class="modal-content">
                        <h4 id="modal-title" class="modal-title">Confirm Deletion</h4>
                        <p id="modal-body" class="modal-body">
                            Are you sure you want to remove this item from your cart?
                        </p>
                        <div class="modal-actions">
                            <!-- These buttons have IDs so your JS can listen for clicks -->
                            <button id="modal-cancel-btn" class="button-secondary">Cancel</button>
                            <button id="modal-confirm-delete-btn" class="button-danger">Delete</button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        <!-- Main Content -->

        <!-- Load global scripts (navbar, auth) -->
        <script src="/public/js/main.js"></script>
        <!-- Load API for fetch replacement -->
        <script src="/public/js/api.js"></script>
        <!-- Load cart-specific scripts (quantity, delete) -->
        <script src="/public/js/cart.js"></script>
        
    </body>
</html>