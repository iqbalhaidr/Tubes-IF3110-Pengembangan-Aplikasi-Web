<?php

class CategoryController {
    private $categoryModel;
    private $db;

    public function __construct() {
        $this->db = Database::getInstance();
        $this->categoryModel = new Category($this->db);
    }

    public function getAllCategories() {
        header('Content-Type: application/json');
        try {
            $categories = $this->categoryModel->getAllCategories();
            echo json_encode(['success' => true, 'data' => $categories]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to fetch categories: ' . $e->getMessage()]);
        }
        exit;
    }

    public function getCategoryData() {
        return $this->categoryModel->getAllCategories();
    }
}
?>