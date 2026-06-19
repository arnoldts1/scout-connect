<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');
$db = getDB();
requireAuth();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') jsonError('Method not allowed', 405);

$type  = $_GET['type'] ?? 'users'; // users | clans | units
$limit = min((int)($_GET['limit'] ?? 20), 100);

if ($type === 'users') {
    $stmt = $db->prepare(
        'SELECT u.id, u.full_name, u.avatar, u.rank, u.xp, u.clan_name, u.unit_name,
                COUNT(DISTINCT ub.id) AS badge_count
         FROM users u
         LEFT JOIN user_badges ub ON ub.user_id = u.id AND ub.status = "earned"
         GROUP BY u.id
         ORDER BY u.xp DESC, badge_count DESC
         LIMIT ?'
    );
    $stmt->execute([$limit]);
    jsonResponse($stmt->fetchAll());
}

if ($type === 'clans') {
    $stmt = $db->prepare('SELECT id, name, avatar, points, member_count, location FROM clans WHERE status="active" ORDER BY points DESC LIMIT ?');
    $stmt->execute([$limit]);
    jsonResponse($stmt->fetchAll());
}

if ($type === 'units') {
    $stmt = $db->prepare('SELECT id, name, avatar, points, member_count, location FROM units WHERE status="active" ORDER BY points DESC LIMIT ?');
    $stmt->execute([$limit]);
    jsonResponse($stmt->fetchAll());
}

jsonError('Invalid type');