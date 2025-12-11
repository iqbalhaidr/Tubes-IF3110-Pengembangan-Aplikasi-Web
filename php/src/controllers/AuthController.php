<?php
require_once __DIR__ . '/../utils/Helper.php';

class AuthController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function showLogin() {
        AuthMiddleware::requireGuest('/');
        require_once __DIR__ . '/../views/auth/login.php';
    }

    public function showRegister() {
        AuthMiddleware::requireGuest('/');
        require_once __DIR__ . '/../views/auth/register.php';
    }

    public function showRegisterBuyer() {
        AuthMiddleware::requireGuest('/');
        Response::redirect('/auth/register?role=buyer');
    }

    public function showRegisterSeller() {
        AuthMiddleware::requireGuest('/');
        Response::redirect('/auth/register?role=seller');
    }

    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';

        $validator = Validator::validateLogin($email, $password);
        if ($validator->hasErrors()) {
            Response::error('Validation failed', $validator->getErrors(), 400);
        }

        $result = $this->userModel->login($email, $password);

        if (!$result['success']) {
            Response::error($result['message'], null, 401);
        }

        AuthMiddleware::login($result['user']);

        $redirect_url = $result['user']['role'] === 'SELLER' ? '/seller/dashboard' : '/home';
        Response::success('Login successful', ['redirect' => $redirect_url], 200);
    }

    public function registerBuyer() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        $password_confirm = isset($_POST['password_confirm']) ? $_POST['password_confirm'] : '';
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $address = isset($_POST['address']) ? trim($_POST['address']) : '';

        $validator = Validator::validateRegisterBuyer(
            $email,
            $password,
            $password_confirm,
            $name,
            $address
        );
        if ($validator->hasErrors()) {
            Response::error('Validation failed', $validator->getErrors(), 400);
        }


        if ($this->userModel->emailExists($email)) {
            Response::error('Email already registered', ['email' => 'This email is already in use'], 409);
        }


        $result = $this->userModel->registerBuyer($email, $password, $name, $address);

        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }


        AuthMiddleware::login($result['user']);

        Response::success('Registration successful', ['redirect' => '/home'], 201);
    }

    public function registerSeller() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        $email = isset($_POST['email']) ? trim($_POST['email']) : '';
        $password = isset($_POST['password']) ? $_POST['password'] : '';
        $password_confirm = isset($_POST['password_confirm']) ? $_POST['password_confirm'] : '';
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $address = isset($_POST['address']) ? trim($_POST['address']) : '';
        $store_name = isset($_POST['store_name']) ? trim($_POST['store_name']) : '';
        $store_description_raw = isset($_POST['store_description']) ? $_POST['store_description'] : '';
        $store_description = Helper::sanitizeRichText($store_description_raw);
        $store_logo = isset($_FILES['store_logo']) ? $_FILES['store_logo'] : null;

        $validator = Validator::validateRegisterSeller(
            $email,
            $password,
            $password_confirm,
            $name,
            $address,
            $store_name,
            $store_description,
            $store_logo
        );
        if ($validator->hasErrors()) {
            Response::error('Validation failed', $validator->getErrors(), 400);
        }

        if ($this->userModel->emailExists($email)) {
            Response::error('Email already registered', ['email' => 'This email is already in use'], 409);
        }

        $logoUpload = $this->processStoreLogoUpload($store_logo);
        if (!$logoUpload['success']) {
            Response::error('Validation failed', ['store_logo' => $logoUpload['message']], 400);
        }

        $result = $this->userModel->registerSeller($email, $password, $name, $address, $store_name, $store_description, $logoUpload['relative_path']);

        if (!$result['success']) {
            if ($logoUpload['absolute_path']) {
                $this->deleteUploadedFile($logoUpload['absolute_path']);
            }

            if (isset($result['field'])) {
                Response::error($result['message'], [$result['field'] => $result['message']], 409);
            }

            Response::error($result['message'], null, 500);
        }

        AuthMiddleware::login($result['user']);

        Response::success('Registration successful', ['redirect' => '/seller/dashboard'], 201);
    }

    private function processStoreLogoUpload($file) {
        $response = [
            'success' => false,
            'relative_path' => null,
            'absolute_path' => null,
            'message' => 'Failed to process store logo upload'
        ];

        if ($file === null || !isset($file['error'])) {
            $response['message'] = 'Store logo is required';
            return $response;
        }

        if ($file['error'] === UPLOAD_ERR_NO_FILE) {
            $response['message'] = 'Store logo is required';
            return $response;
        }

        if ($file['error'] !== UPLOAD_ERR_OK) {
            $response['message'] = 'Failed to upload store logo';
            return $response;
        }

        $allowedMimes = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'image/webp' => 'webp'
        ];

        $extension = null;

        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            if ($finfo === false) {
                $response['message'] = 'Unable to validate store logo file';
                return $response;
            }

            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!isset($allowedMimes[$mimeType])) {
                $response['message'] = 'Store logo must be a PNG, JPG, or WEBP image';
                return $response;
            }

            $extension = $allowedMimes[$mimeType];
        } else {
            $extensionMap = [
                'jpg' => 'jpg',
                'jpeg' => 'jpg',
                'png' => 'png',
                'webp' => 'webp'
            ];

            $detectedExt = strtolower(pathinfo($file['name'] ?? '', PATHINFO_EXTENSION));
            if (!isset($extensionMap[$detectedExt])) {
                $response['message'] = 'Store logo must be a PNG, JPG, or WEBP image';
                return $response;
            }

            $extension = $extensionMap[$detectedExt];
        }

        $maxSize = 2 * 1024 * 1024; // 2MB
        if (isset($file['size']) && $file['size'] > $maxSize) {
            $response['message'] = 'Store logo must be 2MB or smaller';
            return $response;
        }

        $publicDir = realpath(__DIR__ . '/../public');
        if ($publicDir === false) {
            $publicDir = __DIR__ . '/../public';
        }

        $baseDir = $publicDir;
        $relativeDir = 'images' . DIRECTORY_SEPARATOR . 'store-logos';
        $targetDir = $baseDir . DIRECTORY_SEPARATOR . $relativeDir;

        if (!is_dir($targetDir) && !mkdir($targetDir, 0775, true)) {
            $response['message'] = 'Failed to create directory for store logo';
            return $response;
        }

        $filename = uniqid('store_logo_', true) . '.' . $extension;
        $targetPath = $targetDir . DIRECTORY_SEPARATOR . $filename;

        if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
            $response['message'] = 'Failed to save store logo';
            return $response;
        }

        $response['success'] = true;
        $response['relative_path'] = 'public/images/store-logos/' . $filename;
        $response['absolute_path'] = $targetPath;
        $response['message'] = null;
        return $response;
    }

    private function deleteUploadedFile($absolutePath) {
        if ($absolutePath && file_exists($absolutePath)) {
            unlink($absolutePath);
        }
    }

    public function logout() {
        AuthMiddleware::logout();
        Response::redirect('/');
    }

    public function getCurrentUser() {
        if (!AuthMiddleware::isLoggedIn()) {
            Response::error('Not authenticated', null, 401);
        }
        
        $current_user = AuthMiddleware::getCurrentUser();
        $user = $this->userModel->getUserById($current_user['user_id']);
        
        // If user is a seller, include storeBalance
        if ($user && $user['role'] === 'SELLER') {
            if (!class_exists('Store')) {
                require_once __DIR__ . '/../models/Store.php';
            }
            $storeModel = new Store();
            $store = $storeModel->findBySeller($user['user_id']);
            if ($store) {
                $user['storeBalance'] = isset($store['balance']) ? (int)$store['balance'] : 0;
                $user['store_id'] = $store['store_id'];
            }
        }

        Response::success('User retrieved', $user, 200);
    }

    public function updateProfile() {
        AuthMiddleware::requireLogin();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        $current_user = AuthMiddleware::getCurrentUser();
        $name = isset($_POST['name']) ? trim($_POST['name']) : '';
        $address = isset($_POST['address']) ? trim($_POST['address']) : '';

        if (!Validator::isValidName($name)) {
            Response::error('Validation failed', ['name' => 'Please enter a valid name'], 400);
        }

        if (!Validator::isValidAddress($address)) {
            Response::error('Validation failed', ['address' => 'Please enter a valid address (min. 5 characters)'], 400);
        }

        $result = $this->userModel->updateProfile($current_user['user_id'], $name, $address);

        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        AuthMiddleware::startSession();
        $_SESSION['name'] = $name;

        Response::success('Profile updated', $result['user'], 200);
    }

    public function changePassword() {
        AuthMiddleware::requireLogin();

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        $current_user = AuthMiddleware::getCurrentUser();
        $old_password = isset($_POST['old_password']) ? $_POST['old_password'] : '';
        $new_password = isset($_POST['new_password']) ? $_POST['new_password'] : '';
        $new_password_confirm = isset($_POST['new_password_confirm']) ? $_POST['new_password_confirm'] : '';

        if (empty($old_password)) {
            Response::error('Validation failed', ['old_password' => 'Current password is required'], 400);
        }

        if (empty($new_password) || !Validator::isValidPassword($new_password)) {
            Response::error('Validation failed', ['new_password' => 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol'], 400);
        }

        if ($new_password !== $new_password_confirm) {
            Response::error('Validation failed', ['new_password_confirm' => 'Passwords do not match'], 400);
        }

        $result = $this->userModel->changePassword($current_user['user_id'], $old_password, $new_password);

        if (!$result['success']) {
            Response::error($result['message'], null, 401);
        }

        Response::success('Password changed successfully', null, 200);
    }
}
?>
