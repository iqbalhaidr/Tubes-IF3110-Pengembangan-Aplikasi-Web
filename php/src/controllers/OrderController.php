<?php

class OrderController {
    private $order_model;
    private $user_model;

    public function __construct() {
        $this->order_model = new Order();
        $this->user_model = new User();
    }

    /**
     * Display seller order management page
     */
    public function index() {
        AuthMiddleware::requireLogin();
        $current_user = AuthMiddleware::getCurrentUser();

        // Check if user is a seller
        if ($current_user['role'] !== 'SELLER') {
            Response::redirect('/home');
        }

        // Get seller's store
        $store = new Store();
        $seller_store = $store->findBySeller($current_user['user_id']);

        if (!$seller_store) {
            header('HTTP/1.0 404 Not Found');
            require_once __DIR__ . '/../views/404.php';
            return;
        }

        // Default status filter
        $status = isset($_GET['status']) ? trim($_GET['status']) : 'WAITING_APPROVAL';
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $search = isset($_GET['search']) ? trim($_GET['search']) : null;
        $limit = 10;

        // Fetch orders
        $result = $this->order_model->getOrdersByStore($seller_store['store_id'], $status, $search, $page, $limit);

        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        // Get order counts by status
        $counts_result = $this->order_model->getOrderCountByStatus($seller_store['store_id']);
        $status_counts = $counts_result['success'] ? $counts_result['counts'] : [];

        // Prepare data for view
        $orders = $result['orders'];
        $total_pages = $result['total_pages'];
        $total_orders = $result['total'];
        $current_page = $result['page'];
        $store_id = $seller_store['store_id'];

        require_once __DIR__ . '/../views/seller/orders.php';
    }

    /**
     * Get orders via API with JSON response
     */
    public function getOrders() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            Response::error('Method not allowed', null, 405);
        }

        AuthMiddleware::requireLogin();
        $current_user = AuthMiddleware::getCurrentUser();

        if ($current_user['role'] !== 'SELLER') {
            Response::error('Unauthorized', null, 403);
        }

        // Get seller's store
        $store = new Store();
        $seller_store = $store->findBySeller($current_user['user_id']);

        if (!$seller_store) {
            Response::error('Store not found', null, 404);
        }

        $status = isset($_GET['status']) ? trim($_GET['status']) : null;
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $search = isset($_GET['search']) ? trim($_GET['search']) : null;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

        $result = $this->order_model->getOrdersByStore($seller_store['store_id'], $status, $search, $page, $limit);

        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        Response::success('Orders retrieved', $result, 200);
    }

    /**
     * Get single order details
     */
    public function getOrderDetail() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            Response::error('Method not allowed', null, 405);
        }

        AuthMiddleware::requireLogin();
        $current_user = AuthMiddleware::getCurrentUser();

        if ($current_user['role'] !== 'SELLER') {
            Response::error('Unauthorized', null, 403);
        }

        $order_id = isset($_GET['order_id']) ? intval($_GET['order_id']) : null;

        if (!$order_id) {
            Response::error('Order ID is required', null, 400);
        }

        $order = $this->order_model->getOrderById($order_id);

        if (!$order) {
            Response::error('Order not found', null, 404);
        }

        // Verify seller owns this order
        $store = new Store();
        $seller_store = $store->findBySeller($current_user['user_id']);

        if ($order['store_id'] != $seller_store['store_id']) {
            Response::error('Unauthorized', null, 403);
        }

        Response::success('Order retrieved', $order, 200);
    }

    /**
     * Approve order
     */
    public function approve() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        AuthMiddleware::requireLogin();
        $current_user = AuthMiddleware::getCurrentUser();

        if ($current_user['role'] !== 'SELLER') {
            Response::error('Unauthorized', null, 403);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $order_id = isset($data['order_id']) ? intval($data['order_id']) : null;

        if (!$order_id) {
            Response::error('Order ID is required', null, 400);
        }

        // Verify seller owns this order
        $order = $this->order_model->getOrderById($order_id);

        if (!$order) {
            Response::error('Order not found', null, 404);
        }

        $store = new Store();
        $seller_store = $store->findBySeller($current_user['user_id']);

        if ($order['store_id'] != $seller_store['store_id']) {
            Response::error('Unauthorized', null, 403);
        }

        // Check order status is waiting approval
        if ($order['status'] !== 'WAITING_APPROVAL') {
            Response::error('Order cannot be approved in current status', null, 400);
        }

        // Approve order
        $result = $this->order_model->approve($order_id);

        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        Response::success('Order approved successfully', $result['order'], 200);
    }

    /**
     * Reject order
     */
    public function reject() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        AuthMiddleware::requireLogin();
        $current_user = AuthMiddleware::getCurrentUser();

        if ($current_user['role'] !== 'SELLER') {
            Response::error('Unauthorized', null, 403);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $order_id = isset($data['order_id']) ? intval($data['order_id']) : null;
        $reject_reason = isset($data['reject_reason']) ? trim($data['reject_reason']) : '';

        if (!$order_id) {
            Response::error('Order ID is required', null, 400);
        }

        if (empty($reject_reason)) {
            Response::error('Reject reason is required', null, 400);
        }

        // Verify seller owns this order
        $order = $this->order_model->getOrderById($order_id);

        if (!$order) {
            Response::error('Order not found', null, 404);
        }

        $store = new Store();
        $seller_store = $store->findBySeller($current_user['user_id']);

        if ($order['store_id'] != $seller_store['store_id']) {
            Response::error('Unauthorized', null, 403);
        }

        // Check order status is waiting approval
        if ($order['status'] !== 'WAITING_APPROVAL') {
            Response::error('Order cannot be rejected in current status', null, 400);
        }

        // Reject order
        $reject_result = $this->order_model->reject($order_id, $reject_reason);

        if (!$reject_result['success']) {
            Response::error($reject_result['message'], null, 500);
        }

        // Refund buyer balance
        $refund_result = $this->user_model->topUpBalance($order['buyer_id'], $order['total_price']);

        if (!$refund_result['success']) {
            Response::error('Order rejected but refund failed: ' . $refund_result['message'], null, 500);
        }

        Response::success('Order rejected and buyer refunded', $reject_result['order'], 200);
    }

    /**
     * Set delivery time and change status to on_delivery
     */
    public function setDeliveryTime() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        AuthMiddleware::requireLogin();
        $current_user = AuthMiddleware::getCurrentUser();

        if ($current_user['role'] !== 'SELLER') {
            Response::error('Unauthorized', null, 403);
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $order_id = isset($data['order_id']) ? intval($data['order_id']) : null;
        $delivery_time = isset($data['delivery_time']) ? trim($data['delivery_time']) : '';

        if (!$order_id) {
            Response::error('Order ID is required', null, 400);
        }

        if (empty($delivery_time)) {
            Response::error('Delivery time is required', null, 400);
        }

        // Validate delivery_time format (should be a valid datetime)
        if (strtotime($delivery_time) === false) {
            Response::error('Invalid delivery time format', null, 400);
        }

        // Verify seller owns this order
        $order = $this->order_model->getOrderById($order_id);

        if (!$order) {
            Response::error('Order not found', null, 404);
        }

        $store = new Store();
        $seller_store = $store->findBySeller($current_user['user_id']);

        if ($order['store_id'] != $seller_store['store_id']) {
            Response::error('Unauthorized', null, 403);
        }

        // Check order status is approved
        if ($order['status'] !== 'APPROVED') {
            Response::error('Order must be approved before setting delivery time', null, 400);
        }

        // Set delivery time
        $result = $this->order_model->setDeliveryTime($order_id, $delivery_time);

        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        Response::success('Delivery time set successfully', $result['order'], 200);
    }
}
?>
