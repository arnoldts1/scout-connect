<?php
/**
 * /backend/api/posts.php
 * CRUD for Posts entity
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

// ─── GET ───────────────────────────────────────────────────
if ($method === 'GET') {
    $user = requireAuth();

    // Single post
    if (!empty($_GET['id'])) {
        $stmt = $db->prepare('SELECT * FROM posts WHERE id = ?');
        $stmt->execute([$_GET['id']]);
        $post = $stmt->fetch();
        if (!$post) jsonError('Post not found', 404);
        $post = decodePostJson($post);
        jsonResponse($post);
    }

    // Build filter query
    $where  = ['1=1'];
    $params = [];

    if (!empty($_GET['status'])) {
        $where[]  = 'status = ?';
        $params[] = $_GET['status'];
    }
    if (!empty($_GET['author_id'])) {
        $where[]  = 'author_id = ?';
        $params[] = $_GET['author_id'];
    }
    if (!empty($_GET['unit_id'])) {
        $where[]  = 'unit_id = ?';
        $params[] = $_GET['unit_id'];
    }
    if (!empty($_GET['clan_id'])) {
        $where[]  = 'clan_id = ?';
        $params[] = $_GET['clan_id'];
    }

    $sort  = str_starts_with($_GET['sort'] ?? '', '-') ? 'DESC' : 'ASC';
    $sortField = ltrim($_GET['sort'] ?? '-created_date', '-');
    $allowedSort = ['created_date', 'updated_date', 'likes_count', 'comments_count'];
    if (!in_array($sortField, $allowedSort)) $sortField = 'created_date';

    $limit = min((int)($_GET['limit'] ?? 50), 200);

    $sql = 'SELECT * FROM posts WHERE ' . implode(' AND ', $where)
         . " ORDER BY $sortField $sort LIMIT $limit";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $posts = array_map('decodePostJson', $stmt->fetchAll());
    jsonResponse($posts);
}

// ─── POST ──────────────────────────────────────────────────
if ($method === 'POST') {
    $user = requireAuth();
    $body = getRequestBody();

    $id = uuid();
    $status = $body['status'] ?? 'pending';

    $stmt = $db->prepare(
        'INSERT INTO posts (id, author_id, author_name, author_avatar, content, media_urls,
         media_type, status, is_unit_post, unit_id, clan_id, work_category, points_awarded,
         likes_count, comments_count, music_id, music_title, location, tags, created_by_id,
         created_date, updated_date)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,0,0,?,?,?,?,?,NOW(),NOW())'
    );
    $stmt->execute([
        $id,
        $user['id'],
        $user['full_name'],
        $user['avatar'],
        $body['content'] ?? null,
        encodeJson($body['media_urls'] ?? []),
        $body['media_type'] ?? 'image',
        $status,
        (int)($body['is_unit_post'] ?? 0),
        $body['unit_id'] ?? null,
        $body['clan_id'] ?? null,
        $body['work_category'] ?? 'none',
        (int)($body['points_awarded'] ?? 0),
        $body['music_id'] ?? null,
        $body['music_title'] ?? null,
        $body['location'] ?? null,
        encodeJson($body['tags'] ?? []),
        $user['id'],
    ]);

    $post = $db->query("SELECT * FROM posts WHERE id = '$id'")->fetch();
    jsonResponse(decodePostJson($post), 201);
}

// ─── PUT / PATCH ───────────────────────────────────────────
if ($method === 'PUT' || $method === 'PATCH') {
    $user = requireAuth();
    $body = getRequestBody();

    $id = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id is required');

    // Check permission
    $existing = $db->prepare('SELECT * FROM posts WHERE id = ?');
    $existing->execute([$id]);
    $post = $existing->fetch();
    if (!$post) jsonError('Post not found', 404);
    if ($post['author_id'] !== $user['id'] && $user['role'] !== 'admin') {
        jsonError('Forbidden', 403);
    }

    $allowed = ['content','media_urls','status','work_category','points_awarded',
                'likes_count','comments_count','location','music_id','music_title','tags'];
    $updates = [];
    $params  = [];

    foreach ($allowed as $field) {
        if (array_key_exists($field, $body)) {
            $updates[] = "$field = ?";
            $val = in_array($field, ['media_urls','tags']) ? encodeJson($body[$field]) : $body[$field];
            $params[] = $val;
        }
    }

    if (!empty($updates)) {
        $params[] = $id;
        $sql = 'UPDATE posts SET ' . implode(', ', $updates) . ', updated_date=NOW() WHERE id=?';
        $db->prepare($sql)->execute($params);
    }

    $stmt = $db->prepare('SELECT * FROM posts WHERE id = ?');
    $stmt->execute([$id]);
    jsonResponse(decodePostJson($stmt->fetch()));
}

// ─── DELETE ────────────────────────────────────────────────
if ($method === 'DELETE') {
    $user = requireAuth();
    $id   = $_GET['id'] ?? null;
    if (!$id) jsonError('id is required');

    $stmt = $db->prepare('SELECT author_id FROM posts WHERE id = ?');
    $stmt->execute([$id]);
    $post = $stmt->fetch();
    if (!$post) jsonError('Not found', 404);
    if ($post['author_id'] !== $user['id'] && $user['role'] !== 'admin') jsonError('Forbidden', 403);

    $db->prepare('DELETE FROM posts WHERE id = ?')->execute([$id]);
    jsonSuccess('Post deleted');
}

jsonError('Method not allowed', 405);

// ─── Helper ────────────────────────────────────────────────
function decodePostJson(array $row): array {
    $row['media_urls'] = decodeJson($row['media_urls']) ?? [];
    $row['tags']       = decodeJson($row['tags']) ?? [];
    return $row;
}