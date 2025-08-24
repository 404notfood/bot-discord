<?php
/**
 * Script de test de la connexion à la base de données
 */

echo "🧪 Test de connexion à la base de données\n\n";

// Test du fichier de configuration
if (!file_exists('.env')) {
    echo "❌ Fichier .env manquant\n";
    exit(1);
}

// Charger la config
require_once 'Config/config.php';
$config = require 'Config/config.php';

echo "📋 Configuration:\n";
echo "Host: " . $config['database']['host'] . "\n";
echo "Database: " . $config['database']['dbname'] . "\n";
echo "Username: " . $config['database']['username'] . "\n";
echo "\n";

try {
    // Test de connexion PDO
    $dsn = "mysql:host={$config['database']['host']};dbname={$config['database']['dbname']};charset=utf8mb4";
    $pdo = new PDO($dsn, $config['database']['username'], $config['database']['password']);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Connexion PDO réussie\n";
    
    // Test de la table dashboard_members
    $stmt = $pdo->query("SHOW TABLES LIKE 'dashboard_members'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Table dashboard_members existe\n";
        
        $stmt = $pdo->query("SELECT COUNT(*) FROM dashboard_members");
        $count = $stmt->fetchColumn();
        echo "📊 {$count} membre(s) dans la table\n";
    } else {
        echo "❌ Table dashboard_members manquante\n";
    }
    
    // Test des autres tables importantes
    $tables = ['doc_resources', 'users', 'projects'];
    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
        if ($stmt->rowCount() > 0) {
            $stmt = $pdo->query("SELECT COUNT(*) FROM {$table}");
            $count = $stmt->fetchColumn();
            echo "✅ Table {$table}: {$count} enregistrements\n";
        } else {
            echo "⚠️  Table {$table} manquante\n";
        }
    }
    
} catch (PDOException $e) {
    echo "❌ Erreur de connexion: " . $e->getMessage() . "\n";
    exit(1);
}

echo "\n🎉 Test terminé avec succès\n";
?>