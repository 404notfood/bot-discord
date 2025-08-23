<?php
/**
 * Script pour vérifier si les méthodes nécessaires existent dans les modèles
 */

// Activer l'affichage des erreurs
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Démarrer la session
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

echo "<h1>Vérification des méthodes des modèles</h1>";

// Méthodes à vérifier pour chaque modèle
$methodsToCheck = [
    'Models\User' => [
        'getStats',
        'getTopCommands',
        'getMostActiveUsers',
        'getCommandHistory',
        'getResourceUsage',
        'findAll'
    ],
    'Models\Resource' => [
        'getUsageStats',
        'findAll'
    ],
    'Models\Category' => [
        'getAllWithResourceCount',
        'findAll'
    ]
];

// Vérifier chaque modèle et ses méthodes
foreach ($methodsToCheck as $className => $methods) {
    echo "<h2>Classe {$className}</h2>";
    
    try {
        // Charger la classe
        if (!class_exists($className)) {
            echo "<p style='color:red;'>❌ La classe {$className} n'existe pas!</p>";
            continue;
        }
        
        echo "<p style='color:green;'>✅ La classe {$className} existe.</p>";
        
        // Vérifier si les méthodes requises existent
        $reflection = new ReflectionClass($className);
        
        echo "<h3>Vérification des méthodes:</h3>";
        echo "<ul>";
        
        foreach ($methods as $method) {
            if ($reflection->hasMethod($method)) {
                $methodObj = $reflection->getMethod($method);
                echo "<li style='color:green;'>✅ La méthode {$method}() existe - " . ($methodObj->isPublic() ? 'publique' : 'non publique') . "</li>";
            } else {
                echo "<li style='color:red;'>❌ La méthode {$method}() n'existe PAS!</li>";
                
                // Créer une implémentation basique de la méthode manquante
                echo "<div style='margin: 10px 0; padding: 10px; background-color: #f8f9fa; border: 1px solid #ddd;'>";
                echo "<h4>Suggestion d'implémentation pour {$method}():</h4>";
                echo "<pre>";
                
                if ($method == 'getStats') {
                    echo "/**\n * Obtenir les statistiques des utilisateurs\n *\n * @return array\n */\npublic function getStats()\n{\n    // Stats par défaut\n    return [\n        'total' => \$this->count(),\n        'active' => \$this->count(['is_active' => 1]),\n        'last_week' => \$this->count(['last_seen >= ' => date('Y-m-d', strtotime('-7 days'))])\n    ];\n}";
                } elseif ($method == 'getTopCommands') {
                    echo "/**\n * Obtenir les commandes les plus utilisées\n *\n * @param int \$limit Nombre de commandes à retourner\n * @return array\n */\npublic function getTopCommands(\$limit = 5)\n{\n    \$sql = \"SELECT command_name, COUNT(*) as count FROM command_history GROUP BY command_name ORDER BY count DESC LIMIT :limit\";\n    \$stmt = \$this->db->query(\$sql, ['limit' => \$limit]);\n    return \$stmt->fetchAll();\n}";
                } elseif ($method == 'getMostActiveUsers') {
                    echo "/**\n * Obtenir les utilisateurs les plus actifs\n *\n * @param int \$limit Nombre d'utilisateurs à retourner\n * @return array\n */\npublic function getMostActiveUsers(\$limit = 5)\n{\n    \$sql = \"SELECT u.*, COUNT(ch.id) as command_count FROM users u LEFT JOIN command_history ch ON u.id = ch.user_id GROUP BY u.id ORDER BY command_count DESC LIMIT :limit\";\n    \$stmt = \$this->db->query(\$sql, ['limit' => \$limit]);\n    return \$stmt->fetchAll();\n}";
                } elseif ($method == 'getCommandHistory') {
                    echo "/**\n * Obtenir l'historique des commandes d'un utilisateur\n *\n * @param int \$userId ID de l'utilisateur\n * @param int \$limit Nombre de commandes à retourner\n * @return array\n */\npublic function getCommandHistory(\$userId, \$limit = 20)\n{\n    \$sql = \"SELECT * FROM command_history WHERE user_id = :user_id ORDER BY executed_at DESC LIMIT :limit\";\n    \$stmt = \$this->db->query(\$sql, ['user_id' => \$userId, 'limit' => \$limit]);\n    return \$stmt->fetchAll();\n}";
                } elseif ($method == 'getResourceUsage') {
                    echo "/**\n * Obtenir l'utilisation des ressources d'un utilisateur\n *\n * @param int \$userId ID de l'utilisateur\n * @param int \$limit Nombre d'utilisations à retourner\n * @return array\n */\npublic function getResourceUsage(\$userId, \$limit = 20)\n{\n    \$sql = \"SELECT ru.*, r.name as resource_name, r.category_id FROM resource_usage ru LEFT JOIN resources r ON ru.resource_id = r.id WHERE ru.user_id = :user_id ORDER BY ru.used_at DESC LIMIT :limit\";\n    \$stmt = \$this->db->query(\$sql, ['user_id' => \$userId, 'limit' => \$limit]);\n    return \$stmt->fetchAll();\n}";
                } elseif ($method == 'getUsageStats') {
                    echo "/**\n * Obtenir les statistiques d'utilisation des ressources\n *\n * @param int \$limit Nombre de ressources à retourner\n * @return array\n */\npublic function getUsageStats(\$limit = 5)\n{\n    \$sql = \"SELECT r.*, COUNT(ru.id) as usage_count FROM resources r LEFT JOIN resource_usage ru ON r.id = ru.resource_id GROUP BY r.id ORDER BY usage_count DESC LIMIT :limit\";\n    \$stmt = \$this->db->query(\$sql, ['limit' => \$limit]);\n    return \$stmt->fetchAll();\n}";
                } elseif ($method == 'getAllWithResourceCount') {
                    echo "/**\n * Obtenir toutes les catégories avec le nombre de ressources\n *\n * @param bool \$activeOnly Ne retourner que les catégories avec des ressources actives\n * @return array\n */\npublic function getAllWithResourceCount(\$activeOnly = false)\n{\n    \$sql = \"SELECT c.*, COUNT(r.id) as resource_count FROM categories c LEFT JOIN resources r ON c.id = r.category_id\";\n    \n    if (\$activeOnly) {\n        \$sql .= \" AND r.is_active = 1\";\n    }\n    
    \$sql .= \" GROUP BY c.id ORDER BY c.name ASC\";\n    \$stmt = \$this->db->query(\$sql);\n    return \$stmt->fetchAll();\n}";
                }
                
                echo "</pre>";
                echo "</div>";
            }
        }
        
        echo "</ul>";
        
    } catch (Exception $e) {
        echo "<p style='color:red;'>❌ Erreur lors de la vérification de la classe {$className}: " . $e->getMessage() . "</p>";
    }
} 