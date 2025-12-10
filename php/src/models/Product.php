<?php
class Product {
    private $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getProducts($filters = [], $page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        
        $baseSql = 'FROM product p 
                    JOIN store s ON p.store_id = s.store_id 
                    LEFT JOIN category_item ci ON p.product_id = ci.product_id 
                    LEFT JOIN category c ON ci.category_id = c.category_id';
        $whereConditions = ['p.deleted_at IS NULL'];
        $joinConditions = '';
        $params = [];

        if (!empty($filters['search'])) {
            $whereConditions[] = 'p.search_text ILIKE :search';
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        if (!empty($filters['category'])) {
            $whereConditions[] = 'c.category_id = :category';
            $params[':category'] = $filters['category'];
        }

        if (!empty($filters['min_price'])) {
            $whereConditions[] = 'p.price >= :min_price';
            $params[':min_price'] = $filters['min_price'];
        }
        
        if (!empty($filters['max_price'])) {
            $whereConditions[] = 'p.price <= :max_price';
            $params[':max_price'] = $filters['max_price'];
        }

        if (!empty($filters['store_id'])) {
            $whereConditions[] = 'p.store_id = :store_id';
            $params[':store_id'] = $filters['store_id'];
        }

        $whereSql = 'WHERE ' . implode(' AND ', $whereConditions);

        $countSql = "SELECT COUNT(DISTINCT p.product_id) $baseSql $joinConditions $whereSql";
        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($params);
        $totalProducts = (int) $countStmt->fetchColumn();
        $totalPages = $totalProducts > 0 ? ceil($totalProducts / $limit) : 1;

        $productSql = "SELECT p.product_id AS id, p.product_name AS name, p.price, 
                       p.stock, p.main_image_path AS image, s.store_name AS store, s.store_id,
                       STRING_AGG(c.category_name, ', ') AS categories 
                       $baseSql $joinConditions $whereSql 
                       GROUP BY p.product_id, s.store_id, s.store_name 
                       ORDER BY p.product_id DESC 
                       LIMIT :limit OFFSET :offset";
                       
        $params[':limit'] = $limit;
        $params[':offset'] = $offset;

        $productStmt = $this->db->prepare($productSql);
        $productStmt->execute($params);
        $products = $productStmt->fetchAll(PDO::FETCH_ASSOC);
        if ($products === false) {
            $products = [];
        }

        return [
            'products' => $products,
            'pagination' => [
                'total_products' => $totalProducts,
                'total_pages' => $totalPages,
                'current_page' => (int) $page,
                'limit' => $limit
            ]
        ];
    }

    public function findProductById($id) {
        $sql = 'SELECT p.product_id AS id, p.product_name AS name, p.description, p.price, 
                       p.stock, p.main_image_path AS image, s.store_id, s.store_name AS store
                FROM product p
                JOIN store s ON p.store_id = s.store_id
                WHERE p.product_id = :id AND p.deleted_at IS NULL';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findStoreById($storeId) {
        $sql = 'SELECT store_id AS id, store_name AS name, store_description AS description, store_logo_path AS logo_path
                FROM store
                WHERE store_id = :store_id';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':store_id' => $storeId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findCategoriesByProductId($productId) {
        $sql = 'SELECT c.category_id AS id, c.category_name AS name
                FROM category c
                JOIN category_item ci ON c.category_id = ci.category_id
                WHERE ci.product_id = :product_id';
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':product_id' => $productId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getProductsForSeller($store_id, $filters = [], $page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        
        $baseSql = 'FROM product p 
                    LEFT JOIN category_item ci ON p.product_id = ci.product_id 
                    LEFT JOIN category c ON ci.category_id = c.category_id
                    LEFT JOIN auctions a ON p.product_id = a.product_id AND a.status IN (\'ACTIVE\', \'SCHEDULED\')';
        
        $whereConditions = ['p.store_id = :store_id', 'p.deleted_at IS NULL'];
        $params = [':store_id' => $store_id];

        if (!empty($filters['search'])) {
            $whereConditions[] = '(p.product_name ILIKE :search)';
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        if (!empty($filters['category'])) {
            $whereConditions[] = 'c.category_id = :category';
            $params[':category'] = $filters['category'];
        }

        $whereSql = 'WHERE ' . implode(' AND ', $whereConditions);
        $countSql = "SELECT COUNT(DISTINCT p.product_id) 
                     FROM product p 
                     LEFT JOIN category_item ci ON p.product_id = ci.product_id 
                     LEFT JOIN category c ON ci.category_id = c.category_id 
                     $whereSql";
        
        $countStmt = $this->db->prepare($countSql);
        $countStmt->execute($params);
        $totalProducts = (int) $countStmt->fetchColumn();
        $totalPages = $totalProducts > 0 ? ceil($totalProducts / $limit) : 1;

        $validSorts = ['name' => 'p.product_name', 'price' => 'p.price', 'stock' => 'p.stock'];
        $sortBy = $validSorts[$filters['sort_by']] ?? 'p.product_id';
        $sortOrder = strtoupper($filters['sort_order']) === 'ASC' ? 'ASC' : 'DESC';
        $orderBy = "ORDER BY $sortBy $sortOrder";

        $productSql = "SELECT p.product_id, p.product_name, p.price, p.stock, p.main_image_path,
                       a.status as auction_status,
                       STRING_AGG(c.category_name, ', ') AS categories
                       $baseSql 
                       $whereSql 
                       GROUP BY p.product_id, a.status
                       $orderBy 
                       LIMIT :limit OFFSET :offset";
                       
        $params[':limit'] = $limit;
        $params[':offset'] = $offset;

        $productStmt = $this->db->prepare($productSql);
        $productStmt->execute($params);
        $products = $productStmt->fetchAll(PDO::FETCH_ASSOC);

        return [
            'products' => $products,
            'pagination' => [
                'total_products' => $totalProducts,
                'total_pages' => $totalPages,
                'current_page' => (int) $page,
                'limit' => $limit
            ]
        ];
    }

    public function softDeleteProduct($product_id, $store_id) {
        $sql = "UPDATE product 
                SET deleted_at = NOW() 
                WHERE product_id = :product_id AND store_id = :store_id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':product_id' => $product_id,
            ':store_id' => $store_id
        ]);
        
        return $stmt->rowCount(); 
    }

    public function createProduct($store_id, $name, $description, $price, $stock, $image_path = null) {
        $sql = "INSERT INTO product (store_id, product_name, description, price, stock, main_image_path)
                VALUES (:store_id, :name, :description, :price, :stock, :image_path)
                RETURNING product_id";
        
        $stmt = $this->db->prepare($sql);
        
        $stmt->execute([
            ':store_id' => (int)$store_id,
            ':name' => (string)$name,
            ':description' => (string)$description,
            ':price' => (int)$price,
            ':stock' => (int)$stock,
            ':image_path' => $image_path
        ]);
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result || !isset($result['product_id'])) {
            throw new Exception("Gagal mendapatkan product_id dari database");
        }
        
        return (int)$result['product_id'];
    }

    public function updateProductImage($product_id, $image_path) {
        $sql = "UPDATE product SET main_image_path = :image_path WHERE product_id = :product_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([
            ':image_path' => $image_path,
            ':product_id' => $product_id
        ]);
    }

    public function updateProduct($product_id, $store_id, $data) {
        $sql = "UPDATE product 
                SET 
                    product_name = :name, 
                    description = :description, 
                    price = :price, 
                    stock = :stock, 
                    main_image_path = :image_path,
                    updated_at = NOW()
                WHERE 
                    product_id = :product_id AND store_id = :store_id";
        
        $stmt = $this->db->prepare($sql);
        $result = $stmt->execute([
            ':name' => $data['name'],
            ':description' => $data['description'],
            ':price' => $data['price'],
            ':stock' => $data['stock'],
            ':image_path' => $data['image_path'],
            ':product_id' => $product_id,
            ':store_id' => $store_id
        ]);
        
        if (!$result) {
            throw new Exception("Gagal mengupdate database.");
        }
        
        return $stmt->rowCount();
    }
    
    public function updateSearchText($product_id) {
        $synonymDictionary = [
            'laptop' => 'notebook komputer jinjing pc portabel macbook asus lenovo acer hp dell msi',
            'tv' => 'televisi flat screen',
            'smartphone' => 'handphone hp telpon genggam android ios iphone samsung xiaomi oppo vivo',
            'powerbank' => 'cas portabel charger portable pengisi daya baterai cadangan',
            'earbuds' => 'tws headset earphone audio nirkabel bluetooth',
            'smartwatch' => 'jam tangan pintar jam digital arloji pintar',
            'kemeja' => 'baju atasan hem pakaian',
            'gaun' => 'dress baju pesta',
            'celana' => 'bawahan jeans denim chino kulot',
            'jaket' => 'hoodie jumper sweater outerwear',
            'kaos' => 't-shirt baju santai',
            'sepatu' => 'sneakers running shoes',
            'raket' => 'bulutangkis badminton',
            'bola' => 'basket voli sepak',
            'meja' => 'mebel furniture',
            'kursi' => 'mebel furniture',
            'rak' => 'lemari penyimpanan furniture',
            'lampu' => 'penerangan desk lamp',
            'buku' => 'novel komik bacaan fiksi non-fiksi',
            'panci' => 'wajan teflon masak',
            'pisau' => 'alat potong',
            'oven' => 'pemanggang microwave',
            'blender' => 'juicer gilingan bumbu penghalus',
            'kipas' => 'fan pendingin',
        ];

        $stmt_data = $this->db->prepare("
            SELECT 
                p.product_name, 
                p.description, 
                s.store_name, 
                STRING_AGG(c.category_name, ' ') as categories
            FROM product p
            JOIN store s ON p.store_id = s.store_id
            LEFT JOIN category_item ci ON p.product_id = ci.product_id
            LEFT JOIN category c ON ci.category_id = c.category_id
            WHERE p.product_id = :product_id
            GROUP BY p.product_id, s.store_name
        ");
        $stmt_data->execute([':product_id' => $product_id]);
        $data = $stmt_data->fetch(PDO::FETCH_ASSOC);

        if (!$data) return;

        $base_text = $data['product_name'] . ' ' . 
                     strip_tags($data['description'] ?? '') . ' ' . 
                     $data['store_name'] . ' ' . 
                     ($data['categories'] ?? '');

        $extra_keywords = '';
        $normalized_base_text = ' ' . strtolower($base_text) . ' ';

        foreach ($synonymDictionary as $key => $synonyms) {
            if (strpos($normalized_base_text, ' ' . $key . ' ') !== false) {
                $extra_keywords .= $synonyms . ' ';
            }
        }

        $final_search_text = strtolower($base_text . ' ' . $extra_keywords);
        
        $sql_update = "UPDATE product SET search_text = :search_text WHERE product_id = :product_id";
        $stmt_update = $this->db->prepare($sql_update);
        $stmt_update->execute([
            ':search_text' => $final_search_text,
            ':product_id' => $product_id
        ]);
    }

    public function deleteProduct($product_id) {
        $sql = "DELETE FROM product WHERE product_id = :product_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':product_id' => $product_id]);
    }

    public function connectCategoriesToProduct($product_id, $category_ids) {
        $this->db->prepare("DELETE FROM category_item WHERE product_id = ?")
             ->execute([$product_id]);
        
        $sql = "INSERT INTO category_item (product_id, category_id) VALUES (?, ?)";
        $stmt = $this->db->prepare($sql);
        
        foreach ($category_ids as $category_id) {
            if (!empty($category_id)) {
                $stmt->execute([$product_id, (int)$category_id]);
            }
        }
    }

    public function isProductInActiveAuction($product_id) {
        $query = 'SELECT 1 FROM auctions WHERE product_id = :product_id AND status IN (\'ACTIVE\', \'SCHEDULED\')';
        try {
            $statement = $this->db->prepare($query);
            $statement->execute([':product_id' => $product_id]);
            return (bool) $statement->fetchColumn();
        } catch (PDOException $exception) {
            // On error, assume it's not in auction to prevent accidental blocking
            return false;
        }
    }
}
?>