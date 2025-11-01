<?php

class OrderController {
    private $db;
    private $orderModel;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->orderModel = new Order($this->db);
    }

    /**
     * Display order management page (HTML)
     */
    public function index() {
        // Require seller role
        AuthMiddleware::requireRole('SELLER', '/auth/login');
        $currentUser = AuthMiddleware::getCurrentUser();

        if (!$currentUser) {
            header('Location: /auth/login');
            exit;
        }

        // Get store info
        $storeModel = new Store();
        $store = $storeModel->findBySeller($currentUser['user_id']);

        if (!$store) {
            header('Location: /auth/login');
            exit;
        }

        // Get order counts by status - THIS REQUIRES Order model to work properly
        try {
            $orderCounts = $this->orderModel->getOrderCountByStatus($store['store_id']);
        } catch (Exception $e) {
            // If there's an error getting counts, still show the page
            $orderCounts = [
                'WAITING_APPROVAL' => 0,
                'APPROVED' => 0,
                'ON_DELIVERY' => 0,
                'RECEIVED' => 0,
                'REJECTED' => 0
            ];
        }

        // Set view data
        $navbarType = 'seller';
        $activeLink = 'orders';
        $pageTitle = 'Order Management';

        // Include view
        include __DIR__ . '/../views/seller/orders.php';
    }

    /**
     * API: Get orders with filters, search, and pagination
     */
    public function getOrders() {
        // Require seller role
        $currentUser = AuthMiddleware::getCurrentUser();
        
        if (!$currentUser || $currentUser['role'] !== 'SELLER') {
            Response::error('Unauthorized', null, 401);
        }

        // Get store info
        $storeModel = new Store();
        $store = $storeModel->findBySeller($currentUser['user_id']);

        if (!$store) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'Store not found']);
            exit;
        }

        // Get query parameters
        $status = $_GET['status'] ?? null;
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 10);
        $search = $_GET['search'] ?? null;

        // Validate page and limit
        if ($page < 1) $page = 1;
        if ($limit < 1 || $limit > 100) $limit = 10;

        try {
            $result = $this->orderModel->getOrdersByStore(
                $store['store_id'],
                $status,
                $search,
                $page,
                $limit
            );

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Orders retrieved',
                'data' => $result
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve orders',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * API: Get order details
     */
    public function getOrderDetail() {
        // Require seller role
        $currentUser = AuthMiddleware::getCurrentUser();
        
        if (!$currentUser || $currentUser['role'] !== 'SELLER') {
            Response::error('Unauthorized', null, 401);
        }

        $order_id = $_GET['order_id'] ?? null;

        if (!$order_id || !is_numeric($order_id)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid order ID']);
            exit;
        }

        try {
            $order = $this->orderModel->getOrderById($order_id);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Order not found']);
                exit;
            }

            // Verify order belongs to seller's store
            $storeModel = new Store();
            $store = $storeModel->findBySeller($currentUser['user_id']);

            if (!$store || $order['store_id'] != $store['store_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                exit;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Order detail retrieved',
                'data' => $order
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to retrieve order details',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * API: Approve order
     */
    public function approve() {
        // Require seller role
        $currentUser = AuthMiddleware::getCurrentUser();
        
        if (!$currentUser || $currentUser['role'] !== 'SELLER') {
            Response::error('Unauthorized', null, 401);
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $order_id = $data['order_id'] ?? null;

        if (!$order_id || !is_numeric($order_id)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid order ID']);
            exit;
        }

        try {
            // Get order and verify it belongs to seller
            $order = $this->orderModel->getOrderById($order_id);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Order not found']);
                exit;
            }

            // Verify order belongs to seller's store
            $storeModel = new Store();
            $store = $storeModel->findBySeller($currentUser['user_id']);

            if (!$store || $order['store_id'] != $store['store_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                exit;
            }

            // Verify order status
            if ($order['status'] !== 'WAITING_APPROVAL') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Order cannot be approved in ' . $order['status'] . ' status'
                ]);
                exit;
            }

            // Approve order
            $result = $this->orderModel->approve($order_id);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Order approved successfully',
                'data' => $result
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to approve order',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * API: Reject order and refund buyer
     */
    public function reject() {
        // Require seller role
        $currentUser = AuthMiddleware::getCurrentUser();
        
        if (!$currentUser || $currentUser['role'] !== 'SELLER') {
            Response::error('Unauthorized', null, 401);
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $order_id = $data['order_id'] ?? null;
        $reject_reason = $data['reject_reason'] ?? null;

        if (!$order_id || !is_numeric($order_id)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid order ID']);
            exit;
        }

        if (empty($reject_reason)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Reject reason is required']);
            exit;
        }

        // Sanitize reject reason
        $reject_reason = strip_tags($reject_reason);
        if (strlen($reject_reason) > 500) {
            $reject_reason = substr($reject_reason, 0, 500);
        }

        try {
            // Get order and verify it belongs to seller
            $order = $this->orderModel->getOrderById($order_id);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Order not found']);
                exit;
            }

            // Verify order belongs to seller's store
            $storeModel = new Store();
            $store = $storeModel->findBySeller($currentUser['user_id']);

            if (!$store || $order['store_id'] != $store['store_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                exit;
            }

            // Verify order status
            if ($order['status'] !== 'WAITING_APPROVAL') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Order cannot be rejected in ' . $order['status'] . ' status'
                ]);
                exit;
            }

            // Reject order (automatic refund included)
            $this->orderModel->reject($order_id, $reject_reason);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Order rejected successfully and buyer refunded'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to reject order',
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * API: Set delivery time
     */
    public function setDeliveryTime() {
        // Require seller role
        $currentUser = AuthMiddleware::getCurrentUser();
        
        if (!$currentUser || $currentUser['role'] !== 'SELLER') {
            Response::error('Unauthorized', null, 401);
        }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $order_id = $data['order_id'] ?? null;
        $delivery_time = $data['delivery_time'] ?? null;

        if (!$order_id || !is_numeric($order_id)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid order ID']);
            exit;
        }

        if (empty($delivery_time)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Delivery time is required']);
            exit;
        }

        // Validate datetime format
        $dateTime = DateTime::createFromFormat('Y-m-d\TH:i:s', $delivery_time);
        if (!$dateTime || $dateTime->format('Y-m-d\TH:i:s') !== $delivery_time) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid delivery time format']);
            exit;
        }

        try {
            // Get order and verify it belongs to seller
            $order = $this->orderModel->getOrderById($order_id);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Order not found']);
                exit;
            }

            // Verify order belongs to seller's store
            $storeModel = new Store();
            $store = $storeModel->findBySeller($currentUser['user_id']);

            if (!$store || $order['store_id'] != $store['store_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Forbidden']);
                exit;
            }

            // Verify order status
            if ($order['status'] !== 'APPROVED') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Order must be APPROVED before setting delivery time'
                ]);
                exit;
            }

            // Set delivery time
            $result = $this->orderModel->setDeliveryTime($order_id, $delivery_time);

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Delivery time set successfully',
                'data' => $result
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to set delivery time',
                'error' => $e->getMessage()
            ]);
        }
    }
}
