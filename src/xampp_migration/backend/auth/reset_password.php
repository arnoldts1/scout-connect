<?php
/**
 * POST /backend/auth/reset_password.php
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';

setCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);

$body     = getRequestBody();
$token    = trim($body['token'] ?? '');
$password = $body['password'] ?? '';

if (!$token || !$password) jsonError('Token and new password are required');
if (strlen($password) < 6)  jsonError('Password must be at least 6 characters');

$db   = getDB();
$stmt = $db->prepare(
    'SELECT id FROM users WHERE reset_token = ? AND reset_token_expires > NOW() LIMIT 1'
);
$stmt->execute([$token]);
$user = $stmt->fetch();

if (!$user) jsonError('Invalid or expired reset token', 400);

$hash = password_hash($password, PASSWORD_BCRYPT);
$db->prepare(
    'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?'
)->execute([$hash, $user['id']]);

jsonSuccess('Password reset successfully');