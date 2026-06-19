<?php
/**
 * /backend/api/badges.php  and  /backend/api/user_badges.php
 * Handles: Badge, UserBadge, BadgeRequest entities
 */
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');

$method   = $_SERVER['REQUEST_METHOD'];
$db       = getDB();
$user     = requireAuth();
$resource = $_GET['resource'] ?? 'badge'; // badge | user_badge | badge_request

// ─── BADGE ────────────────────────────────────────────────
if ($resource === 'badge') {
    if ($method === 'GET') {
        $stmt = $db->query('SELECT * FROM badges ORDER BY name ASC');
        jsonResponse($stmt->fetchAll());
    }
    if ($method === 'POST') {
        if ($user['role'] !== 'admin') jsonError('Forbidden', 403);
        $body = getRequestBody();
        $id   = uuid();
        $db->prepare(
            'INSERT INTO badges (id,name,description,icon,category,level,points,created_by_id,created_date,updated_date)
             VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())'
        )->execute([$id,$body['name'],$body['description']??null,$body['icon']??null,
                    $body['category']??'skills',$body['level']??'bronze',(int)($body['points']??10),$user['id']]);
        jsonResponse($db->query("SELECT * FROM badges WHERE id='$id'")->fetch(), 201);
    }
}

// ─── USER_BADGE ───────────────────────────────────────────
if ($resource === 'user_badge') {
    if ($method === 'GET') {
        $where = ['1=1']; $params = [];
        if (!empty($_GET['user_id'])) { $where[] = 'user_id=?'; $params[] = $_GET['user_id']; }
        if (!empty($_GET['status']))  { $where[] = 'status=?';  $params[] = $_GET['status']; }
        $sort = str_starts_with($_GET['sort']??'', '-') ? 'DESC' : 'ASC';
        $stmt = $db->prepare('SELECT * FROM user_badges WHERE '.implode(' AND ',$where).' ORDER BY created_date '.$sort);
        $stmt->execute($params);
        jsonResponse($stmt->fetchAll());
    }
    if ($method === 'POST') {
        $body = getRequestBody();
        $id   = uuid();
        $db->prepare(
            'INSERT INTO user_badges (id,user_id,badge_id,badge_name,badge_icon,earned_date,status,created_by_id,created_date,updated_date)
             VALUES (?,?,?,?,?,?,?,?,NOW(),NOW())'
        )->execute([$id,$body['user_id'],$body['badge_id']??null,$body['badge_name']??null,
                    $body['badge_icon']??null,$body['earned_date']??date('Y-m-d'),
                    $body['status']??'earned',$user['id']]);
        jsonResponse($db->query("SELECT * FROM user_badges WHERE id='$id'")->fetch(), 201);
    }
}

// ─── BADGE_REQUEST ────────────────────────────────────────
if ($resource === 'badge_request') {
    if ($method === 'GET') {
        $where = ['1=1']; $params = [];
        if (!empty($_GET['status'])) { $where[] = 'status=?'; $params[] = $_GET['status']; }
        if (!empty($_GET['requester_id'])) { $where[] = 'requester_id=?'; $params[] = $_GET['requester_id']; }
        $stmt = $db->prepare('SELECT * FROM badge_requests WHERE '.implode(' AND ',$where).' ORDER BY created_date DESC');
        $stmt->execute($params);
        jsonResponse($stmt->fetchAll());
    }
    if ($method === 'POST') {
        $body = getRequestBody();
        $id   = uuid();
        $db->prepare(
            'INSERT INTO badge_requests (id,requester_id,requester_name,badge_id,badge_name,request_type,reason,status,created_by_id,created_date,updated_date)
             VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())'
        )->execute([$id,$user['id'],$user['full_name'],$body['badge_id']??null,
                    $body['badge_name']??null,$body['request_type']??'earn',
                    $body['reason']??null,'pending',$user['id']]);
        jsonResponse($db->query("SELECT * FROM badge_requests WHERE id='$id'")->fetch(), 201);
    }
    if ($method === 'PATCH' || $method === 'PUT') {
        if ($user['role'] !== 'admin') jsonError('Forbidden', 403);
        $body = getRequestBody();
        $id   = $_GET['id'] ?? $body['id'] ?? null;
        if (!$id) jsonError('id required');
        $db->prepare('UPDATE badge_requests SET status=?,updated_date=NOW() WHERE id=?')
           ->execute([$body['status']??'pending', $id]);
        jsonSuccess('Updated');
    }
}

jsonError('Method not allowed', 405);