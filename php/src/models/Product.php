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
                    JOIN category_item ci ON p.product_id = ci.product_id 
                    JOIN category c ON ci.category_id = c.category_id';
        $whereConditions = ['p.deleted_at IS NULL'];
        $joinConditions = '';
        $params = [];

        if (!empty($filters['search'])) {
            $whereConditions[] = '(p.product_name ILIKE :search OR s.store_name ILIKE :search)';
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
}
?>
