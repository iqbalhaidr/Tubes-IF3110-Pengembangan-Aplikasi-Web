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
                const result = await api.post('/api/cart/add', {
                    product_id: productId,
                    quantity: quantity
                });

                if (result.success) {
                    showToast("Berhasil ditambahkan ke keranjang");
                    if (typeof updateCartBadge === 'function') {
                        updateCartBadge(result.data.total_items);
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