<?php

class Helper {

    public static function generatePaginLinks($currentPage, $totalPages, $window = 2) {
        $links = [];
        $showEllipsis = false;

        $links[] = [
            'type' => 'prev',
            'page' => $currentPage - 1,
            'disabled' => $currentPage <= 1
        ];

        for ($i = 1; $i <= $totalPages; $i++) {
            if ($i == 1 || $i == $totalPages || ($i >= $currentPage - $window && $i <= $currentPage + $window)) {
                $links[] = [
                    'type' => 'page',
                    'page' => $i,
                    'active' => $i == $currentPage
                ];
                $showEllipsis = true;
            } elseif ($showEllipsis) {
                $links[] = ['type' => 'ellipsis'];
                $showEllipsis = false;
            }
        }

        $links[] = [
            'type' => 'next',
            'page' => $currentPage + 1,
            'disabled' => $currentPage >= $totalPages
        ];

        return $links;
    }

    /**
     * Helper function for structuring cart data
     */
    public static function structure_cart_data($cartItems) {
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
                    "store_id"        => $store_id,
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
                "cart_item_id"    => $cart_item_id,
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
    
    public static function sanitizeRichText($html) {
        if (!is_string($html) || trim($html) === '') {
            return '';
        }

        $allowedTags = '<p><strong><b><em><i><u><s><ol><ul><li><br><blockquote><span><a><h1><h2><h3>';
        
        $clean = strip_tags($html, $allowedTags);
        $clean = preg_replace('/<p>\s*<\/p>/', '', $clean);
        $clean = preg_replace('/\s+style\s*=\s*["\'][^"\']*["\']/', '', $clean);
        $clean = preg_replace('/\s+on\w+\s*=\s*["\'][^"\']*["\']/', '', $clean);
        
        return trim($clean);
    }
}