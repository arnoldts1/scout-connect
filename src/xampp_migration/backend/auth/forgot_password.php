<?php
/**
 * POST /backend/auth/forgot_password.php
 * Send a password-reset email
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';

setCorsHeaders();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') jsonError('Method not allowed', 405);

$body  = getRequestBody();
$email = strtolower(trim($body['email'] ?? ''));

if (!$email) jsonError('Email is required');

$db   = getDB();
$stmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
$stmt->execute([$email]);
$user = $stmt->fetch();

// Always return success to prevent email enumeration
if (!$user) {
    jsonSuccess('If that email exists, a reset link has been sent.');
}

$token   = bin2hex(random_bytes(20));
$expires = date('Y-m-d H:i:s', time() + 3600); // 1 hour

$db->prepare(
    'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?'
)->execute([$token, $expires, $user['id']]);

$resetLink = APP_URL . '/reset-password?token=' . $token;

// Send email (configure your mail server / use PHPMailer in production)
$subject = 'Scout Connect - Password Reset';
$message = "Click the link below to reset your password:\n\n{$resetLink}\n\nThis link expires in 1 hour.";
@mail($email, $subject, $message, "From: noreply@scoutconnect.rw");

jsonSuccess('If that email exists, a reset link has been sent.');