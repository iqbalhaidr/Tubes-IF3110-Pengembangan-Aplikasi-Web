<?php

class Order {
    private $db;

    public function __construct($database = null) {
        if ($database === null) {
            $database = Database::getInstance();
        }
        $this->db = $database;
    }

    /**
     * Create a new order with items
     * Returns the created order ID on success
     */
    public function create($buyer_id, $store_id, $total_price, $shipping_address) {
        try {
            // Start transaction
            $this->db->beginTransaction();

            // Create order
            $query = '
                INSERT INTO "order" (buyer_id, store_id, total_price, shipping_address, status, created_at)
                VALUES (:buyer_id, :store_id, :total_price, :shipping_address, :status, CURRENT_TIMESTAMP)
                RETURNING order_id
            ';
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':buyer_id' => $buyer_id,
                ':store_id' => $store_id,
                ':total_price' => $total_price,
                ':shipping_address' => $shipping_address,
                ':status' => 'WAITING_APPROVAL'
            ]);

            $result = $statement->fetch(PDO::FETCH_ASSOC);
            $order_id = $result['order_id'];

            $this->db->commit();
            return $order_id;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Add an item to an order
     */
    public function addOrderItem($order_id, $product_id, $quantity, $price_at_purchase) {
        try {
            // Validate inputs
            if (!$order_id || !$product_id || !$quantity || !isset($price_at_purchase)) {
                throw new Exception('Invalid order item data');
            }

            if ($quantity <= 0) {
                throw new Exception('Quantity must be greater than 0');
            }

            if ($price_at_purchase < 0) {
                throw new Exception('Price cannot be negative');
            }

            // Calculate subtotal
            $subtotal = $quantity * $price_at_purchase;

            $query = '
                INSERT INTO order_item (order_id, product_id, quantity, price_at_purchase, subtotal)
                VALUES (:order_id, :product_id, :quantity, :price_at_purchase, :subtotal)
            ';
            $statement = $this->db->prepare($query);
            return $statement->execute([
                ':order_id' => $order_id,
                ':product_id' => $product_id,
                ':quantity' => $quantity,
                ':price_at_purchase' => $price_at_purchase,
                ':subtotal' => $subtotal
            ]);
        } catch (Exception $e) {
            throw $e;
        }
    }

    /**
     * Get a single order with all details and items
     */
    public function getOrderById($order_id) {
        $query = '
            SELECT 
                o.order_id,
                o.buyer_id,
                o.store_id,
                o.total_price,
                o.shipping_address,
                o.status,
                o.confirmed_at,
                o.reject_reason,
                o.delivery_time,
                o.received_at,
                o.created_at,
                u.name as buyer_name,
                u.email as buyer_email,
                s.store_name,
                s.user_id as seller_id
            FROM "order" o
            LEFT JOIN "user" u ON o.buyer_id = u.user_id
            LEFT JOIN store s ON o.store_id = s.store_id
            WHERE o.order_id = :order_id
        ';
        $statement = $this->db->prepare($query);
        $statement->execute([':order_id' => $order_id]);
        $order = $statement->fetch(PDO::FETCH_ASSOC);

        if ($order) {
            // Get order items
            $itemsQuery = '
                SELECT 
                    oi.order_item_id,
                    oi.product_id,
                    oi.quantity,
                    oi.price_at_purchase,
                    oi.subtotal,
                    p.product_name,
                    p.main_image_path
                FROM order_item oi
                LEFT JOIN product p ON oi.product_id = p.product_id
                WHERE oi.order_id = :order_id
            ';
            $itemsStatement = $this->db->prepare($itemsQuery);
            $itemsStatement->execute([':order_id' => $order_id]);
            $order['items'] = $itemsStatement->fetchAll(PDO::FETCH_ASSOC);
        }

        return $order;
    }

    /**
     * Get orders by store with filtering, searching, and pagination
     */
    public function getOrdersByStore($store_id, $status = null, $search = null, $page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        
        $query = '
            SELECT 
                o.order_id,
                o.buyer_id,
                o.store_id,
                o.total_price,
                o.shipping_address,
                o.status,
                o.confirmed_at,
                o.reject_reason,
                o.created_at,
                u.name as buyer_name,
                u.email as buyer_email,
                COUNT(*) OVER() as total_count
            FROM "order" o
            LEFT JOIN "user" u ON o.buyer_id = u.user_id
            WHERE o.store_id = :store_id
        ';

        $params = [':store_id' => $store_id];

        if (!empty($status) && $status !== 'all') {
            $query .= ' AND o.status = :status';
            $params[':status'] = $status;
        }

        if (!empty($search)) {
            $query .= ' AND (CAST(o.order_id AS TEXT) ILIKE :search OR u.name ILIKE :search)';
            $params[':search'] = '%' . $search . '%';
        }

        $query .= ' ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset';

        $statement = $this->db->prepare($query);
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        foreach ($params as $key => $value) {
            $statement->bindValue($key, $value);
        }

        $statement->execute();
        $results = $statement->fetchAll(PDO::FETCH_ASSOC);

        $total = 0;
        if (count($results) > 0) {
            $total = $results[0]['total_count'];
        }

        // Fetch items for each order
        foreach ($results as &$order) {
            $itemsQuery = '
                SELECT 
                    oi.order_item_id,
                    oi.product_id,
                    oi.quantity,
                    oi.price_at_purchase,
                    oi.subtotal,
                    p.product_name,
                    p.main_image_path
                FROM order_item oi
                LEFT JOIN product p ON oi.product_id = p.product_id
                WHERE oi.order_id = :order_id
            ';
            $itemsStatement = $this->db->prepare($itemsQuery);
            $itemsStatement->execute([':order_id' => $order['order_id']]);
            $order['items'] = $itemsStatement->fetchAll(PDO::FETCH_ASSOC);
        }

        return [
            'orders' => $results,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ];
    }

    /**
     * Generic status update
     */
    public function updateStatus($order_id, $status, $confirmed_at = null) {
        $query = '
            UPDATE "order" 
            SET status = :status, confirmed_at = :confirmed_at
            WHERE order_id = :order_id
            RETURNING *
        ';
        $statement = $this->db->prepare($query);
        $statement->execute([
            ':order_id' => $order_id,
            ':status' => $status,
            ':confirmed_at' => $confirmed_at
        ]);
        return $statement->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Approve an order (WAITING_APPROVAL → APPROVED)
     */
    public function approve($order_id) {
        try {
            $this->db->beginTransaction();

            // Update order status
            $query = '
                UPDATE "order" 
                SET status = :status, confirmed_at = CURRENT_TIMESTAMP
                WHERE order_id = :order_id
                RETURNING *
            ';
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':order_id' => $order_id,
                ':status' => 'APPROVED'
            ]);
            $result = $statement->fetch(PDO::FETCH_ASSOC);

            $this->db->commit();
            return $result;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Reject an order and refund buyer (WAITING_APPROVAL → REJECTED)
     */
    public function reject($order_id, $reject_reason) {
        try {
            $this->db->beginTransaction();

            // Get order details
            $order = $this->getOrderById($order_id);
            if (!$order) {
                throw new Exception('Order not found');
            }

            // Update order status with reject reason
            $query = '
                UPDATE "order" 
                SET status = :status, reject_reason = :reject_reason
                WHERE order_id = :order_id
            ';
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':order_id' => $order_id,
                ':status' => 'REJECTED',
                ':reject_reason' => $reject_reason
            ]);

            // Refund buyer balance
            $queryRefund = '
                UPDATE "user" 
                SET balance = balance + :amount
                WHERE user_id = :buyer_id
            ';
            $statementRefund = $this->db->prepare($queryRefund);
            $statementRefund->execute([
                ':amount' => $order['total_price'],
                ':buyer_id' => $order['buyer_id']
            ]);

            $update_stock_sql = "UPDATE product SET stock = stock + :quantity WHERE product_id = :product_id";
            $update_stock_stmt = $this->db->prepare($update_stock_sql);

            foreach ($order['items'] as $item) {
                // Hanya kembalikan stok jika produk masih ada (belum dihapus permanen)
                if (!empty($item['product_id'])) { 
                    $update_stock_stmt->execute([
                        ':quantity' => $item['quantity'],
                        ':product_id' => $item['product_id']
                    ]);
                }
            }

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Set delivery time for order (APPROVED → ON_DELIVERY)
     */
    public function setDeliveryTime($order_id, $delivery_time) {
        try {
            $this->db->beginTransaction();

            $query = '
                UPDATE "order" 
                SET status = :status, delivery_time = :delivery_time
                WHERE order_id = :order_id
                RETURNING *
            ';
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':order_id' => $order_id,
                ':status' => 'ON_DELIVERY',
                ':delivery_time' => $delivery_time
            ]);
            $result = $statement->fetch(PDO::FETCH_ASSOC);

            $this->db->commit();
            return $result;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Mark order as received and add balance to store (ON_DELIVERY → RECEIVED)
     */
    public function markReceived($order_id, $store_id, $total_price) {
        try {
            // 1. Ambil detail pesanan yang tepercaya dari DB
            $queryGet = '
                SELECT store_id, total_price, status, delivery_time, buyer_id
                FROM "order"
                WHERE order_id = :order_id
            ';
            $stmtGet = $this->db->prepare($queryGet);
            $stmtGet->execute([':order_id' => $order_id]);
            $order = $stmtGet->fetch(PDO::FETCH_ASSOC);

            if (!$order) {
                throw new Exception('Order not found.');
            }

            // 2. Validasi Otorisasi
            if ($order['buyer_id'] != $buyer_id) {
                throw new Exception('You are not authorized to confirm this order.');
            }

            // 3. Validasi Status
            if ($order['status'] !== 'ON_DELIVERY') {
                throw new Exception('Order cannot be marked as received. It is not currently on delivery.');
            }

            if ($order['delivery_time'] !== null) {
                $deliveryTime = new DateTime($order['delivery_time']);
                $now = new DateTime();

                if ($now < $deliveryTime) {
                    throw new Exception('Cannot confirm receipt. The estimated delivery time has not passed yet.');
                }
            } else {
                // Jika karena suatu alasan delivery_time-nya NULL, gagalkan.
                throw new Exception('Order does not have a valid delivery time.');
            }
            
            $this->db->beginTransaction();

            // Update order status
            $query = '
                UPDATE "order" 
                SET status = :status, received_at = CURRENT_TIMESTAMP
                WHERE order_id = :order_id
            ';
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':order_id' => $order_id,
                ':status' => 'RECEIVED'
            ]);

            // Add balance to store
            $queryBalance = '
                UPDATE store 
                SET balance = balance + :amount
                WHERE store_id = :store_id
            ';
            $statementBalance = $this->db->prepare($queryBalance);
            $statementBalance->execute([
                ':amount' => $total_price,
                ':store_id' => $store_id
            ]);

            $this->db->commit();
            return true;
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Get order count grouped by status for a store
     */
    public function getOrderCountByStatus($store_id) {
        $query = '
            SELECT 
                status,
                COUNT(*) as count
            FROM "order"
            WHERE store_id = :store_id
            GROUP BY status
        ';
        $statement = $this->db->prepare($query);
        $statement->execute([':store_id' => $store_id]);
        $results = $statement->fetchAll(PDO::FETCH_ASSOC);

        // Initialize all statuses with 0
        $counts = [
            'WAITING_APPROVAL' => 0,
            'APPROVED' => 0,
            'ON_DELIVERY' => 0,
            'RECEIVED' => 0,
            'REJECTED' => 0
        ];

        // Update with actual counts
        foreach ($results as $row) {
            $counts[$row['status']] = $row['count'];
        }

        return $counts;
    }

    /**
     * Get orders by buyer with filtering and pagination
     */
    public function getOrdersByBuyer($buyer_id, $status = null, $page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;
        
        $query = '
            SELECT 
                o.order_id,
                o.buyer_id,
                o.store_id,
                o.total_price,
                o.shipping_address,
                o.status,
                o.confirmed_at,
                o.reject_reason,
                o.delivery_time,
                o.received_at,
                o.created_at,
                s.store_name,
                COUNT(*) OVER() as total_count
            FROM "order" o
            LEFT JOIN store s ON o.store_id = s.store_id
            WHERE o.buyer_id = :buyer_id
        ';

        $params = [':buyer_id' => $buyer_id];

        if (!empty($status) && $status !== 'all') {
            $query .= ' AND o.status = :status';
            $params[':status'] = $status;
        }

        $query .= ' ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset';

        $statement = $this->db->prepare($query);
        $statement->bindValue(':limit', $limit, PDO::PARAM_INT);
        $statement->bindValue(':offset', $offset, PDO::PARAM_INT);
        
        foreach ($params as $key => $value) {
            $statement->bindValue($key, $value);
        }

        $statement->execute();
        $results = $statement->fetchAll(PDO::FETCH_ASSOC);

        $total = 0;
        if (count($results) > 0) {
            $total = $results[0]['total_count'];
        }

        // Fetch items for each order
        foreach ($results as &$order) {
            $itemsQuery = '
                SELECT 
                    oi.order_item_id,
                    oi.product_id,
                    oi.quantity,
                    oi.price_at_purchase,
                    oi.subtotal,
                    p.product_name,
                    p.main_image_path
                FROM order_item oi
                LEFT JOIN product p ON oi.product_id = p.product_id
                WHERE oi.order_id = :order_id
            ';
            $itemsStatement = $this->db->prepare($itemsQuery);
            $itemsStatement->execute([':order_id' => $order['order_id']]);
            $order['items'] = $itemsStatement->fetchAll(PDO::FETCH_ASSOC);
        }

        return [
            'orders' => $results,
            'total' => $total,
            'page' => $page,
            'limit' => $limit,
            'total_pages' => ceil($total / $limit)
        ];
    }

    /**
     * Get order count grouped by status for a buyer
     */
    public function getOrderCountByStatusForBuyer($buyer_id) {
        $query = '
            SELECT 
                status,
                COUNT(*) as count
            FROM "order"
            WHERE buyer_id = :buyer_id
            GROUP BY status
        ';
        $statement = $this->db->prepare($query);
        $statement->execute([':buyer_id' => $buyer_id]);
        $results = $statement->fetchAll(PDO::FETCH_ASSOC);

        // Initialize all statuses with 0
        $counts = [
            'WAITING_APPROVAL' => 0,
            'APPROVED' => 0,
            'ON_DELIVERY' => 0,
            'RECEIVED' => 0,
            'REJECTED' => 0
        ];

        // Update with actual counts
        foreach ($results as $row) {
            $counts[$row['status']] = $row['count'];
        }

        return $counts;
    }
    /**
     * Checkout logic
     */
    public function checkout($buyer_id, $shipping_address, $cartItems) {
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
