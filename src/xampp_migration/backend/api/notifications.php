<?php
/**
 * /backend/api/notifications.php
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
    $where  = ['user_id = ?'];
    $params = [$user['id']];

    if (isset($_GET['is_read'])) {
        $where[]  = 'is_read = ?';
        $params[] = (int)$_GET['is_read'];
    }

    $limit = min((int)($_GET['limit'] ?? 50), 100);
    $sql   = 'SELECT * FROM notifications WHERE ' . implode(' AND ', $where)
           . ' ORDER BY created_date DESC LIMIT ' . $limit;
    $stmt  = $db->prepare($sql);
    $stmt->execute($params);
    jsonResponse($stmt->fetchAll());
}

if ($method === 'POST') {
    $body = getRequestBody();
    $id   = uuid();

    // Admin can broadcast to other users; others can only create for themselves
    $targetUserId = $body['user_id'] ?? $user['id'];
    if ($targetUserId !== $user['id'] && $user['role'] !== 'admin') {
        $targetUserId = $user['id'];
    }

    $stmt = $db->prepare(
        'INSERT INTO notifications (id, user_id, type, title, message, actor_id,
         actor_name, actor_avatar, reference_id, reference_type, is_read, created_by_id,
         created_date, updated_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,0,?,NOW(),NOW())'
    );
    $stmt->execute([
        $id,
        $targetUserId,
        $body['type'] ?? 'system',
        $body['title'] ?? null,
        $body['message'] ?? '',
        $body['actor_id'] ?? $user['id'],
        $body['actor_name'] ?? $user['full_name'],
        $body['actor_avatar'] ?? $user['avatar'],
        $body['reference_id'] ?? null,
        $body['reference_type'] ?? null,
        $user['id'],
    ]);

    $n = $db->query("SELECT * FROM notifications WHERE id = '$id'")->fetch();
    jsonResponse($n, 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');

    // Mark as read
    $db->prepare(
        'UPDATE notifications SET is_read = ?, updated_date = NOW() WHERE id = ? AND user_id = ?'
    )->execute([(int)($body['is_read'] ?? 1), $id, $user['id']]);

    jsonSuccess('Updated');
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) jsonError('id required');
    $db->prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?')->execute([$id, $user['id']]);
    jsonSuccess('Deleted');
}

jsonError('Method not allowed', 405);