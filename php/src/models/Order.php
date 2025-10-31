<?php

class Order {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function createOrderTransaction($buyer_id, $shipping_address, $cartItems) {
        $product_ids = array_map(function($item) {
            return $item['product_id'];
        }, $cartItems);

        if (empty($product_ids)) {
            return ['success' => false, 'message' => 'Cart is empty.'];
        }

        $placeholders = implode(',', array_fill(0, count($product_ids), '?'));

        try {
            $this->db->beginTransaction();

            // LOCK THE DATA

            $product_sql = "SELECT product_id, stock, price, deleted_at, product_name 
                            FROM product 
                            WHERE product_id IN ($placeholders) 
                            FOR UPDATE";
            $product_stmt = $this->db->prepare($product_sql);
            $product_stmt->execute($product_ids);
            $locked_products_raw = $product_stmt->fetchAll(PDO::FETCH_ASSOC);

            $locked_products = [];
            foreach ($locked_products_raw as $product) {
                $locked_products[$product['product_id']] = $product;
            }

            $user_sql = "SELECT balance FROM \"user\" WHERE user_id = :user_id FOR UPDATE";
            $user_stmt = $this->db->prepare($user_sql);
            $user_stmt->execute([':user_id' => $buyer_id]);
            $user = $user_stmt->fetch(PDO::FETCH_ASSOC);

            // VALIDATE THE DATA

            // Validate and calculate the items in cart
            $grand_total = 0;
            $store_orders = [];
            $validation_errors = [];

            foreach ($cartItems as $item) {
                $product_id = $item['product_id'];
                $quantity = (int)$item['quantity'];

                // Validation hard delete
                if (!isset($locked_products[$product_id])) {
                    $validation_errors[] = "Product '{$item['product_name']}' is no longer available.";
                    continue;
                }

                // Validation soft delete
                $product = $locked_products[$product_id];
                if ($product['deleted_at'] !== null) {
                    $validation_errors[] = "Product '{$product['product_name']}' has been removed by the seller.";
                }

                // Validation stock enough
                if ($product['stock'] < $quantity) {
                    $validation_errors[] = "Insufficient stock for '{$product['product_name']}'. Only {$product['stock']} left, but you requested {$quantity}.";
                }

                // Calculations for each items
                $price_at_purchase = (int)$product['price'];
                $subtotal = $price_at_purchase * $quantity;
                $grand_total += $subtotal;
                $store_id = (int)$item['store_id'];

                if (!isset($store_orders[$store_id])) {
                    $store_orders[$store_id] = [
                        'total_price' => 0,
                        'items' => []
                    ];
                }
                
                $store_orders[$store_id]['total_price'] += $subtotal;
                $store_orders[$store_id]['items'][] = [
                    'product_id' => $product_id,
                    'quantity' => $quantity,
                    'price_at_purchase' => $price_at_purchase,
                    'subtotal' => $subtotal
                ];
            }

            // Validate the user balance
            if ((int)$user['balance'] < $grand_total) {
                $validation_errors[] = "Insufficient balance. Your balance is {$user['balance']}, but the total is {$grand_total}. Please top up.";
            }

            if (!empty($validation_errors)) {
                $this->db->rollBack();
                return ['success' => false, 'message' => implode(' ', $validation_errors)];
            }


            // UPDATE THE DATA

            // Decrement user balance
            $update_user_sql = "UPDATE \"user\" SET balance = balance - :grand_total, updated_at = CURRENT_TIMESTAMP WHERE user_id = :user_id";
            $update_user_stmt = $this->db->prepare($update_user_sql);
            $update_user_stmt->execute([':grand_total' => $grand_total, ':user_id' => $buyer_id]);


            $insert_order_sql = "INSERT INTO \"order\" (buyer_id, store_id, total_price, shipping_address, status) 
                                 VALUES (:buyer_id, :store_id, :total_price, :shipping_address, 'WAITING_APPROVAL') 
                                 RETURNING order_id";
            $insert_order_stmt = $this->db->prepare($insert_order_sql);

            $insert_item_sql = "INSERT INTO order_item (order_id, product_id, quantity, price_at_purchase, subtotal) 
                                VALUES (:order_id, :product_id, :quantity, :price_at_purchase, :subtotal)";
            $insert_item_stmt = $this->db->prepare($insert_item_sql);

            $update_stock_sql = "UPDATE product SET stock = stock - :quantity, updated_at = CURRENT_TIMESTAMP WHERE product_id = :product_id";
            $update_stock_stmt = $this->db->prepare($update_stock_sql);

            // Create order per store
            foreach ($store_orders as $store_id => $order_data) {
                $insert_order_stmt->execute([
                    ':buyer_id' => $buyer_id,
                    ':store_id' => $store_id,
                    ':total_price' => $order_data['total_price'],
                    ':shipping_address' => $shipping_address
                ]);
                $order_id = $insert_order_stmt->fetchColumn();

                // Add items to this order
                foreach ($order_data['items'] as $item) {
                    $insert_item_stmt->execute([
                        ':order_id' => $order_id,
                        ':product_id' => $item['product_id'],
                        ':quantity' => $item['quantity'],
                        ':price_at_purchase' => $item['price_at_purchase'],
                        ':subtotal' => $item['subtotal']
                    ]);
                    
                    // Decrement stock
                    $update_stock_stmt->execute([
                        ':quantity' => $item['quantity'],
                        ':product_id' => $item['product_id']
                    ]);
                }
            }

            // Clear cart items
            $clear_cart_sql = "DELETE FROM cart_item WHERE buyer_id = :buyer_id";
            $clear_cart_stmt = $this->db->prepare($clear_cart_sql);
            $clear_cart_stmt->execute([':buyer_id' => $buyer_id]);

            $this->db->commit();
            
            return ['success' => true, 'message' => 'Checkout successful.'];

        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            return ['success' => false, 'message' => 'An error occurred during checkout: ' . $e->getMessage()];
        }
    }
}
?>
