<?php
// Data passed from OrderController::showCheckoutPage()
// $user (array)
// $cartData (array)
// $navbarType (string)
// $activeLink (string)
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Checkout - Nimonspedia</title>
    <link rel="stylesheet" href="/public/css/main.css">
    <link rel="stylesheet" href="/public/css/checkout.css">
</head>
<body class="buyer-page">
    
    <?php 
    // Include the navbar component
    // $navbarType and $activeLink are set in OrderController
    include __DIR__ . '/../components/navbar.php'; 
    ?>

    <main class="checkout-container container">
        <h1>Checkout</h1>

        <!-- AC 1: Order summary grouped by store -->
        <div class="checkout-layout">
            <div class="order-summary-list">
                <?php if (empty($cartData['stores'])): ?>
                    <div class="cart-empty">
                        <p>Your cart is empty. Nothing to check out.</p>
                        <a href="/home" class="btn btn-primary">Continue Shopping</a>
                    </div>
                <?php else: ?>
                    <?php foreach ($cartData['stores'] as $store): ?>
                        <div class="store-group">
                            <div class="store-header">
                                <img src="<?= htmlspecialchars($store['store_logo_path'] ?? '/public/images/default-store.png') ?>" alt="Store Logo" class="store-logo" 
                                     onerror="this.src='/public/images/default-store.png'">
                                <span class="store-name"><?= htmlspecialchars($store['store_name']) ?></span>
                            </div>
                            
                            <div class="items-list">
                                <?php foreach ($store['items'] as $item): ?>
                                    <div class="item-card" data-cart-item-id="<?= $item['cart_item_id'] ?>">
                                        <img src="<?= htmlspecialchars($item['main_image_path'] ?? 'default.png') ?>" alt="Product Image" class="item-image"
                                             onerror="this.src='/public/images/products/default.png'">
                                        <div class="item-details">
                                            <div class="item-name"><?= htmlspecialchars($item['product_name']) ?></div>
                                            <div class="item-price">Rp <?= number_format($item['price']) ?></div>
                                        </div>
                                        <div class="item-quantity-price">
                                            <div class="item-quantity">Qty: <?= $item['quantity'] ?></div>
                                            <div class="item-subtotal">Rp <?= number_format($item['price'] * $item['quantity']) ?></div>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            </div>

                            <div class="store-total">
                                <div class="store-total-line">
                                    <span>Total Items:</span>
                                    <span><?= $store['total_items'] ?></span>
                                </div>
                                <div class="store-total-line price">
                                    <span>Total Price:</span>
                                    <span>Rp <?= number_format($store['total_price']) ?></span>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>

            <!-- Checkout Summary Column -->
            <aside class="checkout-summary">
                <!-- AC 2: Delivery address info -->
                <div class="summary-card">
                    <h2>Delivery Address</h2>
                    <textarea id="shippingAddress" class="address-textarea" rows="4" placeholder="Enter your full shipping address..."><?= htmlspecialchars($user['address'] ?? '') ?></textarea>
                </div>

                <!-- AC 1 & 3: Balance info and Grandtotal -->
                <div class="summary-card">
                    <h2>Payment Details</h2>
                    <?php
                        $current_balance = (float)($user['balance'] ?? 0);
                        $grand_total = (float)$cartData['grandtotal_price'];
                        $balance_after = $current_balance - $grand_total;
                        $is_sufficient = $balance_after >= 0;
                    ?>
                    <!-- Pass data to JS -->
                    <script>
                        // Make data available to checkout.js
                        window.checkoutData = {
                            currentUserBalance: <?= $current_balance ?>,
                            grandTotal: <?= $grand_total ?>,
                            isSufficient: <?= $is_sufficient ? 'true' : 'false' ?>,
                            isCartEmpty: <?= empty($cartData['stores']) ? 'true' : 'false' ?>
                        };
                    </script>

                    <div class="balance-info-grid">
                        <span>Current Balance</span>
                        <span id="currentBalance" class="balance-value">Rp <?= number_format($current_balance) ?></span>
                        
                        <span>Grand Total</span>
                        <span id="grandTotal" class="balance-value">Rp <?= number_format($grand_total) ?></span>
                        
                        <span class="balance-after-label">Balance After</span>
                        <span id="balanceAfter" class="balance-value <?= $is_sufficient ? '' : 'insufficient' ?>">
                            Rp <?= number_format($balance_after) ?>
                        </span>
                    </div>

                    <!-- AC 3: Warning if not sufficient -->
                    <div class="balance-warning" id="balanceWarning" style="<?= $is_sufficient ? 'display: none;' : '' ?>">
                        Balance is not sufficient. 
                        <a href="#" data-action="open-topup">Top Up Balance</a>
                    </div>
                    <div class="address-warning" id="addressWarning" style="display: none;">
                        Please add a delivery address.
                    </div>

                    <!-- AC 4: Checkout button disabled -->
                    <button class="checkout-button" id="createOrderBtn">
                        Create Order
                    </button>
                </div>
            </aside>
        </div>
    </main>

    <!-- AC 6: Confirmation modal -->
    <div class="modal-overlay hidden" id="confirmCheckoutModal">
        <div class="modal-content">
            <h2 class="modal-title">Confirm Checkout</h2>
            <p>Are you sure you want to proceed with this purchase?</p>
            <div class="modal-actions">
                <button class="modal-button secondary" id="cancelCheckoutBtn">Cancel</button>
                <button class="modal-button primary" id="confirmCheckoutBtn">Confirm</button>
            </div>
        </div>
    </div>

    <!-- Toast Notification (from main.css) -->
    <div id="toast" class="toast"></div>

    <!-- Include JavaScript files -->
    <script src="/public/js/api.js"></script> <!-- Assuming you have this -->
    <script src="/public/js/main.js"></script> <!-- For navbar and toast -->
    <script src="/public/js/balance.js"></script> <!-- For top-up modal -->
    <script src="/public/js/checkout.js"></script> <!-- New checkout script -->

</body>
</html>

