<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

function decodeEvent(array $row): array {
    $row['participants'] = decodeJson($row['participants']) ?? [];
    return $row;
}

if ($method === 'GET') {
    requireAuth();
    if (!empty($_GET['id'])) {
        $stmt = $db->prepare('SELECT * FROM events WHERE id=?');
        $stmt->execute([$_GET['id']]);
        $e = $stmt->fetch();
        if (!$e) jsonError('Not found', 404);
        jsonResponse(decodeEvent($e));
    }
    $where = ['1=1']; $params = [];
    foreach (['status','organizer_id','clan_id'] as $f)
        if (!empty($_GET[$f])) { $where[] = "$f=?"; $params[] = $_GET[$f]; }
    $limit = min((int)($_GET['limit'] ?? 50), 200);
    $stmt = $db->prepare('SELECT * FROM events WHERE '.implode(' AND ',$where).' ORDER BY start_date DESC LIMIT '.$limit);
    $stmt->execute($params);
    jsonResponse(array_map('decodeEvent', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = getRequestBody();
    $id   = uuid();
    $db->prepare(
        'INSERT INTO events (id,title,description,event_type,organizer_id,organizer_name,location,
         start_date,end_date,cover_image,max_participants,participants,participant_count,status,clan_id,
         created_by_id,created_date,updated_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,NOW(),NOW())'
    )->execute([
        $id,$body['title'],$body['description']??null,$body['event_type']??'other',
        $user['id'],$user['full_name'],$body['location']??null,
        $body['start_date'],$body['end_date']??null,$body['cover_image']??null,
        (int)($body['max_participants']??0),encodeJson($body['participants']??[]),
        $body['status']??'pending',$body['clan_id']??null,$user['id'],
    ]);
    jsonResponse(decodeEvent($db->query("SELECT * FROM events WHERE id='$id'")->fetch()), 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    requireAuth();
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');
    $allowed = ['title','description','status','start_date','end_date','location','participants','participant_count','cover_image'];
    $updates = []; $params = [];
    foreach ($allowed as $f) {
        if (array_key_exists($f,$body)) {
            $updates[] = "$f=?";
            $params[] = $f === 'participants' ? encodeJson($body[$f]) : $body[$f];
        }
    }
    if ($updates) { $params[]=$id; $db->prepare('UPDATE events SET '.implode(',',$updates).',updated_date=NOW() WHERE id=?')->execute($params); }
    $stmt = $db->prepare('SELECT * FROM events WHERE id=?'); $stmt->execute([$id]);
    jsonResponse(decodeEvent($stmt->fetch()));
}

if ($method === 'DELETE') {
    $user = requireAuth();
    $id   = $_GET['id'] ?? null;
    if (!$id) jsonError('id required');
    $db->prepare('DELETE FROM events WHERE id=? AND organizer_id=?')->execute([$id, $user['id']]);
    jsonSuccess('Deleted');
}

jsonError('Method not allowed', 405);