document.addEventListener('DOMContentLoaded', () => {

    const cartForm = document.getElementById('cartForm');
    if (cartForm) {
        const qtyInput = document.getElementById('qty-input');
        const qtyPlus = document.getElementById('qty-plus');
        const qtyMinus = document.getElementById('qty-minus');
        const addToCartBtn = document.getElementById('addToCartBtn');
        
        const maxStock = parseInt(qtyInput.dataset.maxStock);

        function validateQty() {
            let currentQty = parseInt(qtyInput.value);

            if (isNaN(currentQty) || currentQty < 1) {
                currentQty = 1;
                qtyInput.value = 1;
            }
            
            if (currentQty > maxStock) {
                currentQty = maxStock;
                qtyInput.value = maxStock;
                showToast("Stok tidak mencukupi", "error");
            }

            qtyMinus.disabled = currentQty <= 1;
            qtyPlus.disabled = currentQty >= maxStock;
        }

        // --- Event Listeners ---
        qtyPlus.addEventListener('click', () => {
            qtyInput.value = parseInt(qtyInput.value) + 1;
            validateQty();
        });

        qtyMinus.addEventListener('click', () => {
            qtyInput.value = parseInt(qtyInput.value) - 1;
            validateQty();
        });

        qtyInput.addEventListener('change', validateQty); 
        qtyInput.addEventListener('keyup', validateQty);

        addToCartBtn.addEventListener('click', async () => {
            const productId = addToCartBtn.dataset.productId;
            const quantity = parseInt(qtyInput.value);
            
            if (quantity > maxStock) {
                showToast("Stok tidak mencukupi", "error");
                return;
            }
            
            addToCartBtn.disabled = true;
            addToCartBtn.textContent = 'Menambahkan...';

            try {
                const result = await api.post('/cart', {
                    product_id: productId,
                    quantity: quantity
                });

                if (result.success) {
                    showToast("Berhasil ditambahkan ke keranjang");
                    if (typeof updateGlobalCartBadge === 'function') {
                        updateGlobalCartBadge(result.data.total_items);
                    }
                } else {
                    throw new Error(result.message || "Gagal menambahkan");
                }

            } catch (error) {
                console.error('Add to cart error:', error);
                showToast(error.message || "Terjadi kesalahan", "error");
            } finally {
                if (maxStock > 0) {
                    addToCartBtn.disabled = false;
                    addToCartBtn.textContent = 'Tambah ke Keranjang';
                }
            }
        });
    }
});
async function startChatWithStore(storeId) {
    // Show some loading feedback if you have a mechanism for it
    // e.g., document.body.classList.add('loading');

    try {
        // This uses the api helper from api.js, available as `window.api`
        const response = await api.post('/api/node/chat/rooms', { store_id: storeId });

        // The vanilla JS api helper returns the parsed JSON data directly
        if (response && response.status === 'success') {
            // Redirect to the main chat page. The React app will handle opening the correct room.
            window.location.href = '/chat';
        } else {
            // Use a toast or alert to show failure
            showToast(response.message || 'Gagal memulai obrolan.', 'error');
        }
    } catch (error) {
        console.error('Failed to start chat:', error);
        const errorMessage = error.message || 'Terjadi kesalahan saat memulai obrolan. Silakan coba lagi.';
        showToast(errorMessage, 'error');
    } finally {
        // Hide loading feedback
        // e.g., document.body.classList.remove('loading');
    }
}
