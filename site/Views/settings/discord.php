<?php
ob_start();
?>

<div class="container-fluid px-4">
    <h1 class="mt-4"><?= htmlspecialchars($title) ?></h1>
    <ol class="breadcrumb mb-4">
        <li class="breadcrumb-item"><a href="/dashboard">Tableau de bord</a></li>
        <li class="breadcrumb-item"><a href="/settings">Paramètres</a></li>
        <li class="breadcrumb-item active">Discord</li>
    </ol>
    
    <div class="card mb-4">
        <div class="card-header">
            <i class="fab fa-discord me-1"></i>
            Configuration de l'intégration Discord
        </div>
        <div class="card-body">
            <?php if ($success): ?>
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                Les paramètres Discord ont été mis à jour avec succès.
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
            </div>
            <?php endif; ?>
            
            <?php if (!empty($errors)): ?>
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Erreurs:</strong>
                <ul class="mb-0">
                    <?php foreach ($errors as $error): ?>
                    <li><?= htmlspecialchars($error) ?></li>
                    <?php endforeach; ?>
                </ul>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
            </div>
            <?php endif; ?>
            
            <form action="/settings/discord" method="post" class="needs-validation" novalidate>
                <div class="mb-3">
                    <label for="bot_token" class="form-label">Token du Bot Discord <span class="text-danger">*</span></label>
                    <input type="password" class="form-control" id="bot_token" name="bot_token" 
                           value="<?= isset($discordConfig['bot_token']) ? htmlspecialchars($discordConfig['bot_token']) : '' ?>" required>
                    <div class="form-text">
                        Le token du bot Discord se trouve dans le <a href="https://discord.com/developers/applications" target="_blank">portail développeur Discord</a>.
                        Ne partagez jamais ce token.
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="guild_id" class="form-label">ID du Serveur Discord <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="guild_id" name="guild_id" 
                           value="<?= isset($discordConfig['guild_id']) ? htmlspecialchars($discordConfig['guild_id']) : '' ?>" required>
                    <div class="form-text">
                        L'ID du serveur Discord où le bot créera les canaux. Activez le mode développeur dans Discord
                        puis faites clic droit sur le serveur > Copier l'identifiant.
                    </div>
                </div>
                
                <div class="mb-3">
                    <label for="everyone_role_id" class="form-label">ID du Rôle @everyone <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="everyone_role_id" name="everyone_role_id" 
                           value="<?= isset($discordConfig['everyone_role_id']) ? htmlspecialchars($discordConfig['everyone_role_id']) : '' ?>" required>
                    <div class="form-text">
                        L'ID du rôle @everyone est généralement le même que l'ID du serveur.
                    </div>
                </div>
                
                <div class="d-flex justify-content-between">
                    <button type="submit" class="btn btn-primary">Enregistrer les paramètres</button>
                    <a href="/settings/test-discord" class="btn btn-outline-info">Tester la connexion</a>
                </div>
            </form>
        </div>
        <div class="card-footer">
            <div class="small text-muted">
                <strong>Note:</strong> Le bot doit avoir les permissions nécessaires pour créer des canaux et gérer les permissions.
                Assurez-vous qu'il dispose des permissions "Gérer les canaux", "Gérer les rôles" et "Gérer les webhooks".
            </div>
        </div>
    </div>
    
    <div class="card mb-4">
        <div class="card-header">
            <i class="fas fa-info-circle me-1"></i>
            Guide d'intégration Discord
        </div>
        <div class="card-body">
            <h5>Configuration requise</h5>
            <ol>
                <li>Créez une <a href="https://discord.com/developers/applications" target="_blank">application Discord</a> et configurez un bot.</li>
                <li>Copiez le token du bot et collez-le dans le champ ci-dessus.</li>
                <li>Invitez le bot sur votre serveur Discord en utilisant le lien d'invitation de l'application.</li>
                <li>Assurez-vous que le bot a les permissions nécessaires (administrateur est recommandé).</li>
                <li>Activez le mode développeur dans Discord pour obtenir les IDs.</li>
            </ol>
            
            <h5>Fonctionnalités</h5>
            <ul>
                <li>Lors de la création d'un projet, le bot crée une catégorie avec un canal textuel et un canal vocal.</li>
                <li>Lors de la création d'un sous-groupe, le bot crée un canal textuel public et un canal vocal privé.</li>
                <li>Les utilisateurs ajoutés à un sous-groupe reçoivent automatiquement l'accès aux canaux privés.</li>
            </ul>
        </div>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 