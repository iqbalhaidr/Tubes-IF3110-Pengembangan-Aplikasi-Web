document.addEventListener('DOMContentLoaded', () => {

    const cartItemsList = document.getElementById('cart-items-list');
    const cartSummary = document.getElementById('cart-summary');
    const cartContentContainer = document.getElementById('cart-content-container');
    const cartEmptyState = document.getElementById('cart-empty-state');

    const summaryGrandTotalItems = document.getElementById('summary-grandtotal-items');
    const summaryGrandTotalPrice = document.getElementById('summary-grandtotal-price');
    const checkoutButton = document.getElementById('checkout-button');
    const checkoutButtonText = checkoutButton ? checkoutButton.querySelector('span') : null;

    const deleteModal = document.getElementById('delete-confirm-modal');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-delete-btn');

    const cartBadge = document.getElementById('cartBadge');

    let itemToDelete = null;

    if (!cartItemsList) {
        return;
    }

    const formatCurrency = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(number);
    };

    const debounce = (func, wait) => {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    };

    const updateAllTotals = () => {
        let grandTotalItems = 0;
        let grandTotalPrice = 0;

        const storeGroups = cartItemsList.querySelectorAll('.cart-store-group');

        storeGroups.forEach(storeGroup => {
            let storeTotalItems = 0;
            let storeTotalPrice = 0;

            const items = storeGroup.querySelectorAll('.cart-item');

            if (items.length === 0) {
                storeGroup.remove();
                return;
            }

            items.forEach(item => {
                const unitPrice = parseFloat(item.dataset.unitPrice);
                const quantityInput = item.querySelector('.quantity-value');
                const quantity = parseInt(quantityInput.value);

                if (isNaN(unitPrice) || isNaN(quantity)) {
                    return;
                }

                storeTotalItems += quantity;
                storeTotalPrice += unitPrice * quantity;
            });

            const storeTotalItemsEl = storeGroup.querySelector('.store-total-items');
            const storeTotalPriceEl = storeGroup.querySelector('.store-total-price');
            
            if (storeTotalItemsEl) storeTotalItemsEl.textContent = storeTotalItems;
            if (storeTotalPriceEl) storeTotalPriceEl.textContent = formatCurrency(storeTotalPrice);

            grandTotalItems += storeTotalItems;
            grandTotalPrice += storeTotalPrice;
        });

        if (summaryGrandTotalItems) summaryGrandTotalItems.textContent = grandTotalItems;
        if (summaryGrandTotalPrice) summaryGrandTotalPrice.textContent = formatCurrency(grandTotalPrice);

        const allItemsInDOM = cartItemsList.querySelectorAll('.cart-item');
        const uniqueItemCount = allItemsInDOM.length;

        if (checkoutButton) {
            checkoutButton.textContent = `Checkout (${grandTotalItems})`;
            checkoutButton.disabled = (grandTotalItems === 0);
        }

        updateCartBadge(uniqueItemCount);

        checkEmptyState();
    };

    const updateCartBadge = (totalItems) => {
        if (cartBadge) {
            cartBadge.textContent = totalItems;
            cartBadge.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    };

    const checkEmptyState = () => {
        const anyItemLeft = cartItemsList.querySelector('.cart-item');
        
        if (!anyItemLeft) {
            if (cartContentContainer) cartContentContainer.style.display = 'none';
            if (cartEmptyState) cartEmptyState.style.display = 'flex'; 
        } else {
            if (cartContentContainer) cartContentContainer.style.display = 'grid'; 
            if (cartEmptyState) cartEmptyState.style.display = 'none';
        }
    };

    const sendQuantityUpdate = (itemId, quantity, cartItemElement) => {
        console.log(`Debounced: Sending update for ${itemId} to quantity ${quantity}`);

        // Set loading state (AC #7)
        cartItemElement.classList.add('is-loading');

        api.put('/cart/' + itemId, { quantity: quantity })
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

    const debouncedSendQuantityUpdate = debounce(sendQuantityUpdate, 500); // 500ms delay

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

        if (newQuantity < 1) {
            newQuantity = 1;
        }
        if (newQuantity > stock) {
            newQuantity = stock;
            alert(`You can only order a maximum of ${stock} items.`);
        }

        quantityInput.value = newQuantity;
        updateAllTotals();

        debouncedSendQuantityUpdate(itemId, newQuantity, cartItem);
    };

    const handleDeleteClick = (deleteButton) => {
        const cartItem = deleteButton.closest('.cart-item');
        if (!cartItem) return;

        itemToDelete = cartItem;

        if (deleteModal) deleteModal.hidden = false;
    };

    const confirmDelete = () => {
        if (!itemToDelete) return;

        const itemId = itemToDelete.dataset.itemId;

        itemToDelete.classList.add('is-loading');

        if (deleteModal) deleteModal.hidden = true;

        api.delete('/cart/' + itemId)
        .then(data => {
            if (!data.success) {
                throw new Error(data.message || 'Failed to delete item.');
            }
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
    };

    const cancelDelete = () => {
        itemToDelete = null;
        if (deleteModal) deleteModal.hidden = true;
    };

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

    cartItemsList.addEventListener('change', (event) => {
        if (event.target.matches('.quantity-value')) {
            handleQuantityChange(event);
        }
    });

    if (modalConfirmBtn) modalConfirmBtn.addEventListener('click', confirmDelete);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', cancelDelete);
    if (deleteModal) {
        deleteModal.addEventListener('click', (event) => {
            if (event.target === deleteModal) {
                cancelDelete();
            }
        });
    }

    updateAllTotals();

});
