<?php
/**
 * Front-controller / router
 * Maps  /api/{resource}  →  api/{resource}.php
 * Maps  /auth/{action}   →  auth/{action}.php
 *
 * Example URL patterns (Apache mod_rewrite via .htaccess rewrites to this file):
 *   GET  /api/posts            → api/posts.php
 *   GET  /api/posts?id=xyz     → api/posts.php  (single record)
 *   POST /auth/login           → auth/login.php
 */

require_once __DIR__ . '/config/cors.php';
require_once __DIR__ . '/utils/response.php';

setCorsHeaders();

// Parse the request URI relative to the backend root
$uri    = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$base   = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$path   = ltrim(substr($uri, strlen($base)), '/');   // e.g. "api/posts" or "auth/login"
$parts  = explode('/', $path, 3);                    // [segment0, segment1, ...]

$section  = $parts[0] ?? '';   // "api" | "auth"
$resource = $parts[1] ?? '';   // "posts" | "login" …

$allowed = [
    'api'  => ['posts','notifications','conversations','messages','users','upload',
               'follows','units','clans','public_profiles','badges','events',
               'stories','comments','products','courses','music','rentals',
               'leaderboard','patrols','join_requests'],
    'auth' => ['login','register','me','logout','forgot_password','reset_password'],
];

if (!isset($allowed[$section]) || !in_array($resource, $allowed[$section])) {
    header('Content-Type: application/json');
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => "Route /{$section}/{$resource} not found"]);
    exit;
}

$file = __DIR__ . "/{$section}/{$resource}.php";
if (!file_exists($file)) {
    header('Content-Type: application/json');
    http_response_code(501);
    echo json_encode(['success' => false, 'message' => 'Not implemented']);
    exit;
}

require $file;