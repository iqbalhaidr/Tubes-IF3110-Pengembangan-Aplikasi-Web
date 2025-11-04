<?php

class BalanceController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function topUp() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            Response::error('Method not allowed', null, 405);
        }

        AuthMiddleware::startSession();

        if (!AuthMiddleware::isLoggedIn()) {
            Response::error('You must be logged in to top up balance.', null, 401);
        }

        $currentUser = AuthMiddleware::getCurrentUser();

        if (!$currentUser || ($currentUser['role'] ?? null) !== 'BUYER') {
            Response::error('Only buyers can top up balance.', null, 403);
        }

        $payload = $this->parseRequestBody();
        $rawAmount = $payload['amount'] ?? null;

        if ($rawAmount === null || $rawAmount === '') {
            Response::error('Validation failed', ['amount' => 'Amount is required.'], 422);
        }

        $amount = filter_var($rawAmount, FILTER_VALIDATE_INT, [
            'options' => ['min_range' => 1],
        ]);

        if ($amount === false) {
            Response::error('Validation failed', ['amount' => 'Amount must be a positive integer.'], 422);
        }

        if ($amount > 1000000000) {
            Response::error('Validation failed', ['amount' => 'Amount is too large.'], 422);
        }

        $result = $this->userModel->topUpBalance($currentUser['user_id'], $amount);

        if (!$result['success']) {
            Response::error($result['message'] ?? 'Failed to top up balance.', null, 500);
        }

        AuthMiddleware::startSession();
        $_SESSION['balance'] = $result['balance'];

        Response::success('Balance topped up successfully.', [
            'balance' => $result['balance'],
            'amount' => $amount,
        ], 200);
    }

    public function getBalance() {
        AuthMiddleware::requireRole('BUYER');
        $currentUser = AuthMiddleware::getCurrentUser();
        $user = $this->userModel->getUserById($currentUser['user_id']);

        if (!$user) {
            Response::error('User not found', null, 404);
        }

        $_SESSION['balance'] = $user['balance'];

        Response::success('Balance fetched successfully', ['balance' => $user['balance']]);
    }

    private function parseRequestBody() {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (stripos($contentType, 'application/json') !== false) {
            $input = file_get_contents('php://input');
            $decoded = json_decode($input, true);
            return is_array($decoded) ? $decoded : [];
        }

        return $_POST;
    }
}

?>
