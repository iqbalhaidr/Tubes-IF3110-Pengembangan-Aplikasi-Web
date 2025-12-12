(function () {
    const selectors = {
        backdrop: '[data-topup-backdrop]',
        form: '[data-topup-form]',
        amountInput: '[data-topup-amount]'
    };

    let backdropElement = null;
    let formElement = null;
    let amountInput = null;
    let feedbackElement = null;
    let manualSubmitButton = null;
    let midtransSubmitButton = null;

    document.addEventListener('DOMContentLoaded', () => {
        if (!window.api || typeof window.api.post !== 'function') {
            console.warn('Top-up module disabled: API helper not available.');
            return;
        }

        injectModal();
        bindGlobalTriggers();
        
        // Re-cache elements after modal is injected
        cacheElements();
        
        // Re-attach modal events
        attachModalEvents();
    });

    function injectModal() {
        if (document.querySelector(selectors.backdrop)) {
            cacheElements();
            return;
        }

        const backdrop = document.createElement('div');
        backdrop.className = 'topup-backdrop';
        backdrop.setAttribute('data-topup-backdrop', '');
        backdrop.setAttribute('aria-hidden', 'true');
        backdrop.setAttribute('aria-modal', 'true');
        backdrop.setAttribute('role', 'dialog');
        backdrop.setAttribute('inert', '');
        backdrop.innerHTML = `
            <div class="topup-modal" role="presentation">
                <header>
                    <h2 id="topup-modal-title">Tambah Saldo</h2>
                    <button type="button" class="topup-close-btn" data-close-topup aria-label="Tutup pop up">×</button>
                </header>
                <p>Pilih nominal atau masukkan jumlah saldo yang ingin kamu tambahkan ke akun buyer.</p>
                <div class="topup-quick-grid" data-topup-quick>
                    ${[50000, 100000, 150000, 200000].map(value => `<button type="button" class="topup-quick-option" data-topup-value="${value}">Rp ${formatCurrency(value)}</button>`).join('')}
                </div>
                <form class="topup-form" data-topup-form>
                    <label for="topupAmount">Nominal top up</label>
                    <input type="number" min="1" step="1" id="topupAmount" data-topup-amount placeholder="Contoh: 25000" required>
                    <div class="topup-feedback" data-topup-feedback></div>
                    <div class="topup-actions">
                        <button type="button" class="topup-cancel-btn" data-close-topup>Batal</button>
                        <button type="submit" class="topup-submit-btn" data-action="topup-manual">
                            <span>Top Up Manual</span>
                        </button>
                        <button type="submit" class="topup-submit-btn" data-action="topup-midtrans">
                            <span>Top Up (Midtrans)</span>
                        </button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(backdrop);
        cacheElements();
        attachModalEvents();
    }

    function cacheElements() {
        backdropElement = document.querySelector(selectors.backdrop);
        formElement = document.querySelector(selectors.form);
        amountInput = document.querySelector(selectors.amountInput);
        feedbackElement = document.querySelector('[data-topup-feedback]');
        manualSubmitButton = document.querySelector('[data-action="topup-manual"]');
        midtransSubmitButton = document.querySelector('[data-action="topup-midtrans"]');
    }

    function attachModalEvents() {
        if (!backdropElement || !formElement) {
            return;
        }

        const actionsContainer = formElement.querySelector('.topup-actions');
        if (actionsContainer) {
            actionsContainer.addEventListener('click', (event) => {
                const manualBtn = event.target.closest('[data-action="topup-manual"]');
                const midtransBtn = event.target.closest('[data-action="topup-midtrans"]');

                if (manualBtn) {
                    event.preventDefault();
                    handleSubmit(event, manualSubmitButton); // Pass the specific button
                } else if (midtransBtn) {
                    event.preventDefault();
                    initiateMidtransTopUp(midtransSubmitButton); // Call new Midtrans function
                }
            });
        }
        
        backdropElement.addEventListener('click', (event) => {
            if (event.target === backdropElement) {
                closeModal();
            }
        });

        backdropElement.querySelectorAll('[data-close-topup]').forEach((button) => {
            button.addEventListener('click', closeModal);
        });

        const quickGrid = backdropElement.querySelector('[data-topup-quick]');
        if (quickGrid) {
            quickGrid.addEventListener('click', (event) => {
                const option = event.target.closest('[data-topup-value]');
                if (!option || !amountInput) {
                    return;
                }
                amountInput.value = option.getAttribute('data-topup-value');
                clearFeedback();
                amountInput.focus();
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && isModalVisible()) {
                closeModal();
            }
        });
    }

    function bindGlobalTriggers() {
        document.addEventListener('click', (event) => {
            const trigger = event.target.closest('[data-action="open-topup"]');
            if (trigger) {
                event.preventDefault();
                openModal();
            }
        });

        window.balanceUI = window.balanceUI || {};
        window.balanceUI.openTopUpModal = openModal;
    }

    function openModal() {
        if (!backdropElement) {
            return;
        }

        backdropElement.classList.add('is-visible');
        backdropElement.setAttribute('aria-hidden', 'false');
        backdropElement.removeAttribute('inert');
        clearFeedback();
        if (amountInput) {
            amountInput.focus();
            amountInput.select();
        }
    }

    function closeModal() {
        if (!backdropElement) {
            return;
        }

        backdropElement.classList.remove('is-visible');
        backdropElement.setAttribute('aria-hidden', 'true');
        backdropElement.setAttribute('inert', '');
        if (formElement) {
            formElement.reset();
        }
        clearFeedback();
    }

    function isModalVisible() {
        return backdropElement && backdropElement.classList.contains('is-visible');
    }

    async function handleSubmit(event, buttonElement) {
        event.preventDefault();
        console.log('handleSubmit: Function started');
        if (!amountInput || !buttonElement) {
            console.log('handleSubmit: amountInput or buttonElement not found');
            return;
        }

        clearFeedback();

        const rawValue = amountInput.value.trim();
        const amount = Number.parseInt(rawValue, 10);

        if (Number.isNaN(amount) || amount <= 0) {
            showFeedback('Masukkan nominal yang valid dan lebih besar dari 0.', 'error');
            amountInput.focus();
            console.log('handleSubmit: Validation failed - invalid amount');
            return;
        }

        console.log('handleSubmit: Validation passed for amount:', amount);
        toggleSubmitting(true, buttonElement); // Pass the button to toggleSubmitting

        try {
            console.log('handleSubmit: Attempting to post to /balance/top-up with amount:', amount);
            const response = await window.api.post('/balance/top-up', { amount });
            console.log('handleSubmit: Received response from /balance/top-up:', response);

            if (!response || !response.success) {
                console.log('handleSubmit: API response indicates failure or is invalid', response);
                throw response || { message: 'Gagal menambah saldo.' };
            }

            const newBalance = response.data && typeof response.data.balance !== 'undefined'
                ? response.data.balance
                : null;

            if (newBalance !== null) {
                updateBalanceBadge(newBalance);
            }

            showFeedback(`Saldo berhasil ditambahkan sebesar Rp ${formatCurrency(amount)}.`, 'success');
            window.dispatchEvent(new CustomEvent('balance:updated', {
                detail: { balance: newBalance, amount }
            }));
            console.log('handleSubmit: Top-up successful, new balance:', newBalance);

            setTimeout(() => {
                closeModal();
            }, 800);
        } catch (error) {
            console.error('handleSubmit: Error during top-up process:', error);
            const message = deriveErrorMessage(error);
            showFeedback(message, 'error');
        } finally {
            console.log('handleSubmit: Finally block executed');
            toggleSubmitting(false, buttonElement); // Pass the button to toggleSubmitting
        }
    }

    async function initiateMidtransTopUp(buttonElement) {
        console.log('initiateMidtransTopUp: Function started');
        if (!amountInput || !buttonElement) {
            console.log('initiateMidtransTopUp: amountInput or buttonElement not found');
            return;
        }

        clearFeedback();

        const rawValue = amountInput.value.trim();
        const amount = Number.parseInt(rawValue, 10);

        if (Number.isNaN(amount) || amount <= 0) {
            showFeedback('Masukkan nominal yang valid dan lebih besar dari 0.', 'error');
            amountInput.focus();
            console.log('initiateMidtransTopUp: Validation failed - invalid amount');
            return;
        }

        console.log('initiateMidtransTopUp: Validation passed for amount:', amount);
        toggleSubmitting(true, buttonElement);

        try {
            console.log('initiateMidtransTopUp: Attempting to post to /api/topup/midtrans-initiate with amount:', amount);
            const response = await window.api.post('/api/topup/midtrans-initiate', { amount });
            console.log('initiateMidtransTopUp: Received response from /api/topup/midtrans-initiate:', response);

            if (!response || !response.success || !response.snapToken) {
                console.log('initiateMidtransTopUp: API response indicates failure or missing snapToken', response);
                throw response || { message: 'Gagal memulai pembayaran Midtrans.' };
            }

            const snapToken = response.snapToken;
            const clientKey = window.MIDTRANS_CLIENT_KEY; // Get clientKey from global variable

            console.log('initiateMidtransTopUp: Snap Token received:', snapToken);

            await loadMidtransSnap(clientKey);

            window.snap.pay(snapToken, {
                onSuccess: function(result){
                    /* You may add your own implementation here */
                    console.log('Midtrans success:', result);
                    showFeedback('Pembayaran Midtrans berhasil!', 'success');
                    // Consider an AJAX call to update the balance or redirect to a success page
                    setTimeout(() => {
                        window.location.reload(); // Reload page to update balance
                    }, 1000);
                },
                onPending: function(result){
                    /* You may add your own implementation here */
                    console.log('Midtrans pending:', result);
                    showFeedback('Pembayaran Midtrans menunggu konfirmasi.', 'info');
                    // Consider an AJAX call to update pending status
                    setTimeout(() => {
                        closeModal();
                    }, 1000);
                },
                onError: function(result){
                    /* You may add your own implementation here */
                    console.log('Midtrans error:', result);
                    showFeedback('Pembayaran Midtrans gagal!', 'error');
                },
                onClose: function(){
                    /* You may add your own implementation here */
                    console.log('Midtrans popup closed without finishing payment');
                    showFeedback('Pembayaran dibatalkan.', 'error');
                }
            });

        } catch (error) {
            console.error('initiateMidtransTopUp: Error during Midtrans initiation:', error);
            const message = deriveErrorMessage(error);
            showFeedback(message, 'error');
        } finally {
            console.log('initiateMidtransTopUp: Finally block executed');
            toggleSubmitting(false, buttonElement);
        }
    }

    function toggleSubmitting(isSubmitting, buttonElement) {
        if (!buttonElement) {
            return;
        }

        buttonElement.disabled = isSubmitting;

        if (isSubmitting) {
            buttonElement.innerHTML = '<span class="loading" aria-hidden="true"></span><span>Memproses...</span>';
        } else {
            // Restore original text based on data-action
            if (buttonElement.dataset.action === 'topup-manual') {
                buttonElement.innerHTML = '<span>Top Up Manual</span>';
            } else if (buttonElement.dataset.action === 'topup-midtrans') {
                buttonElement.innerHTML = '<span>Top Up (Midtrans)</span>';
            }
        }
    }

    // Utility to dynamically load Midtrans Snap script
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

    function showFeedback(message, type) {
        if (!feedbackElement) {
            return;
        }

        feedbackElement.textContent = message;
        feedbackElement.classList.remove('success', 'error', 'is-visible');
        feedbackElement.classList.add(type === 'success' ? 'success' : 'error', 'is-visible');
    }

    function clearFeedback() {
        if (!feedbackElement) {
            return;
        }
        feedbackElement.textContent = '';
        feedbackElement.classList.remove('success', 'error', 'is-visible');
    }

    function updateBalanceBadge(balanceValue) {
        const balanceDisplay = document.getElementById('balanceDisplay');
        const balanceAmount = document.getElementById('balanceAmount');

        if (balanceDisplay && balanceAmount) {
            balanceDisplay.style.display = 'flex';
            balanceAmount.textContent = 'Balance: Rp ' + formatCurrency(balanceValue);
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('id-ID').format(value);
    }

    function deriveErrorMessage(error) {
        if (!error) {
            return 'Terjadi kesalahan. Silakan coba lagi.';
        }

        if (error.errors && error.errors.amount) {
            return error.errors.amount;
        }

        if (error.message) {
            return error.message;
        }

        return 'Gagal memproses permintaan. Coba lagi nanti.';
    }
})();
