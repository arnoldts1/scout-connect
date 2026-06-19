<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');
$method = $_SERVER['REQUEST_METHOD'];
$db     = getDB();

function decodeComment(array $row): array {
    $row['likes'] = decodeJson($row['likes']) ?? [];
    return $row;
}

if ($method === 'GET') {
    requireAuth();
    $postId = $_GET['post_id'] ?? null;
    if (!$postId) jsonError('post_id required');
    $stmt = $db->prepare('SELECT * FROM comments WHERE post_id=? ORDER BY created_date ASC');
    $stmt->execute([$postId]);
    jsonResponse(array_map('decodeComment', $stmt->fetchAll()));
}

if ($method === 'POST') {
    $user = requireAuth();
    $body = getRequestBody();
    if (empty($body['post_id']) || empty($body['content'])) jsonError('post_id and content required');
    $id = uuid();
    $db->prepare(
        'INSERT INTO comments (id,post_id,author_id,author_name,author_avatar,content,likes,parent_id,created_by_id,created_date,updated_date)
         VALUES (?,?,?,?,?,?,?,?,?,NOW(),NOW())'
    )->execute([
        $id,$body['post_id'],$user['id'],$user['full_name'],$user['avatar']??null,
        $body['content'],encodeJson([]),$body['parent_id']??null,$user['id'],
    ]);
    // Increment post comments_count
    $db->prepare('UPDATE posts SET comments_count = comments_count+1, updated_date=NOW() WHERE id=?')->execute([$body['post_id']]);
    jsonResponse(decodeComment($db->query("SELECT * FROM comments WHERE id='$id'")->fetch()), 201);
}

if ($method === 'PATCH') {
    $user = requireAuth();
    $body = getRequestBody();
    $id   = $_GET['id'] ?? $body['id'] ?? null;
    if (!$id) jsonError('id required');
    // Toggle like
    if (isset($body['toggle_like'])) {
        $stmt = $db->prepare('SELECT likes FROM comments WHERE id=?'); $stmt->execute([$id]);
        $row  = $stmt->fetch();
        $likes = decodeJson($row['likes']) ?? [];
        $uid = $body['toggle_like'];
        if (in_array($uid, $likes)) $likes = array_values(array_diff($likes, [$uid]));
        else $likes[] = $uid;
        $db->prepare('UPDATE comments SET likes=?,updated_date=NOW() WHERE id=?')->execute([encodeJson($likes),$id]);
        jsonSuccess('Done');
    }
    jsonError('No action');
}

if ($method === 'DELETE') {
    $user = requireAuth();
    $id   = $_GET['id'] ?? null;
    if (!$id) jsonError('id required');
    $stmt = $db->prepare('SELECT post_id FROM comments WHERE id=? AND author_id=?');
    $stmt->execute([$id, $user['id']]);
    $c = $stmt->fetch();
    if ($c) {
        $db->prepare('DELETE FROM comments WHERE id=?')->execute([$id]);
        $db->prepare('UPDATE posts SET comments_count = GREATEST(0, comments_count-1), updated_date=NOW() WHERE id=?')->execute([$c['post_id']]);
    }
    jsonSuccess('Deleted');
}

jsonError('Method not allowed', 405);