<?php

require_once __DIR__ . '/../utils/Helper.php';
require_once __DIR__ . '/../models/Product.php';
require_once __DIR__ . '/../models/Store.php';

class StoreController {

    private $productModel;
    private $db;
    private $userModel;
    private $storeModel;

    public function __construct() {
        $this->db = Database::getInstance(); 
        $this->productModel = new Product($this->db);
        $this->storeModel = new Store();
    }

    public function showStorePage($store_id) {
        $store = $this->productModel->findStoreById($store_id);
        if (!$store) {
            http_response_code(404);
            require __DIR__ . '/../views/404.php';
            exit;
        }

        $current_user = AuthMiddleware::getCurrentUser();
        $isUserLoggedIn = !empty($current_user);

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

        $validLimits = [5, 10, 15, 20];
        $currentLimit = 10;
        if (isset($_GET['limit']) && in_array((int)$_GET['limit'], $validLimits)) {
            $currentLimit = (int)$_GET['limit'];
        }

        $minPrice = $_GET['min_price'] ?? '';
        $maxPrice = $_GET['max_price'] ?? '';
        $isPriceFilterActive = !empty($minPrice) || !empty($maxPrice);
        $filterText = "Filter Harga"; 
        if ($isPriceFilterActive) {
            if (!empty($minPrice) && !empty($maxPrice)) {
                $filterText = 'Rp ' . number_format($minPrice) . ' - ' . 'Rp ' . number_format($maxPrice);
            } elseif (!empty($minPrice)) {
                $filterText = '> Rp ' . number_format($minPrice);
            } elseif (!empty($maxPrice)) {
                $filterText = '< Rp ' . number_format($maxPrice);
            }
        }

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
    
    private function getStoreIdForCurrentUser() {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user || $user['role'] !== 'SELLER') {
            return null;
        }
        
        $store = $this->storeModel->findBySeller($user['user_id']);
        return $store ? $store['store_id'] : null;
    }

    public function updateStore() {
        header('Content-Type: application/json');
        AuthMiddleware::requireRole('SELLER');
        
        try {
            $store_id = $this->getStoreIdForCurrentUser();
            if (!$store_id) {
                throw new Exception("Store not found.");
            }
            $name = trim($_POST['store_name'] ?? '');
            $description = trim($_POST['store_description'] ?? '');
            
            if (empty($name) || strlen($name) > 100) {
                throw new Exception("Store name must be between 1-100 characters.");
            }
            
            if (strlen($description) > 5000) {
                throw new Exception("Description cannot exceed 5000 characters.");
            }

            $logoPath = null;
            if (isset($_FILES['store_logo']) && $_FILES['store_logo']['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES['store_logo'];
                $maxSize = 2 * 1024 * 1024; 
                $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                
                if ($file['size'] > $maxSize) {
                    throw new Exception("Logo size must not exceed 2MB.");
                }
                
                $fileMimeType = mime_content_type($file['tmp_name']);
                if (!in_array($fileMimeType, $allowedTypes)) {
                    throw new Exception("Logo must be JPG, PNG, or WEBP.");
                }

                $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                $newFileName = 'store_' . $store_id . '_' . time() . '.' . $extension;
                
                $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/public/images/stores/';
                
                if (!is_dir($uploadDir)) {
                    if (!mkdir($uploadDir, 0755, true)) {
                        throw new Exception("Failed to create upload directory.");
                    }
                }
                
                $uploadPath = $uploadDir . $newFileName;
                $logoPath = 'public/images/stores/' . $newFileName;

                if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
                    throw new Exception("Failed to upload logo.");
                }
            }

            $result = $this->storeModel->update($store_id, $name, $description, $logoPath);

            if (!$result['success']) {
                throw new Exception($result['message']);
            }

            echo json_encode([
                'success' => true, 
                'message' => 'Store updated successfully',
                'store' => $result['store']
            ]);

        } catch (Exception $e) {
            error_log("Error updating store: " . $e->getMessage());
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }

    public function getStoreData() {
        header('Content-Type: application/json');
        AuthMiddleware::requireRole('SELLER');
        
        try {
            $store_id = $this->getStoreIdForCurrentUser();
            if (!$store_id) {
                throw new Exception("Store not found.");
            }

            $store = $this->productModel->findStoreById($store_id);
            
            echo json_encode([
                'success' => true,
                'store' => $store
            ]);

        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }


}
?>
