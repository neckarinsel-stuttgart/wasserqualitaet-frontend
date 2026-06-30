<?php
require_once __DIR__ . '/config.php';

$cacheFile    = __DIR__ . '/next-day-weather-cache.json';
$refreshAfter = 1800;  // re-fetch from upstream after 30 min
$staleLimit   = 14400; // serve stale cache for up to 4 hours

$cacheAge = file_exists($cacheFile) ? time() - filemtime($cacheFile) : PHP_INT_MAX;

if ($cacheAge > $refreshAfter) {
    $url  = API_BASE . '/get_next_day_weather_prediction';
    $json = @file_get_contents($url);

    if ($json !== false && !empty($json)) {
        $decoded = json_decode($json, true);
        $isValid = $decoded !== null && !isset($decoded['detail']);

        if ($isValid) {
            $tmp = $cacheFile . '.tmp';
            file_put_contents($tmp, $json, LOCK_EX);
            rename($tmp, $cacheFile);
            $cacheAge = 0;
        }
    }
}

header('Content-Type: application/json');

if (file_exists($cacheFile) && $cacheAge < $staleLimit) {
    readfile($cacheFile);
} else {
    echo json_encode([[
        'temperature_2m' => null,
        'weather_code'   => null,
        'wind_speed_10m' => null,
    ]]);
}
