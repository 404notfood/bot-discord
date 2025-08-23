<?php
// Définir le répertoire racine
define('ROOT_DIR', __DIR__);

// Charger l'autoloader
spl_autoload_register(function($className) {
    $file = ROOT_DIR . '/' . str_replace('\\', '/', $className) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

// Charger la configuration
$config = require ROOT_DIR . '/Config/config.php';

echo "<h1>Test de connexion à la base de données</h1>";

try {
    // Connexion à la base de données
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
    
    // Vérifier si la table dashboard_members existe
    $stmt = $pdo->query("SHOW TABLES LIKE 'dashboard_members'");
    $tableExists = $stmt->rowCount() > 0;
    
    if ($tableExists) {
        echo "<p style='color:green;'>✅ La table dashboard_members existe.</p>";
        
        // Vérifier la présence de l'utilisateur admin
        $stmt = $pdo->query("SELECT * FROM dashboard_members WHERE username = 'admin'");
        $adminExists = $stmt->fetch();
        
        if ($adminExists) {
            echo "<p style='color:green;'>✅ L'utilisateur admin existe dans la base de données.</p>";
            echo "<p>ID: {$adminExists['id']}</p>";
            echo "<p>Username: {$adminExists['username']}</p>";
            echo "<p>Email: {$adminExists['email']}</p>";
            echo "<p>Rôle: {$adminExists['role']}</p>";
            echo "<p>Password hash: " . substr($adminExists['password'], 0, 15) . "...</p>";
            
            // Tester le mot de passe admin123
            $testPassword = 'admin123';
            if (password_verify($testPassword, $adminExists['password'])) {
                echo "<p style='color:green;'>✅ Le mot de passe 'admin123' est correct pour l'utilisateur admin!</p>";
            } else {
                echo "<p style='color:red;'>❌ Le mot de passe 'admin123' n'est PAS correct pour l'utilisateur admin!</p>";
            }
        } else {
            echo "<p style='color:red;'>❌ L'utilisateur admin n'existe PAS dans la base de données!</p>";
        }
    } else {
        echo "<p style='color:red;'>❌ La table dashboard_members n'existe PAS!</p>";
    }
    
    // Afficher toutes les tables de la base de données
    echo "<h2>Tables dans la base de données</h2>";
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll();
    
    if (count($tables) > 0) {
        echo "<ul>";
        foreach ($tables as $table) {
            echo "<li>" . reset($table) . "</li>";
        }
        echo "</ul>";
    } else {
        echo "<p style='color:red;'>❌ Aucune table trouvée dans la base de données!</p>";
    }
    
} catch (PDOException $e) {
    echo "<p style='color:red;'>❌ Erreur de connexion: " . $e->getMessage() . "</p>";
} 