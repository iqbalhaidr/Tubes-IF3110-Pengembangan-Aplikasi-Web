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
        try {
            $storeCheckStatement = $this->db->prepare('SELECT store_id FROM store WHERE store_name = :store_name');
            $storeCheckStatement->execute([':store_name' => $storeName]);

            if ($storeCheckStatement->fetch()) {
                return [
                    'success' => false,
                    'message' => 'Store name already exists',
                    'field' => 'store_name'
                ];
            }

            $this->db->beginTransaction();

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

            $this->db->commit();

            return ['success' => true, 'user' => $user];
        } catch (Exception $e) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            return ['success' => false, 'message' => $e->getMessage()];
        }
    }

    public function topUpBalance($userId, $amount) {
        if ($amount <= 0) {
            return [
                'success' => false,
                'message' => 'Amount must be greater than zero.'
            ];
        }

        try {
            $this->db->beginTransaction();

            $statement = $this->db->prepare('UPDATE "user"
                SET balance = COALESCE(balance, 0) + :amount,
                    updated_at = CURRENT_TIMESTAMP
                WHERE user_id = :user_id
                RETURNING user_id, balance');

            $statement->execute([
                ':amount' => $amount,
                ':user_id' => $userId,
            ]);

            $result = $statement->fetch();

            if (!$result) {
                $this->db->rollBack();
                return [
                    'success' => false,
                    'message' => 'User not found.'
                ];
            }

            $this->db->commit();

            return [
                'success' => true,
                'balance' => (int) $result['balance'],
            ];
        } catch (PDOException $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }

            return [
                'success' => false,
                'message' => 'Failed to update balance: ' . $exception->getMessage(),
            ];
        }
    }

    private function createUser($email, $password, $name, $role, $address = '') {
        $password_hash = password_hash($password, PASSWORD_BCRYPT);

        $query = 'INSERT INTO "user" (email, password_hash, name, role, address)
                  VALUES (:email, :password_hash, :name, :role, :address)
                  RETURNING user_id, email, name, role, address, balance';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':email' => $email,
                ':password_hash' => $password_hash,
                ':name' => $name,
                ':role' => $role,
                ':address' => $address,
            ]);

            $user = $statement->fetch();

            if (!$user) {
                return ['success' => false, 'message' => 'Registration failed: unable to fetch user'];
            }

            // Ensure balance is an integer
            $user['balance'] = isset($user['balance']) ? (int)$user['balance'] : 0;

            return ['success' => true, 'user' => $user];
        } catch (PDOException $exception) {
            return ['success' => false, 'message' => 'Registration failed: ' . $exception->getMessage()];
        }
    }

    /**
     * Login user
     */
    public function login($email, $password) {
        $query = 'SELECT user_id, email, name, role, balance, password_hash FROM "user" WHERE email = :email';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([':email' => $email]);

            $user = $statement->fetch();

            if (!$user) {
                return ['success' => false, 'message' => 'Email not found'];
            }

            if (!password_verify($password, $user['password_hash'])) {
                return ['success' => false, 'message' => 'Invalid password'];
            }

            unset($user['password_hash']);
            
            // Ensure balance is an integer
            $user['balance'] = isset($user['balance']) ? (int)$user['balance'] : 0;

            return ['success' => true, 'user' => $user];
        } catch (PDOException $exception) {
            return ['success' => false, 'message' => 'Login failed: ' . $exception->getMessage()];
        }
    }

    /**
     * Get user by ID
     */
    public function getUserById($user_id) {
        $query = 'SELECT user_id, email, name, role, balance, address, created_at, updated_at FROM "user" WHERE user_id = :user_id';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([':user_id' => $user_id]);
            $user = $statement->fetch();
            
            if ($user) {
                // Ensure balance is an integer
                $user['balance'] = isset($user['balance']) ? (int)$user['balance'] : 0;
            }
            
            return $user ?: null;
        } catch (PDOException $exception) {
            return null;
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile($user_id, $name, $address) {
        $query = 'UPDATE "user" SET name = :name, address = :address, updated_at = CURRENT_TIMESTAMP 
                  WHERE user_id = :user_id RETURNING user_id, email, name, role, balance, address';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':name' => $name,
                ':address' => $address,
                ':user_id' => $user_id,
            ]);

            $user = $statement->fetch();

            if (!$user) {
                return ['success' => false, 'message' => 'Update failed: unable to fetch user'];
            }

            return ['success' => true, 'user' => $user];
        } catch (PDOException $exception) {
            return ['success' => false, 'message' => 'Update failed: ' . $exception->getMessage()];
        }
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
        $query = 'SELECT password_hash FROM "user" WHERE user_id = :user_id';
        $statement = $this->db->prepare($query);
        $statement->execute([':user_id' => $user_id]);
        $user_data = $statement->fetch();

        if (!$user_data || !password_verify($old_password, $user_data['password_hash'])) {
            return ['success' => false, 'message' => 'Current password is incorrect'];
        }

        // Hash new password
        $password_hash = password_hash($new_password, PASSWORD_BCRYPT);

        // Update password
        $query = 'UPDATE "user" SET password_hash = :password_hash, updated_at = CURRENT_TIMESTAMP WHERE user_id = :user_id';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([
                ':password_hash' => $password_hash,
                ':user_id' => $user_id,
            ]);

            return ['success' => true, 'message' => 'Password changed successfully'];
        } catch (PDOException $exception) {
            return ['success' => false, 'message' => 'Password change failed: ' . $exception->getMessage()];
        }
    }

    /**
     * Check if email exists
     */
    public function emailExists($email) {
        $query = 'SELECT user_id FROM "user" WHERE email = :email';

        try {
            $statement = $this->db->prepare($query);
            $statement->execute([':email' => $email]);
            return (bool) $statement->fetchColumn();
        } catch (PDOException $exception) {
            return false;
        }
    }

    public function getPushPreferences($user_id) {
        $query = 'SELECT chat_enabled, auction_enabled, order_enabled FROM push_preferences WHERE user_id = :user_id';
        try {
            $statement = $this->db->prepare($query);
            $statement->execute([':user_id' => $user_id]);
            $prefs = $statement->fetch(PDO::FETCH_ASSOC);

            // Return defaults if no preferences are set yet
            if (!$prefs) {
                return [
                    'chat_enabled' => true,
                    'auction_enabled' => true,
                    'order_enabled' => true
                ];
            }
            // Cast to boolean
            return [
                'chat_enabled' => (bool)$prefs['chat_enabled'],
                'auction_enabled' => (bool)$prefs['auction_enabled'],
                'order_enabled' => (bool)$prefs['order_enabled']
            ];
        } catch (PDOException $exception) {
            // On error, return default enabled state
            return [
                'chat_enabled' => true,
                'auction_enabled' => true,
                'order_enabled' => true
            ];
        }
    }

    /**
     * Update user's push notification preferences
     */
    public function updatePushPreferences($user_id, $prefs) {
        $chat_enabled = (bool)($prefs['chat_enabled'] ?? false);
        $auction_enabled = (bool)($prefs['auction_enabled'] ?? false);
        $order_enabled = (bool)($prefs['order_enabled'] ?? false);

        try {
            $this->db->beginTransaction();

            // Check if a preference row already exists for the user
            $select_stmt = $this->db->prepare('SELECT user_id FROM push_preferences WHERE user_id = :user_id');
            $select_stmt->execute([':user_id' => $user_id]);
            $exists = $select_stmt->fetchColumn();

            if ($exists) {
                // If it exists, UPDATE it
                $query = 'UPDATE push_preferences SET
                              chat_enabled = :chat_enabled,
                              auction_enabled = :auction_enabled,
                              order_enabled = :order_enabled,
                              updated_at = CURRENT_TIMESTAMP
                          WHERE user_id = :user_id';
            } else {
                // If it does not exist, INSERT a new row
                $query = 'INSERT INTO push_preferences (user_id, chat_enabled, auction_enabled, order_enabled)
                          VALUES (:user_id, :chat_enabled, :auction_enabled, :order_enabled)';
            }
            
            $statement = $this->db->prepare($query);
            $statement->bindValue(':user_id', $user_id, PDO::PARAM_INT);
            $statement->bindValue(':chat_enabled', $chat_enabled, PDO::PARAM_BOOL);
            $statement->bindValue(':auction_enabled', $auction_enabled, PDO::PARAM_BOOL);
            $statement->bindValue(':order_enabled', $order_enabled, PDO::PARAM_BOOL);
            $statement->execute();
            
            $this->db->commit();
            return ['success' => true, 'message' => 'Preferences updated successfully'];
        } catch (PDOException $exception) {
            if ($this->db->inTransaction()) {
                $this->db->rollBack();
            }
            return ['success' => false, 'message' => 'Failed to update preferences: ' . $exception->getMessage()];
        }
    }
}
?>
