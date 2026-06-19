<?php
/**
 * POST /backend/api/upload.php
 * Generic file upload endpoint (replaces base44.integrations.Core.UploadFile)
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../utils/response.php';
require_once __DIR__ . '/../utils/upload.php';
require_once __DIR__ . '/../middleware/auth.php';

setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Method not allowed', 405);
}

$user = requireAuth();

if (empty($_FILES['file'])) {
    jsonError('No file uploaded');
}

$subfolder = sanitize($_POST['subfolder'] ?? 'general');
// Prevent directory traversal
$subfolder = preg_replace('/[^a-z0-9_\-]/', '', $subfolder) ?: 'general';

$file     = $_FILES['file'];
$mimeType = mime_content_type($file['tmp_name']);

// Determine allowed types from context
$allAllowed = array_merge(ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, ALLOWED_AUDIO_TYPES, ['application/pdf']);

try {
    $url = handleFileUpload($file, $subfolder, $allAllowed);
    jsonResponse(['file_url' => $url]);
} catch (RuntimeException $e) {
    jsonError($e->getMessage(), 400);
}