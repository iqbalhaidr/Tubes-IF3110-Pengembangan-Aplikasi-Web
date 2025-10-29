/**
 * ===============================================
 * JavaScript for Cart Page (cart.js)
 * ===============================================
 *
 * Handles:
 * - AC #4: Confirmation dialog for deletion
 * - AC #5: Summary panel updates (per-store and grand total)
 * - AC #6: Empty state logic
 * - AC #7: Loading state on items
 * - AC #8: Cart badge update
 * - AC #9: Persistence (AJAX)
 * - AC #10: Optimistic UI updates
 * - AC #11: Debouncing for quantity updates
 */

// Wait for the DOM to be fully loaded before running any script
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Select Global Elements ---
    // These are elements we need to reference frequently.
    const cartItemsList = document.getElementById('cart-items-list');
    const cartSummary = document.getElementById('cart-summary');
    const cartContentContainer = document.getElementById('cart-content-container');
    const cartEmptyState = document.getElementById('cart-empty-state');

    // Summary fields
    const summaryGrandTotalItems = document.getElementById('summary-grandtotal-items');
    const summaryGrandTotalPrice = document.getElementById('summary-grandtotal-price');
    const checkoutButton = document.getElementById('checkout-button');
    const checkoutButtonText = checkoutButton ? checkoutButton.querySelector('span') : null; // Assumes text is inside a span, or just update textContent

    // Modal elements (for AC #4)
    const deleteModal = document.getElementById('delete-confirm-modal');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-delete-btn');

    // Header cart badge (AC #8) - We assume an ID from your main layout
    const cartBadge = document.getElementById('cart-badge-counter'); // Adjust this ID if needed

    // A variable to store which item we're about to delete
    let itemToDelete = null;

    // Check if we are on a page with cart items
    if (!cartItemsList) {
        // We're not on the cart page or the cart is initially empty
        return;
    }


    // --- 2. Utility Functions ---

    /**
     * Formats a number as Indonesian Rupiah (Rp)
     * @param {number} number - The number to format
     * @returns {string} - Formatted string (e.g., "Rp 1.500.000")
     */
    const formatCurrency = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    };

    /**
     * Debounce function (AC #11)
     * Delays invoking a function until after `wait` milliseconds
     * have elapsed since the last time it was invoked.
     * @param {function} func - The function to debounce
     * @param {number} wait - The delay in milliseconds
     * @returns {function} - The debounced function
     */
    const debounce = (func, wait) => {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    };


    // --- 3. Core Logic Functions ---

    /**
     * Recalculates all totals on the page (AC #5 & #10)
     * Reads from the DOM to perform optimistic updates.
     */
    const updateAllTotals = () => {
        let grandTotalItems = 0;
        let grandTotalPrice = 0;

        const storeGroups = cartItemsList.querySelectorAll('.cart-store-group');

        storeGroups.forEach(storeGroup => {
            let storeTotalItems = 0;
            let storeTotalPrice = 0;

            const items = storeGroup.querySelectorAll('.cart-item');

            items.forEach(item => {
                const unitPrice = parseFloat(item.dataset.unitPrice);
                const quantityInput = item.querySelector('.quantity-value');
                const quantity = parseInt(quantityInput.value);

                if (isNaN(unitPrice) || isNaN(quantity)) {
                    return; // Skip if data is invalid
                }

                storeTotalItems += quantity;
                storeTotalPrice += unitPrice * quantity;
            });

            // Update per-store summary
            const storeTotalItemsEl = storeGroup.querySelector('.store-total-items');
            const storeTotalPriceEl = storeGroup.querySelector('.store-total-price');
            
            if (storeTotalItemsEl) storeTotalItemsEl.textContent = storeTotalItems;
            if (storeTotalPriceEl) storeTotalPriceEl.textContent = formatCurrency(storeTotalPrice);

            grandTotalItems += storeTotalItems;
            grandTotalPrice += storeTotalPrice;
        });

        // Update grand total summary
        if (summaryGrandTotalItems) summaryGrandTotalItems.textContent = grandTotalItems;
        if (summaryGrandTotalPrice) summaryGrandTotalPrice.textContent = formatCurrency(grandTotalPrice);

        // Update checkout button (AC #5)
        if (checkoutButton) {
            checkoutButton.textContent = `Checkout (${grandTotalItems})`;
            checkoutButton.disabled = (grandTotalItems === 0);
        }

        // Update cart badge (AC #8)
        updateCartBadge(grandTotalItems);

        // Check for empty state (AC #6)
        checkEmptyState();
    };

    /**
     * Updates the header cart badge (AC #8)
     * @param {number} totalItems - The total items to display
     */
    const updateCartBadge = (totalItems) => {
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none'; // Or your preferred show/hide logic
        }
    };

    /**
     * Checks if the cart is empty and shows the empty state (AC #6)
     */
    const checkEmptyState = () => {
        const anyItemLeft = cartItemsList.querySelector('.cart-item');
        
        if (!anyItemLeft) {
            if (cartContentContainer) cartContentContainer.style.display = 'none';
            if (cartEmptyState) cartEmptyState.style.display = 'flex'; // Assuming CSS handles hiding it initially
        } else {
            if (cartContentContainer) cartContentContainer.style.display = 'grid'; // Or 'block'
            if (cartEmptyState) cartEmptyState.style.display = 'none';
        }
    };

    /**
     * Sends the updated quantity to the server (AC #9)
     * This is the function we will debounce.
     * @param {string} itemId - The cart item ID
     * @param {number} quantity - The new quantity
     * @param {HTMLElement} cartItemElement - The DOM element for the item
     */
    const sendQuantityUpdate = (itemId, quantity, cartItemElement) => {
        console.log(`Debounced: Sending update for ${itemId} to quantity ${quantity}`);

        // Set loading state (AC #7)
        cartItemElement.classList.add('is-loading');

        fetch('/cart/update', { // Assuming this is your update endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                cart_item_id: itemId,
                quantity: quantity
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                // Server-side error
                throw new Error(data.message || 'Failed to update quantity.');
            }
            // On success, we can re-sync totals from the server if needed,
            // but our optimistic update should be close.
            // For now, just remove the loading state.
            console.log('Server update successful:', data);
            
            // Re-sync totals from server response for 100% accuracy
            // (This assumes your server sends back new totals)
            // updateAllTotalsFromServer(data.totals);
        })
        .catch(error => {
            console.error('Error updating quantity:', error);
            // Optionally: revert the UI change on failure
            // For now, just show an error
            alert('Error updating cart. Please refresh and try again.');
        })
        .finally(() => {
            // Remove loading state
            cartItemElement.classList.remove('is-loading');
        });
    };

    // Create the debounced version of our update function (AC #11)
    const debouncedSendQuantityUpdate = debounce(sendQuantityUpdate, 500); // 500ms delay


    // --- 4. Event Handlers ---

    /**
     * Handles clicks on '+', '-', or typing in the quantity input
     * @param {Event} event - The click or input event
     */
    const handleQuantityChange = (event) => {
        const target = event.target;

        // Find the parent cart item
        const cartItem = target.closest('.cart-item');
        if (!cartItem) return;

        const quantityInput = cartItem.querySelector('.quantity-value');
        const itemId = cartItem.dataset.itemId;
        const stock = parseInt(cartItem.dataset.stock);
        let currentQuantity = parseInt(quantityInput.value);

        if (isNaN(currentQuantity)) currentQuantity = 1;

        let newQuantity = currentQuantity;

        // Determine new quantity based on which button was clicked
        if (target.matches('.quantity-plus')) {
            newQuantity = currentQuantity + 1;
        } else if (target.matches('.quantity-minus')) {
            newQuantity = currentQuantity - 1;
        } else if (target.matches('.quantity-value')) {
            // User is typing or changed the value directly
            newQuantity = parseInt(quantityInput.value);
            if (isNaN(newQuantity)) {
                newQuantity = 1; // Default to 1 if invalid input
            }
        }

        // --- Validation ---
        if (newQuantity < 1) {
            newQuantity = 1;
        }
        if (newQuantity > stock) {
            newQuantity = stock;
            alert(`You can only order a maximum of ${stock} items.`);
        }
        
        // --- Optimistic UI Update (AC #10) ---
        quantityInput.value = newQuantity;
        updateAllTotals();

        // --- Persistence (AC #9 & #11) ---
        // Call the debounced function to update the server
        debouncedSendQuantityUpdate(itemId, newQuantity, cartItem);
    };

    /**
     * Handles click on the delete button (AC #4)
     * @param {HTMLElement} deleteButton - The delete button that was clicked
     */
    const handleDeleteClick = (deleteButton) => {
        const cartItem = deleteButton.closest('.cart-item');
        if (!cartItem) return;

        // Store the item to be deleted
        itemToDelete = cartItem;

        // Show the confirmation modal
        if (deleteModal) deleteModal.hidden = false;
    };

    /**
     * Finalizes the deletion after confirmation (AC #4)
     */
    const confirmDelete = () => {
        if (!itemToDelete) return;

        const itemId = itemToDelete.dataset.itemId;

        // Set loading state (AC #7)
        itemToDelete.classList.add('is-loading');

        // Hide modal
        if (deleteModal) deleteModal.hidden = true;

        // --- Persistence (AC #9) ---
        fetch('/cart/delete', { // Assuming this is your delete endpoint
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                cart_item_id: itemId
            })
        })
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || 'Failed to delete item.');
            }
            
            // --- Optimistic UI Update (AC #10) ---
            // On success, remove the item from the DOM
            itemToDelete.remove();
            
            // Recalculate everything
            updateAllTotals();
        })
        .catch(error => {
            console.error('Error deleting item:', error);
            alert('Error deleting item. Please refresh and try again.');
            if (itemToDelete) itemToDelete.classList.remove('is-loading');
        })
        .finally(() => {
            itemToDelete = null; // Clear the stored item
        });
    };

    /**
     * Cancels the deletion (AC #4)
     */
    const cancelDelete = () => {
        itemToDelete = null;
        if (deleteModal) deleteModal.hidden = true;
    };


    // --- 5. Event Listeners ---

    // Use Event Delegation on the main list for clicks
    cartItemsList.addEventListener('click', (event) => {
        const target = event.target;

        // Check for quantity button clicks
        if (target.matches('.quantity-plus') || target.matches('.quantity-minus')) {
            handleQuantityChange(event);
        }

        // Check for delete button click
        if (target.matches('.delete-item-btn') || target.closest('.delete-item-btn')) {
            const deleteButton = target.matches('.delete-item-btn') ? target : target.closest('.delete-item-btn');
            handleDeleteClick(deleteButton);
        }
    });

    // Add 'change' listener for quantity inputs (handles typing)
    cartItemsList.addEventListener('change', (event) => {
        if (event.target.matches('.quantity-value')) {
            handleQuantityChange(event);
        }
    });

    // Modal button listeners
    if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', confirmDelete);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', cancelDelete);
    // Optional: Allow clicking the backdrop to cancel
    if (deleteModal) {
        deleteModal.addEventListener('click', (event) => {
            if (event.target === deleteModal) {
                cancelDelete();
            }
        });
    }

});
