<?php
// Script de diagnostic PHP - NE PAS LAISSER EN PRODUCTION !

echo "<h1>Diagnostic PHP - Fonctions d'exécution</h1>";

// Vérifier PHP version
echo "<h2>Version PHP</h2>";
echo "Version: " . phpversion() . "<br>";

// Vérifier disable_functions
echo "<h2>Fonctions désactivées (disable_functions)</h2>";
$disabled = ini_get('disable_functions');
if (empty($disabled)) {
    echo "Aucune fonction désactivée<br>";
} else {
    echo "Fonctions désactivées: " . $disabled . "<br>";
}

// Vérifier chaque fonction individuellement
echo "<h2>Statut des fonctions d'exécution</h2>";
$functions = ['exec', 'shell_exec', 'system', 'proc_open', 'proc_close', 'passthru'];

foreach ($functions as $func) {
    $status = function_exists($func) ? '✅ Disponible' : '❌ Indisponible';
    echo "$func: $status<br>";
}

// Vérifier safe_mode (obsolète depuis PHP 5.4 mais on ne sait jamais)
echo "<h2>Mode sécurisé</h2>";
$safe_mode = ini_get('safe_mode');
echo "Safe mode: " . ($safe_mode ? 'Activé' : 'Désactivé') . "<br>";

// Vérifier open_basedir
echo "<h2>Restrictions de répertoire</h2>";
$open_basedir = ini_get('open_basedir');
echo "Open basedir: " . ($open_basedir ? $open_basedir : 'Non configuré') . "<br>";

// Test rapide d'exec si disponible
echo "<h2>Test d'exécution</h2>";
if (function_exists('exec')) {
    echo "Test exec('whoami'): ";
    $result = exec('whoami 2>&1', $output, $return_code);
    echo "Résultat: $result, Code: $return_code<br>";
} else {
    echo "exec() non disponible<br>";
}

// Chemin du fichier php.ini
echo "<h2>Configuration PHP</h2>";
echo "Fichier php.ini chargé: " . php_ini_loaded_file() . "<br>";

// Fichiers de configuration supplémentaires
$additional = php_ini_scanned_files();
if ($additional) {
    echo "Fichiers supplémentaires: " . $additional . "<br>";
}

?>