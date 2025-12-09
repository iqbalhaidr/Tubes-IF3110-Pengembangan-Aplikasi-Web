function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const tableBody = document.getElementById('productsTableBody');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    
    const deleteModal = document.getElementById('deleteModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const modalConfirmDeleteBtn = document.getElementById('modalConfirmDeleteBtn');
    const productNameDelete = document.getElementById('productNameDelete');

    let currentFilters = {
        search: '',
        category: '',
        sort_by: 'name',
        sort_order: 'ASC',
        page: 1
    };
    
    let deleteProductId = null;
    let selectedProductForAuction = null; 

    async function fetchProducts() {
        showLoading(true);
        
        const params = new URLSearchParams(currentFilters);
        
        try {
            const result = await api.get(`/api/seller/products?${params.toString()}`);
            if (result.success) {
                renderTable(result.data.products);
            } else {
                showEmptyState(true);
            }
        } catch (error) {
            console.error('Gagal mengambil produk:', error);
            showEmptyState(true);
        } finally {
            showLoading(false);
        }
    }

    function renderTable(products) {
        tableBody.innerHTML = '';
        if (products.length === 0) {
            showEmptyState(true);
            return;
        }
        
        showEmptyState(false);
        
        products.forEach(product => {
            const stockStatus = product.stock > 0 ? `${product.stock} Pcs` : '<span class="stock-out">Habis</span>';
            const imageUrl = product.main_image_path || '/public/images/default.png';
            
            // Check if product has active/scheduled auction
            const hasAuction = product.auction_status && (product.auction_status === 'ACTIVE' || product.auction_status === 'SCHEDULED');
            
            let actionsHtml = '';
            if (hasAuction) {
                // Show badge instead of edit/delete buttons
                actionsHtml = `
                    <div class="auction-status">
                        <span class="badge-dalam-lelang">DALAM LELANG</span>
                        <a href="/seller/products/${product.product_id}/manage-auctions" class="btn btn-info btn-sm">Lihat Lelang</a>
                    </div>
                `;
            } else {
                // Show Lelang, Edit, Delete buttons
                actionsHtml = `
                    <a href="/seller/products/${product.product_id}/create-auction" class="btn btn-secondary btn-sm">Jadikan Lelang</a>
                    <a href="/seller/products/edit/${product.product_id}" class="btn btn-secondary btn-sm">Edit</a>
                    <button class="btn btn-danger btn-sm btn-delete" 
                            data-id="${product.product_id}" 
                            data-name="${product.product_name}">
                        Delete
                    </button>
                `;
            }
            
            const row = `
                <tr data-id="${product.product_id}">
                    <td><img src="${imageUrl}" alt="${product.product_name}" class="table-thumbnail"></td>
                    <td data-label="Nama Produk">${product.product_name}</td>
                    <td data-label="Kategori">${product.categories || '-'}</td>
                    <td data-label="Harga">Rp. ${Number(product.price).toLocaleString('id-ID')}</td>
                    <td data-label="Stok">${stockStatus}</td>
                    <td data-label="Aksi">
                        ${actionsHtml}
                    </td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    function showLoading(isLoading) {
        if (isLoading) {
            loadingState.style.display = 'block';
            tableBody.innerHTML = '';
            emptyState.style.display = 'none';
        } else {
            loadingState.style.display = 'none';
        }
    }
    
    function showEmptyState(isEmpty) {
        emptyState.style.display = isEmpty ? 'block' : 'none';
    }

    searchInput.addEventListener('input', debounce(() => {
        currentFilters.search = searchInput.value;
        currentFilters.page = 1;
        fetchProducts();
    }, 500));

    categoryFilter.addEventListener('change', () => {
        currentFilters.category = categoryFilter.value;
        currentFilters.page = 1;
        fetchProducts();
    });

    sortFilter.addEventListener('change', () => {
        const [sortBy, sortOrder] = sortFilter.value.split(':');
        currentFilters.sort_by = sortBy;
        currentFilters.sort_order = sortOrder;
        currentFilters.page = 1;
        fetchProducts();
    });


    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            deleteProductId = e.target.dataset.id;
            productNameDelete.textContent = e.target.dataset.name;
            deleteModal.classList.remove('hidden');
        }
    });

    function closeModal() {
        deleteModal.classList.add('hidden');
        deleteProductId = null;
    }

    modalCloseBtn.addEventListener('click', closeModal);
    modalCancelBtn.addEventListener('click', closeModal);

    modalConfirmDeleteBtn.addEventListener('click', async () => {
        if (!deleteProductId) return;

        modalConfirmDeleteBtn.disabled = true;
        modalConfirmDeleteBtn.textContent = 'Menghapus...';

        try {
            const result = await api.post('/api/seller/product/delete', {
                product_id: deleteProductId
            });

            if (result.success) {
                showToast(result.message || 'Produk berhasil dihapus');
                fetchProducts(); 
            } else {
                showToast(result.message || 'Gagal menghapus', 'error');
            }
        } catch (error) {
            showToast('Error: ' + error.message, 'error');
        } finally {
            modalConfirmDeleteBtn.disabled = false;
            modalConfirmDeleteBtn.textContent = 'Ya, Hapus';
            closeModal();
        }
    });

    fetchProducts();
});


function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}