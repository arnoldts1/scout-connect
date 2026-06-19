<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

function decodeStory(array $row): array {
    $row['viewers'] = decodeJson($row['viewers']) ?? [];
    return $row;
}

if ($method === 'GET') {
    requireAuth();
    $where = ['1=1']; $params = [];
    if (!empty($_GET['author_id'])) { $where[] = 'author_id=?'; $params[] = $_GET['author_id']; }
    // Only active (non-expired) stories by default
    if (($_GET['active'] ?? '1') === '1') { $where[] = '(expires_at IS NULL OR expires_at > NOW())'; }
    $stmt = $db->prepare('SELECT * FROM stories WHERE '.implode(' AND ',$where).' ORDER BY created_date DESC');
    $stmt->execute($params);
    jsonResponse(array_map('decodeStory', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = getRequestBody();
    $id   = uuid();
    $expiresAt = $body['expires_at'] ?? date('Y-m-d H:i:s', strtotime('+24 hours'));
    $db->prepare(
        'INSERT INTO stories (id,author_id,author_name,author_avatar,media_url,media_type,
         expires_at,text_overlay,text_position,text_color,filter,is_highlight,highlight_name,
         music_title,music_artist,music_url,music_source,viewers,created_by_id,created_date,updated_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())'
    )->execute([
        $id,$user['id'],$user['full_name'],$user['avatar']??null,
        $body['media_url'],$body['media_type']??'image',$expiresAt,
        $body['text_overlay']??null,$body['text_position']??'center',
        $body['text_color']??'#ffffff',$body['filter']??null,
        (int)($body['is_highlight']??0),$body['highlight_name']??null,
        $body['music_title']??null,$body['music_artist']??null,
        $body['music_url']??null,$body['music_source']??'none',
        encodeJson([]),$user['id'],
    ]);
    jsonResponse(decodeStory($db->query("SELECT * FROM stories WHERE id='$id'")->fetch()), 201);
}

if ($method === 'PATCH') {
    requireAuth();
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');
    // Add viewer
    if (isset($body['add_viewer'])) {
        $stmt = $db->prepare('SELECT viewers FROM stories WHERE id=?'); $stmt->execute([$id]);
        $row  = $stmt->fetch();
        $viewers = decodeJson($row['viewers']) ?? [];
        if (!in_array($body['add_viewer'], $viewers)) $viewers[] = $body['add_viewer'];
        $db->prepare('UPDATE stories SET viewers=?,updated_date=NOW() WHERE id=?')->execute([encodeJson($viewers),$id]);
        jsonSuccess('Viewer added');
    }
    jsonError('No update action');
}

if ($method === 'DELETE') {
    $user = requireAuth();
    $id   = $_GET['id'] ?? null;
    if (!$id) jsonError('id required');
    $db->prepare('DELETE FROM stories WHERE id=? AND author_id=?')->execute([$id, $user['id']]);
    jsonSuccess('Deleted');
}

jsonError('Method not allowed', 405);