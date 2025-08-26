<?php
// Diagnostic PHP pour le serveur web
echo "<h1>Configuration PHP Web Server</h1>";
echo "Version PHP: " . phpversion() . "<br>";
echo "Fichier php.ini: " . php_ini_loaded_file() . "<br>";
echo "Fonctions désactivées: " . ini_get('disable_functions') . "<br>";
echo "SAPI: " . php_sapi_name() . "<br>";
?>