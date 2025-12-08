<?php

require_once __DIR__ . '/../utils/Database.php';

class PushSubscription {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    public function saveSubscription($userId, $endpoint, $p256dh, $auth) {
        // INSERT ... ON CONFLICT to avoid duplicate endpoints for the same user
        $query = "
            INSERT INTO push_subscriptions (user_id, endpoint, p256dh_key, auth_key)
            VALUES (:user_id, :endpoint, :p256dh, :auth)
            ON CONFLICT (endpoint) DO UPDATE SET
                p256dh_key = EXCLUDED.p256dh_key,
                auth_key = EXCLUDED.auth_key;
        ";

        try {
            $stmt = $this->db->prepare($query);
            return $stmt->execute([
                ':user_id' => $userId,
                ':endpoint' => $endpoint,
                ':p256dh' => $p256dh,
                ':auth' => $auth
            ]);
        } catch (PDOException $e) {
            error_log("PushSubscription Error: " . $e->getMessage());
            return false;
        }
    }
}
