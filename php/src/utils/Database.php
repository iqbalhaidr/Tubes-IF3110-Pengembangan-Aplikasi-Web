<?php

class Database {
    private static $dbconn = null;

    private function __construct() {
        // Private constructor to prevent direct instantiation
    }

    public static function getInstance() {
        if (self::$dbconn == null) {
            // Get configuration from environment variables
            $host = getenv('DB_HOST') ?: 'db';
            $port = getenv('DB_PORT') ?: '5432';
            $dbname = getenv('DB_NAME') ?: 'nimonspedia_db';
            $user = getenv('DB_USER') ?: 'nimonspedia_user';
            $password = getenv('DB_PASSWORD') ?: 'your_strong_password';

            // Create connection string
            $conn_string = "host={$host} port={$port} dbname={$dbname} user={$user} password={$password}";

            // Establish database connection
            self::$dbconn = pg_connect($conn_string);

            if (!self::$dbconn) {
                // In a real app, you'd log this error, not die
                die("Connection failed: " . pg_last_error());
            }
        }
        return self::$dbconn;
    }
}
