<?php

class CheckoutController {
    private $order_model;
    private $cart_model;
    private $user_model;

    public function __construct() {
        $this->order_model = new Order();
        $this->cart_model = new Cart();
        $this->user_model = new User();

        Midtrans\Config::$serverKey = $_ENV['MIDTRANS_SERVER_KEY'];
        Midtrans\Config::$isProduction = $_ENV['MIDTRANS_ENV'] === 'production';
        Midtrans\Config::$isSanitized = true;
        Midtrans\Config::$is3ds = true;
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
            $featureDisabledName = 'checkout_enabled';
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

        $navbarType = 'buyer'; 
        $activeLink = 'checkout';

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

        // Feature Flag Check
        FeatureFlag::requireFeature(FeatureFlag::CHECKOUT_ENABLED, $buyer_id);

        $data = json_decode(file_get_contents('php://input'), true);
        $paymentMethod = $data['paymentMethod'] ?? 'balance';
        $shipping_address = $data['shippingAddress'] ?? null;

        if ($paymentMethod === 'balance') {
            return $this->checkoutWithBalance($buyer_id, $shipping_address);
        } elseif ($paymentMethod === 'midtrans') {
            return $this->checkoutWithMidtrans($buyer_id, $shipping_address);
        } else {
            Response::error('Invalid payment method.', null, 400);
        }
    }

    private function checkoutWithMidtrans($buyer_id, $shipping_address) {
        $cartResult = $this->cart_model->fetchItems($buyer_id);
        if (!$cartResult['success'] || empty($cartResult['items'])) {
            Response::error($cartResult['message'] ?: 'Your cart is empty.', null, 400);
        }
        $cartItems = $cartResult['items'];

        if (empty($shipping_address) || trim($shipping_address) === '') {
            Response::error('Shipping address is required.', null, 400);
        }

        $result = $this->order_model->checkoutWithMidtrans($buyer_id, $shipping_address, $cartItems);

        if ($result['success']) {
            $user = $this->user_model->getUserById($buyer_id);

            $params = [
                'transaction_details' => [
                    'order_id' => $result['data']['midtrans_order_ids'][0], // Use the first order ID as the main transaction ID
                    'gross_amount' => $result['data']['grand_total'],
                ],
                'customer_details' => [
                    'first_name' => $user['name'],
                    'email' => $user['email'],
                ],
                'item_details' => $result['data']['midtrans_transaction_details'], // Pass individual order details as item details
            ];

            try {
                $snapToken = Midtrans\Snap::getSnapToken($params);
                Response::success('Snap token generated.', ['snap_token' => $snapToken]);
            } catch (Exception $e) {
                Response::error('Failed to generate Snap token: ' . $e->getMessage(), null, 500);
            }
        } else {
            Response::error($result['message'], null, 400);
        }
    }

    private function checkoutWithBalance($buyer_id, $shipping_address) {
        $cartResult = $this->cart_model->fetchItems($buyer_id);
        if (!$cartResult['success'] || empty($cartResult['items'])) {
            Response::error($cartResult['message'] ?: 'Your cart is empty.', null, 400);
        }
        $cartItems = $cartResult['items'];

        if (empty($shipping_address) || trim($shipping_address) === '') {
            Response::error('Shipping address is required.', null, 400);
        }
        if (strlen($shipping_address) > 500) {
            Response::error('Shipping address is too long (max 500 characters).', null, 400);
        }

        $result = $this->order_model->checkout($buyer_id, $shipping_address, $cartItems);

        if ($result['success']) {
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