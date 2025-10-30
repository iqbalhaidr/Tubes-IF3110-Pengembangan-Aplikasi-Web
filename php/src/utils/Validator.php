<?php

class Validator {
    private $errors = [];

    /**
     * Validate email format
     */
    public static function isValidEmail($email) {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate password strength
     * Requirements: Minimal 8 karakter, huruf besar, huruf kecil, angka, dan simbol
     */
    public static function isValidPassword($password) {
        return strlen($password) >= 8 && 
               preg_match('/[A-Z]/', $password) &&      // Uppercase letter
               preg_match('/[a-z]/', $password) &&      // Lowercase letter
               preg_match('/[0-9]/', $password) &&      // Number
               preg_match('/[^A-Za-z0-9]/', $password); // Symbol (any non-alphanumeric)
    }

    /**
     * Validate name (not empty, min 2 chars)
     */
    public static function isValidName($name) {
        return strlen(trim($name)) >= 2;
    }

    /**
     * Validate address
     */
    public static function isValidAddress($address) {
        return strlen(trim($address)) >= 5;
    }

    /**
     * Start validation chain
     */
    public function __construct() {
        $this->errors = [];
    }

    /**
     * Add error
     */
    public function addError($field, $message) {
        $this->errors[$field] = $message;
        return $this;
    }

    /**
     * Get all errors
     */
    public function getErrors() {
        return $this->errors;
    }

    /**
     * Check if has errors
     */
    public function hasErrors() {
        return count($this->errors) > 0;
    }

    /**
     * Validate registration input
     */
    public static function isValidStoreName($storeName) {
        $trimmed = trim($storeName);
        $length = strlen($trimmed);
        return $length >= 2 && $length <= 100;
    }

    public static function isValidStoreDescription($description) {
        $plainText = trim(strip_tags($description));
        return strlen($plainText) >= 5;
    }

    private static function validateRegisterCommon($email, $password, $password_confirm, $name, $address) {
        $validator = new self();

        if (empty($email) || !self::isValidEmail($email)) {
            $validator->addError('email', 'Please enter a valid email address');
        }

        if (empty($password)) {
            $validator->addError('password', 'Password is required');
        } elseif (!self::isValidPassword($password)) {
            $validator->addError('password', 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol');
        }

        if ($password !== $password_confirm) {
            $validator->addError('password_confirm', 'Passwords do not match');
        }

        if (empty($name) || !self::isValidName($name)) {
            $validator->addError('name', 'Please enter a valid name (at least 2 characters)');
        }

        if (empty($address) || !self::isValidAddress($address)) {
            $validator->addError('address', 'Please enter a valid address (at least 5 characters)');
        }

        return $validator;
    }

    public static function validateRegisterBuyer($email, $password, $password_confirm, $name, $address) {
        return self::validateRegisterCommon($email, $password, $password_confirm, $name, $address);
    }

    public static function validateRegisterSeller($email, $password, $password_confirm, $name, $address, $storeName, $storeDescription, $storeLogo = null) {
        $validator = self::validateRegisterCommon($email, $password, $password_confirm, $name, $address);

        if (empty($storeName) || !self::isValidStoreName($storeName)) {
            $validator->addError('store_name', 'Store name must be between 2 and 100 characters');
        }

        if (empty($storeDescription) || !self::isValidStoreDescription($storeDescription)) {
            $validator->addError('store_description', 'Store description must be at least 5 characters');
        }

        $logoError = self::validateStoreLogo($storeLogo);
        if ($logoError !== null) {
            $validator->addError('store_logo', $logoError);
        }

        return $validator;
    }

    /**
     * Validate login input
     */
    public static function validateLogin($email, $password) {
        $validator = new self();

        if (empty($email)) {
            $validator->addError('email', 'Email is required');
        }

        if (empty($password)) {
            $validator->addError('password', 'Password is required');
        }

        return $validator;
    }

    private static function validateStoreLogo($storeLogo) {
        if ($storeLogo === null) {
            return 'Store logo is required';
        }

        if (!isset($storeLogo['error'])) {
            return 'Invalid store logo upload data';
        }

        if ($storeLogo['error'] === UPLOAD_ERR_NO_FILE) {
            return 'Store logo is required';
        }

        if ($storeLogo['error'] !== UPLOAD_ERR_OK) {
            return 'Failed to upload store logo';
        }

        if (!isset($storeLogo['tmp_name']) || !is_uploaded_file($storeLogo['tmp_name'])) {
            return 'Invalid store logo upload';
        }

        $maxSize = 2 * 1024 * 1024; // 2MB
        if (isset($storeLogo['size']) && $storeLogo['size'] > $maxSize) {
            return 'Store logo must be 2MB or smaller';
        }

        $allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];

        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo === false) {
                return 'Unable to validate store logo file';
            }

            $mimeType = finfo_file($finfo, $storeLogo['tmp_name']);
            finfo_close($finfo);

            if (!in_array($mimeType, $allowedMimeTypes, true)) {
                return 'Store logo must be a PNG, JPG, or WEBP image';
            }
        } else {
            $extension = strtolower(pathinfo($storeLogo['name'] ?? '', PATHINFO_EXTENSION));
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];
            if (!in_array($extension, $allowedExtensions, true)) {
                return 'Store logo must be a PNG, JPG, or WEBP image';
            }
        }

        return null;
    }
}
?>
