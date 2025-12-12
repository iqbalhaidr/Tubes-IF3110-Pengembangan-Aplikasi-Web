document.addEventListener('DOMContentLoaded', () => {
    const createOrderBtn = document.getElementById('createOrderBtn');
    const midtransPayBtn = document.getElementById('midtransPayBtn');
    const payWithBalanceRadio = document.getElementById('payWithBalance');
    const payWithMidtransRadio = document.getElementById('payWithMidtrans');
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

    function updatePaymentMethodView() {
        if (payWithBalanceRadio.checked) {
            show(createOrderBtn);
            hide(midtransPayBtn);
        } else {
            hide(createOrderBtn);
            show(midtransPayBtn);
        }
        validateCheckoutState();
    }

    payWithBalanceRadio.addEventListener('change', updatePaymentMethodView);
    payWithMidtransRadio.addEventListener('change', updatePaymentMethodView);

    updatePaymentMethodView();

    function validateCheckoutState() {
        let disableButton = false;
        const currentAddress = shippingAddressEl ? shippingAddressEl.value.trim() : '';

        if (payWithBalanceRadio.checked) {
            if (!isSufficient) {
                show(balanceWarning);
                disableButton = true;
            } else {
                hide(balanceWarning);
            }

            if (currentAddress === '') {
                show(addressWarning);
                disableButton = true;
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
        } else { // Pay with Midtrans
            hide(balanceWarning);
            if (currentAddress === '') {
                show(addressWarning);
                disableButton = true;
            } else {
                hide(addressWarning);
            }

            if (isCartEmpty) {
                disableButton = true;
            }

            if (midtransPayBtn) {
                midtransPayBtn.disabled = disableButton;
                if (disableButton) {
                    if (currentAddress === '') {
                        midtransPayBtn.textContent = 'Please Enter Address';
                    } else if (isCartEmpty) {
                        midtransPayBtn.textContent = 'Cart is Empty';
                    }
                } else {
                    midtransPayBtn.textContent = 'Proceed to Payment';
                }
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

    if (midtransPayBtn) {
        midtransPayBtn.addEventListener('click', async () => {
            const shippingAddress = shippingAddressEl ? shippingAddressEl.value.trim() : '';
            if (shippingAddress === '') {
                showToast('Shipping address cannot be empty.', 'error');
                return;
            }

            midtransPayBtn.disabled = true;
            midtransPayBtn.textContent = 'Processing...';

            try {
                const result = await api.post('/checkout', {
                    shippingAddress: shippingAddress,
                    paymentMethod: 'midtrans'
                });

                if (result.success && result.data.snap_token) {
                    await loadMidtransSnap(window.MIDTRANS_CLIENT_KEY); // Dynamically load Snap.js
                    snap.pay(result.data.snap_token, {
                        onSuccess: function (result) {
                            showToast('Payment successful! Redirecting...', 'success');
                            setTimeout(() => {
                                window.location.href = '/buyer/order-history';
                            }, 2000);
                        },
                        onPending: function (result) {
                            showToast('Payment is pending. You will be notified once the payment is confirmed.', 'info');
                            setTimeout(() => {
                                window.location.href = '/buyer/order-history';
                            }, 3000);
                        },
                        onError: function (result) {
                            showToast('Payment failed. Please try again.', 'error');
                            midtransPayBtn.disabled = false;
                            midtransPayBtn.textContent = 'Proceed to Payment';
                        },
                        onClose: function () {
                            midtransPayBtn.disabled = false;
                            midtransPayBtn.textContent = 'Proceed to Payment';
                        }
                    });
                } else {
                    throw new Error(result.message || 'Failed to get payment token.');
                }
            } catch (error) {
                console.error('Midtrans payment initiation failed:', error);
                showToast(error.message || 'Failed to initiate payment. Please try again.', 'error');
                midtransPayBtn.disabled = false;
                midtransPayBtn.textContent = 'Proceed to Payment';
            }
        });
    }

    // Utility to dynamically load Midtrans Snap script (copied from balance.js)
    function loadMidtransSnap(clientKey) {
        return new Promise((resolve, reject) => {
            if (window.snap && window.snap.pay) {
                console.log('Midtrans Snap already loaded.');
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = `https://app.sandbox.midtrans.com/snap/snap.js`;
            script.setAttribute('data-client-key', clientKey);
            script.onload = () => {
                console.log('Midtrans Snap script loaded successfully.');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load Midtrans Snap script.');
                reject(new Error('Failed to load Midtrans Snap script.'));
            };
            document.head.appendChild(script);
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

                    if (result.data && result.data.balance !== undefined) {
                        // Update navbar balance display
                        const balanceAmount = document.getElementById('balanceAmount');
                        if (balanceAmount) {
                            const formatter = new Intl.NumberFormat('id-ID');
                            balanceAmount.textContent = 'Balance: Rp ' + formatter.format(result.data.balance);
                        }

                        // Dispatch custom event for other components to listen to
                        window.dispatchEvent(new CustomEvent('balance:updated', {
                            detail: { balance: result.data.balance }
                        }));
                    }

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

