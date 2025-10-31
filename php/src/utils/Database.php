<?php
class Database {
    private static $instance = null;
    private $dbconn;

    private function __construct() {
        $host = getenv('DB_HOST') ?: 'db';
        $port = getenv('DB_PORT') ?: '5432';
        $dbname = getenv('DB_NAME') ?: 'nimonspedia_db';
        $user = getenv('DB_USER') ?: 'nimonspedia_user';
        $password = getenv('DB_PASSWORD') ?: 'secret';

        $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
        
        try {
            $this->dbconn = new PDO($dsn, $user, $password, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]);
        } catch (PDOException $e) {
            error_log("Koneksi Database Gagal: " . $e->getMessage());
            die("Gagal terhubung ke database. Silakan coba lagi nanti.");
        }
    }

    public static function getInstance() {
        if (self::$instance == null) {
            self::$instance = new Database();
        }

        return self::$instance->dbconn;
    }
}
?>
