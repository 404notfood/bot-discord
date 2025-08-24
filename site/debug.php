<?php
echo "<h2>🔧 Debug du routage</h2>";
echo "<pre>";
echo "REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'non défini') . "\n";
echo "SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'non défini') . "\n";
echo "GET route: " . ($_GET['route'] ?? 'non défini') . "\n";
echo "Query String: " . ($_SERVER['QUERY_STRING'] ?? 'vide') . "\n";
echo "</pre>";

echo "<h3>Tests manuels:</h3>";
echo '<a href="/info.php">Test info.php</a><br>';
echo '<a href="/">Page d\'accueil</a><br>';
echo '<a href="/login">Page login</a><br>';
echo '<a href="/dashboard">Dashboard</a><br>';
echo '<a href="/?route=">Route vide</a><br>';
echo '<a href="/?route=login">Route login</a><br>';

echo "<h3>Fichiers présents:</h3>";
echo "<ul>";
$files = glob("*");
foreach ($files as $file) {
    echo "<li>$file</li>";
}
echo "</ul>";
?>