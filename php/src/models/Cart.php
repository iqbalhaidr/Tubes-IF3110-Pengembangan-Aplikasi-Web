<?php

class Cart {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get all items in cart_items by buyer_id
     */
    public function fetchItems($buyer_id) {
        $query = 'SELECT 
            c.cart_item_id, 
            c.quantity,
            p.product_id,
            p.product_name,
            p.price,
            p.main_image_path,
            p.stock,
            s.store_id,
            s.store_name,
            s.store_logo_path
        FROM 
            "cart_item" c
        JOIN 
            "product" p ON c.product_id = p.product_id
        JOIN 
            "store" s ON p.store_id = s.store_id
        WHERE 
            c.buyer_id = :buyer_id
        ORDER BY 
            s.store_name';
        
        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute([':buyer_id' => $buyer_id]);
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

            return ['success' => true, 'items' => $items];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Get cart items failed: ' . $e->getMessage()];
        }
    }

    /**
     * Insert an item to cart_item
     */
    public function addItem($buyer_id, $product_id, $quantity) {
        $query = 'INSERT INTO "cart_item" (buyer_id, product_id, quantity)
                  VALUES (:buyer_id, :product_id, :quantity) 
                  RETURNING cart_item_id, buyer_id, product_id, quantity, created_at, updated_at';

        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':buyer_id' => $buyer_id,
                ':product_id' => $product_id,
                ':quantity' => $quantity
            ]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            return ['success' => true, 'row' => $row];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Add item to cart failed: ' . $e->getMessage()];
        }
    }

    /**
     * Delete an item from cart_item, return affected rows 
     * $buyer_id for protection from unauthorized user
     */
    public function deleteItem($buyer_id, $cart_item_id) {
        $query = 'DELETE FROM "cart_item" WHERE buyer_id = :buyer_id AND cart_item_id = :cart_item_id';

        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':buyer_id' => $buyer_id,
                ':cart_item_id' => $cart_item_id
            ]);
            $affected_rows = $stmt->rowCount();

            return ['success' => true, 'affected_rows' => $affected_rows];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Delete product from cart failed: ' . $e->getMessage()];
        }
    }

    /**
     * Update item quantity from cart_item, return affected rows
     */
    public function updateItem($buyer_id, $cart_item_id, $quantity) {
        $query = 'UPDATE "cart_item" SET quantity = :quantity WHERE buyer_id = :buyer_id AND cart_item_id = :cart_item_id';

        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':buyer_id' => $buyer_id,
                ':cart_item_id' => $cart_item_id,
                ':quantity' => $quantity
            ]);
            
            $affected_rows = $stmt->rowCount();
            return ['success' => true, 'affected_rows' => $affected_rows];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Update product in cart failed: ' . $e->getMessage()];
        }
    }

    /**
     * Increment item quantity by $value from cart_item, return affected rows
     */
    public function incItem($buyer_id, $cart_item_id, $value) {
        $query = 'UPDATE "cart_item" SET quantity = quantity + :value WHERE buyer_id = :buyer_id AND cart_item_id = :cart_item_id';
        
        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':buyer_id' => $buyer_id,
                ':cart_item_id' => $cart_item_id,
                ':value' => $value
            ]);
            
            $affected_rows = $stmt->rowCount();
            return ['success' => true, 'affected_rows' => $affected_rows];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Increment product in cart failed: ' . $e->getMessage()];
        }
    }

    /**
     * Get cart_item_id by buyer_id and product_id, return null if no match
     */
    public function find_cart_item_id($buyer_id, $product_id) {
        $query = 'SELECT cart_item_id FROM "cart_item" WHERE buyer_id = :buyer_id AND product_id = :product_id';

        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':buyer_id' => $buyer_id,
                ':product_id' => $product_id
            ]);
            
            $cart_item_id = $stmt->fetchColumn();
            if ($cart_item_id === false) {
                return ['success' => true, 'cart_item_id' => null];
            }

            return ['success' => true, 'cart_item_id' => $cart_item_id];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Get cart_item_id failed: ' . $e->getMessage()];
        }
    }

    public function get_unique_item_count($buyer_id) {
        $query = 'SELECT COUNT(cart_item_id) FROM "cart_item" WHERE buyer_id = :buyer_id';

        try {
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':buyer_id' => $buyer_id
            ]);
            
            $unique_item_count = $stmt->fetchColumn();
            if ($unique_item_count === false) {
                return ['success' => true, 'unique_item_count' => 0];
            }

            return ['success' => true, 'unique_item_count' => $unique_item_count];

        } catch (PDOException $e) {
            return ['success' => false, 'message' => 'Get unique_item_count failed: ' . $e->getMessage()];
        }
    }

}

?>