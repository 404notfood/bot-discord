<?php
/**
 * Script de test pour diagnostiquer les problèmes de routage
 */

// Activer l'affichage des erreurs
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Définir le répertoire racine
define('ROOT_DIR', __DIR__);

echo "<h1>Test de routage</h1>";

// Charger l'autoloader
spl_autoload_register(function($className) {
    $file = ROOT_DIR . '/' . str_replace('\\', '/', $className) . '.php';
    echo "<p>Tentative de chargement: {$className} -> {$file}</p>";
    if (file_exists($file)) {
        require $file;
        echo "<p style='color:green;'>✅ Chargé: {$className}</p>";
    } else {
        echo "<p style='color:red;'>❌ Non trouvé: {$file}</p>";
    }
});

echo "<h2>Test du routeur</h2>";

try {
    $router = new Core\Router();
    echo "<p style='color:green;'>✅ Routeur créé avec succès</p>";
    
    // Test des routes de base
    $router->addRoute('', ['controller' => 'Auth', 'action' => 'login']);
    $router->addRoute('login', ['controller' => 'Auth', 'action' => 'login']);
    $router->addRoute('dashboard', ['controller' => 'Dashboard', 'action' => 'index']);
    
    echo "<p style='color:green;'>✅ Routes ajoutées</p>";
    
    // Test de la configuration
    echo "<h3>Configuration</h3>";
    $config = require ROOT_DIR . '/Config/config.php';
    echo "<pre>" . print_r($config['routes'], true) . "</pre>";
    
} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Erreur: " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<h2>Test des contrôleurs</h2>";

// Tester l'existence des contrôleurs
$controllers = ['Auth', 'Dashboard', 'Error'];
foreach ($controllers as $ctrl) {
    $className = "Controllers\\{$ctrl}Controller";
    if (class_exists($className)) {
        echo "<p style='color:green;'>✅ Contrôleur {$ctrl} existe</p>";
        
        $instance = new $className();
        $methods = get_class_methods($instance);
        echo "<p>Méthodes disponibles: " . implode(', ', $methods) . "</p>";
    } else {
        echo "<p style='color:red;'>❌ Contrôleur {$ctrl} non trouvé</p>";
    }
}

echo "<h2>Variables d'environnement</h2>";
echo "<p>REQUEST_URI: " . ($_SERVER['REQUEST_URI'] ?? 'non défini') . "</p>";
echo "<p>SCRIPT_NAME: " . ($_SERVER['SCRIPT_NAME'] ?? 'non défini') . "</p>";
echo "<p>PATH_INFO: " . ($_SERVER['PATH_INFO'] ?? 'non défini') . "</p>";
echo "<p>QUERY_STRING: " . ($_SERVER['QUERY_STRING'] ?? 'non défini') . "</p>";
