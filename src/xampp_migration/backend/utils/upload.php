<?php
/**
 * File upload utilities
 */

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/response.php';

/**
 * Handle a file upload from $_FILES
 * Returns the public URL of the uploaded file
 */
function handleFileUpload(
    array $file,
    string $subfolder = 'general',
    array $allowedTypes = [],
    int $maxSize = 0
): string {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        throw new RuntimeException('Upload error: ' . uploadErrorMessage($file['error']));
    }

    $maxSize = $maxSize ?: MAX_FILE_SIZE;
    if ($file['size'] > $maxSize) {
        throw new RuntimeException('File too large. Maximum size: ' . ($maxSize / 1024 / 1024) . 'MB');
    }

    $mimeType = mime_content_type($file['tmp_name']);
    if (!empty($allowedTypes) && !in_array($mimeType, $allowedTypes, true)) {
        throw new RuntimeException('Invalid file type: ' . $mimeType);
    }

    $ext = getExtensionFromMime($mimeType) ?: pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uuid() . '.' . $ext;
    $targetDir = UPLOAD_DIR . $subfolder . '/';

    if (!is_dir($targetDir)) {
        mkdir($targetDir, 0755, true);
    }

    $targetPath = $targetDir . $filename;
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        throw new RuntimeException('Failed to save uploaded file');
    }

    return UPLOAD_URL . $subfolder . '/' . $filename;
}

/**
 * Delete an uploaded file by its URL
 */
function deleteUploadedFile(string $url): void {
    $path = str_replace(UPLOAD_URL, UPLOAD_DIR, $url);
    if (file_exists($path)) {
        unlink($path);
    }
}

function uploadErrorMessage(int $code): string {
    return match($code) {
        UPLOAD_ERR_INI_SIZE   => 'File exceeds PHP ini upload_max_filesize',
        UPLOAD_ERR_FORM_SIZE  => 'File exceeds HTML form MAX_FILE_SIZE',
        UPLOAD_ERR_PARTIAL    => 'File only partially uploaded',
        UPLOAD_ERR_NO_FILE    => 'No file was uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temporary folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file to disk',
        UPLOAD_ERR_EXTENSION  => 'Upload stopped by PHP extension',
        default               => 'Unknown upload error',
    };
}

function getExtensionFromMime(string $mime): string {
    $map = [
        'image/jpeg'      => 'jpg',
        'image/png'       => 'png',
        'image/gif'       => 'gif',
        'image/webp'      => 'webp',
        'video/mp4'       => 'mp4',
        'video/webm'      => 'webm',
        'video/ogg'       => 'ogv',
        'audio/mpeg'      => 'mp3',
        'audio/ogg'       => 'ogg',
        'audio/wav'       => 'wav',
        'audio/mp4'       => 'm4a',
        'application/pdf' => 'pdf',
    ];
    return $map[$mime] ?? '';
}