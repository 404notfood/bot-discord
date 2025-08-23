<?php
/**
 * Vue pour afficher le tableau de bord Studi
 */

// Définir le titre de la page
$title = 'Système Studi';
$pageTitle = 'Gestion du système Studi';
$currentPage = 'studi';
$loggedIn = true;

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Système Studi</h5>
        <div>
            <a href="/studi/config" class="btn btn-sm btn-outline-dark">
                <i class="bi bi-gear-fill"></i> Configuration
            </a>
            <a href="/studi/banned" class="btn btn-sm btn-outline-danger">
                <i class="bi bi-shield-x"></i> Utilisateurs bannis
            </a>
            <a href="/dashboard" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-speedometer2"></i> Dashboard
            </a>
        </div>
    </div>
    <div class="card-body">
        <?php if (isset($flashMessage)): ?>
        <div class="alert alert-<?= $flashType ?? 'info' ?> alert-dismissible fade show" role="alert">
            <?= $flashMessage ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        <?php endif; ?>
        
        <!-- Statut du système -->
        <div class="alert alert-<?= ($config && $config['is_enabled']) ? 'success' : 'warning' ?> mb-4">
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <h5 class="alert-heading">Statut du système Studi</h5>
                    <p class="mb-0">
                        Le système de gestion des infractions Studi est actuellement 
                        <strong><?= ($config && $config['is_enabled']) ? 'activé' : 'désactivé' ?></strong>.
                        <?php if ($config): ?>
                        <br>Nombre maximum d'infractions avant bannissement : <strong><?= $config['max_offenses'] ?></strong>
                        <?php endif; ?>
                    </p>
                </div>
                <a href="/studi/config" class="btn btn-outline-<?= ($config && $config['is_enabled']) ? 'light' : 'dark' ?>">
                    <i class="bi bi-gear-fill"></i> Modifier la configuration
                </a>
            </div>
        </div>
        
        <!-- Statistiques -->
        <div class="row mb-4">
            <div class="col-md-12">
                <h4 class="border-bottom pb-2 mb-3">Statistiques générales</h4>
            </div>
            <div class="col-md-3">
                <div class="card bg-primary text-white mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['total_offenders'] ?? 0 ?></h3>
                        <p class="card-text">Contrevenants</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-danger text-white mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['banned_count'] ?? 0 ?></h3>
                        <p class="card-text">Utilisateurs bannis</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-dark mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['total_offenses'] ?? 0 ?></h3>
                        <p class="card-text">Infractions totales</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= number_format($stats['avg_offenses'] ?? 0, 1) ?></h3>
                        <p class="card-text">Moy. infractions / utilisateur</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Top contrevenants -->
        <div class="card mb-4">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Top contrevenants</h5>
                <a href="/studi/offenders" class="btn btn-sm btn-primary">
                    <i class="bi bi-list-ul"></i> Voir tous les contrevenants
                </a>
            </div>
            <div class="card-body">
                <?php if (empty($topOffenders)): ?>
                <p class="text-center text-muted">Aucun contrevenant enregistré</p>
                <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Utilisateur ID</th>
                                <th>Infractions</th>
                                <th>Statut</th>
                                <th>Dernière infraction</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($topOffenders as $offender): ?>
                            <?php 
                            $isBanned = isset($stats['banned_users']) && in_array($offender['user_id'], $stats['banned_users']);
                            $warningLevel = ($offender['offense_count'] / ($config ? $config['max_offenses'] : 3)) * 100;
                            ?>
                            <tr>
                                <td><?= htmlspecialchars($offender['user_id']) ?></td>
                                <td>
                                    <div class="progress" style="height: 20px;">
                                        <div class="progress-bar <?= $isBanned ? 'bg-danger' : ($warningLevel > 75 ? 'bg-warning' : 'bg-success') ?>" 
                                             role="progressbar" style="width: <?= min($warningLevel, 100) ?>%;" 
                                             aria-valuenow="<?= $offender['offense_count'] ?>" 
                                             aria-valuemin="0" 
                                             aria-valuemax="<?= $config ? $config['max_offenses'] : 3 ?>">
                                            <?= $offender['offense_count'] ?> / <?= $config ? $config['max_offenses'] : 3 ?>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <?php if ($isBanned): ?>
                                    <span class="badge bg-danger">Banni</span>
                                    <?php elseif ($warningLevel > 75): ?>
                                    <span class="badge bg-warning text-dark">À risque</span>
                                    <?php else: ?>
                                    <span class="badge bg-success">Normal</span>
                                    <?php endif; ?>
                                </td>
                                <td><?= date('d/m/Y H:i', strtotime($offender['last_offense_at'])) ?></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <a href="/studi/view-offender/<?= $offender['user_id'] ?>" class="btn btn-info">
                                            <i class="bi bi-eye"></i> Détails
                                        </a>
                                        <a href="/studi/reset-offenses/<?= $offender['user_id'] ?>" class="btn btn-warning">
                                            <i class="bi bi-arrow-counterclockwise"></i> Réinitialiser
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                <?php endif; ?>
            </div>
        </div>
        
        <!-- Statistiques par serveur -->
        <?php if (!empty($stats['guilds'])): ?>
        <div class="card">
            <div class="card-header">
                <h5 class="mb-0">Statistiques par serveur</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Serveur ID</th>
                                <th>Contrevenants</th>
                                <th>Infractions</th>
                                <th>Max. infractions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($stats['guilds'] as $guild): ?>
                            <tr>
                                <td><?= htmlspecialchars($guild['guild_id']) ?></td>
                                <td><?= $guild['offender_count'] ?></td>
                                <td><?= $guild['offense_count'] ?></td>
                                <td><?= $guild['max_offenses'] ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 