<?php

require_once __DIR__ . '/../utils/Database.php';

class Chat {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function findRoomsByUserId($userId, $userRole) {
        $baseQuery = "
            SELECT
                cr.store_id,
                cr.buyer_id,
                cr.last_message_at,
                cr.unread_count,
                s.store_name,
                s.store_logo_path,
                u.name as buyer_name,
                (
                    SELECT cm.content
                    FROM chat_messages cm
                    WHERE cm.store_id = cr.store_id AND cm.buyer_id = cr.buyer_id
                    ORDER BY cm.created_at DESC
                    LIMIT 1
                ) as last_message_preview,
                (
                    SELECT cm.sender_id
                    FROM chat_messages cm
                    WHERE cm.store_id = cr.store_id AND cm.buyer_id = cr.buyer_id
                    ORDER BY cm.created_at DESC
                    LIMIT 1
                ) as last_message_sender_id
            FROM
                chat_room cr
            JOIN
                store s ON cr.store_id = s.store_id
            JOIN
                \"user\" u ON cr.buyer_id = u.user_id
        ";

        $whereClause = "";
        $params = [];

        if ($userRole === 'BUYER') {
            $whereClause = "WHERE cr.buyer_id = :user_id";
            $params[':user_id'] = $userId;
        } elseif ($userRole === 'SELLER') {
            // get the store_id for the seller
            $stmt = $this->db->prepare("SELECT store_id FROM store WHERE user_id = :user_id");
            $stmt->execute([':user_id' => $userId]);
            $store = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($store) {
                $whereClause = "WHERE cr.store_id = :store_id";
                $params[':store_id'] = $store['store_id'];
            } else {
                return [];
            }
        } else {
            return [];
        }
        
        $fullQuery = $baseQuery . $whereClause . " ORDER BY cr.last_message_at DESC";
        
        $stmt = $this->db->prepare($fullQuery);
        $stmt->execute($params);

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function createRoom($buyerId, $storeId) {
        // Check if the room already exists
        $stmt = $this->db->prepare("SELECT * FROM chat_room WHERE buyer_id = :buyer_id AND store_id = :store_id");
        $stmt->execute([':buyer_id' => $buyerId, ':store_id' => $storeId]);
        $existingRoom = $stmt->fetch(PDO::FETCH_ASSOC);

        $created = false;
        if (!$existingRoom) {
            $insertStmt = $this->db->prepare(
                "INSERT INTO chat_room (buyer_id, store_id, last_message_at) VALUES (:buyer_id, :store_id, NOW())"
            );
            $insertStmt->execute([':buyer_id' => $buyerId, ':store_id' => $storeId]);
            $created = true;
        }

        $selectStmt = $this->db->prepare("
            SELECT
                cr.store_id,
                cr.buyer_id,
                cr.last_message_at,
                cr.unread_count,
                s.store_name,
                s.store_logo_path,
                u.name as buyer_name,
                (
                    SELECT cm.content
                    FROM chat_messages cm
                    WHERE cm.store_id = cr.store_id AND cm.buyer_id = cr.buyer_id
                    ORDER BY cm.created_at DESC
                    LIMIT 1
                ) as last_message_preview,
                (
                    SELECT cm.sender_id
                    FROM chat_messages cm
                    WHERE cm.store_id = cr.store_id AND cm.buyer_id = cr.buyer_id
                    ORDER BY cm.created_at DESC
                    LIMIT 1
                ) as last_message_sender_id
            FROM
                chat_room cr
            JOIN
                store s ON cr.store_id = s.store_id
            JOIN
                \"user\" u ON cr.buyer_id = u.user_id
            WHERE cr.buyer_id = :buyer_id AND cr.store_id = :store_id
        ");
        $selectStmt->execute([':buyer_id' => $buyerId, ':store_id' => $storeId]);
        $roomData = $selectStmt->fetch(PDO::FETCH_ASSOC);

        return [
            'created' => $created,
            'room' => $roomData
        ];
    }

    public function canAccessRoom($userId, $userRole, $storeId, $buyerId) {
        if ($userRole === 'BUYER') {
            return $userId == $buyerId;
        } elseif ($userRole === 'SELLER') {
            $stmt = $this->db->prepare("SELECT user_id FROM store WHERE store_id = :store_id");
            $stmt->execute([':store_id' => $storeId]);
            $storeOwner = $stmt->fetch(PDO::FETCH_ASSOC);
            return $storeOwner && $storeOwner['user_id'] == $userId;
        }
        return false;
    }

    public function findMessagesByRoom($storeId, $buyerId, $beforeCursor = null, $limit = 50) {
        $query = "
            SELECT message_id, store_id, buyer_id, sender_id, message_type, content, product_id, is_read, created_at
            FROM chat_messages
            WHERE store_id = :store_id AND buyer_id = :buyer_id
        ";
        $params = [
            ':store_id' => $storeId,
            ':buyer_id' => $buyerId
        ];

        if ($beforeCursor !== null) {
            $query .= " AND message_id < :before_cursor";
            $params[':before_cursor'] = $beforeCursor;
        }

        $query .= " ORDER BY created_at DESC LIMIT :limit";
        $params[':limit'] = $limit;

        $stmt = $this->db->prepare($query);
        // PDO requires integer binding for limit
        $stmt->bindValue(':store_id', $params[':store_id'], PDO::PARAM_INT);
        $stmt->bindValue(':buyer_id', $params[':buyer_id'], PDO::PARAM_INT);
        if ($beforeCursor !== null) {
            $stmt->bindValue(':before_cursor', $params[':before_cursor'], PDO::PARAM_INT);
        }
        $stmt->bindValue(':limit', $params[':limit'], PDO::PARAM_INT);
        
        $stmt->execute();

        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
