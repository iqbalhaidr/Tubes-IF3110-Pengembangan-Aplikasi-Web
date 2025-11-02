/**
 * Order Management JavaScript
 * Handles seller order management functionality
 */

let currentPage = 1;
let currentLimit = 10;
let currentStatus = 'all';
let currentSearch = '';
let totalPages = 1;
let orderCountsData = {};
let countRefreshInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    initializeEventListeners();
    loadOrderCounts();
    loadOrders();
    
    // Refresh order counts every 5 seconds
    countRefreshInterval = setInterval(loadOrderCounts, 5000);
});

// ================================================================
// INITIALIZATION
// ================================================================

function initializeEventListeners() {
    // Status tabs
    document.querySelectorAll('.status-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentStatus = tab.dataset.status;
            currentPage = 1;
            loadOrders();
        });
    });

    // Search
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('orderSearch');
    
    searchBtn.addEventListener('click', () => {
        currentSearch = searchInput.value.trim();
        currentPage = 1;
        loadOrders();
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            currentSearch = searchInput.value.trim();
            currentPage = 1;
            loadOrders();
        }
    });

    // Pagination
    document.getElementById('prevBtn').addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadOrders();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadOrders();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    // Modal close buttons
    setupModalHandlers();
}

function setupModalHandlers() {
    // Order Detail Modal
    const detailModal = document.getElementById('orderDetailModal');
    const detailOverlay = document.getElementById('orderDetailOverlay');
    const detailClose = document.getElementById('detailClose');

    [detailOverlay, detailClose].forEach(el => {
        if (el) {
            el.addEventListener('click', () => {
                detailModal.classList.add('hidden');
            });
        }
    });

    // Approve Modal
    const approveModal = document.getElementById('approveModal');
    const approveOverlay = document.getElementById('approveOverlay');
    const approveClose = document.getElementById('approveClose');
    const approveCancel = document.getElementById('approveCancel');

    [approveOverlay, approveClose, approveCancel].forEach(el => {
        if (el) {
            el.addEventListener('click', () => {
                approveModal.classList.add('hidden');
            });
        }
    });

    document.getElementById('approveConfirm').addEventListener('click', confirmApprove);

    // Reject Modal
    const rejectModal = document.getElementById('rejectModal');
    const rejectOverlay = document.getElementById('rejectOverlay');
    const rejectClose = document.getElementById('rejectClose');
    const rejectCancel = document.getElementById('rejectCancel');
    const rejectReason = document.getElementById('rejectReason');

    [rejectOverlay, rejectClose, rejectCancel].forEach(el => {
        if (el) {
            el.addEventListener('click', () => {
                rejectModal.classList.add('hidden');
            });
        }
    });

    rejectReason.addEventListener('input', (e) => {
        document.getElementById('charCount').textContent = e.target.value.length;
    });

    document.getElementById('rejectConfirm').addEventListener('click', confirmReject);

    // Delivery Modal
    const deliveryModal = document.getElementById('deliveryModal');
    const deliveryOverlay = document.getElementById('deliveryOverlay');
    const deliveryClose = document.getElementById('deliveryClose');
    const deliveryCancel = document.getElementById('deliveryCancel');

    [deliveryOverlay, deliveryClose, deliveryCancel].forEach(el => {
        if (el) {
            el.addEventListener('click', () => {
                deliveryModal.classList.add('hidden');
            });
        }
    });

    document.getElementById('deliveryConfirm').addEventListener('click', confirmDelivery);
}

// ================================================================
// DATA LOADING
// ================================================================

async function loadOrderCounts() {
    try {
        // Fetch all statuses in parallel for better performance
        const statuses = ['all', 'WAITING_APPROVAL', 'APPROVED', 'ON_DELIVERY', 'RECEIVED', 'REJECTED'];
        
        const promises = statuses.map(status => {
            const url = status === 'all' 
                ? '/api/orders?status=all&limit=1'
                : `/api/orders?status=${status}&limit=1`;
            return api.get(url).then(data => ({ status, data }));
        });

        const results = await Promise.all(promises);

        // Update counts for each status
        results.forEach(({ status, data }) => {
            if (data && data.success && data.data) {
                const total = data.data.total || 0;
                
                if (status === 'all') {
                    orderCountsData.all = total;
                    const countAll = document.getElementById('countAll');
                    if (countAll) countAll.textContent = total;
                } else {
                    // Map status to count element ID
                    // e.g., WAITING_APPROVAL -> countWaitingApproval
                    const countId = 'count' + status
                        .split('_')
                        .map(s => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
                        .join('');
                    
                    const countElement = document.getElementById(countId);
                    if (countElement) {
                        countElement.textContent = total;
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading order counts:', error);
    }
}

async function loadOrders() {
    showLoadingState();

    try {
        let url = `/api/orders?page=${currentPage}&limit=${currentLimit}`;
        
        if (currentStatus !== 'all') {
            url += `&status=${currentStatus}`;
        }
        
        if (currentSearch) {
            url += `&search=${encodeURIComponent(currentSearch)}`;
        }

        const data = await api.get(url);

        if (data.success && data.data.orders && data.data.orders.length > 0) {
            renderOrdersTable(data.data.orders);
            updatePagination(data.data);
            hideEmptyState();
        } else {
            showEmptyState('No orders found');
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        showEmptyState('Error loading orders. Please try again.');
    } finally {
        hideLoadingState();
    }
}

// ================================================================
// RENDERING
// ================================================================

function renderOrdersTable(orders) {
    const tbody = document.getElementById('ordersTableBody');
    tbody.innerHTML = '';

    orders.forEach(order => {
        const row = document.createElement('tr');
        
        // Product list - handle undefined items
        const productsList = (order.items && Array.isArray(order.items))
            ? order.items
                .map(item => `${item.product_name} x${item.quantity}`)
                .join(', ')
            : 'N/A';

        row.innerHTML = `
            <td class="order-id">#${order.order_id}</td>
            <td class="order-date">${formatDate(order.created_at)}</td>
            <td class="order-buyer">${order.buyer_name || 'Unknown'}</td>
            <td class="products-list">${escapeHtml(productsList)}</td>
            <td class="order-total">Rp ${formatCurrency(order.total_price)}</td>
            <td><span class="status-badge status-${order.status.toLowerCase()}">${formatStatus(order.status)}</span></td>
            <td class="order-actions">
                <button type="button" class="action-btn" onclick="viewOrderDetail(${order.order_id})">View Detail</button>
                ${getActionButtons(order)}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

function getActionButtons(order) {
    let buttons = '';

    if (order.status === 'WAITING_APPROVAL') {
        buttons += `<button type="button" class="action-btn" onclick="openApproveModal(${order.order_id})">Approve</button>`;
        buttons += `<button type="button" class="action-btn danger" onclick="openRejectModal(${order.order_id})">Reject</button>`;
    } else if (order.status === 'APPROVED') {
        buttons += `<button type="button" class="action-btn" onclick="openDeliveryModal(${order.order_id})">Kirim Barang</button>`;
    }

    return buttons;
}

function updatePagination(data) {
    totalPages = data.total_pages || 1;
    const paginationInfo = document.getElementById('paginationInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    paginationInfo.textContent = `Page ${data.page} of ${totalPages}`;
    prevBtn.disabled = data.page <= 1;
    nextBtn.disabled = data.page >= totalPages;
}

// ================================================================
// MODAL OPERATIONS
// ================================================================

async function viewOrderDetail(orderId) {
    try {
        const data = await api.get(`/api/orders/detail?order_id=${orderId}`);

        const order = data.data;
        const detailBody = document.getElementById('orderDetailBody');
        
        const productsHtml = order.items
            .map(item => `
                <div class="product-detail-item">
                    <div class="product-detail-info">
                        <div class="product-detail-name">${escapeHtml(item.product_name)}</div>
                        <div class="product-detail-qty">Qty: ${item.quantity}</div>
                    </div>
                    <div class="product-detail-price">Rp ${formatCurrency(item.price_at_purchase)}</div>
                </div>
            `)
            .join('');

        detailBody.innerHTML = `
            <div class="order-detail-content">
                <div class="detail-section">
                    <h3>Order Information</h3>
                    <div class="detail-row">
                        <span class="detail-label">Order ID</span>
                        <span class="detail-value">#${order.order_id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Date</span>
                        <span class="detail-value">${formatDate(order.created_at)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status</span>
                        <span class="detail-value"><span class="status-badge status-${order.status.toLowerCase()}">${formatStatus(order.status)}</span></span>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Buyer Information</h3>
                    <div class="detail-row">
                        <span class="detail-label">Name</span>
                        <span class="detail-value">${escapeHtml(order.buyer_name || 'Unknown')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Email</span>
                        <span class="detail-value">${escapeHtml(order.buyer_email || '-')}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Address</span>
                        <span class="detail-value">${escapeHtml(order.shipping_address || '-')}</span>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Products</h3>
                    <div class="products-detail-list">
                        ${productsHtml}
                    </div>
                </div>

                <div class="detail-section">
                    <h3>Summary</h3>
                    <div class="detail-row">
                        <span class="detail-label">Total Price</span>
                        <span class="detail-value">Rp ${formatCurrency(order.total_price)}</span>
                    </div>
                    ${order.delivery_time ? `
                        <div class="detail-row">
                            <span class="detail-label">Delivery Time</span>
                            <span class="detail-value">${formatDateTime(order.delivery_time)}</span>
                        </div>
                    ` : ''}
                    ${order.reject_reason ? `
                        <div class="detail-row">
                            <span class="detail-label">Rejection Reason</span>
                            <span class="detail-value">${escapeHtml(order.reject_reason)}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        document.getElementById('orderDetailModal').classList.remove('hidden');
    } catch (error) {
        console.error('Error loading order detail:', error);
        showToast('Error loading order details', 'error');
    }
}

function openApproveModal(orderId) {
    document.getElementById('approveOrderId').textContent = `Order #${orderId}`;
    document.getElementById('approveModal').dataset.orderId = orderId;
    document.getElementById('approveModal').classList.remove('hidden');
}

function openRejectModal(orderId) {
    document.getElementById('rejectOrderId').textContent = `Order #${orderId}`;
    document.getElementById('rejectReason').value = '';
    document.getElementById('charCount').textContent = '0';
    document.getElementById('rejectReasonError').classList.remove('show');
    document.getElementById('rejectReason').classList.remove('is-invalid');
    document.getElementById('rejectModal').dataset.orderId = orderId;
    document.getElementById('rejectModal').classList.remove('hidden');
}

function openDeliveryModal(orderId) {
    document.getElementById('deliveryOrderId').textContent = `Order #${orderId}`;
    document.getElementById('deliveryTime').value = '';
    document.getElementById('deliveryTimeError').classList.remove('show');
    document.getElementById('deliveryTime').classList.remove('is-invalid');
    document.getElementById('deliveryModal').dataset.orderId = orderId;
    document.getElementById('deliveryModal').classList.remove('hidden');
}

// ================================================================
// MODAL CONFIRMATIONS
// ================================================================

async function confirmApprove() {
    const orderId = document.getElementById('approveModal').dataset.orderId;
    const confirmBtn = document.getElementById('approveConfirm');
    const originalText = confirmBtn.textContent;

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';

    try {
        const data = await api.post('/api/orders/approve', {
            order_id: parseInt(orderId)
        });

        showToast('Order approved successfully!', 'success');
        document.getElementById('approveModal').classList.add('hidden');
        await loadOrderCounts();
        await loadOrders();
    } catch (error) {
        console.error('Error approving order:', error);
        showToast('Error approving order. Please try again.', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

async function confirmReject() {
    const orderId = document.getElementById('rejectModal').dataset.orderId;
    const reason = document.getElementById('rejectReason').value.trim();
    const confirmBtn = document.getElementById('rejectConfirm');
    const originalText = confirmBtn.textContent;

    // Validate reason
    if (!reason) {
        showFieldError('rejectReason', 'Rejection reason is required');
        return;
    }

    if (reason.length > 500) {
        showFieldError('rejectReason', 'Rejection reason cannot exceed 500 characters');
        return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';

    try {
        const data = await api.post('/api/orders/reject', {
            order_id: parseInt(orderId),
            reject_reason: reason
        });

        showToast('Order rejected and buyer refunded successfully!', 'success');
        document.getElementById('rejectModal').classList.add('hidden');
        await loadOrderCounts();
        await loadOrders();
    } catch (error) {
        console.error('Error rejecting order:', error);
        showToast('Error rejecting order. Please try again.', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

async function confirmDelivery() {
    const orderId = document.getElementById('deliveryModal').dataset.orderId;
    const deliveryTime = document.getElementById('deliveryTime').value;
    const confirmBtn = document.getElementById('deliveryConfirm');
    const originalText = confirmBtn.textContent;

    // Validate delivery time
    if (!deliveryTime) {
        showFieldError('deliveryTime', 'Delivery time is required');
        return;
    }

    // Convert to ISO format with seconds
    const datetime = new Date(deliveryTime);
    if (isNaN(datetime.getTime())) {
        showFieldError('deliveryTime', 'Invalid date/time format');
        return;
    }

    // Format as YYYY-MM-DDTHH:mm:ss
    const isoTime = datetime.toISOString().slice(0, 19);

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Processing...';

    try {
        const data = await api.post('/api/orders/delivery-time', {
            order_id: parseInt(orderId),
            delivery_time: isoTime
        });

        showToast('Delivery time set successfully!', 'success');
        document.getElementById('deliveryModal').classList.add('hidden');
        await loadOrderCounts();
        await loadOrders();
    } catch (error) {
        console.error('Error setting delivery time:', error);
        showToast('Error setting delivery time. Please try again.', 'error');
    } finally {
        confirmBtn.disabled = false;
        confirmBtn.textContent = originalText;
    }
}

// ================================================================
// UTILITY FUNCTIONS
// ================================================================

function showFieldError(fieldName, message) {
    const errorElement = document.getElementById(`${fieldName}Error`);
    const inputElement = document.getElementById(fieldName);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
    
    if (inputElement) {
        inputElement.classList.add('is-invalid');
    }
}

function showLoadingState() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('ordersTableBody').innerHTML = '';
}

function hideLoadingState() {
    document.getElementById('loadingState').classList.add('hidden');
}

function showEmptyState(message = 'No orders found') {
    const emptyState = document.getElementById('emptyState');
    document.getElementById('emptyStateMessage').textContent = message;
    emptyState.classList.remove('hidden');
    document.getElementById('ordersTableBody').innerHTML = '';
}

function hideEmptyState() {
    document.getElementById('emptyState').classList.add('hidden');
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    
    clearTimeout(toast.hideTimeout);
    toast.hideTimeout = setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(date);
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID').format(amount);
}

function formatStatus(status) {
    const statusMap = {
        'WAITING_APPROVAL': 'Waiting Approval',
        'APPROVED': 'Approved',
        'ON_DELIVERY': 'On Delivery',
        'RECEIVED': 'Received',
        'REJECTED': 'Rejected'
    };
    return statusMap[status] || status;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
