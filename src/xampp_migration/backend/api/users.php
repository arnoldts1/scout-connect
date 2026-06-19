<?php
/**
 * /backend/api/users.php
 * Admin-level user management + public listing
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();
$user   = requireAuth();

$SAFE_FIELDS = 'id, full_name, email, role, avatar, phone, date_of_birth, scout_id, scout_rank,
    bio, location, unit_id, unit_name, clan_id, clan_name, is_verified, is_org_leader,
    org_leader_role, org_leader_position, has_wood_badge, wood_badge_beads, wood_badge_status,
    theme, onboarding_complete, last_login, created_date, updated_date';

if ($method === 'GET') {
    if (!empty($_GET['id'])) {
        $stmt = $db->prepare("SELECT $SAFE_FIELDS FROM users WHERE id = ?");
        $stmt->execute([$_GET['id']]);
        $u = $stmt->fetch();
        if (!$u) jsonError('User not found', 404);
        jsonResponse($u);
    }

    // List - admin only
    if ($user['role'] !== 'admin') jsonError('Forbidden', 403);

    $limit  = min((int)($_GET['limit'] ?? 100), 500);
    $sort   = $_GET['sort'] ?? '-created_date';
    $field  = ltrim($sort, '-');
    $dir    = str_starts_with($sort, '-') ? 'DESC' : 'ASC';
    $allowed = ['created_date','last_login','full_name','email','role'];
    if (!in_array($field, $allowed)) $field = 'created_date';

    $stmt = $db->query("SELECT $SAFE_FIELDS FROM users ORDER BY $field $dir LIMIT $limit");
    jsonResponse($stmt->fetchAll());
}

if ($method === 'PATCH' || $method === 'PUT') {
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');

    // Only admin can update other users
    if ($id !== $user['id'] && $user['role'] !== 'admin') {
        jsonError('Forbidden', 403);
    }

    $allowed = ['role','is_verified','is_org_leader','org_leader_role','org_leader_position',
                'has_wood_badge','wood_badge_beads','wood_badge_status','avatar','phone',
                'bio','location','unit_id','unit_name','clan_id','clan_name',
                'scout_rank','theme','onboarding_complete'];

    $updates = [];
    $params  = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) {
            $updates[] = "$f = ?";
            $params[]  = $body[$f];
        }
    }

    if (!$updates) jsonError('No valid fields');

    $params[] = $id;
    $db->prepare('UPDATE users SET ' . implode(',', $updates) . ', updated_date=NOW() WHERE id=?')
       ->execute($params);

    $stmt = $db->prepare("SELECT $SAFE_FIELDS FROM users WHERE id = ?");
    $stmt->execute([$id]);
    jsonResponse($stmt->fetch());
}

jsonError('Method not allowed', 405);