const basePath = document.body.dataset.basePath || '/home';
const storeId = document.body.dataset.storeId || '';

function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

const urlParams = new URLSearchParams(window.location.search);
let currentState = {
    search: urlParams.get('search') || '',
    category: urlParams.get('category') || '',
    min_price: urlParams.get('min_price') || '',
    max_price: urlParams.get('max_price') || '',
    page: parseInt(urlParams.get('page') || 1),
    limit: parseInt(urlParams.get('limit') || 10),
    store_id: storeId
};

async function fetchProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const paginationContainer = document.getElementById('pagination');
    
    showLoadingSkeletons(productsGrid);
    
    const queryString = new URLSearchParams(currentState).toString();
    window.history.pushState(currentState, '', `${basePath}?${queryString}`);

    try {
        const result = await api.get(`/api/products?${queryString}`);
        if (result.success) {
            renderProducts(productsGrid, result.data.products);
            renderPagination(paginationContainer, result.data.pagination);
            updateFilterUI();
        } else {
            throw new Error(result.message || 'Failed to fetch data');
        }

    } catch (error) {
        console.error('Fetch error:', error);
        if (productsGrid) {
            productsGrid.innerHTML = '<p>Gagal memuat produk. Silakan coba lagi.</p>';
        }
        if (paginationContainer) {
            paginationContainer.innerHTML = '';
        }
    }
}

function showLoadingSkeletons(productsGrid) {
    if (!productsGrid) return;
    let skeletons = '';
    for (let i = 0; i < 10; i++) {
        skeletons += `
            <div class="product-card skeleton">
                <div class="product-image skeleton-img"></div>
                <div class="product-info">
                    <div class="product-name skeleton-text"></div>
                    <div class="product-price skeleton-text"></div>
                    <div class="product-store skeleton-text short"></div>
                </div>
            </div>
        `;
    }
    productsGrid.innerHTML = skeletons;
}

function renderProducts(productsGrid, products) {
    const emptyStateHTML = '<p style="grid-column: 1 / -1; text-align: center;">Produk tidak ditemukan.</p>';
    if (!productsGrid) return;
    
    if (products.length === 0) {
        productsGrid.innerHTML = emptyStateHTML;
        return;
    }

    let productHTML = '';
    products.forEach(product => {
        const isOutOfStock = product.stock === 0;
        const stockClass = isOutOfStock ? 'out-of-stock' : '';
        const imageUrl = product.image || '/public/images/default.png';
        const formattedPrice = Number(product.price).toLocaleString('id-ID');
        
        const allCategories = product.categories;

        productHTML += `
            <a class="product-card ${stockClass}" 
               href="/product/${product.id}" 
               title="${product.name}">
                
                <div class="product-image">
                    <img src="${imageUrl}" 
                         alt="${product.name}" 
                         loading="lazy" 
                         onerror="this.style.display='none'; this.parentElement.innerHTML='🛒'">
                </div>
                
                <div class="product-info">
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">Rp. ${formattedPrice}</div>
                    
                    <div class="product-extra-info">
                        <div class="product-category">
                            <span class="info-label">Kategori:</span>
                            <span class="info-value">${allCategories}</span>
                        </div>
                        <div class="product-store">
                            <span class="info-label">Nama Toko:</span>
                            <span class="info-value">${product.store}</span>
                        </div>
                    </div>
                </div>
            </a>
        `;
    });
    productsGrid.innerHTML = productHTML;
}

function generatePaginLinks(currentPage, totalPages, window = 2) {
    let links = [];
    let showEllipsis = false;

    links.push({
        type: 'prev',
        page: currentPage - 1,
        disabled: currentPage <= 1
    });

    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - window && i <= currentPage + window)) {
            links.push({
                type: 'page',
                page: i,
                active: i === currentPage
            });
            showEllipsis = true;
        } else if (showEllipsis) {
            links.push({ type: 'ellipsis' });
            showEllipsis = false;
        }
    }

    links.push({
        type: 'next',
        page: currentPage + 1,
        disabled: currentPage >= totalPages
    });

    return links;
}

function renderPagination(paginationContainer, pagination) {
    if (!paginationContainer) return;

    const { total_products, total_pages, current_page } = pagination;
    const limit = currentState.limit;

    if (total_pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }

    const total = total_products;
    const start = (total > 0) ? ((current_page - 1) * limit) + 1 : 0;
    const end = Math.min(current_page * limit, total);
    const resultText = `Menampilkan ${start} - ${end} dari ${total} data`;

    const links = generatePaginLinks(current_page, total_pages);
    let navHtml = '';
    links.forEach(link => {
        if (link.type === 'prev') {
            navHtml += `<a href="${basePath}?page=${link.page}" class="pagination-button ${link.disabled ? 'disabled' : ''}" data-page="${link.page}">◀</a>`;
        } else if (link.type === 'page') {
            navHtml += `<a href="${basePath}?page=${link.page}" class="pagination-button ${link.active ? 'active' : ''}" data-page="${link.page}">${link.page}</a>`;
        } else if (link.type === 'ellipsis') {
            navHtml += `<span class="pagination-ellipsis">...</span>`;
        } else if (link.type === 'next') {
            navHtml += `<a href="${basePath}?page=${link.page}" class="pagination-button ${link.disabled ? 'disabled' : ''}" data-page="${link.page}">▶</a>`;
        }
    });

    const limits = [5, 10, 15, 20];
    let selectHtml = '<div class="page-size-selector"><label for="pageSizeSelector">Per Halaman:</label><select id="pageSizeSelector" class="filter-select">';
    limits.forEach(l => {
        selectHtml += `<option value="${l}" ${l == limit ? 'selected' : ''}>${l}</option>`;
    });
    selectHtml += '</select></div>';

    paginationContainer.innerHTML = `
        <span class="pagination-info">${resultText}</span>
        <div class="pagination-nav">${navHtml}</div>
        ${selectHtml}
    `;
}

async function openCategoryModal(categoryModal, categoryList) {
    if (!categoryModal || !categoryList) return;

    try {
        categoryList.innerHTML = '<li>Memuat kategori...</li>';
        categoryModal.style.display = 'block';

        if (window.api && typeof window.api.get === 'function') {
            const result = await window.api.get('/api/categories');
            if (result.success && result.data) {
                populateCategoryList(categoryList, result.data);
            } else {
                categoryList.innerHTML = '<li>Gagal memuat kategori.</li>';
            }
        } else {
            console.error('window.api.get is not defined. Pastikan api.js dimuat.');
            categoryList.innerHTML = '<li>Error: Gagal memuat API.</li>';
        }
    } catch (error) {
        console.error("Error fetching categories:", error);
        categoryList.innerHTML = '<li>Gagal memuat kategori.</li>';
    }
}

function populateCategoryList(categoryList, categories) {
    if (!categoryList) return;
    let listHTML = '<li><a href="#" data-category-id="">Semua Kategori</a></li>';
    categories.forEach(category => {
        listHTML += `<li><a href="#" data-category-id="${category.category_id}">${category.category_name}</a></li>`;
    });
    categoryList.innerHTML = listHTML;
}

function closeCategoryModal(categoryModal) {
    if (categoryModal) {
        categoryModal.style.display = 'none';
    }
}

function updateFilterUI() {
    const minPrice = currentState.min_price || '';
    const maxPrice = currentState.max_price || '';
    const isPriceFilterActive = minPrice !== '' || maxPrice !== '';

    const openBtn = document.getElementById('openPriceModalBtn');
    if (!openBtn) return; 

    const filterContainer = openBtn.parentElement;
    let resetBtn = document.getElementById('resetPriceFilter');

    let filterText = "Filter Harga";
    if (isPriceFilterActive) {
        if (minPrice && maxPrice) {
            filterText = `Rp ${Number(minPrice).toLocaleString('id-ID')} - Rp ${Number(maxPrice).toLocaleString('id-ID')}`;
        } else if (minPrice) {
            filterText = `> Rp ${Number(minPrice).toLocaleString('id-ID')}`;
        } else if (maxPrice) {
            filterText = `< Rp ${Number(maxPrice).toLocaleString('id-ID')}`;
        }
        openBtn.classList.add('active');
    } else {
        openBtn.classList.remove('active');
    }
    openBtn.textContent = filterText; 

    if (isPriceFilterActive && !resetBtn && filterContainer) {
        resetBtn = document.createElement('button');
        resetBtn.className = 'filter-reset-button';
        resetBtn.id = 'resetPriceFilter';
        resetBtn.title = 'Reset filter harga';
        resetBtn.innerHTML = '&times;';
        resetBtn.addEventListener('click', handleResetPrice); 
        
        filterContainer.insertBefore(resetBtn, openBtn.nextSibling); 

    } else if (!isPriceFilterActive && resetBtn) {
        resetBtn.remove();
    }
}

function handleResetPrice() {
    currentState.min_price = '';
    currentState.max_price = '';
    currentState.page = 1;
    
    const minInput = document.getElementById('modal_min_price');
    const maxInput = document.getElementById('modal_max_price');
    if (minInput) minInput.value = '';
    if (maxInput) maxInput.value = '';

    fetchProducts();
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const categoryFilterBtn = document.getElementById('categoryFilter');
    const paginationContainer = document.getElementById('pagination');
    
    const categoryModal = document.getElementById('categoryModal');
    const categoryModalClose = document.getElementById('categoryModalClose');
    const categoryList = document.getElementById('categoryList');
    
    const priceModal = document.getElementById('priceModal');
    const openPriceModalBtn = document.getElementById('openPriceModalBtn');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalMinInput = document.getElementById('modal_min_price');
    const modalMaxInput = document.getElementById('modal_max_price');
    const modalApplyBtn = document.getElementById('modalApplyBtn');
    const modalClearBtn = document.getElementById('modalClearBtn');
    const quickFilterBtns = document.querySelectorAll('.quick-filter-btn');
    const initialResetBtn = document.getElementById('resetPriceFilter');

    if (searchInput) {
        searchInput.addEventListener('input', debounce(() => {
            currentState.search = searchInput.value;
            currentState.page = 1;
            fetchProducts();
        }, 500));
        searchInput.value = currentState.search;
    }

    if (categoryFilterBtn) {
        categoryFilterBtn.addEventListener('click', () => {
            openCategoryModal(categoryModal, categoryList);
        });
    }

    if (categoryModalClose) { 
        categoryModalClose.addEventListener('click', () => closeCategoryModal(categoryModal));
    }

    if (categoryList) {
        categoryList.addEventListener('click', (event) => {
            event.preventDefault(); 
            const targetLink = event.target.closest('a');

            if (targetLink && targetLink.hasAttribute('data-category-id')) {
                const categoryId = targetLink.getAttribute('data-category-id');
                const categoryName = targetLink.textContent; 

                if (categoryFilterBtn) {
                    categoryFilterBtn.textContent = categoryId ? `Kategori: ${categoryName}` : "Filter Kategori";
                }

                currentState.category = categoryId;
                currentState.page = 1;
                fetchProducts();
                closeCategoryModal(categoryModal);
            }
        });
    }

    if (categoryModal) {
        window.addEventListener('click', (event) => {
            if (event.target == categoryModal) {
                closeCategoryModal(categoryModal);
            }
        });
    }

    if (paginationContainer) {
        paginationContainer.addEventListener('click', (e) => {
            const target = e.target.closest('a.pagination-button');
            if (!target) return;
            
            e.preventDefault();
            if (target.classList.contains('disabled')) return;
            
            currentState.page = parseInt(target.dataset.page);
            fetchProducts();
            window.scrollTo(0, 0);
        });
    
        paginationContainer.addEventListener('change', (e) => {
            if (e.target.id === 'pageSizeSelector') {
                currentState.limit = parseInt(e.target.value);
                currentState.page = 1;
                fetchProducts();
            }
        });
    }

    if (initialResetBtn) {
        initialResetBtn.addEventListener('click', handleResetPrice);
    }

    if (openPriceModalBtn) {
        openPriceModalBtn.addEventListener('click', function() {
            if (priceModal) priceModal.classList.remove('hidden');
        });
    }

    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', function() {
            if (priceModal) priceModal.classList.add('hidden');
        });
    }

    if (priceModal) {
        priceModal.addEventListener('click', function(event) {
            if (event.target === priceModal) {
                priceModal.classList.add('hidden');
            }
        });
    }

    if (modalApplyBtn) {
        modalApplyBtn.addEventListener('click', function() {
            if (modalMinInput) currentState.min_price = modalMinInput.value;
            if (modalMaxInput) currentState.max_price = modalMaxInput.value;
            currentState.page = 1;

            fetchProducts();
            if (priceModal) priceModal.classList.add('hidden');
        });
    }

    if (modalClearBtn) {
        modalClearBtn.addEventListener('click', function() {
            if (modalMinInput) modalMinInput.value = '';
            if (modalMaxInput) modalMaxInput.value = '';
        });
    }

    if (quickFilterBtns.length > 0) {
        quickFilterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                if (modalMinInput) modalMinInput.value = btn.dataset.min;
                if (modalMaxInput) modalMaxInput.value = btn.dataset.max;
            });
        });
    }
    
    if (modalMinInput) modalMinInput.value = currentState.min_price;
    if (modalMaxInput) modalMaxInput.value = currentState.max_price;

});
