<?php
/**
 * /backend/api/clans.php
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db = getDB();

function decodeClan(array $row): array {
    $row['members'] = decodeJson($row['members']) ?? [];
    $row['leaders'] = decodeJson($row['leaders']) ?? [];
    return $row;
}

if ($method === 'GET') {
    requireAuth();
    if (!empty($_GET['id'])) {
        $stmt = $db->prepare('SELECT * FROM clans WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        $c = $stmt->fetch();
        if (!$c) jsonError('Not found', 404);
        jsonResponse(decodeClan($c));
    }
    $where = ['1=1']; $params = [];
    if (!empty($_GET['admin_email'])) { $where[] = 'admin_email = ?'; $params[] = $_GET['admin_email']; }
    if (!empty($_GET['status']))      { $where[] = 'status = ?'; $params[] = $_GET['status']; }
    $stmt = $db->prepare('SELECT * FROM clans WHERE ' . implode(' AND ', $where) . ' ORDER BY name ASC');
    $stmt->execute($params);
    jsonResponse(array_map('decodeClan', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = getRequestBody();
    $id   = uuid();
    $stmt = $db->prepare(
        'INSERT INTO clans (id, name, description, location, admin_id, admin_email,
         leaders, members, member_count, points, status, founded_date, created_by_id, created_date, updated_date)
         VALUES (?,?,?,?,?,?,?,?,?,0,?,?,?,?,NOW(),NOW())'
    );
    $stmt->execute([
        $id, $body['name'], $body['description'] ?? null, $body['location'] ?? null,
        $body['admin_id'] ?? $user['id'], $body['admin_email'] ?? $user['email'],
        encodeJson($body['leaders'] ?? [$user['id']]),
        encodeJson($body['members'] ?? [$user['id']]),
        (int)($body['member_count'] ?? 1),
        $body['status'] ?? 'active',
        $body['founded_date'] ?? date('Y-m-d'),
        $user['id'],
    ]);
    $c = $db->query("SELECT * FROM clans WHERE id = '$id'")->fetch();
    jsonResponse(decodeClan($c), 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    $user = requireAuth();
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');
    $allowed = ['name','description','location','members','leaders','member_count','points','status','avatar','cover_image'];
    $updates = []; $params = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) {
            $updates[] = "$f = ?";
            $params[] = in_array($f, ['members','leaders']) ? encodeJson($body[$f]) : $body[$f];
        }
    }
    if ($updates) {
        $params[] = $id;
        $db->prepare('UPDATE clans SET ' . implode(',', $updates) . ', updated_date=NOW() WHERE id=?')->execute($params);
    }
    $stmt = $db->prepare('SELECT * FROM clans WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(decodeClan($stmt->fetch()));
}

jsonError('Method not allowed', 405);