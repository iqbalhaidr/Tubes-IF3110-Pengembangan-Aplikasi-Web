<?php

class User {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
    }

    /**
     * Register buyer
     */
    public function registerBuyer($email, $password, $name, $address = '') {
        $createResult = $this->createUser($email, $password, $name, 'BUYER', $address);

        if (!$createResult['success']) {
            return $createResult;
        }

        return ['success' => true, 'user' => $createResult['user']];
    }

    /**
     * Register seller along with store
     */
    public function registerSeller($email, $password, $name, $address, $storeName, $storeDescription, $storeLogoPath = null) {
        $storeCheck = pg_query_params(
            $this->db,
            'SELECT store_id FROM store WHERE store_name = $1',
            array($storeName)
        );

        if ($storeCheck && pg_num_rows($storeCheck) > 0) {
            return [
                'success' => false,
                'message' => 'Store name already exists',
                'field' => 'store_name'
            ];
        }

        pg_query($this->db, 'BEGIN');

        try {
            $createResult = $this->createUser($email, $password, $name, 'SELLER', $address);

            if (!$createResult['success']) {
                throw new Exception($createResult['message']);
            }

            $user = $createResult['user'];

            $storeModel = new Store();
            $storeResult = $storeModel->create($user['user_id'], $storeName, $storeDescription ?? '', $storeLogoPath);

            if (!$storeResult['success']) {
                throw new Exception($storeResult['message']);
            }

            pg_query($this->db, 'COMMIT');

            return ['success' => true, 'user' => $user];
        } catch (Exception $e) {
            pg_query($this->db, 'ROLLBACK');
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    private function createUser($email, $password, $name, $role, $address = '') {
        $password_hash = password_hash($password, PASSWORD_BCRYPT);

        $query = 'INSERT INTO "user" (email, password_hash, name, role, address)
                  VALUES ($1, $2, $3, $4, $5)
                  RETURNING user_id, email, name, role, address, balance';
        $result = pg_query_params($this->db, $query, array($email, $password_hash, $name, $role, $address));

        if (!$result) {
            return ['success' => false, 'message' => 'Registration failed: ' . pg_last_error($this->db)];
        }

        $user = pg_fetch_assoc($result);
        return ['success' => true, 'user' => $user];
    }

    /**
     * Login user
     */
    public function login($email, $password) {
        $query = 'SELECT user_id, email, name, role, password_hash FROM "user" WHERE email = $1';
        $result = pg_query_params($this->db, $query, array($email));

        if (pg_num_rows($result) === 0) {
            return ['success' => false, 'message' => 'Email not found'];
        }

        $user = pg_fetch_assoc($result);

        // Verify password
        if (!password_verify($password, $user['password_hash'])) {
            return ['success' => false, 'message' => 'Invalid password'];
        }

        // Remove password hash from result
        unset($user['password_hash']);

        return ['success' => true, 'user' => $user];
    }

    /**
     * Get user by ID
     */
    public function getUserById($user_id) {
        $query = 'SELECT user_id, email, name, role, balance, address, created_at, updated_at FROM "user" WHERE user_id = $1';
        $result = pg_query_params($this->db, $query, array($user_id));

        if (pg_num_rows($result) === 0) {
            return null;
        }

        return pg_fetch_assoc($result);
    }

    /**
     * Update user profile
     */
    public function updateProfile($user_id, $name, $address) {
        $query = 'UPDATE "user" SET name = $1, address = $2, updated_at = CURRENT_TIMESTAMP 
                  WHERE user_id = $3 RETURNING user_id, email, name, role, balance, address';
        $result = pg_query_params($this->db, $query, array($name, $address, $user_id));

        if (!$result) {
            return ['success' => false, 'message' => 'Update failed: ' . pg_last_error($this->db)];
        }

        $user = pg_fetch_assoc($result);
        return ['success' => true, 'user' => $user];
    }

    /**
     * Change password
     */
    public function changePassword($user_id, $old_password, $new_password) {
        // Get user
        $user = $this->getUserById($user_id);
        if (!$user) {
            return ['success' => false, 'message' => 'User not found'];
        }

        // Verify old password
        $query = 'SELECT password_hash FROM "user" WHERE user_id = $1';
        $result = pg_query_params($this->db, $query, array($user_id));
        $user_data = pg_fetch_assoc($result);

        if (!password_verify($old_password, $user_data['password_hash'])) {
            return ['success' => false, 'message' => 'Current password is incorrect'];
        }

        // Hash new password
        $password_hash = password_hash($new_password, PASSWORD_BCRYPT);

        // Update password
        $query = 'UPDATE "user" SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2';
        $result = pg_query_params($this->db, $query, array($password_hash, $user_id));

        if (!$result) {
            return ['success' => false, 'message' => 'Password change failed: ' . pg_last_error($this->db)];
        }

        return ['success' => true, 'message' => 'Password changed successfully'];
    }

    /**
     * Check if email exists
     */
    public function emailExists($email) {
        $query = 'SELECT user_id FROM "user" WHERE email = $1';
        $result = pg_query_params($this->db, $query, array($email));
        return pg_num_rows($result) > 0;
    }
}
?>
