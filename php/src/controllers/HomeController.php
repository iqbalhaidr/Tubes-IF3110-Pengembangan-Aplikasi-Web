<?php

require_once __DIR__ . '/../models/Category.php';
require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Store.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class HomeController {
    public function index() {
        $categories = Category::findAll();
        $current_user = AuthMiddleware::getCurrentUser();

        require_once __DIR__ . '/../views/home.php';
    }

    public function buyerHome() {
        AuthMiddleware::requireRole('BUYER', '/auth/login');

        $categories = Category::findAll();

        require_once __DIR__ . '/../views/buyer/home.php';
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
                    ['label' => 'Store Description', 'value' => $store['store_description'] ?? 'Tell buyers what makes your store unique.'],
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
}
