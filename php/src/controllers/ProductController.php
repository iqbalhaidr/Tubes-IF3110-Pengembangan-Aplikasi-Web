<?php
class ProductController {
    private $productModel;
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->productModel = new Product($this->db);
    }

    public function getProducts() {
        header('Content-Type: application/json');
        try {
            $validLimits = [5, 10, 15, 20];
            $limit = 10;
            if (isset($_GET['limit']) && in_array((int)$_GET['limit'], $validLimits)) {
                $limit = (int)$_GET['limit'];
            }

            $filters = [
                'search'    => $_GET['search'] ?? null,
                'category'  => $_GET['category'] ?? null,
                'min_price' => $_GET['min_price'] ?? null,
                'max_price' => $_GET['max_price'] ?? null,
                'store_id'  => $_GET['store_id'] ?? null
            ];
            $page = $_GET['page'] ?? 1;

            $result = $this->productModel->getProducts($filters, $page, $limit);
            
            echo json_encode(['success' => true, 'data' => $result]);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }

    public function showProductDetail($id) {
        try {
            $isUserLoggedIn = AuthMiddleware::isLoggedIn();
            $current_user = AuthMiddleware::getCurrentUser();
    
            if (!$isUserLoggedIn) {
                $navbarType = 'guest';
            } elseif ($current_user['role'] === 'BUYER') {
                $navbarType = 'buyer';
            } elseif ($current_user['role'] === 'SELLER') {
                $navbarType = 'seller';
            } else {
                $navbarType = 'guest';
            }
            
            $activeLink = 'discover'; 
    
            $product = $this->productModel->findProductById($id);
            if (!$product) {
                http_response_code(404);
                require __DIR__ . '/../views/404.php';
                exit;
            }
    
            $store = $this->productModel->findStoreById($product['store_id']);
            
            $categoryArray = $this->productModel->findCategoriesByProductId($id);
            $categoryNames = array_column($categoryArray, 'name');
            $categories = implode(', ', $categoryNames);
            
            require __DIR__ . '/../views/product_detail.php';
    
        } catch (Exception $e) {
            http_response_code(500);
            echo "Error: " . $e->getMessage();
            exit;
        }
    }
}
?>
