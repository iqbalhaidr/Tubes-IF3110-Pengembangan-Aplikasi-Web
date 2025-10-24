<?php

class Response {
    /**
     * Send a JSON response
     */
    public static function json($data, $status_code = 200) {
        header('Content-Type: application/json');
        http_response_code($status_code);
        echo json_encode($data);
        exit;
    }

    /**
     * Send a success response
     */
    public static function success($message, $data = null, $status_code = 200) {
        $response = [
            'success' => true,
            'message' => $message,
        ];
        
        if ($data !== null) {
            $response['data'] = $data;
        }
        
        self::json($response, $status_code);
    }

    /**
     * Send an error response
     */
    public static function error($message, $errors = null, $status_code = 400) {
        $response = [
            'success' => false,
            'message' => $message,
        ];
        
        if ($errors !== null) {
            $response['errors'] = $errors;
        }
        
        self::json($response, $status_code);
    }

    /**
     * Redirect to a URL
     */
    public static function redirect($url) {
        header('Location: ' . $url);
        exit;
    }
}
?>
