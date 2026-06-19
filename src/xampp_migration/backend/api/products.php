<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

function decodeProduct(array $row): array {
    $row['images'] = decodeJson($row['images']) ?? [];
    return $row;
}

if ($method === 'GET') {
    requireAuth();
    if (!empty($_GET['id'])) {
        $stmt = $db->prepare('SELECT * FROM products WHERE id=?'); $stmt->execute([$_GET['id']]);
        $p = $stmt->fetch(); if (!$p) jsonError('Not found', 404);
        jsonResponse(decodeProduct($p));
    }
    $where = ['1=1']; $params = [];
    foreach (['category','condition','seller_id','status'] as $f)
        if (!empty($_GET[$f])) { $where[] = "$f=?"; $params[] = $_GET[$f]; }
    if (!empty($_GET['search'])) {
        $where[] = '(title LIKE ? OR description LIKE ?)';
        $s = '%'.$_GET['search'].'%'; $params[] = $s; $params[] = $s;
    }
    $limit = min((int)($_GET['limit']??50),200);
    $stmt = $db->prepare('SELECT * FROM products WHERE '.implode(' AND ',$where).' ORDER BY created_date DESC LIMIT '.$limit);
    $stmt->execute($params);
    jsonResponse(array_map('decodeProduct', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = getRequestBody();
    $id   = uuid();
    $db->prepare(
        'INSERT INTO products (id,title,description,price,category,`condition`,images,seller_id,seller_name,
         seller_avatar,location,status,created_by_id,created_date,updated_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())'
    )->execute([
        $id,$body['title'],$body['description']??null,(float)($body['price']??0),
        $body['category']??'gear',$body['condition']??'good',
        encodeJson($body['images']??[]),$user['id'],$user['full_name'],
        $user['avatar']??null,$body['location']??null,$body['status']??'active',$user['id'],
    ]);
    jsonResponse(decodeProduct($db->query("SELECT * FROM products WHERE id='$id'")->fetch()), 201);
}

if ($method === 'PATCH' || $method === 'PUT') {
    requireAuth();
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');
    $allowed = ['title','description','price','category','condition','images','status','location'];
    $updates=[]; $params=[];
    foreach ($allowed as $f) {
        if (array_key_exists($f,$body)) {
            $updates[] = "$f=?";
            $params[] = $f === 'images' ? encodeJson($body[$f]) : $body[$f];
        }
    }
    if ($updates) { $params[]=$id; $db->prepare('UPDATE products SET '.implode(',',$updates).',updated_date=NOW() WHERE id=?')->execute($params); }
    $stmt = $db->prepare('SELECT * FROM products WHERE id=?'); $stmt->execute([$id]);
    jsonResponse(decodeProduct($stmt->fetch()));
}

if ($method === 'DELETE') {
    $user = requireAuth();
    $id   = $_GET['id'] ?? null;
    if (!$id) jsonError('id required');
    $db->prepare('DELETE FROM products WHERE id=? AND seller_id=?')->execute([$id,$user['id']]);
    jsonSuccess('Deleted');
}

jsonError('Method not allowed', 405);