<?php

require_once __DIR__ . '/../utils/Helper.php';

class StoreController {

    private $productModel;
    private $db;
    private $userModel;

    public function __construct() {
        $this->db = Database::getInstance(); 
        $this->productModel = new Product($this->db);
        $this->userModel = new User($this->db); 
    }

    public function showStorePage($store_id) {
        $store = $this->productModel->findStoreById($store_id);
        if (!$store) {
            http_response_code(404);
            require __DIR__ . '/../views/404.php';
            exit;
        }
    
        $current_user = AuthMiddleware::getCurrentUser();
    
        $validLimits = [5, 10, 15, 20]; 
        $currentLimit = 10;
        if (isset($_GET['limit']) && in_array((int)$_GET['limit'], $validLimits)) {
            $currentLimit = (int)$_GET['limit'];
        }
    
        $minPrice = $_GET['min_price'] ?? '';
        $maxPrice = $_GET['max_price'] ?? '';
        $isPriceFilterActive = !empty($minPrice) || !empty($maxPrice);
    
        $filters = [
            'search'    => $_GET['search'] ?? null,
            'category'  => $_GET['category'] ?? null,
            'min_price' => $minPrice, 
            'max_price' => $maxPrice,
            'store_id'  => $store_id 
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
        
        require __DIR__ . '/../views/store_detail.php';
    }
}
?>