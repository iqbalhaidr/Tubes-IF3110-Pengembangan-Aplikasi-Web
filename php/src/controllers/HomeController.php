<?php

require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Store.php';
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

    public function buyerHome() {
        AuthMiddleware::requireRole('BUYER', '/auth/login');
        $current_user = AuthMiddleware::getCurrentUser();

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
        if ($currentPage < 1) $currentPage = 1;

        $result = $this->productModel->getProducts($filters, $currentPage, $currentLimit);
        
        $products = $result['products'];
        $pagination = $result['pagination'];
        $totalPages = $pagination['total_pages'];
        $total = $pagination['total_products'];

        $start = ($total > 0) ? (($currentPage - 1) * $currentLimit) + 1 : 0;
        $end = min($currentPage * $currentLimit, $total);
        $resultText = "Menampilkan $start - $end dari $total data";

        $paginationLinks = Helper::generatePaginLinks($currentPage, $totalPages);
        
        require __DIR__ . '/../views/buyer/home.php';
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
            // Store doesn't exist - this is a new seller who hasn't created a store yet
            // For now, redirect them to login (they should create store during registration)
            header('Location: /auth/login');
            exit;
        }

        // Calculate dashboard statistics
        $stats = $this->calculateDashboardStats($store['store_id']);

        require_once __DIR__ . '/../views/seller/dashboard.php';
    }

    /**
     * Calculate dashboard statistics for seller
     */
    private function calculateDashboardStats($store_id) {
        try {
            // 1. Total unique products (not quantity)
            $productQuery = 'SELECT COUNT(DISTINCT p.product_id) as total_products 
                            FROM product p 
                            WHERE p.store_id = :store_id AND p.deleted_at IS NULL';
            $productStmt = $this->db->prepare($productQuery);
            $productStmt->execute([':store_id' => $store_id]);
            $productResult = $productStmt->fetch(PDO::FETCH_ASSOC);
            $total_products = (int)($productResult['total_products'] ?? 0);

            // 2. Pending orders (WAITING_APPROVAL)
            $pendingQuery = 'SELECT COUNT(*) as pending_count 
                            FROM "order" 
                            WHERE store_id = :store_id AND status = :status';
            $pendingStmt = $this->db->prepare($pendingQuery);
            $pendingStmt->execute([':store_id' => $store_id, ':status' => 'WAITING_APPROVAL']);
            $pendingResult = $pendingStmt->fetch(PDO::FETCH_ASSOC);
            $pending_orders = (int)($pendingResult['pending_count'] ?? 0);

            // 3. Products with low stock (< 10)
            $lowStockQuery = 'SELECT COUNT(DISTINCT p.product_id) as low_stock_count 
                             FROM product p 
                             WHERE p.store_id = :store_id AND p.stock < 10 AND p.deleted_at IS NULL';
            $lowStockStmt = $this->db->prepare($lowStockQuery);
            $lowStockStmt->execute([':store_id' => $store_id]);
            $lowStockResult = $lowStockStmt->fetch(PDO::FETCH_ASSOC);
            $low_stock = (int)($lowStockResult['low_stock_count'] ?? 0);

            // 4. Total revenue (sum of all RECEIVED orders)
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
            // Return default stats if there's an error
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

    public function sellerProfile() {
        AuthMiddleware::requireRole('BUYER', '/auth/login');
        header('Location: /seller/dashboard');
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
        $relativeDir = 'uploads' . DIRECTORY_SEPARATOR . 'store_logos';
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
        $response['relative_path'] = 'uploads/store_logos/' . $filename;
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
}
?>