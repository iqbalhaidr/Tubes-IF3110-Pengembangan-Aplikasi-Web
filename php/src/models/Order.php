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
                INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, subtotal)
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
                FROM order_items oi
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
                FROM order_items oi
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
}
