<?php
/**
 * /backend/api/messages.php
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

function decodeMsgJson(array $row): array {
    foreach (['reactions','read_by','delivered_to','deleted_for'] as $f) {
        $row[$f] = decodeJson($row[$f]) ?? [];
    }
    return $row;
}

if ($method === 'GET') {
    $convId = $_GET['conversation_id'] ?? null;
    if (!$convId) jsonError('conversation_id required');

    $limit = min((int)($_GET['limit'] ?? 200), 500);
    $stmt  = $db->prepare(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_date ASC LIMIT ' . $limit
    );
    $stmt->execute([$convId]);
    jsonResponse(array_map('decodeMsgJson', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $body = getRequestBody();
    $id   = uuid();

    $stmt = $db->prepare(
        'INSERT INTO messages (id, conversation_id, sender_id, sender_name, sender_avatar,
         content, media_url, media_type, reply_to, reply_preview,
         reactions, read_by, delivered_to, deleted_for, is_deleted, created_by_id, created_date, updated_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,0,?,NOW(),NOW())'
    );
    $stmt->execute([
        $id,
        $body['conversation_id'],
        $user['id'],
        $user['full_name'],
        $user['avatar'],
        $body['content'] ?? null,
        $body['media_url'] ?? null,
        $body['media_type'] ?? 'text',
        $body['reply_to'] ?? null,
        $body['reply_preview'] ?? null,
        encodeJson($body['reactions'] ?? []),
        encodeJson($body['read_by'] ?? [$user['id']]),
        encodeJson($body['delivered_to'] ?? [$user['id']]),
        encodeJson($body['deleted_for'] ?? []),
        $user['id'],
    ]);

    $m = $db->query("SELECT * FROM messages WHERE id = '$id'")->fetch();
    jsonResponse(decodeMsgJson($m), 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');

    $allowed = ['content','reactions','read_by','is_deleted','deleted_for'];
    $updates = [];
    $params  = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) {
            $updates[] = "$f = ?";
            $params[] = in_array($f, ['reactions','read_by','deleted_for']) ? encodeJson($body[$f]) : $body[$f];
        }
    }
    if ($updates) {
        $params[] = $id;
        $db->prepare('UPDATE messages SET ' . implode(',', $updates) . ', updated_date=NOW() WHERE id=?')
           ->execute($params);
    }
    $stmt = $db->prepare('SELECT * FROM messages WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(decodeMsgJson($stmt->fetch()));
}

jsonError('Method not allowed', 405);