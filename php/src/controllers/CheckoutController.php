<?php

class CheckoutController {
    private $order_model;
    private $cart_model;
    private $user_model;

    public function __construct() {
        $this->order_model = new Order();
        $this->cart_model = new Cart();
        $this->user_model = new User();
    }

    public function index() {
        AuthMiddleware::requireRole('BUYER', '/auth/login');
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        // ============================================
        // FEATURE FLAG CHECK - Checkout must be enabled
        // ============================================
        $checkoutAccess = FeatureFlag::checkAccess(FeatureFlag::CHECKOUT_ENABLED, $buyer_id);
        if (!$checkoutAccess['enabled']) {
            // Redirect to a disabled feature page or show error
            $featureDisabledReason = $checkoutAccess['reason'];
            $featureDisabledIsGlobal = $checkoutAccess['is_global'];
            require_once __DIR__ . '/../views/feature-disabled.php';
            return;
        }

        $user = $this->user_model->getUserById($buyer_id);
        if (!$user) {
            Response::error('User not found.', null, 404);
            return;
        }

        $cartResult = $this->cart_model->fetchItems($buyer_id);
        if (!$cartResult['success']) {
            Response::error('Could not fetch cart items: ' . $cartResult['message'], null, 500);
            return;
        }

        $cartData = Helper::structure_cart_data($cartResult['items']);

        $navbarType = 'buyer'; // Mending ditaro di checkout.php??
        $activeLink = 'checkout'; // For highlighting the 'Checkout' link in navbar (gatau ini buat apa)

        require_once __DIR__ . '/../views/checkout/checkout.php';
    }

    /**
     * Endpoint for checkout
     */
    public function checkout() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        AuthMiddleware::requireLogin();
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        // ============================================
        // FEATURE FLAG CHECK - Checkout must be enabled
        // Server-side enforcement to prevent API bypass
        // ============================================
        FeatureFlag::requireFeature(FeatureFlag::CHECKOUT_ENABLED, $buyer_id);

        $cartResult = $this->cart_model->fetchItems($buyer_id);
        if (!$cartResult['success']) {
            Response::error('Could not fetch cart items: ' . $cartResult['message'], null, 500);
        }
        if (empty($cartResult['items'])) {
            Response::error('Your cart is empty. Nothing to check out.', null, 400);
        }
        $cartItems = $cartResult['items'];

        // Shipping Address
        $data = json_decode(file_get_contents('php://input'), true);
        $shipping_address = $data['shippingAddress'] ?? null;

        if (empty($shipping_address) || trim($shipping_address) === '') {
            Response::error('Shipping address is required.', null, 400);
        }
        if (strlen($shipping_address) < 1) {
            Response::error('Shipping address seems too short. Please provide a full address.', null, 400);
        }
        if (strlen($shipping_address) > 500) {
            Response::error('Shipping address is too long (max 500 characters).', null, 400);
        }

        $result = $this->order_model->checkout($buyer_id, $shipping_address, $cartItems);

        if ($result['success']) {
            // Update session balance
            $user = $this->user_model->getUserById($buyer_id);
            if ($user) {
                $_SESSION['balance'] = $user['balance'];
            }

            Response::success(
                $result['message'],
                [
                    'redirect' => '/buyer/order-history',
                    'balance' => $user['balance'] ?? null
                ],
                200
            );
        } else {
            Response::error($result['message'], null, 400);
        }
    }

}

?>