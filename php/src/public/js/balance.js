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
    let submitButton = null;

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
                        <button type="submit" class="topup-submit-btn" data-topup-submit>
                            <span>Tambah Saldo</span>
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
        submitButton = document.querySelector('[data-topup-submit]');
    }

    function attachModalEvents() {
        if (!backdropElement || !formElement) {
            return;
        }

        formElement.addEventListener('submit', handleSubmit);

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

    async function handleSubmit(event) {
        event.preventDefault();
        if (!amountInput || !submitButton) {
            return;
        }

        clearFeedback();

        const rawValue = amountInput.value.trim();
        const amount = Number.parseInt(rawValue, 10);

        if (Number.isNaN(amount) || amount <= 0) {
            showFeedback('Masukkan nominal yang valid dan lebih besar dari 0.', 'error');
            amountInput.focus();
            return;
        }

        toggleSubmitting(true);

        try {
            const response = await window.api.post('/balance/top-up', { amount });

            if (!response || !response.success) {
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

            setTimeout(() => {
                closeModal();
            }, 800);
        } catch (error) {
            const message = deriveErrorMessage(error);
            showFeedback(message, 'error');
        } finally {
            toggleSubmitting(false);
        }
    }

    function toggleSubmitting(isSubmitting) {
        if (!submitButton) {
            return;
        }

        submitButton.disabled = isSubmitting;

        if (isSubmitting) {
            submitButton.innerHTML = '<span class="loading" aria-hidden="true"></span><span>Memproses...</span>';
        } else {
            submitButton.textContent = 'Tambah Saldo';
        }
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
