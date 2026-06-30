<?php
require_once __DIR__ . '/config.php';

$cacheFile = __DIR__ . '/water-temp-cache.json';
$maxAge    = 1800; // 30 minutes

$cacheAge = file_exists($cacheFile) ? time() - filemtime($cacheFile) : PHP_INT_MAX;

if ($cacheAge > $maxAge) {
    $url  = API_BASE . '/get_water_temp';
    $json = @file_get_contents($url);

    if ($json !== false && !empty($json)) {
        $decoded = json_decode($json, true);
        $isValid = $decoded !== null && !isset($decoded['detail']);

        if ($isValid) {
            $tmp = $cacheFile . '.tmp';
            file_put_contents($tmp, $json, LOCK_EX);
            rename($tmp, $cacheFile);
        }
    }
}

header('Content-Type: application/json');

if (file_exists($cacheFile)) {
    readfile($cacheFile);
} else {
    echo json_encode([]);
}
