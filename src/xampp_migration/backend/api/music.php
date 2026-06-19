<?php
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
    $where=['1=1']; $params=[];
    if (!empty($_GET['genre']))   { $where[]='genre=?';   $params[]=$_GET['genre']; }
    if (!empty($_GET['source']))  { $where[]='source=?';  $params[]=$_GET['source']; }
    if (!empty($_GET['search'])) {
        $where[] = '(title LIKE ? OR artist LIKE ?)';
        $s='%'.$_GET['search'].'%'; $params[]=$s; $params[]=$s;
    }
    $limit = min((int)($_GET['limit']??50),200);
    $stmt = $db->prepare('SELECT * FROM music WHERE '.implode(' AND ',$where).' ORDER BY title ASC LIMIT '.$limit);
    $stmt->execute($params);
    jsonResponse($stmt->fetchAll());
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = getRequestBody();
    $id   = uuid();
    $db->prepare(
        'INSERT INTO music (id,title,artist,duration_seconds,source,url,genre,cover_art,created_by_id,created_date,updated_date)
         VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())'
    )->execute([
        $id,$body['title'],$body['artist']??null,(int)($body['duration_seconds']??0),
        $body['source']??'none',$body['url']??null,$body['genre']??null,
        $body['cover_art']??null,$user['id'],
    ]);
    jsonResponse($db->query("SELECT * FROM music WHERE id='$id'")->fetch(), 201);
}

if ($method === 'DELETE') {
    $user = requireAuth();
    if ($user['role'] !== 'admin') jsonError('Forbidden',403);
    $id = $_GET['id'] ?? null;
    if (!$id) jsonError('id required');
    $db->prepare('DELETE FROM music WHERE id=?')->execute([$id]);
    jsonSuccess('Deleted');
}

jsonError('Method not allowed', 405);