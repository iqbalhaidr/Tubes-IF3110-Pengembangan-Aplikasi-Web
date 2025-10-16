<?php

require_once __DIR__ . '/../utils/Database.php';

class Category {
    public static function findAll() {
        $dbconn = Database::getInstance();
        $result = pg_query($dbconn, 'SELECT category_id, name FROM category ORDER BY name ASC');

        $categories = [];
        if ($result) {
            while ($row = pg_fetch_assoc($result)) {
                $categories[] = $row;
            }
        }
        return $categories;
    }
}
