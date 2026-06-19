<?php
/**
 * /backend/api/public_profiles.php
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

if ($method === 'GET') {
    requireAuth();
    $where = ['1=1']; $params = [];
    if (!empty($_GET['user_id']))  { $where[] = 'user_id = ?';  $params[] = $_GET['user_id']; }
    if (!empty($_GET['username'])) { $where[] = 'username = ?'; $params[] = $_GET['username']; }
    $limit = min((int)($_GET['limit'] ?? 50), 200);
    $stmt = $db->prepare('SELECT * FROM public_profiles WHERE ' . implode(' AND ', $where) . " LIMIT $limit");
    $stmt->execute($params);
    jsonResponse($stmt->fetchAll());
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = getRequestBody();
    $id   = uuid();

    // Upsert by user_id
    $existing = $db->prepare('SELECT id FROM public_profiles WHERE user_id = ?');
    $existing->execute([$body['user_id'] ?? $user['id']]);
    $ex = $existing->fetch();

    if ($ex) {
        // Update
        $db->prepare(
            'UPDATE public_profiles SET full_name=?,username=?,email=?,avatar=?,bio=?,location=?,
             unit_name=?,clan_name=?,rank=?,is_verified=?,is_org_leader=?,wood_badge_beads=?,updated_date=NOW()
             WHERE id=?'
        )->execute([
            $body['full_name'] ?? null, $body['username'] ?? null, $body['email'] ?? null,
            $body['avatar'] ?? null, $body['bio'] ?? null, $body['location'] ?? null,
            $body['unit_name'] ?? null, $body['clan_name'] ?? null, $body['rank'] ?? null,
            (int)($body['is_verified'] ?? 0), (int)($body['is_org_leader'] ?? 0),
            (int)($body['wood_badge_beads'] ?? 0), $ex['id'],
        ]);
        $stmt = $db->prepare('SELECT * FROM public_profiles WHERE id = ?');
        $stmt->execute([$ex['id']]);
        jsonResponse($stmt->fetch());
    }

    $stmt = $db->prepare(
        'INSERT INTO public_profiles (id, user_id, full_name, username, email, avatar, bio,
         location, unit_name, clan_name, rank, followers_count, following_count, posts_count,
         is_verified, is_org_leader, wood_badge_beads, created_date, updated_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,0,0,0,?,?,?,NOW(),NOW())'
    );
    $stmt->execute([
        $id, $body['user_id'] ?? $user['id'], $body['full_name'] ?? null,
        $body['username'] ?? null, $body['email'] ?? null,
        $body['avatar'] ?? null, $body['bio'] ?? null, $body['location'] ?? null,
        $body['unit_name'] ?? null, $body['clan_name'] ?? null, $body['rank'] ?? null,
        (int)($body['is_verified'] ?? 0), (int)($body['is_org_leader'] ?? 0),
        (int)($body['wood_badge_beads'] ?? 0),
    ]);
    $p = $db->query("SELECT * FROM public_profiles WHERE id = '$id'")->fetch();
    jsonResponse($p, 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    $user = requireAuth();
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');
    $allowed = ['full_name','username','avatar','bio','location','unit_name','clan_name','rank',
                'followers_count','following_count','posts_count','is_verified','is_org_leader','wood_badge_beads'];
    $updates = []; $params = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) { $updates[] = "$f=?"; $params[] = $body[$f]; }
    }
    if ($updates) {
        $params[] = $id;
        $db->prepare('UPDATE public_profiles SET ' . implode(',', $updates) . ',updated_date=NOW() WHERE id=?')->execute($params);
    }
    $stmt = $db->prepare('SELECT * FROM public_profiles WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse($stmt->fetch());
}

jsonError('Method not allowed', 405);