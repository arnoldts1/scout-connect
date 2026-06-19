<?php
/**
 * /backend/api/conversations.php
 * Direct & group conversations
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

function decodeConvJson(array $row): array {
    foreach (['participants','participant_details','unread_count','typing_users'] as $f) {
        $row[$f] = decodeJson($row[$f]);
    }
    return $row;
}

if ($method === 'GET') {
    if (!empty($_GET['id'])) {
        $stmt = $db->prepare('SELECT * FROM conversations WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        $c = $stmt->fetch();
        if (!$c) jsonError('Not found', 404);
        jsonResponse(decodeConvJson($c));
    }

    // List all conversations for current user (JSON_CONTAINS)
    $stmt = $db->prepare(
        "SELECT * FROM conversations 
         WHERE JSON_CONTAINS(participants, JSON_QUOTE(?))
         ORDER BY last_message_at DESC, created_date DESC
         LIMIT 50"
    );
    $stmt->execute([$user['id']]);
    jsonResponse(array_map('decodeConvJson', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $body = getRequestBody();
    $id   = uuid();

    $stmt = $db->prepare(
        'INSERT INTO conversations (id, type, participants, participant_details,
         group_name, group_avatar, unread_count, created_by_id, created_date, updated_date)
         VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())'
    );
    $stmt->execute([
        $id,
        $body['type'] ?? 'direct',
        encodeJson($body['participants'] ?? [$user['id']]),
        encodeJson($body['participant_details'] ?? []),
        $body['group_name'] ?? null,
        $body['group_avatar'] ?? null,
        encodeJson($body['unread_count'] ?? (object)[]),
        $user['id'],
    ]);

    $c = $db->query("SELECT * FROM conversations WHERE id = '$id'")->fetch();
    jsonResponse(decodeConvJson($c), 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');

    $allowed = ['last_message','last_message_at','last_sender_id','unread_count',
                'typing_users','call_signal','group_name','group_avatar','participants'];
    $updates = [];
    $params  = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f, $body)) {
            $updates[] = "$f = ?";
            $params[] = in_array($f, ['unread_count','typing_users','participants'])
                ? encodeJson($body[$f]) : $body[$f];
        }
    }

    if ($updates) {
        $params[] = $id;
        $db->prepare('UPDATE conversations SET ' . implode(',', $updates) . ', updated_date=NOW() WHERE id=?')
           ->execute($params);
    }

    $stmt = $db->prepare('SELECT * FROM conversations WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(decodeConvJson($stmt->fetch()));
}

jsonError('Method not allowed', 405);