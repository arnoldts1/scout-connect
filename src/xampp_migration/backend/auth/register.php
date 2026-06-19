<?php
/**
 * POST /backend/auth/register.php
 * Register a new user
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$body      = getRequestBody();
$fullName  = trim($body['full_name'] ?? '');
$email     = strtolower(trim($body['email'] ?? ''));
$password  = $body['password'] ?? '';

if (!$fullName || !$email || !$password) {
    jsonError('full_name, email and password are required');
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    jsonError('Invalid email address');
}

if (strlen($password) < 6) {
    jsonError('Password must be at least 6 characters');
}

$db = getDB();

// Check email uniqueness
$check = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$check->execute([$email]);
if ($check->fetch()) {
    jsonError('Email already registered', 409);
}

$id   = uuid();
$hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $db->prepare(
    'INSERT INTO users (id, full_name, email, password_hash, role, onboarding_complete, created_date, updated_date)
     VALUES (?, ?, ?, ?, "user", 0, NOW(), NOW())'
);
$stmt->execute([$id, $fullName, $email, $hash]);

// Fetch created user
$userStmt = $db->prepare('SELECT * FROM users WHERE id = ?');
$userStmt->execute([$id]);
$user = $userStmt->fetch();

$token = createSession($id);

unset($user['password_hash'], $user['reset_token'], $user['reset_token_expires']);

jsonResponse([
    'token' => $token,
    'user'  => $user,
], 201);