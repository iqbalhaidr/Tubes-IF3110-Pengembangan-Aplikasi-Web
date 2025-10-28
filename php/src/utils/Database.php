<?php

class Database {
    private static $dbconn = null;

    private function __construct() {
        // Private constructor to prevent direct instantiation
    }

    public static function getInstance() {
        if (self::$dbconn === null) {
            $host = getenv('DB_HOST') ?: 'db';
            $port = getenv('DB_PORT') ?: '5432';
            $dbname = getenv('DB_NAME') ?: 'nimonspedia_db';
            $user = getenv('DB_USER') ?: 'nimonspedia_user';
            $password = getenv('DB_PASSWORD') ?: 'your_strong_password';

            $dsn = "pgsql:host={$host};port={$port};dbname={$dbname}";

            try {
                self::$dbconn = new PDO($dsn, $user, $password, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);
            } catch (PDOException $exception) {
                // In a real app, you'd log this error, not die
                die('Connection failed: ' . $exception->getMessage());
            }
        }

        return self::$dbconn;
    }
}
