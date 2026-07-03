<?php
require_once __DIR__ . '/config.php';

$url = API_BASE . '/masterdata';
$response = @file_get_contents($url);

if ($response === false) {
    http_response_code(502);
    exit('Download not available');
}

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="neckar-data.csv"');
echo $response;
