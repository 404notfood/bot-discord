<?php
/**
 * Script pour importer la table config
 */

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Définir le répertoire racine
define('ROOT_DIR', __DIR__);

echo "Importation de la table config...<br>";

try {
    // Configuration de la base de données
    $config = require ROOT_DIR . '/Config/config.php';
    $dbConfig = $config['database'];
    
    // Connexion à la base de données
    $dsn = "mysql:host={$dbConfig['host']};dbname={$dbConfig['dbname']};charset={$dbConfig['charset']}";
    $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Lire le fichier SQL
    $sql = file_get_contents(ROOT_DIR . '/config_table.sql');
    
    // Diviser le fichier en requêtes individuelles
    $queries = array_filter(array_map('trim', explode(';', $sql)));
    
    // Exécuter chaque requête
    foreach ($queries as $query) {
        if (!empty($query)) {
            $pdo->exec($query);
            echo "Requête exécutée: " . substr($query, 0, 100) . "...<br>";
        }
    }
    
    echo "<br>Importation terminée avec succès!";
    
} catch (PDOException $e) {
    echo "Erreur: " . $e->getMessage() . "<br>";
} 