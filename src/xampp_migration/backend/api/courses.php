<?php
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();
header('Content-Type: application/json');
$method   = $_SERVER['REQUEST_METHOD'];
$db       = getDB();
$resource = $_GET['resource'] ?? 'course'; // course | lesson | quiz | progress

// ─── COURSES ──────────────────────────────────────────────
if ($resource === 'course') {
    if ($method === 'GET') {
        requireAuth();
        if (!empty($_GET['id'])) {
            $stmt = $db->prepare('SELECT * FROM courses WHERE id=?'); $stmt->execute([$_GET['id']]);
            $c = $stmt->fetch(); if (!$c) jsonError('Not found',404);
            jsonResponse($c);
        }
        $where=['1=1']; $params=[];
        foreach(['category','difficulty','status'] as $f) if(!empty($_GET[$f])){ $where[]="$f=?"; $params[]=$_GET[$f]; }
        $stmt = $db->prepare('SELECT * FROM courses WHERE '.implode(' AND ',$where).' ORDER BY title ASC');
        $stmt->execute($params);
        jsonResponse($stmt->fetchAll());
    }
    if ($method === 'POST') {
        $user = requireAuth();
        if ($user['role'] !== 'admin') jsonError('Forbidden',403);
        $body = getRequestBody();
        $id   = uuid();
        $db->prepare('INSERT INTO courses (id,title,description,category,cover_image,difficulty,
            duration_minutes,xp_reward,badge_id,lessons_count,enrollments_count,status,created_by_id,created_date,updated_date)
            VALUES (?,?,?,?,?,?,?,?,?,0,0,?,?,NOW(),NOW())')->execute([
            $id,$body['title'],$body['description']??null,$body['category'],
            $body['cover_image']??null,$body['difficulty']??'beginner',
            (int)($body['duration_minutes']??0),(int)($body['xp_reward']??100),
            $body['badge_id']??null,$body['status']??'published',$user['id'],
        ]);
        jsonResponse($db->query("SELECT * FROM courses WHERE id='$id'")->fetch(), 201);
    }
}

// ─── LESSONS ──────────────────────────────────────────────
if ($resource === 'lesson') {
    if ($method === 'GET') {
        requireAuth();
        $cid = $_GET['course_id'] ?? null;
        if (!$cid) jsonError('course_id required');
        $stmt = $db->prepare('SELECT * FROM lessons WHERE course_id=? ORDER BY `order` ASC');
        $stmt->execute([$cid]);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$r) $r['tasks'] = decodeJson($r['tasks']) ?? [];
        jsonResponse($rows);
    }
    if ($method === 'POST') {
        $user = requireAuth();
        if ($user['role'] !== 'admin') jsonError('Forbidden',403);
        $body = getRequestBody();
        $id   = uuid();
        $db->prepare('INSERT INTO lessons (id,course_id,title,content,video_url,pdf_url,`order`,duration_minutes,xp_reward,tasks,created_by_id,created_date,updated_date)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,NOW(),NOW())')->execute([
            $id,$body['course_id'],$body['title'],$body['content']??null,
            $body['video_url']??null,$body['pdf_url']??null,
            (int)($body['order']??0),(int)($body['duration_minutes']??0),
            (int)($body['xp_reward']??20),encodeJson($body['tasks']??[]),$user['id'],
        ]);
        jsonResponse($db->query("SELECT * FROM lessons WHERE id='$id'")->fetch(), 201);
    }
}

// ─── PROGRESS ─────────────────────────────────────────────
if ($resource === 'progress') {
    $user = requireAuth();
    if ($method === 'GET') {
        $where=['1=1']; $params=[];
        if(!empty($_GET['user_id'])){ $where[]='user_id=?'; $params[]=$_GET['user_id']; }
        if(!empty($_GET['course_id'])){ $where[]='course_id=?'; $params[]=$_GET['course_id']; }
        $stmt=$db->prepare('SELECT * FROM scout_progress WHERE '.implode(' AND ',$where));
        $stmt->execute($params);
        $rows=$stmt->fetchAll();
        foreach($rows as &$r){ $r['completed_lessons']=decodeJson($r['completed_lessons'])??[]; $r['quiz_scores']=decodeJson($r['quiz_scores'])??[]; }
        jsonResponse($rows);
    }
    if ($method === 'POST') {
        $body = getRequestBody();
        $existing = $db->prepare('SELECT id FROM scout_progress WHERE user_id=? AND course_id=?');
        $existing->execute([$user['id'], $body['course_id']]);
        $ex = $existing->fetch();
        if ($ex) {
            $allowed=['completed_lessons','quiz_scores','progress_percent','xp_earned','status','completed_at'];
            $updates=[]; $params=[];
            foreach($allowed as $f){ if(array_key_exists($f,$body)){ $updates[]="$f=?"; $params[]=in_array($f,['completed_lessons','quiz_scores'])?encodeJson($body[$f]):$body[$f]; } }
            if($updates){ $params[]=$ex['id']; $db->prepare('UPDATE scout_progress SET '.implode(',',$updates).',updated_date=NOW() WHERE id=?')->execute($params); }
            $stmt=$db->prepare('SELECT * FROM scout_progress WHERE id=?'); $stmt->execute([$ex['id']]);
            $r=$stmt->fetch(); $r['completed_lessons']=decodeJson($r['completed_lessons'])??[]; $r['quiz_scores']=decodeJson($r['quiz_scores'])??[];
            jsonResponse($r);
        }
        $id = uuid();
        $db->prepare('INSERT INTO scout_progress (id,user_id,course_id,completed_lessons,quiz_scores,progress_percent,xp_earned,status,created_by_id,created_date,updated_date)
            VALUES (?,?,?,?,?,0,0,?,?,NOW(),NOW())')->execute([
            $id,$user['id'],$body['course_id'],encodeJson([]),encodeJson([]),
            $body['status']??'enrolled',$user['id'],
        ]);
        jsonResponse(['id'=>$id,'user_id'=>$user['id'],'course_id'=>$body['course_id'],'status'=>'enrolled','completed_lessons'=>[],'quiz_scores'=>[],'progress_percent'=>0,'xp_earned'=>0], 201);
    }
}

jsonError('Method not allowed', 405);