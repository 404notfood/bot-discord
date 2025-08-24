<?php
echo "✅ PHP fonctionne !<br>";
echo "Version PHP: " . phpversion() . "<br>";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "<br>";
echo "Script Name: " . $_SERVER['SCRIPT_NAME'] . "<br>";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "<br>";
echo "Query String: " . ($_SERVER['QUERY_STRING'] ?? 'vide') . "<br>";

echo "<hr>";
echo "Fichiers dans le répertoire:<br>";
$files = scandir(__DIR__);
foreach ($files as $file) {
    if ($file !== '.' && $file !== '..') {
        echo "- $file<br>";
    }
}
?>