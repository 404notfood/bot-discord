<?php
/**
 * Script de débogage pour l'application
 */

// Activer l'affichage des erreurs
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Démarrer la session d'abord
session_start();

// Définir le répertoire racine
define('ROOT_DIR', __DIR__);

// Charger l'autoloader
spl_autoload_register(function($className) {
    $file = ROOT_DIR . '/' . str_replace('\\', '/', $className) . '.php';
    if (file_exists($file)) {
        require $file;
    } else {
        echo "<p>Impossible de charger la classe: {$className}</p>";
        echo "<p>Fichier recherché: {$file}</p>";
    }
});

echo "<h1>Informations de débogage</h1>";

// Informations sur le serveur
echo "<h2>Informations sur le serveur</h2>";
echo "<ul>";
echo "<li>Version PHP: " . phpversion() . "</li>";
echo "<li>Serveur: " . $_SERVER['SERVER_SOFTWARE'] . "</li>";
echo "<li>URI demandée: " . $_SERVER['REQUEST_URI'] . "</li>";
echo "<li>Méthode: " . $_SERVER['REQUEST_METHOD'] . "</li>";
echo "<li>Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "</li>";
echo "<li>Script: " . $_SERVER['SCRIPT_FILENAME'] . "</li>";
echo "</ul>";

// Vérifier l'existence des dossiers et fichiers principaux
echo "<h2>Vérification des dossiers et fichiers principaux</h2>";
$criticalFiles = [
    'index.php',
    'Core/Router.php',
    'Core/Controller.php',
    'Core/Database.php',
    'Core/Model.php',
    'Controllers/AuthController.php',
    'Controllers/DashboardController.php',
    'Controllers/ResourceController.php',
    'Controllers/CategoryController.php',
    'Controllers/MemberController.php',
    'Controllers/ErrorController.php',
    'Views/layout.php',
    'Views/404.php',
    'Views/500.php',
    'Config/config.php'
];

echo "<ul>";
foreach ($criticalFiles as $file) {
    $path = ROOT_DIR . '/' . $file;
    if (file_exists($path)) {
        echo "<li>✅ {$file} existe</li>";
    } else {
        echo "<li style='color:red;'>❌ {$file} n'existe pas</li>";
    }
}
echo "</ul>";

// Vérifier la configuration de la base de données
echo "<h2>Configuration de la base de données</h2>";
try {
    $config = require ROOT_DIR . '/Config/config.php';
    echo "<p>Configuration chargée avec succès</p>";
    
    // Tester la connexion à la base de données
    $dsn = "mysql:host={$config['database']['host']};dbname={$config['database']['dbname']};charset={$config['database']['charset']}";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    
    $pdo = new PDO(
        $dsn,
        $config['database']['username'],
        $config['database']['password'],
        $options
    );
    
    echo "<p style='color:green;'>✅ Connexion à la base de données réussie!</p>";
    
    // Tester la structure de la base de données
    $tables = ['users', 'dashboard_members', 'resources', 'categories'];
    echo "<p>Vérification des tables essentielles:</p>";
    echo "<ul>";
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
        if ($stmt->rowCount() > 0) {
            echo "<li>✅ La table {$table} existe</li>";
        } else {
            echo "<li style='color:red;'>❌ La table {$table} n'existe pas!</li>";
        }
    }
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Erreur: " . $e->getMessage() . "</p>";
}

// Vérifier les sessions
echo "<h2>Informations sur les sessions</h2>";
if (session_status() === PHP_SESSION_ACTIVE) {
    echo "<p style='color:green;'>✅ Les sessions sont actives</p>";
    echo "<p>Session ID: " . session_id() . "</p>";
    if (!empty($_SESSION)) {
        echo "<p>Variables de session:</p>";
        echo "<pre>" . print_r($_SESSION, true) . "</pre>";
    } else {
        echo "<p>Aucune variable de session n'est définie</p>";
        
        // Test de création d'une variable de session
        $_SESSION['test'] = 'Ceci est un test';
        echo "<p>Variable de session de test créée. Rechargez la page pour vérifier.</p>";
    }
} else {
    echo "<p style='color:red;'>❌ Les sessions ne sont pas actives!</p>";
}

// Afficher la dernière erreur PHP
echo "<h2>Dernière erreur PHP</h2>";
$error = error_get_last();
if ($error) {
    echo "<pre>" . print_r($error, true) . "</pre>";
} else {
    echo "<p>Aucune erreur récente</p>";
}

// Tester le chargement de la classe User pour voir si findAll() existe
echo "<h2>Test des méthodes des modèles</h2>";
try {
    $reflectionUser = new ReflectionClass('Models\User');
    echo "<h3>Méthodes de la classe User:</h3>";
    echo "<ul>";
    $methods = $reflectionUser->getMethods();
    foreach ($methods as $method) {
        echo "<li>{$method->getName()}</li>";
    }
    echo "</ul>";
    
    $reflectionResource = new ReflectionClass('Models\Resource');
    echo "<h3>Méthodes de la classe Resource:</h3>";
    echo "<ul>";
    $methods = $reflectionResource->getMethods();
    foreach ($methods as $method) {
        echo "<li>{$method->getName()}</li>";
    }
    echo "</ul>";
    
    $reflectionCategory = new ReflectionClass('Models\Category');
    echo "<h3>Méthodes de la classe Category:</h3>";
    echo "<ul>";
    $methods = $reflectionCategory->getMethods();
    foreach ($methods as $method) {
        echo "<li>{$method->getName()}</li>";
    }
    echo "</ul>";
} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Erreur lors de la réflexion des classes: " . $e->getMessage() . "</p>";
}

// Tester l'utilisation du routeur
echo "<h2>Test du routeur</h2>";
try {
    $router = new Core\Router();
    echo "<p>✅ Le routeur a été instancié avec succès</p>";
    
    // Tester l'ajout d'une route
    $router->addRoute('test', ['controller' => 'Test', 'action' => 'index']);
    echo "<p>✅ Une route a été ajoutée avec succès</p>";
    
} catch (Exception $e) {
    echo "<p style='color:red;'>❌ Erreur lors de l'utilisation du routeur: " . $e->getMessage() . "</p>";
} 