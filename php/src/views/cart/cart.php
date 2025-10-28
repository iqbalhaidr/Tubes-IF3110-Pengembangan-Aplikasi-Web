<?php
// Data Structure
//  $cartData = [
// 	"grandtotal_items" => {grandtotal_items},
// 	"grandtotal_price" => {grandtotal_price},
// 	"stores" => [
// 		{store_id} => [
// 			"store_logo_path" => {store_logo_path},
// 			"store_name" => {store_name},
// 			"total_items" => {total_items},
// 			"total_price" => {total_price},
// 			"items" => [
// 				{cart_item_id} => [
// 					"main_image_path" => {main_image_path},
// 					"product_name" => {product_name},
// 					"price" => {price},
// 					"quantity" => {quantity},
// 					"stock" => {stock}
// 				],
// 				{cart_item_id} => [],
// 				{cart_item_id} => []
// 			]
// 		],
// 		{store_id} => [],
// 		{store_id} => []
// 	]
//  ]
?>

<!-- 
  This container wraps the entire page logic.
  We use this to easily switch between the "empty" and "filled" cart states.
-->
<div class="cart-page-wrapper">

    <?php if ($cartData["grandtotal_items"] === 0): ?>

        <!-- Empty State -->
        <div class="cart-empty-state" id="cart-empty-state">
            <img src="/public/asset/empty_cart.png" alt="Empty Cart" class="empty-cart-image">
            <h2 class="empty-state-title">Your Cart is Empty</h2>
            <p class="empty-state-subtitle">Looks like you haven't added anything yet. Let's shop!</p>
            <a href="/" class="button-primary start-shopping-btn">Start Shopping</a>
        </div>

    <?php else: ?>

        <div class="cart-content-container" id="cart-content-container">

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

    <?php endif; ?>

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
