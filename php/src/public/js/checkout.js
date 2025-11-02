document.addEventListener('DOMContentLoaded', () => {
    const createOrderBtn = document.getElementById('createOrderBtn');
    const balanceWarning = document.getElementById('balanceWarning');
    const addressWarning = document.getElementById('addressWarning');
    const shippingAddressEl = document.getElementById('shippingAddress');

    const confirmCheckoutModal = document.getElementById('confirmCheckoutModal');
    const cancelCheckoutBtn = document.getElementById('cancelCheckoutBtn');
    const confirmCheckoutBtn = document.getElementById('confirmCheckoutBtn');

    const { 
        currentUserBalance, 
        grandTotal, 
        isSufficient,
        isCartEmpty,
    } = window.checkoutData;

    const show = (el) => el && (el.style.display = 'block');
    const hide = (el) => el && (el.style.display = 'none');

    function validateCheckoutState() {
        let disableButton = false;
        let buttonText = 'Create Order';

        const currentAddress = shippingAddressEl ? shippingAddressEl.value.trim() : '';
        
        if (!isSufficient) {
            show(balanceWarning);
            disableButton = true;
        } else {
            hide(balanceWarning);
        }

        if (currentAddress === '') {
            show(addressWarning);
            disableButton = true;
            buttonText = 'Please Enter Address';
        } else {
            hide(addressWarning);
        }

        if (isCartEmpty) {
            disableButton = true;
        }

        if (createOrderBtn) {
            createOrderBtn.disabled = disableButton;
            if (disableButton) {
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

    validateCheckoutState();

    if (shippingAddressEl) {
        shippingAddressEl.addEventListener('input', validateCheckoutState);
    }

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

    if (confirmCheckoutBtn) {
        confirmCheckoutBtn.addEventListener('click', async () => {
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
                validateCheckoutState();
                return;
            }

            try {
                const result = await api.post('/checkout', { 
                    shippingAddress: shippingAddress 
                });

                if (result.success) {
                    showToast('Checkout successful! Redirecting to your orders...', 'success');
                    setTimeout(() => {
                        window.location.href = result.data.redirect || '/buyer/order-history';
                    }, 2000);
                } else {
                    throw new Error(result.message || 'An unknown error occurred.');
                }

            } catch (error) {
                console.error('Checkout failed:', error);
                showToast(error.message || 'Checkout failed. Please try again.', 'error');
                
                confirmCheckoutBtn.disabled = false;
                confirmCheckoutBtn.textContent = 'Confirm';
                if (confirmCheckoutModal) {
                    confirmCheckoutModal.classList.add('hidden');
                }
            }
        });
    }

    if (confirmCheckoutModal) {
        confirmCheckoutModal.addEventListener('click', (e) => {
            if (e.target === confirmCheckoutModal) {
                confirmCheckoutModal.classList.add('hidden');
            }
        });
    }

});

