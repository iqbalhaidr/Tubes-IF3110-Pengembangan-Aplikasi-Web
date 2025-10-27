<?php

class CartController {
    private $cart_model;

    public function __construct() {
        $this->cart_model = new Cart();
    }

    /**
     * Handle view all product
     */
    public function view_product() {
        if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
            Response::error('Method not allowed', null, 405);
        }

        if (!AuthMiddleware::isLoggedIn()) {
            Response::error('User not logged in', null, 401);
        }
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        $data = $this->cart_model->get_cart_items_by_buyer_id($buyer_id);
        if (!$data['success']) {
            Response::error($data['message'], null, 500);
        }

        Response::success('Get items in cart successful', $data['items'], 200);
    }

    /**
     * Handle add product
     */
    public function add_product() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }
        
        if (!AuthMiddleware::isLoggedIn()) {
            Response::error('User not logged in', null, 401);
        }
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        // Check if product_id valid (in product relation)
        $product_id = isset($_POST['product_id']) ? trim($_POST['product_id']) : '';
        // Validate product_id (waiting for product model to be implemented)
        /**
         * if (!isValid) {
         *      Response::error('Invalid Product ID', null, 400);
         * }
         */

        // Check if product already in cart
        $temp = $this->cart_model->get_cart_item_id_by_buyer_id_and_product_id($buyer_id, $product_id);
        if (!$temp['success']) {
            Response::error($temp['message'], null, 500);
        }

        $cart_item_id = $temp['cart_item_id'];
        if ($cart_item_id !== null) {
            // Increment quantity by 1 if product already in cart
            $result = $this->cart_model->inc_product($buyer_id, $product_id, 1);
        } else {
            // Execute add product
            $result = $this->cart_model->add_product($buyer_id, $product_id, 1);
        }

        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        Response::success('Add to cart successful', $result['row'], 200);
    }

    /**
     * Handle delete product
     */
    public function delete_product() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }
        
        if (!AuthMiddleware::isLoggedIn()) {
            Response::error('User not logged in', null, 401);
        }
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        $product_id = isset($_POST['product_id']) ? trim($_POST['product_id']) : '';

        // Execute delete product
        $result = $this->cart_model->delete_product($buyer_id, $product_id);
        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        Response::success('Delete from cart successful, ' . $result['affected_rows'] . ' rows affected', null, 200);
    }

    /**
     * Handle update product quantity
     */
    public function update_product() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }
        
        if (!AuthMiddleware::isLoggedIn()) {
            Response::error('User not logged in', null, 401);
        }
        $current_user = AuthMiddleware::getCurrentUser();
        $buyer_id = $current_user['user_id'];

        // Check if items really exist in cart
        $product_id = isset($_POST['product_id']) ? trim($_POST['product_id']) : '';
        $temp = $this->cart_model->get_cart_item_id_by_buyer_id_and_product_id($buyer_id, $product_id);
        if (!$temp['success']) {
            Response::error($temp['message'], null, 500);
        }
        
        $cart_item_id = $temp['cart_item_id'];
        if ($cart_item_id === null) {
            Response::error('Product not found in cart', null, 400);
        } 
        
        // Execute update product quantity
        $quantity = $_POST['quantity'];
        $result = $this->cart_model->update_product($buyer_id, $product_id, $quantity);
        if (!$result['success']) {
            Response::error($result['message'], null, 500);
        }

        Response::success('Update product in cart successful, ' . $result['affected_rows'] . ' rows affected', null, 200);
    }

}

?>