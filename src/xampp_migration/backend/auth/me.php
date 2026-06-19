<?php
/**
 * GET  /backend/auth/me.php  - get current user
 * PATCH /backend/auth/me.php - update current user profile
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $user = requireAuth();
    unset($user['password_hash'], $user['reset_token'], $user['reset_token_expires']);
    jsonResponse($user);
}

if ($method === 'PATCH' || $method === 'PUT') {
    $user = requireAuth();
    $body = getRequestBody();

    // Fields the user is allowed to update on themselves
    $allowed = [
        'avatar', 'phone', 'date_of_birth', 'scout_rank', 'bio', 'location',
        'theme', 'onboarding_complete', 'unit_id', 'unit_name', 'clan_id', 'clan_name',
        'scout_id', 'has_wood_badge', 'wood_badge_beads', 'wood_badge_status',
        'last_login', 'is_org_leader', 'org_leader_role', 'org_leader_position',
    ];

    $updates = [];
    $params  = [];
    foreach ($allowed as $field) {
        if (array_key_exists($field, $body)) {
            $updates[] = "$field = ?";
            $params[]  = $body[$field];
        }
    }

    if (empty($updates)) {
        jsonError('No valid fields to update');
    }

    $params[] = $user['id'];
    $sql = 'UPDATE users SET ' . implode(', ', $updates) . ', updated_date = NOW() WHERE id = ?';
    getDB()->prepare($sql)->execute($params);

    // Return updated user
    $stmt = getDB()->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$user['id']]);
    $updated = $stmt->fetch();
    unset($updated['password_hash'], $updated['reset_token'], $updated['reset_token_expires']);
    jsonResponse($updated);
}

if ($method === 'DELETE') {
    // Logout - delete session
    $token = getBearerToken();
    if ($token) deleteSession($token);
    jsonSuccess('Logged out');
}

jsonError('Method not allowed', 405);