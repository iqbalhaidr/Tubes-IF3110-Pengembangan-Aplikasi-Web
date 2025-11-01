<?php 
$mainCssVersion = filemtime(__DIR__ . '/../../public/css/main.css');
$orderHistoryCssVersion = filemtime(__DIR__ . '/../../public/css/order_history.css');
$navbarType = 'buyer';
$activeLink = 'order-history';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nimonspedia - Order History</title>
    <link rel="stylesheet" href="/public/css/main.css?v=<?= $mainCssVersion ?>">
    <link rel="stylesheet" href="/public/css/order_history.css?v=<?= $orderHistoryCssVersion ?>">
</head>
<body class="buyer-order-history">
    <?php include __DIR__ . '/../components/navbar.php'; ?>

    <main class="order-history-content">
        <div class="container">
            <!-- Order History Header -->
            <header class="order-history-header">
                <h1>Order History</h1>
                <p class="subtitle">View and track all your purchases</p>
            </header>

            <!-- Status Filter Tabs -->
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

            <!-- Orders List -->
            <div class="orders-list" id="ordersList">
                <!-- Orders will be loaded here -->
            </div>

            <!-- Empty State -->
            <div class="empty-state" id="emptyState" style="display: none;">
                <div class="empty-state-icon">📦</div>
                <h2>No Orders Yet</h2>
                <p>Start shopping to see your order history here</p>
                <a href="/home" class="btn btn-primary">Continue Shopping</a>
            </div>

            <!-- Pagination -->
            <div class="pagination-container" id="paginationContainer">
                <!-- Pagination will be loaded here -->
            </div>
        </div>
    </main>

    <!-- Order Detail Modal -->
    <div class="modal-overlay" id="detailModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Order Details</h2>
                <button type="button" class="modal-close" id="detailModalClose">&times;</button>
            </div>
            <div class="modal-body" id="detailModalBody">
                <!-- Order details will be loaded here -->
            </div>
        </div>
    </div>

    <!-- Confirmation Modal -->
    <div class="modal-overlay" id="confirmModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Confirm Order Received</h2>
                <button type="button" class="modal-close" id="confirmModalClose">&times;</button>
            </div>
            <div class="modal-body">
                <p>Please confirm that you have received this order. This action cannot be undone.</p>
                <div class="modal-actions">
                    <button type="button" class="btn btn-secondary" id="confirmModalCancel">Cancel</button>
                    <button type="button" class="btn btn-primary" id="confirmModalSubmit">Confirm Received</button>
                </div>
            </div>
        </div>
    </div>

    <script src="/public/js/api.js"></script>
    <script src="/public/js/balance.js"></script>
    <script src="/public/js/main.js"></script>
    <script src="/public/js/order_history.js"></script>
</body>
</html>
