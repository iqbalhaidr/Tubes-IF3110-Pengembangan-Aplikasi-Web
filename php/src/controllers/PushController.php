<?php

require_once __DIR__ . '/../models/PushSubscription.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';

class PushController {
    public function subscribe() {
        $userData = AuthMiddleware::getCurrentUser();
        if (!$userData) return;

        $input = json_decode(file_get_contents('php://input'), true);

        // Basic validation
        if (empty($input['endpoint']) || empty($input['keys']['p256dh']) || empty($input['keys']['auth'])) {
            Response::error('Bad Request: Subscription object is incomplete.', null, 400);
            return;
        }

        $subscriptionModel = new PushSubscription();
        $result = $subscriptionModel->saveSubscription(
            $userData['user_id'],
            $input['endpoint'],
            $input['keys']['p256dh'],
            $input['keys']['auth']
        );

        if ($result) {
            Response::json(['status' => 'success', 'message' => 'Subscription saved successfully.'], 201);
        } else {
            Response::error('Internal Server Error: Could not save subscription.', null, 500);
        }
    }
}
