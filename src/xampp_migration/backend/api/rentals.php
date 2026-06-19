<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

function decodeRental(array $row): array {
    $row['images'] = decodeJson($row['images']) ?? [];
    return $row;
}

if ($method === 'GET') {
    requireAuth();
    $where=['1=1']; $params=[];
    foreach(['category','owner_id','status'] as $f) if(!empty($_GET[$f])){ $where[]="$f=?"; $params[]=$_GET[$f]; }
    $stmt=$db->prepare('SELECT * FROM rental_listings WHERE '.implode(' AND ',$where).' ORDER BY created_date DESC');
    $stmt->execute($params);
    jsonResponse(array_map('decodeRental', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = getRequestBody();
    $id   = uuid();
    $db->prepare(
        'INSERT INTO rental_listings (id,title,description,category,daily_rate,weekly_rate,images,
         owner_id,owner_name,owner_avatar,location,available_from,available_to,status,
         created_by_id,created_date,updated_date) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())'
    )->execute([
        $id,$body['title'],$body['description']??null,$body['category']??'gear',
        (float)($body['daily_rate']??0),(float)($body['weekly_rate']??0),
        encodeJson($body['images']??[]),$user['id'],$user['full_name'],
        $user['avatar']??null,$body['location']??null,
        $body['available_from']??null,$body['available_to']??null,
        $body['status']??'available',$user['id'],
    ]);
    jsonResponse(decodeRental($db->query("SELECT * FROM rental_listings WHERE id='$id'")->fetch()), 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    requireAuth();
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');
    $allowed=['title','description','daily_rate','weekly_rate','images','status','available_from','available_to'];
    $updates=[]; $params=[];
    foreach($allowed as $f){ if(array_key_exists($f,$body)){ $updates[]="$f=?"; $params[]=$f==='images'?encodeJson($body[$f]):$body[$f]; } }
    if($updates){ $params[]=$id; $db->prepare('UPDATE rental_listings SET '.implode(',',$updates).',updated_date=NOW() WHERE id=?')->execute($params); }
    $stmt=$db->prepare('SELECT * FROM rental_listings WHERE id=?'); $stmt->execute([$id]);
    jsonResponse(decodeRental($stmt->fetch()));
}

if ($method === 'DELETE') {
    $user = requireAuth();
    $id   = $_GET['id'] ?? null;
    if (!$id) jsonError('id required');
    $db->prepare('DELETE FROM rental_listings WHERE id=? AND owner_id=?')->execute([$id,$user['id']]);
    jsonSuccess('Deleted');
}

jsonError('Method not allowed', 405);