// Order History Page JavaScript

let currentStatus = 'all';
let currentPage = 1;
let totalPages = 1;
let orderCounts = {};
let pendingConfirmOrderId = null;

// Status label mapping
const statusLabels = {
    'WAITING_APPROVAL': 'Waiting for Seller Approval',
    'APPROVED': 'Order Approved',
    'ON_DELIVERY': 'On Delivery',
    'RECEIVED': 'Order Received',
    'REJECTED': 'Order Rejected'
};

// Status badge class mapping
const statusBadgeClasses = {
    'WAITING_APPROVAL': 'waiting-approval',
    'APPROVED': 'approved',
    'ON_DELIVERY': 'on-delivery',
    'RECEIVED': 'received',
    'REJECTED': 'rejected'
};

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    loadOrders(currentStatus, 1);
    loadOrderCounts();
});

function initializeEventListeners() {
    // Status tab click
    document.querySelectorAll('.status-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            currentStatus = this.dataset.status;
            currentPage = 1;
            loadOrders(currentStatus, 1);
        });
    });

    // Modal close buttons
    const detailModal = document.getElementById('detailModal');
    const confirmModal = document.getElementById('confirmModal');

    document.getElementById('detailModalClose').addEventListener('click', () => {
        detailModal.classList.remove('active');
    });

    document.getElementById('confirmModalClose').addEventListener('click', () => {
        confirmModal.classList.remove('active');
    });

    // Cancel confirm modal
    document.getElementById('confirmModalCancel').addEventListener('click', () => {
        confirmModal.classList.remove('active');
        pendingConfirmOrderId = null;
    });

    // Confirm received submission
    document.getElementById('confirmModalSubmit').addEventListener('click', confirmOrderReceived);

    // Close modals on overlay click
    detailModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });

    confirmModal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.classList.remove('active');
            pendingConfirmOrderId = null;
        }
    });
}

function loadOrderCounts() {
    // Load counts for all statuses
    const statuses = ['all', 'WAITING_APPROVAL', 'APPROVED', 'ON_DELIVERY', 'RECEIVED', 'REJECTED'];
    const promises = statuses.map(status => 
        api.get(`/api/buyer-orders?page=1&limit=1&status=${status}`)
            .catch(error => {
                console.error(`Error loading count for status ${status}:`, error);
                return { success: false, data: { total: 0 } };
            })
    );

    Promise.all(promises)
        .then(results => {
            results.forEach((result, index) => {
                if (result.success) {
                    const status = statuses[index];
                    const countElement = document.getElementById(`count${getCountId(status)}`);
                    if (countElement) {
                        countElement.textContent = result.data.total || 0;
                    }
                }
            });
        })
        .catch(error => console.error('Error in Promise.all for order counts:', error));
}

function getCountId(status) {
    const mapping = {
        'all': 'All',
        'WAITING_APPROVAL': 'Waiting',
        'APPROVED': 'Approved',
        'ON_DELIVERY': 'Delivery',
        'RECEIVED': 'Received',
        'REJECTED': 'Rejected'
    };
    return mapping[status] || '';
}

function loadOrders(status, page) {
    const ordersList = document.getElementById('ordersList');
    const emptyState = document.getElementById('emptyState');
    const paginationContainer = document.getElementById('paginationContainer');

    ordersList.innerHTML = '<div class="loading-state" style="text-align: center; padding: 2rem;"><p>Loading orders...</p></div>';

    const url = `/api/buyer-orders?page=${page}&limit=10${status !== 'all' ? `&status=${status}` : ''}`;

    api.get(url)
        .then(data => {
            if (data.success) {
                const orders = data.data.orders || [];
                currentPage = data.data.page;
                totalPages = data.data.total_pages;

                if (orders.length === 0) {
                    ordersList.innerHTML = '';
                    emptyState.style.display = 'block';
                    paginationContainer.innerHTML = '';
                } else {
                    emptyState.style.display = 'none';
                    ordersList.innerHTML = orders.map(order => createOrderCard(order)).join('');
                    renderPagination();

                    // Add event listeners to dynamically created elements
                    ordersList.querySelectorAll('.btn-detail').forEach(btn => {
                        btn.addEventListener('click', () => showOrderDetail(btn.dataset.orderId));
                    });

                    ordersList.querySelectorAll('.btn-confirm').forEach(btn => {
                        btn.addEventListener('click', () => openConfirmModal(btn.dataset.orderId));
                    });
                }
            }
        })
        .catch(error => {
            console.error('Error loading orders:', error);
            ordersList.innerHTML = '<div class="error-state" style="text-align: center; padding: 2rem; color: red;"><p>Failed to load orders. Please try again.</p></div>';
        });
}

function createOrderCard(order) {
    const createdDate = new Date(order.created_at).toLocaleDateString('id-ID');
    const statusLabel = statusLabels[order.status] || order.status;
    const statusBadgeClass = statusBadgeClasses[order.status] || '';
    const totalPrice = parseInt(order.total_price).toLocaleString('id-ID');

    // Create product items HTML
    const productsHtml = (order.items || []).map(item => {
        const itemPrice = parseInt(item.price_at_purchase).toLocaleString('id-ID');
        const itemImage = item.main_image_path ? `${item.main_image_path}` : '/public/images/products/default.png';
        return `
            <div class="order-product-item">
                <img src="${itemImage}" alt="${item.product_name}" class="product-thumbnail">
                <div class="product-info">
                    <span class="product-name">${item.product_name || 'Unknown Product'}</span>
                    <span class="product-quantity">x${item.quantity}</span>
                </div>
            </div>
        `;
    }).join('');

    let actionButton = '';
    if (order.status === 'ON_DELIVERY') {
        actionButton = `<button type="button" class="btn btn-primary btn-confirm" data-order-id="${order.order_id}">Confirm Received</button>`;
    }

    return `
        <div class="order-card">
            <div class="order-card-header">
                <div class="order-id">
                    <span class="order-id-label">Order ID</span>
                    <span class="order-id-value">#${order.order_id}</span>
                </div>
                <div class="order-date">
                    <span class="order-date-label">Date</span>
                    <span class="order-date-value">${createdDate}</span>
                </div>
                <div class="order-store">
                    <span class="order-store-label">Store</span>
                    <a href="/store/${order.store_id}" style="text-decoration: none; color: inherit;">
                        <span class="order-store-value" style="cursor: pointer; text-decoration: underline;">${order.store_name || 'Unknown Store'}</span>
                    </a>
                </div>
                <div style="display: flex; justify-content: flex-end;">
                    <span class="status-badge ${statusBadgeClass}">${statusLabel}</span>
                </div>
            </div>
            <div class="order-products">
                ${productsHtml}
            </div>
            <div class="order-footer">
                <div class="order-total">
                    <span class="order-total-label">Total</span>
                    <span class="order-total-price">Rp ${totalPrice}</span>
                </div>
            </div>
            <div class="order-actions">
                <button type="button" class="btn btn-secondary btn-detail" data-order-id="${order.order_id}">View Details</button>
                ${actionButton}
            </div>
        </div>
    `;
}

function showOrderDetail(orderId) {
    const modal = document.getElementById('detailModal');
    const modalBody = document.getElementById('detailModalBody');

    modalBody.innerHTML = '<div style="text-align: center; padding: 2rem;"><p>Loading order details...</p></div>';
    modal.classList.add('active');

    api.get(`/api/buyer-orders/detail?order_id=${orderId}`)
        .then(data => {
            if (data.success) {
                modalBody.innerHTML = createDetailContent(data.data);
            } else {
                modalBody.innerHTML = '<div style="color: red; padding: 2rem;">Failed to load order details</div>';
            }
        })
        .catch(error => {
            console.error('Error loading order detail:', error);
            modalBody.innerHTML = '<div style="color: red; padding: 2rem;">Error loading order details</div>';
        });
}

function createDetailContent(order) {
    const statusLabel = statusLabels[order.status] || order.status;
    const statusBadgeClass = statusBadgeClasses[order.status] || '';
    const createdDate = new Date(order.created_at).toLocaleDateString('id-ID');
    const totalPrice = parseInt(order.total_price).toLocaleString('id-ID');

    let deliveryInfo = '';
    if (order.delivery_time) {
        const deliveryDate = new Date(order.delivery_time).toLocaleDateString('id-ID');
        const deliveryTime = new Date(order.delivery_time).toLocaleTimeString('id-ID');
        deliveryInfo = `
            <div class="detail-row">
                <span class="detail-label">Estimated Delivery</span>
                <span class="detail-value">${deliveryDate} at ${deliveryTime}</span>
            </div>
        `;
    }

    let rejectionInfo = '';
    if (order.status === 'REJECTED' && order.reject_reason) {
        const refundAmount = parseInt(order.total_price).toLocaleString('id-ID');
        rejectionInfo = `
            <div class="rejection-details">
                <div class="rejection-details-title">⚠️ Order Rejected</div>
                <div class="rejection-details-reason">
                    <strong>Reason:</strong> ${order.reject_reason}
                </div>
                <div class="refund-badge">✓ Refunded: Rp ${refundAmount}</div>
            </div>
        `;
    }

    const itemsHtml = (order.items || []).map(item => {
        const itemPrice = parseInt(item.price_at_purchase).toLocaleString('id-ID');
        const itemTotal = (parseInt(item.price_at_purchase) * parseInt(item.quantity)).toLocaleString('id-ID');
        const imagePath = item.main_image_path ? `${item.main_image_path}` : '/public/images/products/default.png';
        return `
            <div class="detail-item">
                <div class="detail-item-image">
                    <img src="${imagePath}" alt="${item.product_name}" onerror="this.src='/public/images/products/default.png'">
                </div>
                <div class="detail-item-info">
                    <div class="detail-item-name">${item.product_name}</div>
                    <div class="detail-item-detail">Qty: ${item.quantity} × Rp ${itemPrice}</div>
                </div>
                <div class="detail-item-price">
                    <div class="detail-item-price-label">Subtotal</div>
                    <div class="detail-item-price-value">Rp ${itemTotal}</div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="detail-section">
            <div class="detail-section-title">Order Status</div>
            <span class="status-badge ${statusBadgeClass}">${statusLabel}</span>
            ${rejectionInfo}
        </div>

        <div class="detail-section">
            <div class="detail-section-title">Items Ordered</div>
            <div class="detail-items">
                ${itemsHtml}
            </div>
        </div>

        <div class="detail-section">
            <div class="detail-section-title">Delivery Information</div>
            <div class="detail-row">
                <span class="detail-label">Shipping Address</span>
                <span class="detail-value">${order.shipping_address}</span>
            </div>
            ${deliveryInfo}
        </div>

        <div class="detail-section">
            <div class="detail-section-title">Order Summary</div>
            <div class="detail-row">
                <span class="detail-label">Order Date</span>
                <span class="detail-value">${createdDate}</span>
            </div>
            <div class="detail-row">
                <span class="detail-label">Total Price</span>
                <span class="detail-value" style="font-weight: 700; color: var(--primary-green); font-size: 1.1rem;">Rp ${totalPrice}</span>
            </div>
        </div>
    `;
}

function openConfirmModal(orderId) {
    pendingConfirmOrderId = orderId;
    const modal = document.getElementById('confirmModal');
    modal.classList.add('active');
}

function confirmOrderReceived() {
    if (!pendingConfirmOrderId) return;

    const submitBtn = document.getElementById('confirmModalSubmit');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processing...';

    api.post('/api/buyer-orders/confirm', {
        order_id: pendingConfirmOrderId
    })
        .then(data => {
            if (data.success) {
                // Close modal and reload orders
                document.getElementById('confirmModal').classList.remove('active');
                showToast('Order marked as received successfully', 'success');
                loadOrders(currentStatus, currentPage);
                loadOrderCounts();
                pendingConfirmOrderId = null;
            } else {
                showToast(data.message || 'Failed to confirm order received', 'error');
            }
        })
        .catch(error => {
            console.error('Error confirming order:', error);
            showToast('Error confirming order. Please try again.', 'error');
        })
        .finally(() => {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
        });
}

function renderPagination() {
    const paginationContainer = document.getElementById('paginationContainer');
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-button';
    prevBtn.textContent = '← Previous';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            loadOrders(currentStatus, currentPage - 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    paginationContainer.appendChild(prevBtn);

    // Page numbers
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    if (startPage > 1) {
        const firstBtn = document.createElement('button');
        firstBtn.className = 'pagination-button';
        firstBtn.textContent = '1';
        firstBtn.addEventListener('click', () => {
            loadOrders(currentStatus, 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationContainer.appendChild(firstBtn);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            ellipsis.style.padding = '0.6rem 0.5rem';
            paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'pagination-button';
        if (i === currentPage) pageBtn.classList.add('active');
        pageBtn.textContent = i;
        pageBtn.addEventListener('click', () => {
            loadOrders(currentStatus, i);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationContainer.appendChild(pageBtn);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.className = 'pagination-ellipsis';
            ellipsis.textContent = '...';
            ellipsis.style.padding = '0.6rem 0.5rem';
            paginationContainer.appendChild(ellipsis);
        }

        const lastBtn = document.createElement('button');
        lastBtn.className = 'pagination-button';
        lastBtn.textContent = totalPages;
        lastBtn.addEventListener('click', () => {
            loadOrders(currentStatus, totalPages);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        paginationContainer.appendChild(lastBtn);
    }

    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-button';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            loadOrders(currentStatus, currentPage + 1);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });
    paginationContainer.appendChild(nextBtn);
}

function showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 1rem 1.5rem;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 2000;
        animation: slideInUp 0.3s ease;
        font-weight: 600;
        max-width: 400px;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutDown 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Add keyframe animations to document if not already there
if (!document.querySelector('style[data-toast-animations]')) {
    const style = document.createElement('style');
    style.setAttribute('data-toast-animations', '');
    style.textContent = `
        @keyframes slideInUp {
            from {
                transform: translateY(100px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
        @keyframes slideOutDown {
            from {
                transform: translateY(0);
                opacity: 1;
            }
            to {
                transform: translateY(100px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}
