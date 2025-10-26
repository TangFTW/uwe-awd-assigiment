<?php
/* db/import.php */
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
header('Content-Type: text/plain; charset=utf-8');

$host = 'localhost';
$user = 'root';
$pass = '';
$db   = 'hkpo_mobile';
$jsonFile = __DIR__ . '/mobile-office.json';

$mysqli = new mysqli($host, $user, $pass, $db);
$mysqli->set_charset('utf8mb4');

if (!file_exists($jsonFile)) {
  exit("JSON file not found: $jsonFile\n");
}
$raw = file_get_contents($jsonFile);
$parsed = json_decode($raw, true);
if ($parsed === null) {
  exit("Invalid JSON file\n");
}
$rows = isset($parsed['data']) && is_array($parsed['data']) ? $parsed['data'] :
        (is_array($parsed) ? $parsed : null);
if ($rows === null) {
  exit("JSON does not contain an array of records\n");
}

$sql = "
INSERT INTO mobilepost (
  mobileCode, locationTC, locationSC, addressTC,
  nameSC, districtSC, addressSC, closeHour,
  nameTC, districtTC, latitude, openHour, dayOfWeekCode,
  nameEN, districtEN, locationEN, addressEN, seq, longitude
) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
ON DUPLICATE KEY UPDATE
  locationTC=VALUES(locationTC),
  locationSC=VALUES(locationSC),
  addressTC=VALUES(addressTC),
  nameSC=VALUES(nameSC),
  districtSC=VALUES(districtSC),
  addressSC=VALUES(addressSC),
  closeHour=VALUES(closeHour),
  nameTC=VALUES(nameTC),
  districtTC=VALUES(districtTC),
  latitude=VALUES(latitude),
  openHour=VALUES(openHour),
  nameEN=VALUES(nameEN),
  districtEN=VALUES(districtEN),
  locationEN=VALUES(locationEN),
  addressEN=VALUES(addressEN),
  longitude=VALUES(longitude)
";

$mysqli->begin_transaction();
$stmt = $mysqli->prepare($sql);

$ok=0; $skip=0;
foreach ($rows as $r) {
  // Normalize + basic validation
  $mobileCode    = isset($r['mobileCode'])    ? (string)$r['mobileCode'] : '';
  $locationTC    = (string)($r['locationTC'] ?? '');
  $locationSC    = (string)($r['locationSC'] ?? '');
  $addressTC     = (string)($r['addressTC']  ?? '');
  $nameSC        = (string)($r['nameSC']     ?? '');
  $districtSC    = (string)($r['districtSC'] ?? '');
  $addressSC     = (string)($r['addressSC']  ?? '');
  $closeHour     = (string)($r['closeHour']  ?? '');
  $nameTC        = (string)($r['nameTC']     ?? '');
  $districtTC    = (string)($r['districtTC'] ?? '');
  $latitude      = isset($r['latitude'])      ? (float)$r['latitude']   : null;
  $openHour      = (string)($r['openHour']   ?? '');
  $dayOfWeekCode = isset($r['dayOfWeekCode']) ? (int)$r['dayOfWeekCode'] : null;
  $nameEN        = (string)($r['nameEN']     ?? '');
  $districtEN    = (string)($r['districtEN'] ?? '');
  $locationEN    = (string)($r['locationEN'] ?? '');
  $addressEN     = (string)($r['addressEN']  ?? '');
  $seq           = isset($r['seq'])           ? (int)$r['seq']           : null;
  $longitude     = isset($r['longitude'])     ? (float)$r['longitude']   : null;

  if ($mobileCode==='' || $latitude===null || $longitude===null || $seq===null || $dayOfWeekCode===null) {
    $skip++;
    continue;
  }

  // Types: sssssssss d s i ssss i d  => "ssssssssssdsissssiid"
  $stmt->bind_param(
    "ssssssssssdsissssiid",
    $mobileCode, $locationTC, $locationSC, $addressTC,
    $nameSC, $districtSC, $addressSC, $closeHour,
    $nameTC, $districtTC, $latitude, $openHour, $dayOfWeekCode,
    $nameEN, $districtEN, $locationEN, $addressEN, $seq, $longitude
  );
  $stmt->execute();
  $ok++;
}
$mysqli->commit();

echo "Import completed. Upserted: $ok, Skipped: $skip\n";
$stmt->close();
$mysqli->close();