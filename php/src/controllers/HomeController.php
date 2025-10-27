<?php

require_once __DIR__ . '/../models/Category.php';
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
}
