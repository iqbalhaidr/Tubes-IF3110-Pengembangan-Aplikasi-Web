<?php

class AuthController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    /**
     * Show login page
     */
    public function showLogin() {
        AuthMiddleware::requireGuest('/');
        require_once __DIR__ . '/../views/auth/login.php';
    }

    /**
     * Show register page
     */
    public function showRegister() {
        AuthMiddleware::requireGuest('/');
        require_once __DIR__ . '/../views/auth/register.php';
    }

    /**
     * Handle login form submission
     */
    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';

        // Validate input
        $validator = Validator::validateLogin($email, $password);
        if ($validator->hasErrors()) {
            Response::error('Validation failed', $validator->getErrors(), 400);
        }

        // Attempt login
        $result = $this->userModel->login($email, $password);

        if (!$result['success']) {
            Response::error($result['message'], null, 401);
        }

        // Create session
        AuthMiddleware::login($result['user']);

        // Redirect based on role
        $redirect_url = $result['user']['role'] === 'SELLER' ? '/seller/dashboard' : '/';
        Response::success('Login successful', ['redirect' => $redirect_url], 200);
    }

    /**
     * Handle register form submission
     */
    public function register() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        $password_confirm = isset($_POST['password_confirm']) ? $_POST['password_confirm'] : '';
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $address = isset($_POST['address']) ? trim($_POST['address']) : '';
        $role = isset($_POST['role']) ? $_POST['role'] : '';

        // Validate input
        $validator = Validator::validateRegister($email, $password, $password_confirm, $name, $address, $role);
        if ($validator->hasErrors()) {
            Response::error('Validation failed', $validator->getErrors(), 400);
        }

        // Check if email already exists
        if ($this->userModel->emailExists($email)) {
            Response::error('Email already registered', ['email' => 'This email is already in use'], 409);
        }

        // Attempt registration
        $result = $this->userModel->register($email, $password, $name, $role, $address);

        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        // Create session
        AuthMiddleware::login($result['user']);

        // Redirect based on role
        $redirect_url = $result['user']['role'] === 'SELLER' ? '/seller/dashboard' : '/';
        Response::success('Registration successful', ['redirect' => $redirect_url], 201);
    }

    /**
     * Handle logout
     */
    public function logout() {
        AuthMiddleware::logout();
        Response::redirect('/');
    }

    /**
     * Get current user info (API endpoint)
     */
    public function getCurrentUser() {
        AuthMiddleware::requireLogin();
        
        $current_user = AuthMiddleware::getCurrentUser();
        $user = $this->userModel->getUserById($current_user['user_id']);

        Response::success('User retrieved', $user, 200);
    }

    /**
     * Update user profile (API endpoint)
     */
    public function updateProfile() {
        AuthMiddleware::requireLogin();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        $current_user = AuthMiddleware::getCurrentUser();
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $address = isset($_POST['address']) ? trim($_POST['address']) : '';

        // Validate input
        if (!Validator::isValidName($name)) {
            Response::error('Validation failed', ['name' => 'Please enter a valid name'], 400);
        }

        if (!Validator::isValidAddress($address)) {
            Response::error('Validation failed', ['address' => 'Please enter a valid address'], 400);
        }

        // Update profile
        $result = $this->userModel->updateProfile($current_user['user_id'], $name, $address);

        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        // Update session
        AuthMiddleware::startSession();
        $_SESSION['name'] = $name;

        Response::success('Profile updated', $result['user'], 200);
    }

    /**
     * Change password (API endpoint)
     */
    public function changePassword() {
        AuthMiddleware::requireLogin();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        $current_user = AuthMiddleware::getCurrentUser();
        $old_password = isset($_POST['old_password']) ? $_POST['old_password'] : '';
        $new_password = isset($_POST['new_password']) ? $_POST['new_password'] : '';
        $new_password_confirm = isset($_POST['new_password_confirm']) ? $_POST['new_password_confirm'] : '';

        // Validate input
        if (empty($old_password)) {
            Response::error('Validation failed', ['old_password' => 'Current password is required'], 400);
        }

        if (empty($new_password) || !Validator::isValidPassword($new_password)) {
            Response::error('Validation failed', ['new_password' => 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol'], 400);
        }

        if ($new_password !== $new_password_confirm) {
            Response::error('Validation failed', ['new_password_confirm' => 'Passwords do not match'], 400);
        }

        // Change password
        $result = $this->userModel->changePassword($current_user['user_id'], $old_password, $new_password);

        if (!$result['success']) {
            Response::error($result['message'], null, 401);
        }

        Response::success('Password changed successfully', null, 200);
    }
}
?>
