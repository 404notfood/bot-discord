<?php
/**
 * Vue pour afficher les détails d'un utilisateur Discord
 */

// Définir le titre de la page
$title = 'Détails utilisateur';
$currentPage = 'users';

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Détails de l'utilisateur : <?= htmlspecialchars($user['username']) ?></h5>
        <div>
            <a href="/dashboard/users" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour à la liste
            </a>
        </div>
    </div>
    <div class="card-body">
        <div class="row">
            <div class="col-md-6">
                <h6 class="border-bottom pb-2 mb-3">Informations utilisateur</h6>
                <table class="table table-sm">
                    <tbody>
                        <tr>
                            <th style="width: 40%">ID</th>
                            <td><?= $user['id'] ?></td>
                        </tr>
                        <tr>
                            <th>Discord ID</th>
                            <td><?= htmlspecialchars($user['discord_id']) ?></td>
                        </tr>
                        <tr>
                            <th>Nom d'utilisateur</th>
                            <td><?= htmlspecialchars($user['username']) ?></td>
                        </tr>
                        <tr>
                            <th>Langue préférée</th>
                            <td><?= htmlspecialchars($user['preferred_language']) ?></td>
                        </tr>
                        <tr>
                            <th>Notifications</th>
                            <td>
                                <?php if ($user['notifications_enabled']): ?>
                                    <span class="badge bg-success">Activées</span>
                                <?php else: ?>
                                    <span class="badge bg-danger">Désactivées</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <th>Date d'inscription</th>
                            <td><?= date('d/m/Y H:i', strtotime($user['created_at'])) ?></td>
                        </tr>
                        <tr>
                            <th>Dernière activité</th>
                            <td><?= date('d/m/Y H:i', strtotime($user['last_seen'])) ?></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="col-md-6">
                <h6 class="border-bottom pb-2 mb-3">Statistiques d'utilisation</h6>
                <table class="table table-sm">
                    <tbody>
                        <tr>
                            <th style="width: 60%">Nombre de commandes utilisées</th>
                            <td><?= count($commandHistory) ?></td>
                        </tr>
                        <tr>
                            <th>Nombre de ressources consultées</th>
                            <td><?= count($resourceUsage) ?></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-6">
                <h6 class="border-bottom pb-2 mb-3">Historique des commandes</h6>
                <?php if (empty($commandHistory)): ?>
                    <div class="alert alert-info">
                        Aucune commande utilisée par cet utilisateur.
                    </div>
                <?php else: ?>
                    <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>Commande</th>
                                    <th>Paramètres</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($commandHistory as $command): ?>
                                    <tr>
                                        <td><code><?= htmlspecialchars($command['command_name']) ?></code></td>
                                        <td>
                                            <?php if (!empty($command['parameters'])): ?>
                                                <small class="text-muted"><?= htmlspecialchars($command['parameters']) ?></small>
                                            <?php else: ?>
                                                <small class="text-muted">-</small>
                                            <?php endif; ?>
                                        </td>
                                        <td><small><?= date('d/m/Y H:i', strtotime($command['executed_at'])) ?></small></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
            
            <div class="col-md-6">
                <h6 class="border-bottom pb-2 mb-3">Ressources consultées</h6>
                <?php if (empty($resourceUsage)): ?>
                    <div class="alert alert-info">
                        Aucune ressource consultée par cet utilisateur.
                    </div>
                <?php else: ?>
                    <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
                        <table class="table table-sm table-hover">
                            <thead>
                                <tr>
                                    <th>Ressource</th>
                                    <th>Recherche</th>
                                    <th>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($resourceUsage as $usage): ?>
                                    <tr>
                                        <td><?= htmlspecialchars($usage['resource_name']) ?></td>
                                        <td>
                                            <?php if (!empty($usage['search_query'])): ?>
                                                <small class="text-muted"><?= htmlspecialchars($usage['search_query']) ?></small>
                                            <?php else: ?>
                                                <small class="text-muted">-</small>
                                            <?php endif; ?>
                                        </td>
                                        <td><small><?= date('d/m/Y H:i', strtotime($usage['used_at'])) ?></small></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php
$content = ob_get_clean();
require ROOT_DIR . '/Views/layout.php';
?> 