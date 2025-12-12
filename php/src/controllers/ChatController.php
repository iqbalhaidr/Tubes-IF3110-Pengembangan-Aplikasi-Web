<?php

require_once __DIR__ . '/../models/User.php';
require_once __DIR__ . '/../models/Chat.php';
require_once __DIR__ . '/../utils/Response.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../utils/FeatureFlag.php';

class ChatController {
    public function getChatRooms() {
        $userData = AuthMiddleware::getCurrentUser();
        if (!$userData) {
            return;
        }

        $userId = $userData['user_id'];
        $userRole = $userData['role'];

        FeatureFlag::requireFeature(FeatureFlag::CHAT_ENABLED, $userId);

        $chatModel = new Chat();
        $rooms = $chatModel->findRoomsByUserId($userId, $userRole);

        Response::json([
            'status' => 'success',
            'data' => $rooms
        ]);
    }

    public function createChatRoom() {
        $userData = AuthMiddleware::getCurrentUser();
        if (!$userData) return;

        FeatureFlag::requireFeature(FeatureFlag::CHAT_ENABLED, $userData['user_id']);

        // Only buyers can create rooms
        if ($userData['role'] !== 'BUYER') {
            Response::error('Forbidden: Only buyers can create chat rooms.', null, 403);
            return;
        }
        $buyerId = $userData['user_id'];

        $input = json_decode(file_get_contents('php://input'), true);
        $storeId = $input['store_id'] ?? null;

        if (!$storeId || !is_numeric($storeId)) {
            Response::error('Bad Request: store_id is required and must be numeric.', null, 400);
            return;
        }

        $chatModel = new Chat();
        $result = $chatModel->createRoom((int)$buyerId, (int)$storeId);

        if ($result['created']) {
            Response::json([
                'status' => 'success',
                'message' => 'Chat room created successfully.',
                'data' => $result['room']
            ], 201);
        } else {
            Response::json([
                'status' => 'success',
                'message' => 'Chat room already exists.',
                'data' => $result['room']
            ], 200);
        }
    }

    public function getMessages($storeId, $buyerId) {
        $userData = AuthMiddleware::getCurrentUser();
        if (!$userData) return;

        FeatureFlag::requireFeature(FeatureFlag::CHAT_ENABLED, $userData['user_id']);

        $chatModel = new Chat();
        $canAccess = $chatModel->canAccessRoom($userData['user_id'], $userData['role'], $storeId, $buyerId);
        if (!$canAccess) {
            Response::error('Forbidden: You do not have access to this chat room.', null, 403);
            return;
        }

        $beforeCursor = isset($_GET['before']) && is_numeric($_GET['before']) ? (int)$_GET['before'] : null;

        $messages = $chatModel->findMessagesByRoom($storeId, $buyerId, $beforeCursor);

        Response::json([
            'status' => 'success',
            'data' => $messages
        ]);
    }

    // TODO FIX THISSSS
    public function uploadImage() {
        $userData = AuthMiddleware::getCurrentUser();
        if (!$userData) return;

        FeatureFlag::requireFeature(FeatureFlag::CHAT_ENABLED, $userData['user_id']);

        if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            Response::error('Bad Request: No image uploaded or upload error occurred.', null, 400);
            return;
        }

        $maxSize = 5 * 1024 * 1024;
        if ($_FILES['image']['size'] > $maxSize) {
            Response::error('Payload Too Large: File size cannot exceed 5MB.', null, 413);
            return;
        }

        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
        $fileType = mime_content_type($_FILES['image']['tmp_name']);
        if (!in_array($fileType, $allowedTypes)) {
            Response::error('Unsupported Media Type: Only JPG, PNG, and GIF are allowed.', null, 415);
            return;
        }

        // Generate unique filename and path
        $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $uniqueFilename = uniqid('chat_', true) . '.' . $extension;
        $targetDir = __DIR__ . '/../public/images/chat-uploads/';
        $targetFile = $targetDir . $uniqueFilename;

        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
            $publicUrl = '/images/chat-uploads/' . $uniqueFilename;
            Response::json([
                'status' => 'success',
                'data' => ['url' => $publicUrl]
            ]);
        } else {
            Response::error('Internal Server Error: Failed to save uploaded file.', null, 500);
        }
    }
}
