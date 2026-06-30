<?php
require_once __DIR__ . '/config.php';

$year  = isset($_GET['year'])  ? intval($_GET['year'])  : date('Y');
$month = isset($_GET['month']) ? intval($_GET['month']) : date('n');

$cacheFile = __DIR__ . "/plot-data-cache-{$year}-{$month}.json";
$maxAge    = 3600; // 1 hour

$cacheAge = file_exists($cacheFile) ? time() - filemtime($cacheFile) : PHP_INT_MAX;

if ($cacheAge > $maxAge) {
    $url  = API_BASE . "/plot-data?year={$year}&month={$month}";
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
    echo json_encode([
        'year'       => $year,
        'month'      => $month,
        'site_id'    => 'default',
        'columns'    => [
            'V_TE005_mean', 'V_TE050_mean', 'Ho_Ne_Temperatur', 'TT_TU_mean',
            'We_Ne_ElektrischeLeitfaehigkeit', 'Sauerstoff',
            'Ho_Ne_Truebung,quantitativ', 'pH_wert', 'ABSF_STD_mean',
        ],
        'timestamps' => [],
        'rows'       => [],
    ]);
}
