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
    public static function validateRegister($email, $password, $password_confirm, $name, $address, $role) {
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

        if (empty($role) || !in_array($role, ['BUYER', 'SELLER'])) {
            $validator->addError('role', 'Invalid role selected');
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
}
?>
