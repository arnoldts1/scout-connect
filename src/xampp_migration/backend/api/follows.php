<?php
/**
 * /backend/api/follows.php
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

if ($method === 'GET') {
    $where  = ['1=1'];
    $params = [];
    if (!empty($_GET['follower_id'])) { $where[] = 'follower_id = ?'; $params[] = $_GET['follower_id']; }
    if (!empty($_GET['following_id'])) { $where[] = 'following_id = ?'; $params[] = $_GET['following_id']; }
    $stmt = $db->prepare('SELECT * FROM follows WHERE ' . implode(' AND ', $where));
    $stmt->execute($params);
    jsonResponse($stmt->fetchAll());
}

if ($method === 'POST') {
    $body = getRequestBody();
    $id   = uuid();
    $stmt = $db->prepare(
        'INSERT IGNORE INTO follows (id, follower_id, following_id, follower_name, following_name, created_by_id, created_date)
         VALUES (?,?,?,?,?,?,NOW())'
    );
    $stmt->execute([
        $id, $user['id'],
        $body['following_id'],
        $user['full_name'],
        $body['following_name'] ?? null,
        $user['id'],
    ]);
    $f = $db->query("SELECT * FROM follows WHERE id = '$id'")->fetch();
    jsonResponse($f, 201);
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        // Allow delete by follower+following pair
        $body = getRequestBody();
        $stmt = $db->prepare('DELETE FROM follows WHERE follower_id = ? AND following_id = ?');
        $stmt->execute([$user['id'], $body['following_id'] ?? '']);
        jsonSuccess('Unfollowed');
    }
    $db->prepare('DELETE FROM follows WHERE id = ? AND follower_id = ?')->execute([$id, $user['id']]);
    jsonSuccess('Deleted');
}

jsonError('Method not allowed', 405);