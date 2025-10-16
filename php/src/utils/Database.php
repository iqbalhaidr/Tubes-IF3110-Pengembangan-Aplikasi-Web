<?php

class Database {
    private static $dbconn = null;

    private function __construct() {
        // Private constructor to prevent direct instantiation
    }

    public static function getInstance() {
        if (self::$dbconn == null) {
            // Configuration
            $host = 'db';
            $port = '5432';
            $dbname = 'nimonspedia_db';
            $user = 'nimonspedia_user';
            $password = 'your_strong_password';

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
