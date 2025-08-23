<?php
/**
 * Vue pour la configuration du système Studi
 */

// Définir le titre de la page
$title = 'Configuration Studi';
$pageTitle = 'Configuration du système Studi';
$currentPage = 'studi';
$loggedIn = true;

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Configuration du système Studi</h5>
        <div>
            <a href="/studi" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-arrow-left"></i> Retour
            </a>
            <a href="/dashboard" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-speedometer2"></i> Dashboard
            </a>
        </div>
    </div>
    <div class="card-body">
        <?php if (!empty($errors)): ?>
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <h5 class="alert-heading">Erreurs</h5>
            <ul class="mb-0">
                <?php foreach ($errors as $error): ?>
                <li><?= $error ?></li>
                <?php endforeach; ?>
            </ul>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        <?php endif; ?>
        
        <?php if ($success): ?>
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            Configuration mise à jour avec succès.
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        <?php endif; ?>
        
        <div class="row">
            <div class="col-md-6">
                <form action="/studi/config" method="post">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5 class="mb-0">Paramètres généraux</h5>
                        </div>
                        <div class="card-body">
                            <div class="form-check form-switch mb-3">
                                <input class="form-check-input" type="checkbox" id="is_enabled" name="is_enabled" value="1" <?= ($config && $config['is_enabled']) ? 'checked' : '' ?>>
                                <label class="form-check-label" for="is_enabled">Activer le système Studi</label>
                            </div>
                            
                            <div class="mb-3">
                                <label for="max_offenses" class="form-label">Nombre maximum d'infractions avant bannissement</label>
                                <input type="number" class="form-control" id="max_offenses" name="max_offenses" value="<?= $config ? $config['max_offenses'] : 3 ?>" min="1" max="10" required>
                                <div class="form-text">Nombre d'infractions qu'un utilisateur peut accumuler avant d'être banni automatiquement.</div>
                            </div>
                        </div>
                        <div class="card-footer">
                            <button type="submit" class="btn btn-primary">Enregistrer</button>
                        </div>
                    </div>
                </form>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">
                        <h5 class="mb-0">Informations</h5>
                    </div>
                    <div class="card-body">
                        <h6>À propos du système Studi</h6>
                        <p>Le système Studi permet de suivre les infractions des utilisateurs dans un contexte éducatif. Il permet :</p>
                        <ul>
                            <li>De suivre les infractions par utilisateur</li>
                            <li>D'envoyer des avertissements automatiques</li>
                            <li>De bannir automatiquement les utilisateurs après un certain nombre d'infractions</li>
                            <li>De gérer les bannissements et les réintégrations</li>
                        </ul>
                        
                        <h6 class="mt-4">Comment ça fonctionne</h6>
                        <p>Lorsqu'un utilisateur commet une infraction :</p>
                        <ol>
                            <li>Le bot enregistre l'infraction dans la base de données</li>
                            <li>L'utilisateur reçoit un avertissement automatique</li>
                            <li>Si le nombre d'infractions atteint ou dépasse le seuil configuré, l'utilisateur est automatiquement banni</li>
                        </ol>
                        
                        <div class="alert alert-info mt-3">
                            <i class="bi bi-info-circle-fill"></i> Les modérateurs peuvent toujours gérer manuellement les infractions, les bannissements et les réintégrations.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 