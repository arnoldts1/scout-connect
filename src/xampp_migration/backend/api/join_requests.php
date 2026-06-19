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
    foreach(['target_id','requester_id','status','target_type'] as $f)
        if(!empty($_GET[$f])){ $where[]="$f=?"; $params[]=$_GET[$f]; }
    $stmt=$db->prepare('SELECT * FROM join_requests WHERE '.implode(' AND ',$where).' ORDER BY created_date DESC');
    $stmt->execute($params);
    jsonResponse($stmt->fetchAll());
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = getRequestBody();
    // Prevent duplicates
    $dup=$db->prepare('SELECT id FROM join_requests WHERE requester_id=? AND target_id=? AND status="pending"');
    $dup->execute([$user['id'],$body['target_id']]);
    if ($dup->fetch()) jsonError('Request already pending', 409);
    $id = uuid();
    $db->prepare(
        'INSERT INTO join_requests (id,requester_id,requester_name,requester_avatar,target_id,target_name,target_type,message,status,created_by_id,created_date,updated_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,NOW(),NOW())'
    )->execute([
        $id,$user['id'],$user['full_name'],$user['avatar']??null,
        $body['target_id'],$body['target_name']??null,$body['target_type']??'clan',
        $body['message']??null,'pending',$user['id'],
    ]);
    jsonResponse($db->query("SELECT * FROM join_requests WHERE id='$id'")->fetch(), 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    requireAuth();
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');
    $status = $body['status'] ?? 'pending';
    $db->prepare('UPDATE join_requests SET status=?,updated_date=NOW() WHERE id=?')->execute([$status,$id]);
    jsonSuccess('Updated');
}

if ($method === 'DELETE') {
    $user = requireAuth();
    $id   = $_GET['id'] ?? null;
    if (!$id) jsonError('id required');
    $db->prepare('DELETE FROM join_requests WHERE id=? AND requester_id=?')->execute([$id,$user['id']]);
    jsonSuccess('Deleted');
}

jsonError('Method not allowed', 405);