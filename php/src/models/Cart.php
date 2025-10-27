<?php

class Cart {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Get all cart_items by buyer_id
     */
    public function get_cart_items_by_buyer_id($buyer_id) {
        $query = 'SELECT 
            c.cart_item_id, 
            c.quantity,
            p.product_id,
            p.product_name,
            p.price,
            p.main_image_path,
            s.store_id,
            s.store_name
        FROM 
            "cart_item" c
        JOIN 
            "product" p ON c.product_id = p.product_id
        JOIN 
            "store" s ON p.store_id = s.store_id
        WHERE 
            c.buyer_id = $1
        ORDER BY 
            s.store_name';
        $result = pg_query_params($this->db, $query, array($buyer_id));

        if (!$result) {
            return ['success' => false, 'message' => 'Get cart items failed: ' . pg_last_error($this->db)];
        }

        // Fetches all rows from a result as an array (empty array if zero rows)
        $arr = pg_fetch_all($result);

        return ['success' => true, 'items' => $arr];
    }

    /**
     * Insert a product to cart_item
     */
    public function add_product($buyer_id, $product_id, $quantity) {
        $query = 'INSERT INTO "cart_item" (buyer_id, product_id, quantity)
                  VALUES ($1, $2, $3) RETURNING cart_item_id, buyer_id, product_id, quantity, created_at, updated_at';
        $result = pg_query_params($this->db, $query, array($buyer_id, $product_id, $quantity));

        if (!$result) {
            return ['success' => false, 'message' => 'Add product to cart failed: ' . pg_last_error($this->db)];
        }

        $row = pg_fetch_assoc($result);
        return ['success' => true, 'row' => $row];
    }

    /**
     * Get cart_item_id by buyer_id and product_id, return null if no match
     */
    public function get_cart_item_id_by_buyer_id_and_product_id($buyer_id, $product_id) {
        $query = 'SELECT cart_item_id FROM "cart_item" WHERE buyer_id = $1 AND product_id = $2';
        $result = pg_query_params($this->db, $query, array($buyer_id, $product_id));

        if (!$result) {
            return ['success' => false, 'message' => 'Get cart_item_id failed: ' . pg_last_error($this->db)];
        }

        if (pg_num_rows($result) === 0) {
            return ['success' => true, 'cart_item_id' => null];
        }

        $cart_item_id = pg_fetch_result($result, 0, 0);
        return ['success' => true, 'cart_item_id' => $cart_item_id];
    }

    /**
     * Delete product from cart_item, return affected rows
     */
    public function delete_product($buyer_id, $product_id) {
        $query = 'DELETE FROM "cart_item" WHERE buyer_id = $1 AND product_id = $2';
        $result = pg_query_params($this->db, $query, array($buyer_id, $product_id));

        if (!$result) {
            return ['success' => false, 'message' => 'Delete product from cart failed: ' . pg_last_error($this->db)];
        }

        $affected_rows = pg_affected_rows($result);
        return ['success' => true, 'affected_rows' => $affected_rows];
    }

    /**
     * Update product quantity from cart_item, return affected rows
     */
    public function update_product($buyer_id, $product_id, $quantity) {
        $query = 'UPDATE "cart_item" SET quantity = $3 WHERE buyer_id = $1 AND product_id = $2';
        $result = pg_query_params($this->db, $query, array($buyer_id, $product_id, $quantity));

        if (!$result) {
            return ['success' => false, 'message' => 'Update product in cart failed: ' . pg_last_error($this->db)];
        }

        $affected_rows = pg_affected_rows($result);
        return ['success' => true, 'affected_rows' => $affected_rows];
    }

    /**
     * Increment product quantity by $value from cart_item, return affected rows
     */
    public function inc_product($buyer_id, $product_id, $value) {
        $query = 'UPDATE "cart_item" SET quantity = quantity + $3 WHERE buyer_id = $1 AND product_id = $2';
        $result = pg_query_params($this->db, $query, array($buyer_id, $product_id, $value));

        if (!$result) {
            return ['success' => false, 'message' => 'Increment product in cart failed: ' . pg_last_error($this->db)];
        }

        $affected_rows = pg_affected_rows($result);
        return ['success' => true, 'affected_rows' => $affected_rows];
    }

    /**
     * Decrement product quantity by $value from cart_item, return affected rows
     */
    public function dec_product($buyer_id, $product_id, $value) {
        $query = 'UPDATE "cart_item" SET quantity = quantity - $3 WHERE buyer_id = $1 AND product_id = $2';
        $result = pg_query_params($this->db, $query, array($buyer_id, $product_id, $value));

        if (!$result) {
            return ['success' => false, 'message' => 'Decrement product in cart failed: ' . pg_last_error($this->db)];
        }

        $affected_rows = pg_affected_rows($result);
        return ['success' => true, 'affected_rows' => $affected_rows];
    }


}

?>