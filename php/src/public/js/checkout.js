document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    const createOrderBtn = document.getElementById('createOrderBtn');
    const balanceWarning = document.getElementById('balanceWarning');
    const addressWarning = document.getElementById('addressWarning');
    const shippingAddressEl = document.getElementById('shippingAddress');
    
    // Modal elements
    const confirmCheckoutModal = document.getElementById('confirmCheckoutModal');
    const cancelCheckoutBtn = document.getElementById('cancelCheckoutBtn');
    const confirmCheckoutBtn = document.getElementById('confirmCheckoutBtn');

    // Get data from PHP (injected via <script> tag in checkout.php)
    const { 
        currentUserBalance, 
        grandTotal, 
        isSufficient,
        isCartEmpty,
    } = window.checkoutData;

    // Helper function to show/hide
    const show = (el) => el && (el.style.display = 'block');
    const hide = (el) => el && (el.style.display = 'none');

    /**
     * Validate checkout conditions and update button state.
     * AC 4: Checkout button disabled if balance is not enough or loading
     * Also check for empty cart or empty address
     */
    function validateCheckoutState() {
        let disableButton = false;
        let buttonText = 'Create Order';

        const currentAddress = shippingAddressEl ? shippingAddressEl.value.trim() : '';
        
        // AC 5: Validation for balance
        if (!isSufficient) {
            show(balanceWarning);
            disableButton = true;
        } else {
            hide(balanceWarning);
        }

        // Additional validation: Address must exist
        if (currentAddress === '') {
            show(addressWarning);
            disableButton = true;
            buttonText = 'Please Enter Address';
        } else {
            hide(addressWarning);
        }

        // Additional validation: Cart must not be empty
        if (isCartEmpty) {
            disableButton = true;
        }

        if (createOrderBtn) {
            createOrderBtn.disabled = disableButton;
            if (disableButton) {
                // Prioritize button text
                if (currentAddress === '') {
                    createOrderBtn.textContent = 'Please Enter Address';
                } else if (!isSufficient) {
                    createOrderBtn.textContent = 'Insufficient Balance';
                } else if (isCartEmpty) {
                    createOrderBtn.textContent = 'Cart is Empty';
                }
            } else {
                createOrderBtn.textContent = 'Create Order';
            }
        }
    }

    // Initial validation on page load
    validateCheckoutState();

    if (shippingAddressEl) {
        shippingAddressEl.addEventListener('input', validateCheckoutState);
    }

    /**
     * AC 6: Confirmation modal before checkout
     */
    if (createOrderBtn) {
        createOrderBtn.addEventListener('click', () => {
            if (confirmCheckoutModal) {
                confirmCheckoutModal.classList.remove('hidden');
            }
        });
    }

    if (cancelCheckoutBtn) {
        cancelCheckoutBtn.addEventListener('click', () => {
            if (confirmCheckoutModal) {
                confirmCheckoutModal.classList.add('hidden');
            }
        });
    }

    /**
     * AC 7: Process: hold balance, decrement stock... (via API call)
     */
    if (confirmCheckoutBtn) {
        confirmCheckoutBtn.addEventListener('click', async () => {
            // Disable button to prevent double-clicking
            confirmCheckoutBtn.disabled = true;
            confirmCheckoutBtn.textContent = 'Processing...';

            const shippingAddress = shippingAddressEl ? shippingAddressEl.value.trim() : '';
            if (shippingAddress === '') {
                showToast('Shipping address cannot be empty.', 'error');
                confirmCheckoutBtn.disabled = false;
                confirmCheckoutBtn.textContent = 'Confirm';
                if (confirmCheckoutModal) {
                    confirmCheckoutModal.classList.add('hidden');
                }
                validateCheckoutState(); // Re-show warning on main page
                return;
            }

            try {
                // Call the /checkout POST endpoint
                const result = await api.post('/checkout', { 
                    shippingAddress: shippingAddress 
                });

                // AC 8: Redirect to order history if success
                // AC 10: Items automatically deleted from cart (handled by backend)
                if (result.success) {
                    showToast('Checkout successful! Redirecting to your orders...', 'success');
                    // Redirect to the URL provided by the backend
                    setTimeout(() => {
                        window.location.href = result.data.redirect || '/orders/history';
                    }, 2000);
                } else {
                    // This else block might not be hit if api.post throws on non-2xx
                    throw new Error(result.message || 'An unknown error occurred.');
                }

            } catch (error) {
                // AC 9: Error handling if stock/balance not enough
                console.error('Checkout failed:', error);
                // Display the error message from the backend
                showToast(error.message || 'Checkout failed. Please try again.', 'error');
                
                // Re-enable button and hide modal
                confirmCheckoutBtn.disabled = false;
                confirmCheckoutBtn.textContent = 'Confirm';
                if (confirmCheckoutModal) {
                    confirmCheckoutModal.classList.add('hidden');
                }
                
                // Note: If stock/balance changed, the user might need to reload
                // to see the new validation state.
            }
        });
    }

    // Close modal if clicking outside
    if (confirmCheckoutModal) {
        confirmCheckoutModal.addEventListener('click', (e) => {
            if (e.target === confirmCheckoutModal) {
                confirmCheckoutModal.classList.add('hidden');
            }
        });
    }

});

