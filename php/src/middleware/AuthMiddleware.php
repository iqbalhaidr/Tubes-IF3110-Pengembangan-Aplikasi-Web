<?php

class AuthMiddleware {
    /**
     * Start a secure session
     */
    public static function startSession() {
        if (session_status() === PHP_SESSION_NONE) {
            // Get configuration from environment variables
            $httpOnly = filter_var(
                getenv('SESSION_COOKIE_HTTPONLY') ?: 'true',
                FILTER_VALIDATE_BOOLEAN
            );
            $sameSite = getenv('SESSION_COOKIE_SAMESITE') ?: 'Lax';
            $sessionName = getenv('SESSION_NAME') ?: 'NIMONSPEDIA_SESSION';
            
            // Configure session security
            ini_set('session.cookie_httponly', $httpOnly ? 1 : 0);
            ini_set('session.cookie_secure', 0); // Set to 1 in production with HTTPS
            ini_set('session.cookie_samesite', $sameSite);
            ini_set('session.name', $sessionName);
            
            session_start();
        }
    }

    /**
     * Check if user is logged in
     */
    public static function isLoggedIn() {
        self::startSession();
        return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
    }

    /**
     * Get current logged in user
     */
    public static function getCurrentUser() {
        self::startSession();
        if (!self::isLoggedIn()) {
            return null;
        }

        return [
            'user_id' => $_SESSION['user_id'],
            'email' => $_SESSION['email'],
            'name' => $_SESSION['name'],
            'role' => $_SESSION['role'],
            'balance' => isset($_SESSION['balance']) ? (int)$_SESSION['balance'] : 0
        ];
    }

    /**
     * Login user (create session)
     */
    public static function login($user) {
        self::startSession();
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['balance'] = isset($user['balance']) ? (int)$user['balance'] : 0;
        
        // Get session lifetime from environment (default 24 hours)
        $sessionLifetime = intval(getenv('SESSION_LIFETIME') ?: 86400);
        $_SESSION['expires_at'] = time() + $sessionLifetime;
    }

    /**
     * Logout user (destroy session)
     */
    public static function logout() {
        self::startSession();
        session_destroy();
    }

    /**
     * Require login, redirect if not authenticated
     */
    public static function requireLogin($redirect_url = '/auth/login') {
        if (!self::isLoggedIn()) {
            Response::redirect($redirect_url);
        }
    }

    /**
     * Require specific role
     */
    public static function requireRole($role, $redirect_url = '/') {
        self::startSession();
        if (!self::isLoggedIn() || $_SESSION['role'] !== $role) {
            Response::redirect($redirect_url);
        }
    }

    /**
     * Require not logged in (for auth pages)
     */
    public static function requireGuest($redirect_url = '/') {
        if (self::isLoggedIn()) {
            Response::redirect($redirect_url);
        }
    }
}
?>
