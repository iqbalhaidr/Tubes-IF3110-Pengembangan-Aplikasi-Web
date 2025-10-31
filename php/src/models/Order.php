<?php

class Order {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Create a new order
     */
    public function create($buyer_id, $store_id, $total_price, $shipping_address) {
        $query = 'INSERT INTO "order" (buyer_id, store_id, total_price, shipping_address, status, created_at)
                  VALUES (:buyer_id, :store_id, :total_price, :shipping_address, :status, CURRENT_TIMESTAMP)
                  RETURNING order_id, buyer_id, store_id, total_price, shipping_address, status, created_at';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':buyer_id' => $buyer_id,
                ':store_id' => $store_id,
                ':total_price' => $total_price,
                ':shipping_address' => $shipping_address,
                ':status' => 'WAITING_APPROVAL',
            ]);

            $order = $statement->fetch();

            if (!$order) {
                return ['success' => false, 'message' => 'Failed to create order'];
            }

            return ['success' => true, 'order' => $order];
        } catch (PDOException $exception) {
            return ['success' => false, 'message' => 'Failed to create order: ' . $exception->getMessage()];
        }
    }

    /**
     * Add items to order
     */
    public function addOrderItem($order_id, $product_id, $quantity, $price_at_purchase) {
        $subtotal = $quantity * $price_at_purchase;

        $query = 'INSERT INTO order_item (order_id, product_id, quantity, price_at_purchase, subtotal)
                  VALUES (:order_id, :product_id, :quantity, :price_at_purchase, :subtotal)
                  RETURNING order_item_id, order_id, product_id, quantity, price_at_purchase, subtotal';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':order_id' => $order_id,
                ':product_id' => $product_id,
                ':quantity' => $quantity,
                ':price_at_purchase' => $price_at_purchase,
                ':subtotal' => $subtotal,
            ]);

            $order_item = $statement->fetch();

            if (!$order_item) {
                return ['success' => false, 'message' => 'Failed to add order item'];
            }

            return ['success' => true, 'order_item' => $order_item];
        } catch (PDOException $exception) {
            return ['success' => false, 'message' => 'Failed to add order item: ' . $exception->getMessage()];
        }
    }

    /**
     * Get order by ID with items
     */
    public function getOrderById($order_id) {
        $query = 'SELECT 
                    o.order_id,
                    o.buyer_id,
                    o.store_id,
                    o.total_price,
                    o.shipping_address,
                    o.status,
                    o.reject_reason,
                    o.confirmed_at,
                    o.delivery_time,
                    o.received_at,
                    o.created_at,
                    u.name as buyer_name,
                    u.email as buyer_email,
                    u.address as buyer_address
                  FROM "order" o
                  JOIN "user" u ON o.buyer_id = u.user_id
                  WHERE o.order_id = :order_id';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([':order_id' => $order_id]);

            $order = $statement->fetch();

            if (!$order) {
                return null;
            }

            // Fetch order items
            $items_query = 'SELECT 
                              oi.order_item_id,
                              oi.product_id,
                              oi.quantity,
                              oi.price_at_purchase,
                              oi.subtotal,
                              p.product_name,
                              p.main_image_path
                            FROM order_item oi
                            JOIN product p ON oi.product_id = p.product_id
                            WHERE oi.order_id = :order_id';

            $items_statement = $this->db->prepare($items_query);
            $items_statement->execute([':order_id' => $order_id]);
            $order['items'] = $items_statement->fetchAll();

            return $order;
        } catch (PDOException $exception) {
            return null;
        }
    }

    /**
     * Get orders by store with filters and pagination
     */
    public function getOrdersByStore($store_id, $status = null, $search = null, $page = 1, $limit = 10) {
        $offset = ($page - 1) * $limit;

        $query = 'SELECT 
                    o.order_id,
                    o.buyer_id,
                    o.store_id,
                    o.total_price,
                    o.shipping_address,
                    o.status,
                    o.reject_reason,
                    o.confirmed_at,
                    o.delivery_time,
                    o.received_at,
                    o.created_at,
                    u.name as buyer_name,
                    u.email as buyer_email
                  FROM "order" o
                  JOIN "user" u ON o.buyer_id = u.user_id
                  WHERE o.store_id = :store_id';

        $count_query = 'SELECT COUNT(*) as total FROM "order" o
                       JOIN "user" u ON o.buyer_id = u.user_id
                       WHERE o.store_id = :store_id';

        $params = [':store_id' => $store_id];

        // Add status filter
        if ($status !== null) {
            $query .= ' AND o.status = :status';
            $count_query .= ' AND o.status = :status';
            $params[':status'] = $status;
        }

        // Add search filter (order ID or buyer name)
        if ($search !== null && $search !== '') {
            $search_term = '%' . $search . '%';
            $query .= ' AND (CAST(o.order_id AS TEXT) LIKE :search OR u.name ILIKE :search)';
            $count_query .= ' AND (CAST(o.order_id AS TEXT) LIKE :search OR u.name ILIKE :search)';
            $params[':search'] = $search_term;
        }

        $query .= ' ORDER BY o.created_at DESC LIMIT :limit OFFSET :offset';

        try {
            // Get total count
            $count_statement = $this->db->prepare($count_query);
            $count_statement->execute($params);
            $count_result = $count_statement->fetch();
            $total = (int)$count_result['total'];

            // Get paginated results
            $params[':limit'] = $limit;
            $params[':offset'] = $offset;

            $statement = $this->db->prepare($query);
            $statement->execute($params);
            $orders = $statement->fetchAll();

            return [
                'success' => true,
                'orders' => $orders,
                'total' => $total,
                'page' => $page,
                'limit' => $limit,
                'total_pages' => ceil($total / $limit)
            ];
        } catch (PDOException $exception) {
            return [
                'success' => false,
                'message' => 'Failed to fetch orders: ' . $exception->getMessage()
            ];
        }
    }

    /**
     * Update order status
     */
    public function updateStatus($order_id, $status, $confirmed_at = null) {
        $query = 'UPDATE "order" 
                  SET status = :status, confirmed_at = COALESCE(:confirmed_at, confirmed_at), updated_at = CURRENT_TIMESTAMP
                  WHERE order_id = :order_id
                  RETURNING order_id, status, confirmed_at';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':order_id' => $order_id,
                ':status' => $status,
                ':confirmed_at' => $confirmed_at,
            ]);

            $result = $statement->fetch();

            if (!$result) {
                return ['success' => false, 'message' => 'Order not found'];
            }

            return ['success' => true, 'order' => $result];
        } catch (PDOException $exception) {
            return ['success' => false, 'message' => 'Failed to update order: ' . $exception->getMessage()];
        }
    }

    /**
     * Approve order
     */
    public function approve($order_id) {
        return $this->updateStatus($order_id, 'APPROVED', date('Y-m-d H:i:s'));
    }

    /**
     * Reject order with reason
     */
    public function reject($order_id, $reject_reason) {
        $query = 'UPDATE "order" 
                  SET status = :status, reject_reason = :reject_reason, confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                  WHERE order_id = :order_id
                  RETURNING order_id, status, reject_reason, confirmed_at';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':order_id' => $order_id,
                ':status' => 'REJECTED',
                ':reject_reason' => $reject_reason,
            ]);

            $result = $statement->fetch();

            if (!$result) {
                return ['success' => false, 'message' => 'Order not found'];
            }

            return ['success' => true, 'order' => $result];
        } catch (PDOException $exception) {
            return ['success' => false, 'message' => 'Failed to reject order: ' . $exception->getMessage()];
        }
    }

    /**
     * Set delivery time and change status to ON_DELIVERY
     */
    public function setDeliveryTime($order_id, $delivery_time) {
        $query = 'UPDATE "order" 
                  SET status = :status, delivery_time = :delivery_time, updated_at = CURRENT_TIMESTAMP
                  WHERE order_id = :order_id
                  RETURNING order_id, status, delivery_time';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':order_id' => $order_id,
                ':status' => 'ON_DELIVERY',
                ':delivery_time' => $delivery_time,
            ]);

            $result = $statement->fetch();

            if (!$result) {
                return ['success' => false, 'message' => 'Order not found'];
            }

            return ['success' => true, 'order' => $result];
        } catch (PDOException $exception) {
            return ['success' => false, 'message' => 'Failed to set delivery time: ' . $exception->getMessage()];
        }
    }

    /**
     * Mark order as received and add balance to store
     */
    public function markReceived($order_id, $store_id, $total_price) {
        try {
            $this->db->beginTransaction();

            // Update order status
            $order_query = 'UPDATE "order" 
                           SET status = :status, received_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                           WHERE order_id = :order_id
                           RETURNING order_id, status';

            $order_statement = $this->db->prepare($order_query);
            $order_statement->execute([
                ':order_id' => $order_id,
                ':status' => 'RECEIVED',
            ]);

            $order_result = $order_statement->fetch();

            if (!$order_result) {
                $this->db->rollBack();
                return ['success' => false, 'message' => 'Order not found'];
            }

            // Add balance to store
            $store_query = 'UPDATE store 
                           SET balance = balance + :amount, updated_at = CURRENT_TIMESTAMP
                           WHERE store_id = :store_id
                           RETURNING store_id, balance';

            $store_statement = $this->db->prepare($store_query);
            $store_statement->execute([
                ':store_id' => $store_id,
                ':amount' => $total_price,
            ]);

            $store_result = $store_statement->fetch();

            if (!$store_result) {
                $this->db->rollBack();
                return ['success' => false, 'message' => 'Store not found'];
            }

            $this->db->commit();

            return ['success' => true, 'order' => $order_result, 'store' => $store_result];
        } catch (PDOException $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            return ['success' => false, 'message' => 'Failed to mark order as received: ' . $exception->getMessage()];
        }
    }

    /**
     * Get count of orders by status for a store
     */
    public function getOrderCountByStatus($store_id) {
        $query = 'SELECT 
                    status,
                    COUNT(*) as count
                  FROM "order"
                  WHERE store_id = :store_id
                  GROUP BY status';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([':store_id' => $store_id]);
            $results = $statement->fetchAll();

            $counts = [
                'WAITING_APPROVAL' => 0,
                'APPROVED' => 0,
                'ON_DELIVERY' => 0,
                'RECEIVED' => 0,
                'REJECTED' => 0
            ];

            foreach ($results as $result) {
                if (isset($counts[$result['status']])) {
                    $counts[$result['status']] = (int)$result['count'];
                }
            }

            return ['success' => true, 'counts' => $counts];
        } catch (PDOException $exception) {
            return ['success' => false, 'message' => 'Failed to fetch order counts: ' . $exception->getMessage()];
        }
    }
}
?>
