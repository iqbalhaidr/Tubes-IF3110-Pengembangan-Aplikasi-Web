<?php

class AuthMiddleware {
    public static function startSession() {
        if (headers_sent()) {
            return; 
        }

        if (session_status() === PHP_SESSION_NONE) {

            $httpOnly = filter_var(
                getenv('SESSION_COOKIE_HTTPONLY') ?: 'true',
                FILTER_VALIDATE_BOOLEAN
            );
            $sameSite = getenv('SESSION_COOKIE_SAMESITE') ?: 'Lax';
            $sessionName = getenv('SESSION_NAME') ?: 'NIMONSPEDIA_SESSION';
            

            if (!headers_sent()) {
                ini_set('session.cookie_httponly', $httpOnly ? 1 : 0);
                ini_set('session.cookie_secure', 0); 
                ini_set('session.cookie_samesite', $sameSite);
                ini_set('session.name', $sessionName);
                
                session_start();
            }
        }
    }

    public static function isLoggedIn() {
        self::startSession();
        return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
    }

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

    public static function login($user) {
        self::startSession();
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['email'] = $user['email'];
        $_SESSION['name'] = $user['name'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['balance'] = isset($user['balance']) ? (int)$user['balance'] : 0;
        
        // session lifetime default 24 hours
        $sessionLifetime = intval(getenv('SESSION_LIFETIME') ?: 86400);
        $_SESSION['expires_at'] = time() + $sessionLifetime;
    }

    /**
     * Logout user --> destroy session
     */
    public static function logout() {
        self::startSession();
        session_destroy();
    }

    public static function requireLogin($redirect_url = '/auth/login') {
        if (!self::isLoggedIn()) {
            Response::redirect($redirect_url);
        }
    }

    public static function requireRole($role, $redirect_url = '/') {
        self::startSession();
        if (!self::isLoggedIn() || $_SESSION['role'] !== $role) {
            Response::redirect($redirect_url);
        }
    }
    
    public static function requireGuest($redirect_url = '/') {
        if (self::isLoggedIn()) {
            Response::redirect($redirect_url);
        }
    }
}
?>
