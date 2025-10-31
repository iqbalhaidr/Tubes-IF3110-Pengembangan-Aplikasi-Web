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

        $validLimits = [4, 8, 12, 20];
        $currentLimit = 12; 
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

        $stats = [
            'total_products' => 0,
            'pending_orders' => 0,
            'low_stock' => 0,
            'total_revenue' => 0,
        ];

        require_once __DIR__ . '/../views/seller/dashboard.php';
    }

    public function buyerProfile() {
        AuthMiddleware::requireRole('BUYER', '/auth/login');

        $userModel = new User();
        $currentSessionUser = AuthMiddleware::getCurrentUser();
        $user = $userModel->getUserById($currentSessionUser['user_id']);

        $profileTitle = 'Your Account';
        $profileSubtitle = 'Keep your personal details accurate so orders reach you without delay.';
        $currentRole = 'BUYER';
        $navLinks = [
            ['label' => 'Discover', 'href' => '/buyer/home', 'active' => false],
            ['label' => 'Cart', 'href' => 'javascript:void(0);', 'active' => false],
            ['label' => 'Checkout', 'href' => 'javascript:void(0);', 'active' => false],
            ['label' => 'Orders', 'href' => 'javascript:void(0);', 'active' => false],
            ['label' => 'Profile', 'href' => '/buyer/profile', 'active' => true],
        ];

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
        AuthMiddleware::requireRole('SELLER', '/auth/login');

        $userModel = new User();
        $storeModel = new Store();
        $currentSessionUser = AuthMiddleware::getCurrentUser();
        $user = $userModel->getUserById($currentSessionUser['user_id']);
    $store = $storeModel->findBySeller($currentSessionUser['user_id']);

        $profileTitle = 'Seller Profile';
        $profileSubtitle = 'Review your account and storefront details to build buyer trust.';
        $currentRole = 'SELLER';
        $navLinks = [
            ['label' => 'Dashboard', 'href' => '/seller/dashboard', 'active' => false],
            ['label' => 'Product Management', 'href' => 'javascript:void(0);', 'active' => false],
            ['label' => 'Order Management', 'href' => 'javascript:void(0);', 'active' => false],
            ['label' => 'Profile', 'href' => '/seller/profile', 'active' => true],
        ];

        $storeDescriptionRaw = $store['store_description'] ?? '';
        $storeDescription = $this->formatRichTextField($storeDescriptionRaw);
        $hasStoreDescription = $storeDescription !== '';
        
        $storeLogoPath = $store['store_logo_path'] ?? null;

        $profileSections = [
            [
                'title' => 'Account Information',
                'items' => [
                    ['label' => 'Full Name', 'value' => $user['name'] ?? '-'],
                    ['label' => 'Email', 'value' => $user['email'] ?? '-'],
                    ['label' => 'Address', 'value' => $user['address'] ?? 'Add a business address to simplify logistics.'],
                ],
            ],
            [
                'title' => 'Store Overview',
                'items' => [
                    ['label' => 'Store Name', 'value' => $store['store_name'] ?? 'Complete your store profile'],
                    [
                        'label' => 'Store Logo',
                        'value' => $storeLogoPath,
                        'isLogo' => true,
                    ],
                    [
                        'label' => 'Store Description',
                        'value' => $hasStoreDescription ? $storeDescription : 'Tell buyers what makes your store unique.',
                        'isRichText' => $hasStoreDescription,
                    ],
                    ['label' => 'Store Balance', 'value' => 'Rp ' . number_format($store['balance'] ?? 0, 0, ',', '.')],
                ],
            ],
        ];

        $metaSummary = [
            ['label' => 'Role', 'value' => 'Seller'],
            ['label' => 'Store Created', 'value' => $this->formatDate($store['created_at'] ?? null)],
        ];

        require_once __DIR__ . '/../views/profile/profile.php';
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

    private function formatRichTextField($html) {
        if (!is_string($html) || trim($html) === '') {
            return '';
        }

        $allowedTags = '<p><strong><b><em><i><u><s><ol><ul><li><br><blockquote><span><a>';
        $clean = strip_tags($html, $allowedTags);

        // Remove empty paragraphs that Quill can generate
        $clean = preg_replace('/<p>\s*<\/p>/', '', $clean);

        return trim($clean);
    }
}
?>