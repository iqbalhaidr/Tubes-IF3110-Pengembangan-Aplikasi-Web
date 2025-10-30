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
 * - AC #9: Persistence (AJAX) - SIMULATED
 * - AC #10: Optimistic UI updates
 * - AC #11: Debouncing for quantity updates
 */

// Wait for the DOM to be fully loaded before running any script
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Select Global Elements ---
    const cartItemsList = document.getElementById('cart-items-list');
    const cartSummary = document.getElementById('cart-summary');
    const cartContentContainer = document.getElementById('cart-content-container');
    const cartEmptyState = document.getElementById('cart-empty-state');

    // Summary fields
    const summaryGrandTotalItems = document.getElementById('summary-grandtotal-items');
    const summaryGrandTotalPrice = document.getElementById('summary-grandtotal-price');
    const checkoutButton = document.getElementById('checkout-button');
    // const checkoutButtonText = checkoutButton ? checkoutButton.querySelector('span') : null; // This wasn't used, just updating textContent

    // Modal elements (for AC #4)
    const deleteModal = document.getElementById('delete-confirm-modal');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-delete-btn');

    // Header cart badge (AC #8)
    const cartBadge = document.getElementById('cart-badge-counter');

    // A variable to store which item we're about to delete
    let itemToDelete = null;

    // Check if we are on a page with cart items
    if (!cartItemsList) {
        // We're not on the cart page or the cart is initially empty
        // We still run the script to handle the initial empty state
        if (cartEmptyState) {
            checkEmptyState();
        }
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
     */
    const updateAllTotals = () => {
        let grandTotalItems = 0;
        let grandTotalPrice = 0;

        const storeGroups = cartItemsList.querySelectorAll('.cart-store-group');

        storeGroups.forEach(storeGroup => {
            let storeTotalItems = 0;
            let storeTotalPrice = 0;

            const items = storeGroup.querySelectorAll('.cart-item');

            // If a store has no items left, remove the store group
            if (items.length === 0) {
                storeGroup.remove();
                return; // Go to the next store group
            }

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
     */
    const updateCartBadge = (totalItems) => {
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            // Use visibility or a class for better accessibility/transitions
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none'; 
        }
    };

    /**
     * Checks if the cart is empty and shows the empty state (AC #6)
     */
    const checkEmptyState = () => {
        // Check if any item *lists* are left (more robust than checking for items)
        const anyStoreGroupLeft = document.querySelector('.cart-store-group');
        
        if (!anyStoreGroupLeft) {
            if (cartContentContainer) cartContentContainer.style.display = 'none';
            if (cartEmptyState) cartEmptyState.style.display = 'flex'; 
        } else {
            // This case handles the initial page load if cart is not empty
            if (cartContentContainer) cartContentContainer.style.display = 'grid'; 
            if (cartEmptyState) cartEmptyState.style.display = 'none';
        }
    };

    /**
     * Sends the updated quantity to the server (AC #9) - SIMULATED
     */
    const sendQuantityUpdate = (itemId, quantity, cartItemElement) => {
        console.log(`Debounced: Sending update for ${itemId} to quantity ${quantity}`);

        // Set loading state (AC #7)
        cartItemElement.classList.add('is-loading');

        // --- SERVER COMMUNICATION (DISABLED FOR TESTING) ---
        /*
        fetch('/cart/update', { 
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
                throw new Error(data.message || 'Failed to update quantity.');
            }
            console.log('Server update successful:', data);
        })
        .catch(error => {
            console.error('Error updating quantity:', error);
            alert('Error updating cart. Please refresh and try again.');
        })
        .finally(() => {
            cartItemElement.classList.remove('is-loading');
        });
        */
        // --- END DISABLED BLOCK ---


        // --- SIMULATION FOR CLIENT-SIDE TESTING ---
        console.log("Simulating server update...");
        // Simulate a 300ms server delay
        setTimeout(() => {
            console.log('Simulated server update successful.');
            cartItemElement.classList.remove('is-loading');
        }, 300);
        // --- END SIMULATION ---
    };

    // Create the debounced version of our update function (AC #11)
    const debouncedSendQuantityUpdate = debounce(sendQuantityUpdate, 500); // 500ms delay


    // --- 4. Event Handlers ---

    /**
     * Handles clicks on '+', '-', or typing in the quantity input
     */
    const handleQuantityChange = (event) => {
        const target = event.target;

        const cartItem = target.closest('.cart-item');
        if (!cartItem) return;

        const quantityInput = cartItem.querySelector('.quantity-value');
        const itemId = cartItem.dataset.itemId;
        const stock = parseInt(cartItem.dataset.stock);
        let currentQuantity = parseInt(quantityInput.value);

        if (isNaN(currentQuantity)) currentQuantity = 1;

        let newQuantity = currentQuantity;

        if (target.matches('.quantity-plus')) {
            newQuantity = currentQuantity + 1;
        } else if (target.matches('.quantity-minus')) {
            newQuantity = currentQuantity - 1;
        } else if (target.matches('.quantity-value')) {
            newQuantity = parseInt(quantityInput.value);
            if (isNaN(newQuantity)) {
                newQuantity = 1; 
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
        debouncedSendQuantityUpdate(itemId, newQuantity, cartItem);
    };

    /**
     * Handles click on the delete button (AC #4)
     */
    const handleDeleteClick = (deleteButton) => {
        const cartItem = deleteButton.closest('.cart-item');
        if (!cartItem) return;

        itemToDelete = cartItem;
        if (deleteModal) deleteModal.hidden = false;
    };

    /**
     * Finalizes the deletion after confirmation (AC #4) - SIMULATED
     */
    const confirmDelete = () => {
        if (!itemToDelete) return;

        const itemId = itemToDelete.dataset.itemId;

        itemToDelete.classList.add('is-loading');
        if (deleteModal) deleteModal.hidden = true;

        // --- SERVER COMMUNICATION (DISABLED FOR TESTING) ---
        /*
        fetch('/cart/delete', { 
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
            
            // --- UI Update was here ---
            itemToDelete.remove();
            updateAllTotals();
        })
        .catch(error => {
            console.error('Error deleting item:', error);
            alert('Error deleting item. Please refresh and try again.');
            if (itemToDelete) itemToDelete.classList.remove('is-loading');
        })
        .finally(() => {
            itemToDelete = null; 
        });
        */
        // --- END DISABLED BLOCK ---


        // --- SIMULATION FOR CLIENT-SIDE TESTING ---
        console.log("Simulating server delete...");
        // Simulate a 300ms delay, then run the UI update logic
        setTimeout(() => {
            console.log('Simulated server delete successful.');
            
            // This logic was moved from the .then() block for testing
            itemToDelete.remove();
            updateAllTotals(); // Recalculate everything

            itemToDelete = null; // Clear the stored item
        }, 300);
        // --- END SIMULATION ---
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

        if (target.matches('.quantity-plus') || target.matches('.quantity-minus')) {
            handleQuantityChange(event);
        }

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
    
    if (deleteModal) {
        deleteModal.addEventListener('click', (event) => {
            if (event.target === deleteModal) {
                cancelDelete();
            }
        });
    }

    // --- 6. Initial Page Load Check ---
    // Run an initial check in case the cart is loaded empty from the server
    checkEmptyState();
    // Run totals on load to set initial badge count, etc.
    updateAllTotals();

});