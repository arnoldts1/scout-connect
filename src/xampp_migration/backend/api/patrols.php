<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

function decodePatrol(array $row): array {
    $row['members'] = decodeJson($row['members']) ?? [];
    $row['badges']  = decodeJson($row['badges'])  ?? [];
    return $row;
}

if ($method === 'GET') {
    requireAuth();
    $where=['1=1']; $params=[];
    if (!empty($_GET['clan_id'])) { $where[]='clan_id=?'; $params[]=$_GET['clan_id']; }
    if (!empty($_GET['id']))      { $where[]='id=?';      $params[]=$_GET['id']; }
    $stmt=$db->prepare('SELECT * FROM patrols WHERE '.implode(' AND ',$where).' ORDER BY name ASC');
    $stmt->execute($params);
    jsonResponse(array_map('decodePatrol', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = getRequestBody();
    $id   = uuid();
    $db->prepare(
        'INSERT INTO patrols (id,name,slogan,avatar,clan_id,leader_id,assistant_leader_id,
         members,member_count,points,badges,created_by_id,created_date,updated_date)
         VALUES (?,?,?,?,?,?,?,?,?,0,?,?,NOW(),NOW())'
    )->execute([
        $id,$body['name'],$body['slogan']??null,$body['avatar']??null,
        $body['clan_id']??null,$body['leader_id']??$user['id'],
        $body['assistant_leader_id']??null,
        encodeJson($body['members']??[$user['id']]),
        (int)($body['member_count']??1),
        encodeJson($body['badges']??[]),$user['id'],
    ]);
    jsonResponse(decodePatrol($db->query("SELECT * FROM patrols WHERE id='$id'")->fetch()), 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    requireAuth();
    $body=$getRequestBody??getRequestBody();
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');
    $allowed=['name','slogan','avatar','members','member_count','points','badges','leader_id'];
    $updates=[]; $params=[];
    foreach($allowed as $f){ if(array_key_exists($f,$body)){ $updates[]="$f=?"; $params[]=in_array($f,['members','badges'])?encodeJson($body[$f]):$body[$f]; } }
    if($updates){ $params[]=$id; $db->prepare('UPDATE patrols SET '.implode(',',$updates).',updated_date=NOW() WHERE id=?')->execute($params); }
    $stmt=$db->prepare('SELECT * FROM patrols WHERE id=?'); $stmt->execute([$id]);
    jsonResponse(decodePatrol($stmt->fetch()));
}

jsonError('Method not allowed', 405);