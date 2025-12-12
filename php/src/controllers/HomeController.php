<?php

require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Store.php';
require_once __DIR__ . '/../models/TopUp.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class HomeController {

    private $productModel;
    private $db;

    public function __construct() {
        $this->db = Database::getInstance(); 
        $this->productModel = new Product($this->db);
    }

    public function index() {
        if (AuthMiddleware::isLoggedIn()) {
            $user = AuthMiddleware::getCurrentUser();
            if ($user['role'] === 'SELLER') {
                header('Location: /seller/dashboard');
                exit;
            }
        }

        $validLimits = [5, 10, 15, 20];
        $currentLimit = 10; 
        if (isset($_GET['limit']) && in_array((int)$_GET['limit'], $validLimits)) {
            $currentLimit = (int)$_GET['limit'];
        }

        $filters = [
            'search'    => $_GET['search'] ?? null,
            'category'  => $_GET['category'] ?? null,
            'min_price' => $_GET['min_price'] ?? null,
            'max_price' => $_GET['max_price'] ?? null
        ];
        $currentPage = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        if ($currentPage < 1) {
            $currentPage = 1;
        }

        $result = $this->productModel->getProducts($filters, $currentPage, $currentLimit);
        
        $products = $result['products'];
        $pagination = $result['pagination'];
        $totalPages = $pagination['total_pages'];

        $total = $pagination['total_products'];
        $start = ($total > 0) ? (($currentPage - 1) * $currentLimit) + 1 : 0;
        $end = min($currentPage * $currentLimit, $total);
        $resultText = "Menampilkan $start - $end dari $total data";

        $paginationLinks = Helper::generatePaginLinks($currentPage, $totalPages);

        $categoryModel = new Category($this->db);
        $categories = $categoryModel->getAllCategories();
        $current_user = AuthMiddleware::getCurrentUser();

        require __DIR__ . '/../views/home.php';
    }

    public function sellerDashboard() {
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

        // Calculate dashboard statistics
        $stats = $this->calculateDashboardStats($store['store_id']);

        require_once __DIR__ . '/../views/seller/dashboard.php';
    }

    private function calculateDashboardStats($store_id) {
        try {
            $productQuery = 'SELECT COUNT(DISTINCT p.product_id) as total_products 
                            FROM product p 
                            WHERE p.store_id = :store_id AND p.deleted_at IS NULL';
            $productStmt = $this->db->prepare($productQuery);
            $productStmt->execute([':store_id' => $store_id]);
            $productResult = $productStmt->fetch(PDO::FETCH_ASSOC);
            $total_products = (int)($productResult['total_products'] ?? 0);

            $pendingQuery = 'SELECT COUNT(*) as pending_count 
                            FROM "order" 
                            WHERE store_id = :store_id AND status = :status';
            $pendingStmt = $this->db->prepare($pendingQuery);
            $pendingStmt->execute([':store_id' => $store_id, ':status' => 'WAITING_APPROVAL']);
            $pendingResult = $pendingStmt->fetch(PDO::FETCH_ASSOC);
            $pending_orders = (int)($pendingResult['pending_count'] ?? 0);

            $lowStockQuery = 'SELECT COUNT(DISTINCT p.product_id) as low_stock_count 
                             FROM product p 
                             WHERE p.store_id = :store_id AND p.stock < 10 AND p.deleted_at IS NULL';
            $lowStockStmt = $this->db->prepare($lowStockQuery);
            $lowStockStmt->execute([':store_id' => $store_id]);
            $lowStockResult = $lowStockStmt->fetch(PDO::FETCH_ASSOC);
            $low_stock = (int)($lowStockResult['low_stock_count'] ?? 0);

            $revenueQuery = 'SELECT COALESCE(SUM(o.total_price), 0) as total_revenue 
                            FROM "order" o 
                            WHERE o.store_id = :store_id AND o.status = :status';
            $revenueStmt = $this->db->prepare($revenueQuery);
            $revenueStmt->execute([':store_id' => $store_id, ':status' => 'RECEIVED']);
            $revenueResult = $revenueStmt->fetch(PDO::FETCH_ASSOC);
            $total_revenue = (int)($revenueResult['total_revenue'] ?? 0);

            return [
                'total_products' => $total_products,
                'pending_orders' => $pending_orders,
                'low_stock' => $low_stock,
                'total_revenue' => $total_revenue,
            ];

        } catch (Exception $e) {
            return [
                'total_products' => 0,
                'pending_orders' => 0,
                'low_stock' => 0,
                'total_revenue' => 0,
            ];
        }
    }

    public function buyerProfile() {
        AuthMiddleware::requireRole('BUYER', '/auth/login');

        $userModel = new User();
        $currentSessionUser = AuthMiddleware::getCurrentUser();
        $user = $userModel->getUserById($currentSessionUser['user_id']);
        $pushPreferences = $userModel->getPushPreferences($currentSessionUser['user_id']);

        $profileTitle = 'Your Account';
        $profileSubtitle = 'Keep your personal details accurate so orders reach you without delay.';
        $currentRole = 'BUYER';

        $profileSections = [
            [
                'title' => 'Account Information',
                'items' => [
                    ['label' => 'Full Name', 'value' => $user['name'] ?? '-'],
                    ['label' => 'Email', 'value' => $user['email'] ?? '-'],
                    ['label' => 'Address', 'value' => $user['address'] ?? 'Complete your address so sellers know where to ship.'],
                ],
            ],
            [
                'title' => 'Wallet & Activity',
                'items' => [
                    ['label' => 'Account Balance', 'value' => 'Rp ' . number_format($user['balance'] ?? 0, 0, ',', '.')],
                    ['label' => 'Member Since', 'value' => $this->formatDate($user['created_at'] ?? null)],
                    ['label' => 'Last Updated', 'value' => $this->formatDate($user['updated_at'] ?? null)],
                ],
            ],
        ];

        $metaSummary = [
            ['label' => 'Role', 'value' => 'Buyer'],
            ['label' => 'Preferred Contact', 'value' => $user['email'] ?? '-'],
        ];

        require_once __DIR__ . '/../views/profile/profile.php';
    }

    public function updateBuyerPreferences() {
        AuthMiddleware::requireRole('BUYER');
        $currentUser = AuthMiddleware::getCurrentUser();
        $userId = $currentUser['user_id'];

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: /buyer/profile');
            exit;
        }

        $prefs = [
            'chat_enabled' => isset($_POST['chat_enabled']),
            'auction_enabled' => isset($_POST['auction_enabled']),
            'order_enabled' => isset($_POST['order_enabled'])
        ];

        $userModel = new User();
        $userModel->updatePushPreferences($userId, $prefs);

        header('Location: /buyer/profile?update=success');
        exit;
    }

    public function sellerProfile() {
        AuthMiddleware::requireRole('SELLER', '/auth/login');
        header('Location: /seller/settings');
        exit;
    }

    public function sellerSettings() {
        AuthMiddleware::requireRole('SELLER', '/auth/login');
        $userModel = new User();
        $currentSessionUser = AuthMiddleware::getCurrentUser();
        $pushPreferences = $userModel->getPushPreferences($currentSessionUser['user_id']);

        // Get store info for navbar balance display
        $storeModel = new Store();
        $store = $storeModel->findBySeller($currentSessionUser['user_id']);

        $pageTitle = 'Settings';
        $navbarType = 'seller';
        
        require_once __DIR__ . '/../views/seller/settings.php';
    }

    public function updateSellerPreferences() {
        AuthMiddleware::requireRole('SELLER');
        $currentUser = AuthMiddleware::getCurrentUser();
        $userId = $currentUser['user_id'];

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Location: /seller/settings');
            exit;
        }

        $prefs = [
            'chat_enabled' => isset($_POST['chat_enabled']),
            'auction_enabled' => isset($_POST['auction_enabled']),
            'order_enabled' => isset($_POST['order_enabled'])
        ];

        $userModel = new User();
        $userModel->updatePushPreferences($userId, $prefs);

        header('Location: /seller/settings?update=success');
        exit;
    }

    private function formatDate($dateValue) {
        if (empty($dateValue)) {
            return '-';
        }


        try {
            $date = new DateTime($dateValue);
            return $date->format('d M Y');
        } catch (Exception $e) {
            return '-';
        }
    }

    public function updateStore() {
        AuthMiddleware::requireRole('SELLER', '/auth/login');

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        $currentSessionUser = AuthMiddleware::getCurrentUser();
        $storeModel = new Store();
        $store = $storeModel->findBySeller($currentSessionUser['user_id']);

        if (!$store) {
            Response::error('Store not found', null, 404);
        }

        $storeName = isset($_POST['store_name']) ? trim($_POST['store_name']) : '';
        $storeDescriptionRaw = isset($_POST['store_description']) ? $_POST['store_description'] : '';
        $storeDescription = Helper::sanitizeRichText($storeDescriptionRaw);
        $storeLogo = isset($_FILES['store_logo']) ? $_FILES['store_logo'] : null;

        // Validate store name
        if (empty($storeName)) {
            Response::error('Validation failed', ['store_name' => 'Store name is required'], 400);
        }

        if (strlen($storeName) > 100) {
            Response::error('Validation failed', ['store_name' => 'Store name cannot exceed 100 characters'], 400);
        }

        // Check if store name is already taken by another store
        if ($storeName !== $store['store_name']) {
            $statement = $this->db->prepare('SELECT store_id FROM store WHERE store_name = :store_name AND store_id != :store_id');
            $statement->execute([
                ':store_name' => $storeName,
                ':store_id' => $store['store_id']
            ]);

            if ($statement->fetch()) {
                Response::error('Validation failed', ['store_name' => 'Store name already taken'], 409);
            }
        }

        $newLogoPath = $store['store_logo_path'];

        // Process logo upload if provided
        if ($storeLogo && $storeLogo['error'] !== UPLOAD_ERR_NO_FILE) {
            $logoUpload = $this->processStoreLogoUpload($storeLogo);
            if (!$logoUpload['success']) {
                Response::error('Validation failed', ['store_logo' => $logoUpload['message']], 400);
            }

            $newLogoPath = $logoUpload['relative_path'];

            // Delete old logo if it exists
            if ($store['store_logo_path'] && file_exists(__DIR__ . '/../public/' . $store['store_logo_path'])) {
                unlink(__DIR__ . '/../public/' . $store['store_logo_path']);
            }
        }

        // Update store
        $result = $storeModel->update($store['store_id'], $storeName, $storeDescription, $newLogoPath);

        if (!$result['success']) {
            // Clean up uploaded file if update fails
            if ($storeLogo && $logoUpload && $logoUpload['success'] && file_exists($logoUpload['absolute_path'])) {
                unlink($logoUpload['absolute_path']);
            }
            Response::error($result['message'], null, 500);
        }

        Response::success('Store updated successfully', [
            'store_name' => $storeName,
            'store_logo_path' => $newLogoPath
        ], 200);
    }

    private function processStoreLogoUpload($file) {
        $response = [
            'success' => false,
            'relative_path' => null,
            'absolute_path' => null,
            'message' => 'Failed to process store logo upload'
        ];

        if ($file === null || !isset($file['error'])) {
            $response['message'] = 'Store logo is required';
            return $response;
        }

        if ($file['error'] === UPLOAD_ERR_NO_FILE) {
            $response['message'] = 'Store logo is required';
            return $response;
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $response['message'] = 'Failed to upload store logo';
            return $response;
        }

        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp'
        ];

        $extension = null;

        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo === false) {
                $response['message'] = 'Unable to validate store logo file';
                return $response;
            }

            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!isset($allowedMimes[$mimeType])) {
                $response['message'] = 'Store logo must be a PNG, JPG, or WEBP image';
                return $response;
            }

            $extension = $allowedMimes[$mimeType];
        } else {
            $extensionMap = [
                'jpg' => 'jpg',
                'jpeg' => 'jpg',
                'png' => 'png',
                'webp' => 'webp'
            ];

            $detectedExt = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
            if (!isset($extensionMap[$detectedExt])) {
                $response['message'] = 'Store logo must be a PNG, JPG, or WEBP image';
                return $response;
            }

            $extension = $extensionMap[$detectedExt];
        }

        $maxSize = 2 * 1024 * 1024; // 2MB
        if (isset($file['size']) && $file['size'] > $maxSize) {
            $response['message'] = 'Store logo must be 2MB or smaller';
            return $response;
        }

        $publicDir = realpath(__DIR__ . '/../public');
        if ($publicDir === false) {
            $publicDir = __DIR__ . '/../public';
        }

        $baseDir = $publicDir;
        $relativeDir = 'images' . DIRECTORY_SEPARATOR . 'store-logos';
        $targetDir = $baseDir . DIRECTORY_SEPARATOR . $relativeDir;

        if (!is_dir($targetDir) && !mkdir($targetDir, 0775, true)) {
            $response['message'] = 'Failed to create directory for store logo';
            return $response;
        }

        // Generate filename and target path
        $filename = uniqid('store_logo_', true) . '.' . $extension;
        $targetPath = $targetDir . DIRECTORY_SEPARATOR . $filename;

        // Move uploaded file directly without cropping
        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            $response['message'] = 'Failed to save store logo';
            return $response;
        }

        $response['success'] = true;
        $response['relative_path'] = 'public/images/store-logos/' . $filename;
        $response['absolute_path'] = $targetPath;
        $response['message'] = null;
        return $response;
    }

    public function getStoreInfo() {
        AuthMiddleware::requireRole('SELLER', '/auth/login');

        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            Response::error('Invalid request method', null, 405);
            return;
        }

        $currentSessionUser = AuthMiddleware::getCurrentUser();
        $storeModel = new Store();
        $store = $storeModel->findBySeller($currentSessionUser['user_id']);

        if (!$store) {
            Response::error('Store not found', null, 404);
            return;
        }

        Response::success('Store information retrieved', [
            'store_id' => $store['store_id'],
            'store_name' => $store['store_name'],
            'store_description' => $store['store_description'],
            'store_logo_path' => $store['store_logo_path']
        ], 200);
    }

    public function buyerOrderHistory() {
        AuthMiddleware::requireRole('BUYER', '/auth/login');
        $currentUser = AuthMiddleware::getCurrentUser();

        $navbarType = 'buyer';
        $activeLink = 'order-history';

        require_once __DIR__ . '/../views/buyer/order_history.php';
    }

    public function getBuyerOrders() {
        AuthMiddleware::requireRole('BUYER');
        $currentUser = AuthMiddleware::getCurrentUser();

        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            exit;
        }

        // Get query parameters
        $status = $_GET['status'] ?? null;
        $page = (int)($_GET['page'] ?? 1);
        $limit = (int)($_GET['limit'] ?? 10);

        // Validate page and limit
        if ($page < 1) $page = 1;
        if ($limit < 1 || $limit > 100) $limit = 10;

        try {
            $orderModel = new Order($this->db);
            $result = $orderModel->getOrdersByBuyer(
                $currentUser['user_id'],
                $status,
                $page,
                $limit
            );

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $result
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch orders',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function getBuyerOrderDetail() {
        AuthMiddleware::requireRole('BUYER');
        $currentUser = AuthMiddleware::getCurrentUser();

        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
            exit;
        }

        $order_id = $_GET['order_id'] ?? null;

        if (!$order_id || !is_numeric($order_id)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid order ID']);
            exit;
        }

        try {
            $orderModel = new Order($this->db);
            $order = $orderModel->getOrderById($order_id);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Order not found']);
                exit;
            }

            // Verify order belongs to buyer
            if ($order['buyer_id'] != $currentUser['user_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                exit;
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'data' => $order
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to fetch order detail',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function confirmOrderReceived() {
        AuthMiddleware::requireRole('BUYER');
        $currentUser = AuthMiddleware::getCurrentUser();

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
            $orderModel = new Order($this->db);
            $order = $orderModel->getOrderById($order_id);

            if (!$order) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Order not found']);
                exit;
            }

            // Verify order belongs to buyer
            if ($order['buyer_id'] != $currentUser['user_id']) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Unauthorized']);
                exit;
            }

            // Verify order status
            if ($order['status'] !== 'ON_DELIVERY') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Only orders in ON_DELIVERY status can be marked as received'
                ]);
                exit;
            }

            // Mark order as received
            $result = $orderModel->markReceived($order_id, $order['store_id'], $order['total_price']);

            // Send push notification to seller
            try {
                $storeModel = new Store();
                $store = $storeModel->findById($order['store_id']);
                if ($store && $store['user_id']) {
                    $payload = [
                        'title' => 'Pesanan Telah Diterima',
                        'body' => 'Pembeli telah mengonfirmasi penerimaan untuk pesanan #' . $order_id . '.',
                        'data' => ['url' => '/seller/orders']
                    ];
                    Helper::triggerPushNotification($store['user_id'], 'order_enabled', $payload);
                }
            } catch (Exception $e) {
                // Log error but don't fail the main request
                error_log("Failed to send push notification for order received: " . $e->getMessage());
            }

            http_response_code(200);
            echo json_encode([
                'success' => true,
                'message' => 'Order marked as received successfully'
            ]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'message' => 'Failed to confirm order received',
                'error' => $e->getMessage()
            ]);
        }
    }

    public function buyerTopUpHistory() {
        AuthMiddleware::requireRole('BUYER', '/auth/login');
        $currentUser = AuthMiddleware::getCurrentUser();

        $topUpModel = new TopUp();
        $topUpHistory = $topUpModel->getTopUpHistoryByUserId($currentUser['user_id']);

        $navbarType = 'buyer';
        $activeLink = 'topup-history'; // Assuming there will be a link in the navbar

        require_once __DIR__ . '/../views/buyer/topup_history.php';
    }

    public function exportPerformanceReport() {
        AuthMiddleware::requireRole('SELLER', '/auth/login');

        try {
            $currentUser = AuthMiddleware::getCurrentUser();
            
            $storeModel = new Store();
            $store = $storeModel->findBySeller($currentUser['user_id']);

            if (!$store) {
                http_response_code(404);
                echo "Store not found.";
                exit;
            }

            $reportData = $this->getSellerPerformanceReport($store['store_id'], $store);

            $storeNameSanitized = preg_replace('/[^a-zA-Z0-9_ -]/', '', $store['store_name']);
            $fileName = "performance_report_" . str_replace(' ', '_', $storeNameSanitized) . "_" . date("Ymd") . ".csv";

            header('Content-Type: text/csv');
            header('Content-Disposition: attachment; filename="' . $fileName . '"');
            header('Pragma: no-cache');
            header('Expires: 0');

            $output = fopen('php://output', 'w');

            fputcsv($output, ['Metric', 'Value']);

            foreach ($reportData as $key => $value) {
                fputcsv($output, [$key, $value]);
            }
            
            fclose($output);
            exit;

        } catch (Exception $e) {
            http_response_code(500);
            echo "Failed to generate report: " . $e->getMessage();
            exit;
        }
    }

    private function getSellerPerformanceReport($store_id, $storeInfo) {
        $report = [];

        $report['Store Name'] = $storeInfo['store_name'];
        $report['Store Balance'] = 'Rp ' . number_format($storeInfo['balance'] ?? 0, 0, ',', '.');
        $report['Report Generated At'] = date("d M Y H:i:s");
        
        $productStatsQuery = 'SELECT
                                COUNT(*) as total_products,
                                COUNT(CASE WHEN stock < 10 THEN 1 END) as low_stock_products,
                                COALESCE(SUM(price * stock), 0) as total_stock_value
                            FROM product
                            WHERE store_id = :store_id AND deleted_at IS NULL';
        $productStmt = $this->db->prepare($productStatsQuery);
        $productStmt->execute([':store_id' => $store_id]);
        $productStats = $productStmt->fetch(PDO::FETCH_ASSOC);

        $report['--- Products ---'] = '---'; // Separator
        $report['Total Active Products'] = (int)($productStats['total_products'] ?? 0);
        $report['Products with Low Stock (<10)'] = (int)($productStats['low_stock_products'] ?? 0);
        $report['Total Stock Value'] = 'Rp ' . number_format((int)($productStats['total_stock_value'] ?? 0), 0, ',', '.');


        $orderStatsQuery = "SELECT
                                COALESCE(SUM(CASE WHEN status = 'RECEIVED' THEN total_price ELSE 0 END), 0) as total_revenue,
                                COALESCE(SUM(CASE WHEN status IN ('APPROVED', 'ON_DELIVERY') THEN total_price ELSE 0 END), 0) as pending_revenue,
                                COUNT(*) as all_time_orders,
                                COUNT(CASE WHEN status = 'RECEIVED' THEN 1 END) as total_orders_completed,
                                COUNT(CASE WHEN status = 'WAITING_APPROVAL' THEN 1 END) as total_orders_pending_approval,
                                COUNT(CASE WHEN status = 'APPROVED' THEN 1 END) as total_orders_to_ship,
                                COUNT(CASE WHEN status = 'ON_DELIVERY' THEN 1 END) as total_orders_in_delivery,
                                COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) as total_orders_rejected
                            FROM \"order\"
                            WHERE store_id = :store_id";
        $orderStmt = $this->db->prepare($orderStatsQuery);
        $orderStmt->execute([':store_id' => $store_id]);
        $orderStats = $orderStmt->fetch(PDO::FETCH_ASSOC);

        $report['--- Revenue ---'] = '---'; // Separator
        $report['Total Revenue (Completed Orders)'] = 'Rp ' . number_format((int)($orderStats['total_revenue'] ?? 0), 0, ',', '.');
        $report['Pending Revenue (In Progress)'] = 'Rp ' . number_format((int)($orderStats['pending_revenue'] ?? 0), 0, ',', '.');
        
        $report['--- Orders ---'] = '---'; // Separator
        $report['Total All-Time Orders'] = (int)($orderStats['all_time_orders'] ?? 0);
        $report['Orders Pending Approval'] = (int)($orderStats['total_orders_pending_approval'] ?? 0);
        $report['Orders To Ship (Approved)'] = (int)($orderStats['total_orders_to_ship'] ?? 0);
        $report['Orders In Delivery'] = (int)($orderStats['total_orders_in_delivery'] ?? 0);
        $report['Orders Completed (Received)'] = (int)($orderStats['total_orders_completed'] ?? 0);
        $report['Orders Rejected'] = (int)($orderStats['total_orders_rejected'] ?? 0);

        return $report;
    }
}
?>