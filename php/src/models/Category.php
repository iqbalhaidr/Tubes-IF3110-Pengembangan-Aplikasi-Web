<?php
class Category {
    private $db;

    public function __construct(PDO $db) {
        $this->db = $db;
    }

    public function getAllCategories() {
        try {
            $query = "SELECT category_id, category_name FROM category ORDER BY category_name ASC";
            $stmt = $this->db->prepare($query);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Error fetching categories: " . $e->getMessage());
            return [];
        }
    }
}
?>