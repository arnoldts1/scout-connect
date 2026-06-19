<?php
/**
 * Authentication Middleware
 * Validates Bearer token / session and returns current user
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/response.php';

/**
 * Require a valid authenticated user.
 * Returns user row array, or sends 401 and exits.
 */
function requireAuth(): array {
    $user = getAuthUser();
    if (!$user) {
        jsonError('Unauthorized', 401);
    }
    return $user;
}

/**
 * Require admin role.
 */
function requireAdmin(): array {
    $user = requireAuth();
    if ($user['role'] !== 'admin') {
        jsonError('Forbidden: admin only', 403);
    }
    return $user;
}

/**
 * Require admin or leader role.
 */
function requireLeader(): array {
    $user = requireAuth();
    if (!in_array($user['role'], ['admin', 'leader'])) {
        jsonError('Forbidden: leader or admin required', 403);
    }
    return $user;
}

/**
 * Get the currently authenticated user from token (or null).
 */
function getAuthUser(): ?array {
    $token = getBearerToken();
    if (!$token) {
        return null;
    }

    $db = getDB();
    $stmt = $db->prepare(
        'SELECT s.user_id, s.expires_at, u.* 
         FROM sessions s 
         JOIN users u ON u.id = s.user_id 
         WHERE s.id = ? AND s.expires_at > NOW()'
    );
    $stmt->execute([$token]);
    $row = $stmt->fetch();

    if (!$row) {
        return null;
    }

    return $row;
}

/**
 * Extract Bearer token from Authorization header or cookie.
 */
function getBearerToken(): ?string {
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+(.+)/i', $header, $m)) {
        return trim($m[1]);
    }
    // Also check cookie
    return $_COOKIE['scout_token'] ?? null;
}

/**
 * Create a session token for a user.
 */
function createSession(string $userId): string {
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';

    $db = getDB();
    $stmt = $db->prepare(
        'INSERT INTO sessions (id, user_id, ip_address, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)'
    );
    $stmt->execute([$token, $userId, $ip, $ua, $expires]);
    return $token;
}

/**
 * Delete a session (logout).
 */
function deleteSession(string $token): void {
    $db = getDB();
    $db->prepare('DELETE FROM sessions WHERE id = ?')->execute([$token]);
}