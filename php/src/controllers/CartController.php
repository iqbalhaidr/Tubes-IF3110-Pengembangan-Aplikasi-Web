<?php

class CartController {
    private $cart_model;

    public function __construct() {
        $this->cart_model = new Cart();
    }

    /**
     * Endpoint for index displaying Cart page ()
     */
    public function index() {
        AuthMiddleware::requireLogin();
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        $data = $this->cart_model->fetchItems($buyer_id);
        if (!$data['success']) {
            Response::error($data['message'], null, 500);
        }
        $cartData = $this->_structure_cart_data($data['items']);
        
        require_once __DIR__ . '/../views/cart/cart.php';
    }

    /**
     * Endpoint for add item
     */
    public function addItem() {
        if (!AuthMiddleware::isLoggedIn()) {
            Response::error('User not logged in', null, 401);
        }
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        $data = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE || !isset($data['product_id'])) {
            Response::error('Invalid input. "product_id" is required in JSON body or form data.', null, 400);
        }
        $product_id = trim($data['product_id']);
        $quantity = trim($data['quantity']);

        $temp = $this->cart_model->find_cart_item_id($buyer_id, $product_id);
        if (!$temp['success']) {
            Response::error($temp['message'], null, 500);
        }

        $cart_item_id = $temp['cart_item_id'];
        if ($cart_item_id !== null) {
            $result = $this->cart_model->incItem($buyer_id, $cart_item_id, $quantity);
        } else {
            $result = $this->cart_model->addItem($buyer_id, $product_id, $quantity);
        }

        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

       if ($cart_item_id !== null) {
             Response::success('Product quantity incremented', ['affected_rows' => $result['affected_rows']], 200);
        } else {
             Response::success('Add to cart successful', $result['row'], 201);
        }
    }

    /**
     * Endpoint for delete item
     */
    public function deleteItem($cart_item_id) {
        if (!AuthMiddleware::isLoggedIn()) {
            Response::error('User not logged in', null, 401);
        }
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        $result = $this->cart_model->deleteItem($buyer_id, $cart_item_id);
        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        Response::success('Delete item from cart successful, ' . $result['affected_rows'] . ' rows affected', null, 200);
    }

    /**
     * Endpoint for update item quantity
     */
    public function updateItem($cart_item_id) {
        if (!AuthMiddleware::isLoggedIn()) {
            Response::error('User not logged in', null, 401);
        }
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        $data = json_decode(file_get_contents('php://input'), true);
        if (json_last_error() !== JSON_ERROR_NONE || !isset($data['quantity'])) {
            Response::error('Invalid input. "quantity" is required in JSON body.', null, 400);
        }
        
        $quantity = (int)$data['quantity'];
        $result = $this->cart_model->updateItem($buyer_id, $cart_item_id, $quantity);
        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        Response::success('Update item in cart successful, ' . $result['affected_rows'] . ' rows affected', null, 200);
    }

    /**
     * Endpoint for fetch all items in cart_items by buyer_id
     */
    public function fetchItems() {
        if (!AuthMiddleware::isLoggedIn()) {
            Response::error('User not logged in', null, 401);
        }
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        $data = $this->cart_model->fetchItems($buyer_id);
        if (!$data['success']) {
            Response::error($data['message'], null, 500);
        }
        $structuredCartData = $this->_structure_cart_data($data['items']);

        Response::success('Get items in cart successful', $structuredCartData, 200);
    }

    /**
     * Endpoint for cart badge counter unique item count
     */
    public function getUniqueItemCount() {
        if (!AuthMiddleware::isLoggedIn()) {
            Response::error('User not logged in', null, 401);
        }
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        $data = $this->cart_model->get_unique_item_count($buyer_id);
        if (!$data['success']) {
            Response::error($data['message'], null, 500);
        }

        Response::success('Get items in cart successful', $data, 200);
    }

    /**
     * Helper function for structuring data
     */
    private function _structure_cart_data($cartItems) {
        $cartData = [
            "grandtotal_items" => 0,
            "grandtotal_price" => 0.0,
            "stores" => []
        ];

        if (empty($cartItems)) {
            return $cartData;
        }

        foreach ($cartItems as $item) {
            $store_id = $item['store_id'];
            $cart_item_id = $item['cart_item_id'];

            if (!isset($cartData['stores'][$store_id])) {
                $cartData['stores'][$store_id] = [
                    "store_logo_path" => $item['store_logo_path'],
                    "store_name"      => $item['store_name'],
                    "total_items"     => 0,
                    "total_price"     => 0.0,
                    "items"           => []
                ];
            }

            $item_quantity = (int) $item['quantity'];
            $item_price    = (float) $item['price'];
            $item_subtotal = $item_price * $item_quantity;

            $cartData['stores'][$store_id]['items'][$cart_item_id] = [
                "main_image_path" => $item['main_image_path'],
                "product_name"    => $item['product_name'],
                "price"           => $item_price,
                "quantity"        => $item_quantity,
                "stock"           => (int) $item['stock']
            ];

            $cartData['stores'][$store_id]['total_items'] += $item_quantity;
            $cartData['stores'][$store_id]['total_price'] += $item_subtotal;

            $cartData['grandtotal_items'] += $item_quantity;
            $cartData['grandtotal_price'] += $item_subtotal;
        }

        return $cartData;
    }

}

?>