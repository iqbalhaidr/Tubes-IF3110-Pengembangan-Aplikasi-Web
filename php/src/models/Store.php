<?php

class Store {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Create a store for a seller
     */
    public function create($userId, $storeName, $storeDescription = '', $storeLogoPath = null) {
        $query = 'INSERT INTO store (user_id, store_name, store_description, store_logo_path)
                  VALUES ($1, $2, $3, $4)
                  RETURNING store_id, user_id, store_name, store_description, store_logo_path, balance';

        $result = pg_query_params(
            $this->db,
            $query,
            array($userId, $storeName, $storeDescription, $storeLogoPath)
        );

        if (!$result) {
            return [
                'success' => false,
                'message' => 'Store creation failed: ' . pg_last_error($this->db)
            ];
        }

        $store = pg_fetch_assoc($result);
        return [
            'success' => true,
            'store' => $store
        ];
    }

    /**
     * Find store by user id
     */
    public function findBySeller($userId) {
        $query = 'SELECT store_id, user_id, store_name, store_description, store_logo_path, balance, created_at, updated_at
                  FROM store
                  WHERE user_id = $1';
        $result = pg_query_params($this->db, $query, array($userId));

        if (!$result || pg_num_rows($result) === 0) {
            return null;
        }

        return pg_fetch_assoc($result);
    }
}

?>
