<?php
/**
 * Script de réinitialisation du mot de passe administrateur
 * 
 * Ce script permet de réinitialiser le mot de passe du compte administrateur
 * en cas de perte de celui-ci. À utiliser en dernier recours.
 */

// Définir le répertoire racine
define('ROOT_DIR', __DIR__);

// Charger l'autoloader
spl_autoload_register(function($className) {
    $file = ROOT_DIR . '/' . str_replace('\\', '/', $className) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use Models\DashboardMember;

// Démarrer la session
session_start();

// Vérifier si déjà connecté avec un compte administrateur
$isAdminLoggedIn = isset($_SESSION['member_id']) && isset($_SESSION['member_role']) && $_SESSION['member_role'] === 'admin';

// Variables pour le formulaire
$message = '';
$success = false;

// Traitement du formulaire
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Si déjà connecté en tant qu'admin, utiliser cette session
    if ($isAdminLoggedIn) {
        $adminId = $_SESSION['member_id'];
        $currentPassword = $_POST['current_password'] ?? '';
        $newPassword = $_POST['new_password'] ?? '';
        $confirmPassword = $_POST['confirm_password'] ?? '';
        
        // Vérifier que tous les champs sont remplis
        if (empty($currentPassword) || empty($newPassword) || empty($confirmPassword)) {
            $message = 'Tous les champs sont obligatoires.';
        } 
        // Vérifier que les nouveaux mots de passe correspondent
        elseif ($newPassword !== $confirmPassword) {
            $message = 'Les nouveaux mots de passe ne correspondent pas.';
        } 
        // Vérifier que le nouveau mot de passe est assez fort
        elseif (strlen($newPassword) < 8) {
            $message = 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
        } else {
            // Vérifier le mot de passe actuel
            $memberModel = new DashboardMember();
            $admin = $memberModel->findById($adminId);
            
            if ($admin && password_verify($currentPassword, $admin['password'])) {
                // Mettre à jour le mot de passe
                if ($memberModel->update($adminId, ['password' => $newPassword])) {
                    $success = true;
                    $message = 'Le mot de passe a été mis à jour avec succès.';
                } else {
                    $message = 'Une erreur est survenue lors de la mise à jour du mot de passe.';
                }
            } else {
                $message = 'Le mot de passe actuel est incorrect.';
            }
        }
    } 
    // Sinon, utiliser la réinitialisation spéciale (code de sécurité)
    else {
        $username = $_POST['username'] ?? '';
        $securityCode = $_POST['security_code'] ?? '';
        $newPassword = $_POST['new_password'] ?? '';
        $confirmPassword = $_POST['confirm_password'] ?? '';
        
        // Vérifier que tous les champs sont remplis
        if (empty($username) || empty($securityCode) || empty($newPassword) || empty($confirmPassword)) {
            $message = 'Tous les champs sont obligatoires.';
        } 
        // Vérifier que les nouveaux mots de passe correspondent
        elseif ($newPassword !== $confirmPassword) {
            $message = 'Les nouveaux mots de passe ne correspondent pas.';
        } 
        // Vérifier que le nouveau mot de passe est assez fort
        elseif (strlen($newPassword) < 8) {
            $message = 'Le nouveau mot de passe doit contenir au moins 8 caractères.';
        } 
        // Vérifier le code de sécurité (à personnaliser selon votre besoin)
        elseif ($securityCode !== 'Maglit3s53940!') { // Code provenant de la DB
            $message = 'Le code de sécurité est incorrect.';
        } else {
            // Trouver l'admin par son nom d'utilisateur
            $memberModel = new DashboardMember();
            $admin = $memberModel->findBy(['username' => $username, 'role' => 'admin']);
            
            if ($admin) {
                // Réinitialiser le mot de passe
                if ($memberModel->resetAdminPassword($admin['id'], $newPassword)) {
                    $success = true;
                    $message = 'Le mot de passe a été réinitialisé avec succès.';
                } else {
                    $message = 'Une erreur est survenue lors de la réinitialisation du mot de passe.';
                }
            } else {
                $message = 'Aucun administrateur trouvé avec ce nom d\'utilisateur.';
            }
        }
    }
}

// En-tête HTML
?>
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation du mot de passe administrateur</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0-alpha1/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        body { 
            padding-top: 50px; 
            background-color: #f5f5f5;
        }
        .form-container {
            max-width: 500px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .alert {
            margin-bottom: 20px;
        }
        h2 {
            margin-bottom: 20px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="form-container">
            <h2>Réinitialisation du mot de passe administrateur</h2>
            
            <?php if (!empty($message)): ?>
                <div class="alert alert-<?php echo $success ? 'success' : 'danger'; ?>" role="alert">
                    <?php echo htmlspecialchars($message); ?>
                </div>
            <?php endif; ?>
            
            <?php if ($success): ?>
                <div class="text-center">
                    <p>Vous pouvez maintenant <a href="login">vous connecter</a> avec votre nouveau mot de passe.</p>
                </div>
            <?php else: ?>
                <?php if ($isAdminLoggedIn): ?>
                    <!-- Formulaire pour les administrateurs déjà connectés -->
                    <form method="post" action="">
                        <div class="mb-3">
                            <label for="current_password" class="form-label">Mot de passe actuel</label>
                            <input type="password" class="form-control" id="current_password" name="current_password" required>
                        </div>
                        <div class="mb-3">
                            <label for="new_password" class="form-label">Nouveau mot de passe</label>
                            <input type="password" class="form-control" id="new_password" name="new_password" required>
                            <div class="form-text">Au moins 8 caractères.</div>
                        </div>
                        <div class="mb-3">
                            <label for="confirm_password" class="form-label">Confirmer le nouveau mot de passe</label>
                            <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                        </div>
                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-primary">Mettre à jour le mot de passe</button>
                        </div>
                    </form>
                <?php else: ?>
                    <!-- Formulaire de réinitialisation spéciale -->
                    <form method="post" action="">
                        <div class="mb-3">
                            <label for="username" class="form-label">Nom d'utilisateur administrateur</label>
                            <input type="text" class="form-control" id="username" name="username" required>
                        </div>
                        <div class="mb-3">
                            <label for="security_code" class="form-label">Code de sécurité</label>
                            <input type="password" class="form-control" id="security_code" name="security_code" required>
                            <div class="form-text">Ce code vous a été fourni par l'administrateur système.</div>
                        </div>
                        <div class="mb-3">
                            <label for="new_password" class="form-label">Nouveau mot de passe</label>
                            <input type="password" class="form-control" id="new_password" name="new_password" required>
                            <div class="form-text">Au moins 8 caractères.</div>
                        </div>
                        <div class="mb-3">
                            <label for="confirm_password" class="form-label">Confirmer le nouveau mot de passe</label>
                            <input type="password" class="form-control" id="confirm_password" name="confirm_password" required>
                        </div>
                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-danger">Réinitialiser le mot de passe</button>
                        </div>
                    </form>
                <?php endif; ?>
                
                <div class="mt-3 text-center">
                    <a href="index.php">Retourner à l'accueil</a>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html> 