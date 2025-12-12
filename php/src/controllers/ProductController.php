<?php
require_once __DIR__ . '/../utils/Helper.php';

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

            // Find active auction for this product
            $activeAuction = $this->productModel->findActiveAuctionForProduct($id);
            
            $categoryArray = $this->productModel->findCategoriesByProductId($id);
            $categoryNames = array_column($categoryArray, 'name');
            $categories = implode(', ', $categoryNames);
            
            $clean_description = Helper::sanitizeRichText($product['description']);
            
            require __DIR__ . '/../views/product_detail.php';
    
        } catch (Exception $e) {
            http_response_code(500);
            echo "Error: " . $e->getMessage();
            exit;
        }
    }

    private function getStoreIdForCurrentUser() {
        $user = AuthMiddleware::getCurrentUser();
        if (!$user || $user['role'] !== 'SELLER') {
            return null;
        }
        
        $stmt = $this->db->prepare("SELECT store_id FROM store WHERE user_id = :user_id");
        $stmt->execute([':user_id' => $user['user_id']]);
        $store = $stmt->fetch();
        
        return $store ? $store['store_id'] : null;
    }

    public function showProductManagement() {
        AuthMiddleware::requireRole('SELLER', '/auth/login');

        $current_user = AuthMiddleware::getCurrentUser();
        
        // Get store info for navbar balance display
        $storeModel = new Store();
        $store = $storeModel->findBySeller($current_user['user_id']);
        
        $categoryController = new CategoryController();
        $categories = $categoryController->getCategoryData();

        $navbarType = 'seller';
        $activeLink = 'products';

        require __DIR__ . '/../views/seller/product_management.php';
    }

    public function getProductBySeller() {
        header('Content-Type: application/json');
        AuthMiddleware::requireRole('SELLER');
        
        $store_id = $this->getStoreIdForCurrentUser();
        if (!$store_id) {
            echo json_encode(['success' => false, 'message' => 'Toko tidak ditemukan']);
            exit;
        }

        $filters = [
            'search'     => $_GET['search'] ?? null,
            'category'   => $_GET['category'] ?? null,
            'sort_by'    => $_GET['sort_by'] ?? 'name',
            'sort_order' => $_GET['sort_order'] ?? 'ASC'
        ];
        $page = $_GET['page'] ?? 1;
        $limit = 10;

        $result = $this->productModel->getProductsForSeller($store_id, $filters, $page, $limit);
        echo json_encode(['success' => true, 'data' => $result]);
        exit;
    }

    public function getProductById($id) {
        header('Content-Type: application/json');
        AuthMiddleware::requireRole('SELLER');
        
        try {
            $store_id = $this->getStoreIdForCurrentUser();
            if (!$store_id) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Toko tidak ditemukan']);
                exit;
            }

            $product = $this->productModel->findProductById($id);
            
            if (!$product) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Produk tidak ditemukan']);
                exit;
            }

            // Verify ownership - product must belong to current seller's store
            if ($product['store_id'] !== $store_id) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Anda tidak memiliki produk ini']);
                exit;
            }

            // Return product data in format expected by React
            echo json_encode([
                'success' => true,
                'data' => [
                    'product_id' => $product['id'],
                    'product_name' => $product['name'],
                    'price' => $product['price'],
                    'stock' => $product['stock'],
                    'main_image_path' => $product['image'],
                    'description' => $product['description']
                ]
            ]);
            exit;
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'error' => $e->getMessage()]);
            exit;
        }
    }

    public function deleteProduct() {
        header('Content-Type: application/json');
        AuthMiddleware::requireRole('SELLER');
        
        $store_id = $this->getStoreIdForCurrentUser();
        if (!$store_id) {
            echo json_encode(['success' => false, 'message' => 'Aksi tidak diizinkan']);
            exit;
        }

        $data = json_decode(file_get_contents('php://input'), true);
        $product_id = $data['product_id'] ?? null;

        if (!$product_id) {
            echo json_encode(['success' => false, 'message' => 'Product ID tidak valid']);
            exit;
        }

        // Check if product is in an active auction
        if ($this->productModel->isProductInActiveAuction($product_id)) {
            Response::error('This product cannot be deleted because it is currently in an active or scheduled auction.', null, 403);
        }

        $rowCount = $this->productModel->softDeleteProduct($product_id, $store_id);

        if ($rowCount > 0) {
            echo json_encode(['success' => true, 'message' => 'Produk berhasil dihapus']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Gagal menghapus produk atau produk tidak ditemukan']);
        }
        exit;
    }

    public function getSellerProductById($id) {
        header('Content-Type: application/json');
        AuthMiddleware::requireRole('SELLER');
        
        $store_id = $this->getStoreIdForCurrentUser();
        if (!$store_id) {
            Response::error('Aksi tidak diizinkan', null, 403);
        }

        $productData = $this->productModel->findProductById($id);

        if (!$productData || $productData['store_id'] !== $store_id) {
            Response::error('Produk tidak ditemukan atau bukan milik Anda', null, 404);
        }
        
        // Remap fields to be consistent with other parts of the app
        $responseProduct = [
            "product_id" => $productData['id'],
            "product_name" => $productData['name'],
            "description" => $productData['description'],
            "price" => $productData['price'],
            "stock" => $productData['stock'],
            "main_image_path" => $productData['image'],
            "store_id" => $productData['store_id'],
            "store_name" => $productData['store']
        ];

        Response::success('Product retrieved', $responseProduct);
    }

    public function showAddProductPage() {
        AuthMiddleware::requireRole('SELLER', '/auth/login');
        $current_user = AuthMiddleware::getCurrentUser();

        // Get store info for navbar balance display
        $storeModel = new Store();
        $store = $storeModel->findBySeller($current_user['user_id']);

        $categoryController = new CategoryController();
        $categories = $categoryController->getCategoryData(); 

        $navbarType = 'seller';
        $activeLink = 'products';

        require __DIR__ . '/../views/seller/add_product.php';
    }

    public function createProduct() {
        header('Content-Type: application/json');
        AuthMiddleware::requireRole('SELLER');
        
        $store_id = $this->getStoreIdForCurrentUser(); 
        if (!$store_id) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Toko tidak ditemukan']);
            exit;
        }
    
        try {
            $name = trim($_POST['product_name'] ?? '');
            $description = trim($_POST['description'] ?? '');
            
            $price = filter_var($_POST['price'] ?? '', FILTER_VALIDATE_INT);
            $stock = filter_var($_POST['stock'] ?? '', FILTER_VALIDATE_INT);
            
            $category_ids = json_decode($_POST['categories'] ?? '[]', true);
    
            if (empty($name) || strlen($name) > 200) {
                throw new Exception("Nama produk tidak valid.");
            }
            
            if (empty($description) || strlen($description) > 1000) {
                throw new Exception("Deskripsi tidak valid.");
            }
            
            if ($price === false || $price < 1000) {
                throw new Exception("Harga tidak valid. Minimal Rp 1.000.");
            }

            if ($stock === false || $stock < 0) {
                throw new Exception("Stok tidak valid. Minimal 0.");
            }
            
            if (empty($category_ids) || !is_array($category_ids)) {
                throw new Exception("Pilih minimal satu kategori.");
            }
    
            if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
                throw new Exception("Upload foto gagal atau foto tidak ditemukan.");
            }
            
            $file = $_FILES['photo'];
            $maxSize = 2 * 1024 * 1024;
            $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
            if ($file['size'] > $maxSize) {
                throw new Exception("Ukuran foto maksimal 2MB.");
            }
            
            $fileMimeType = mime_content_type($file['tmp_name']);
            if (!in_array($fileMimeType, $allowedTypes)) {
                throw new Exception("Tipe file harus JPG, PNG, atau WEBP. Anda upload: " . $fileMimeType);
            }
    
            $productId = $this->productModel->createProduct(
                (int)$store_id, 
                $name,
                $description,
                (int)$price,
                (int)$stock,
                null
            );
    
            if (!$productId) {
                throw new Exception("Gagal menyimpan produk ke database.");
            }
    
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            $newFileName = $productId . '.' . $extension;
            
            $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/public/images/products/';
            
            if (!is_dir($uploadDir)) {
                if (!mkdir($uploadDir, 0755, true)) {
                    throw new Exception("Gagal membuat direktori upload.");
                }
            }
            
            $uploadPath = $uploadDir . $newFileName;
            $publicPath = '/public/images/products/' . $newFileName;
    
            if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
                $this->productModel->deleteProduct($productId);
                throw new Exception("Gagal memindahkan file.");
            }
    
            $this->productModel->updateProductImage($productId, $publicPath);
            $this->productModel->connectCategoriesToProduct($productId, $category_ids);
            $this->productModel->updateSearchText($productId);
    
            echo json_encode([
                'success' => true, 
                'message' => 'Produk berhasil ditambahkan',
                'product_id' => $productId
            ]);
    
        } catch (Exception $e) {
            error_log("Error creating product: " . $e->getMessage());
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }

    public function showEditProductPage($id) {
        AuthMiddleware::requireRole('SELLER', '/auth/login');
        $current_user = AuthMiddleware::getCurrentUser();
        $store_id = $this->getStoreIdForCurrentUser();

        // Get store info for navbar balance display
        $storeModel = new Store();
        $store = $storeModel->findBySeller($current_user['user_id']);

        $product = $this->productModel->findProductById($id);

        if (!$product || $product['store_id'] !== $store_id) {
            http_response_code(404);
            require __DIR__ . '/../views/404.php'; 
            exit;
        }

        $categoryController = new CategoryController();
        $allCategories = $categoryController->getCategoryData(); 

        $productCategories = $this->productModel->findCategoriesByProductId($id);
        $productCategoryIds = array_column($productCategories, 'id');

        $navbarType = 'seller';
        $activeLink = 'products'; 

        require __DIR__ . '/../views/seller/edit_product.php';
    }

    public function updateProduct($id) {
        header('Content-Type: application/json');
        AuthMiddleware::requireRole('SELLER');
        
        try {
            $store_id = $this->getStoreIdForCurrentUser();
            if (!$store_id) {
                throw new Exception("Toko tidak ditemukan.");
            }

            $product = $this->productModel->findProductById($id);
            if (!$product || $product['store_id'] !== $store_id) {
                throw new Exception("Aksi tidak diizinkan.");
            }

            // Check if product is in an active auction
            if ($this->productModel->isProductInActiveAuction($id)) {
                throw new Exception("This product cannot be edited because it is currently in an active or scheduled auction.");
            }

            $name = trim($_POST['product_name'] ?? '');
            $description = trim($_POST['description'] ?? '');
            $price = filter_var($_POST['price'] ?? '', FILTER_VALIDATE_INT);
            $stock = filter_var($_POST['stock'] ?? '', FILTER_VALIDATE_INT);
            $category_ids = json_decode($_POST['categories'] ?? '[]', true);
            
            if (empty($name) || strlen($name) > 200) throw new Exception("Nama produk tidak valid.");
            if (empty($description) || strlen($description) > 1000) throw new Exception("Deskripsi tidak valid.");
            if ($price === false || $price < 1000) throw new Exception("Harga tidak valid. Minimal Rp 1.000.");
            if ($stock === false || $stock < 0) throw new Exception("Stok tidak valid. Minimal 0.");
            if (empty($category_ids) || !is_array($category_ids)) throw new Exception("Pilih minimal satu kategori.");

            $publicPath = $product['image'];

            if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
                $file = $_FILES['photo'];
                $maxSize = 2 * 1024 * 1024;
                $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                
                if ($file['size'] > $maxSize) throw new Exception("Ukuran foto maksimal 2MB.");
                $fileMimeType = mime_content_type($file['tmp_name']);
                if (!in_array($fileMimeType, $allowedTypes)) {
                     throw new Exception("Tipe file harus JPG, PNG, atau WEBP.");
                }

                $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
                $newFileName = $id . '.' . $extension; 
                $uploadDir = $_SERVER['DOCUMENT_ROOT'] . '/public/images/products/';
                $uploadPath = $uploadDir . $newFileName;
                $publicPath = '/public/images/products/' . $newFileName . '?v=' . time();

                if (!move_uploaded_file($file['tmp_name'], $uploadPath)) {
                    throw new Exception("Gagal memindahkan file.");
                }
            }

            $data = [
                'name' => $name,
                'description' => $description,
                'price' => $price,
                'stock' => $stock,
                'image_path' => $publicPath
            ];
            $this->productModel->updateProduct($id, $store_id, $data);
            $this->productModel->connectCategoriesToProduct($id, $category_ids);
            $this->productModel->updateSearchText($id);

            echo json_encode(['success' => true, 'message' => 'Produk berhasil diupdate']);

        } catch (Throwable $e) {
            http_response_code(400); 
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
        exit;
    }
}
?>
