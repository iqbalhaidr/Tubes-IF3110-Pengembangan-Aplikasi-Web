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
                  VALUES (:user_id, :store_name, :store_description, :store_logo_path)
                  RETURNING store_id, user_id, store_name, store_description, store_logo_path, balance';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':user_id' => $userId,
                ':store_name' => $storeName,
                ':store_description' => $storeDescription,
                ':store_logo_path' => $storeLogoPath,
            ]);

            $store = $statement->fetch();

            if (!$store) {
                return [
                    'success' => false,
                    'message' => 'Store creation failed: unable to fetch new store data'
                ];
            }

            return [
                'success' => true,
                'store' => $store
            ];
        } catch (PDOException $exception) {
            return [
                'success' => false,
                'message' => 'Store creation failed: ' . $exception->getMessage()
            ];
        }
    }

    /**
     * Find store by user id
     */
    public function findBySeller($userId) {
        $query = 'SELECT store_id, user_id, store_name, store_description, store_logo_path, balance, created_at, updated_at
                  FROM store
                  WHERE user_id = :user_id';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([':user_id' => $userId]);
            return $statement->fetch() ?: null;
        } catch (PDOException $exception) {
            return null;
        }
    }

    /**
     * Update store information
     */
    public function update($storeId, $storeName, $storeDescription = '', $storeLogoPath = null) {
        $query = 'UPDATE store
                  SET store_name = :store_name,
                      store_description = :store_description,
                      store_logo_path = COALESCE(:store_logo_path, store_logo_path),
                      updated_at = CURRENT_TIMESTAMP
                  WHERE store_id = :store_id
                  RETURNING store_id, user_id, store_name, store_description, store_logo_path, balance';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':store_id' => $storeId,
                ':store_name' => $storeName,
                ':store_description' => $storeDescription,
                ':store_logo_path' => $storeLogoPath,
            ]);

            $store = $statement->fetch();

            if (!$store) {
                return [
                    'success' => false,
                    'message' => 'Store update failed: unable to fetch updated store data'
                ];
            }

            return [
                'success' => true,
                'store' => $store
            ];
        } catch (PDOException $exception) {
            return [
                'success' => false,
                'message' => 'Store update failed: ' . $exception->getMessage()
            ];
        }
    }

    public function findAll($searchQuery = null) {
        $query = 'SELECT store_id, store_name, store_logo_path FROM store';
        $params = [];

        if ($searchQuery) {
            $query .= ' WHERE store_name ILIKE :search';
            $params[':search'] = '%' . $searchQuery . '%';
        }

        $query .= ' ORDER BY store_name ASC';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute($params);
            return $statement->fetchAll() ?: [];
        } catch (PDOException $exception) {
            return [];
        }
    }
}

?>
