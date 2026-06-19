<?php
/**
 * Database Configuration
 * Scout Connect - XAMPP Migration
 */

define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_PORT', getenv('DB_PORT') ?: '3306');
define('DB_NAME', getenv('DB_NAME') ?: 'scout_connect');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_CHARSET', 'utf8mb4');

// JWT / Session
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'CHANGE_ME_IN_PRODUCTION_scout_connect_2024');
define('SESSION_LIFETIME', 60 * 60 * 24 * 30); // 30 days

// File uploads
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL', getenv('APP_URL') ? getenv('APP_URL') . '/backend/uploads/' : 'http://localhost/scout_connect/backend/uploads/');
define('MAX_FILE_SIZE', 10 * 1024 * 1024); // 10 MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
define('ALLOWED_VIDEO_TYPES', ['video/mp4', 'video/webm', 'video/ogg']);
define('ALLOWED_AUDIO_TYPES', ['audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/mp4']);

// App
define('APP_URL', getenv('APP_URL') ?: 'http://localhost/scout_connect');
define('FRONTEND_URL', getenv('FRONTEND_URL') ?: 'http://localhost:5173');
define('APP_ENV', getenv('APP_ENV') ?: 'development');

/**
 * Get a PDO database connection (singleton)
 */
function getDB(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST, DB_PORT, DB_NAME, DB_CHARSET
        );
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
    }
    return $pdo;
}