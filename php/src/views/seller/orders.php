<?php 
$mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css');
$ordersCssVersion = filemtime(__DIR__ . '/../../public/css/orders.css');
$navbarType = 'seller';
$activeLink = 'orders';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Order Management</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/orders.css?v=<?= $ordersCssVersion ?>">
    <link rel="stylesheet" href="/public/css/logout-modal.css">
</head>
<body class="seller-orders">
    <?php include __DIR__ . '/../components/navbar.php'; ?>

    <main class="orders-content">
        <div class="container">
            <!-- Orders Header -->
            <header class="orders-header">
                <div class="orders-header-top">
                    <h1>Order Management</h1>
                    <div class="orders-search-bar">
                        <input type="text" id="orderSearch" placeholder="Search by Order ID or Buyer Name" class="search-input">
                        <button type="button" id="searchBtn" class="btn btn-primary btn-sm">Search</button>
                    </div>
                </div>
            </header>

            <!-- Status Tabs -->
            <div class="status-tabs">
                <button type="button" class="status-tab active" data-status="all">
                    All Orders
                    <span class="tab-count" id="countAll">0</span>
                </button>
                <button type="button" class="status-tab" data-status="WAITING_APPROVAL">
                    Waiting Approval
                    <span class="tab-count" id="countWaiting">0</span>
                </button>
                <button type="button" class="status-tab" data-status="APPROVED">
                    Approved
                    <span class="tab-count" id="countApproved">0</span>
                </button>
                <button type="button" class="status-tab" data-status="ON_DELIVERY">
                    On Delivery
                    <span class="tab-count" id="countDelivery">0</span>
                </button>
                <button type="button" class="status-tab" data-status="RECEIVED">
                    Received
                    <span class="tab-count" id="countReceived">0</span>
                </button>
                <button type="button" class="status-tab" data-status="REJECTED">
                    Rejected
                    <span class="tab-count" id="countRejected">0</span>
                </button>
            </div>

            <!-- Orders Table -->
            <section class="orders-section">
                <div class="orders-table-wrapper">
                    <table class="orders-table" id="ordersTable">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Date</th>
                                <th>Buyer</th>
                                <th>Products</th>
                                <th>Total</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="ordersTableBody">
                            <!-- Filled by JavaScript -->
                        </tbody>
                    </table>
                </div>

                <!-- Empty State -->
                <div class="empty-state hidden" id="emptyState">
                    <div class="empty-state-icon">📭</div>
                    <h3>No Orders Found</h3>
                    <p id="emptyStateMessage">There are no orders matching your search.</p>
                </div>

                <!-- Loading State -->
                <div class="loading-state hidden" id="loadingState">
                    <div class="spinner"></div>
                    <p>Loading orders...</p>
                </div>
            </section>

            <!-- Pagination -->
            <div class="pagination-container" id="paginationContainer">
                <button type="button" class="pagination-button" id="prevBtn" title="Previous page">← Previous</button>
                <span class="pagination-info" id="paginationInfo">Page 1</span>
                <button type="button" class="pagination-button" id="nextBtn" title="Next page">Next →</button>
            </div>
        </div>
    </main>

    <!-- Order Detail Modal -->
    <div id="orderDetailModal" class="modal hidden">
        <div class="modal-overlay" id="orderDetailOverlay"></div>
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h2>Order Details</h2>
                <button type="button" class="modal-close" id="detailClose">&times;</button>
            </div>
            <div class="modal-body" id="orderDetailBody">
                <!-- Filled by JavaScript -->
            </div>
        </div>
    </div>

    <!-- Approve Order Modal -->
    <div id="approveModal" class="modal hidden">
        <div class="modal-overlay" id="approveOverlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Approve Order</h2>
                <button type="button" class="modal-close" id="approveClose">&times;</button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to approve this order?</p>
                <p class="modal-order-id" id="approveOrderId"></p>
            </div>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" id="approveCancel">Cancel</button>
                <button type="button" class="btn btn-primary" id="approveConfirm">Approve</button>
            </div>
        </div>
    </div>

    <!-- Reject Order Modal -->
    <div id="rejectModal" class="modal hidden">
        <div class="modal-overlay" id="rejectOverlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Reject Order</h2>
                <button type="button" class="modal-close" id="rejectClose">&times;</button>
            </div>
            <form class="modal-form" id="rejectForm">
                <div class="form-group">
                    <label for="rejectReason">Rejection Reason *</label>
                    <textarea id="rejectReason" name="reject_reason" required placeholder="Explain why you are rejecting this order..." maxlength="500"></textarea>
                    <div class="char-count"><span id="charCount">0</span>/500</div>
                    <div class="error-message" id="rejectReasonError"></div>
                </div>
                <p class="modal-order-id" id="rejectOrderId"></p>
            </form>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" id="rejectCancel">Cancel</button>
                <button type="button" class="btn btn-danger" id="rejectConfirm">Reject Order</button>
            </div>
        </div>
    </div>

    <!-- Delivery Time Modal -->
    <div id="deliveryModal" class="modal hidden">
        <div class="modal-overlay" id="deliveryOverlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h2>Set Delivery Time</h2>
                <button type="button" class="modal-close" id="deliveryClose">&times;</button>
            </div>
            <form class="modal-form" id="deliveryForm">
                <div class="form-group">
                    <label for="deliveryTime">Delivery Date & Time *</label>
                    <input type="datetime-local" id="deliveryTime" name="delivery_time" required>
                    <div class="error-message" id="deliveryTimeError"></div>
                </div>
                <p class="modal-order-id" id="deliveryOrderId"></p>
            </form>
            <div class="modal-actions">
                <button type="button" class="btn btn-secondary" id="deliveryCancel">Cancel</button>
                <button type="button" class="btn btn-primary" id="deliveryConfirm">Set Delivery</button>
            </div>
        </div>
    </div>

    <!-- Toast Notification -->
    <div id="toast" class="toast hidden"></div>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/main.js"></script>
    <script src="/public/js/orders.js"></script>
</body>
</html>
