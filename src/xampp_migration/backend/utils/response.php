<?php
/**
 * JSON response helpers
 */

function jsonResponse(mixed $data, int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

function jsonError(string $message, int $status = 400, array $extra = []): void {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(array_merge(['error' => $message], $extra));
    exit();
}

function jsonSuccess(string $message = 'OK', array $data = []): void {
    jsonResponse(array_merge(['message' => $message], $data));
}

/**
 * Parse JSON request body
 */
function getRequestBody(): array {
    $raw = file_get_contents('php://input');
    if (!$raw) return [];
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Generate a UUID v4
 */
function uuid(): string {
    return sprintf('%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand(0, 0xffff), mt_rand(0, 0xffff),
        mt_rand(0, 0xffff),
        mt_rand(0, 0x0fff) | 0x4000,
        mt_rand(0, 0x3fff) | 0x8000,
        mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
    );
}

/**
 * Sanitize a string
 */
function sanitize(string $val): string {
    return htmlspecialchars(trim($val), ENT_QUOTES, 'UTF-8');
}

/**
 * Encode array to JSON safely
 */
function encodeJson(mixed $val): ?string {
    if ($val === null) return null;
    return json_encode($val, JSON_UNESCAPED_UNICODE);
}

/**
 * Decode JSON column from DB
 */
function decodeJson(?string $val): mixed {
    if ($val === null || $val === '') return null;
    return json_decode($val, true);
}