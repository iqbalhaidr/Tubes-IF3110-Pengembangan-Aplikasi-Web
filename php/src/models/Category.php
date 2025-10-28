<?php

require_once __DIR__ . '/../utils/Database.php';

class Category {
    public static function findAll() {
        $dbconn = Database::getInstance();

        try {
            $statement = $dbconn->query('SELECT category_id, name FROM category ORDER BY name ASC');
            return $statement->fetchAll();
        } catch (PDOException $exception) {
            // Surface an empty result set to keep the caller flow intact
            return [];
        }
    }
}
