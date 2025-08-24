<?php
/**
 * Script pour créer un utilisateur administrateur
 * À exécuter une seule fois après l'installation
 */

require_once 'Core/Database.php';

try {
    $db = Core\Database::getInstance();
    
    // Créer l'utilisateur admin
    $hashedPassword = password_hash('admin123', PASSWORD_DEFAULT);
    
    $sql = "INSERT IGNORE INTO dashboard_members (username, email, password, role) 
            VALUES (:username, :email, :password, :role)";
    
    $stmt = $db->query($sql, [
        'username' => 'admin',
        'email' => 'admin@bot.rtfm2win.ovh',
        'password' => $hashedPassword,
        'role' => 'admin'
    ]);
    
    echo "✅ Utilisateur admin créé avec succès\n";
    echo "Nom d'utilisateur: admin\n";
    echo "Mot de passe: admin123\n";
    
} catch (Exception $e) {
    echo "❌ Erreur: " . $e->getMessage() . "\n";
}
?>