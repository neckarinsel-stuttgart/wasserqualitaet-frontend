<?php
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with(trim($line), '#') || !str_contains($line, '=')) continue;
        [$key, $value] = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
}
if (empty($_ENV['API_BASE'])) {
    http_response_code(500);
    die('API_BASE is not configured. Set it in .env.');
}
define('API_BASE', rtrim($_ENV['API_BASE'], '/'));
