<?php

require_once __DIR__ . '/../utils/Helper.php';

class HomeController {

    private $productModel;
    private $db;

    public function __construct() {
        $this->db = Database::getInstance(); 
        $this->productModel = new Product($this->db);
    }

    public function index() {
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

        require __DIR__ . '/../views/home.php';
    }
}
?>