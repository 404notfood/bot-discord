<?php
/**
 * Vue pour afficher les logs de modération
 */

// Définir le titre de la page
$title = 'Logs de modération';
$pageTitle = 'Logs de modération';
$currentPage = 'moderation';
$loggedIn = true;

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Logs de modération</h5>
        <div>
            <a href="/moderation/stats" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-bar-chart"></i> Statistiques
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
        
        <!-- Statistiques -->
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card bg-light">
                    <div class="card-body">
                        <h5 class="card-title">Statistiques de modération (<?= $period == 'day' ? 'dernières 24h' : ($period == 'week' ? '7 derniers jours' : ($period == 'year' ? '12 derniers mois' : '30 derniers jours')) ?>)</h5>
                        <div class="row">
                            <div class="col-md-2">
                                <div class="text-center">
                                    <h3 class="text-primary mb-0"><?= $stats['total'] ?? 0 ?></h3>
                                    <small class="text-muted">Actions</small>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="text-center">
                                    <h3 class="text-danger mb-0"><?= $stats['ban_count'] ?? 0 ?></h3>
                                    <small class="text-muted">Bannissements</small>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="text-center">
                                    <h3 class="text-warning mb-0"><?= $stats['warn_count'] ?? 0 ?></h3>
                                    <small class="text-muted">Avertissements</small>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="text-center">
                                    <h3 class="text-info mb-0"><?= $stats['kick_count'] ?? 0 ?></h3>
                                    <small class="text-muted">Expulsions</small>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="text-center">
                                    <h3 class="text-secondary mb-0"><?= $stats['unique_users'] ?? 0 ?></h3>
                                    <small class="text-muted">Utilisateurs</small>
                                </div>
                            </div>
                            <div class="col-md-2">
                                <div class="text-center">
                                    <h3 class="text-success mb-0"><?= $stats['unique_mods'] ?? 0 ?></h3>
                                    <small class="text-muted">Modérateurs</small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filtres -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0">Filtres</h6>
            </div>
            <div class="card-body">
                <form action="/moderation/logs" method="get" class="row g-3">
                    <div class="col-md-2">
                        <label for="guild_id" class="form-label">Serveur ID</label>
                        <input type="text" class="form-control" id="guild_id" name="guild_id" value="<?= htmlspecialchars($filters['guild_id'] ?? '') ?>">
                    </div>
                    <div class="col-md-2">
                        <label for="user_id" class="form-label">Utilisateur ID</label>
                        <input type="text" class="form-control" id="user_id" name="user_id" value="<?= htmlspecialchars($filters['user_id'] ?? '') ?>">
                    </div>
                    <div class="col-md-2">
                        <label for="moderator_id" class="form-label">Modérateur ID</label>
                        <input type="text" class="form-control" id="moderator_id" name="moderator_id" value="<?= htmlspecialchars($filters['moderator_id'] ?? '') ?>">
                    </div>
                    <div class="col-md-2">
                        <label for="action_type" class="form-label">Type d'action</label>
                        <select class="form-select" id="action_type" name="action_type">
                            <option value="">Tous</option>
                            <?php foreach ($actionTypes as $type => $label): ?>
                            <option value="<?= $type ?>" <?= (isset($filters['action_type']) && $filters['action_type'] === $type) ? 'selected' : '' ?>>
                                <?= $label ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="col-md-2">
                        <label for="date_from" class="form-label">Date début</label>
                        <input type="date" class="form-control" id="date_from" name="date_from" value="<?= htmlspecialchars($filters['date_from'] ?? '') ?>">
                    </div>
                    <div class="col-md-2">
                        <label for="date_to" class="form-label">Date fin</label>
                        <input type="date" class="form-control" id="date_to" name="date_to" value="<?= htmlspecialchars($filters['date_to'] ?? '') ?>">
                    </div>
                    <div class="col-md-2">
                        <label for="period" class="form-label">Période</label>
                        <select class="form-select" id="period" name="period">
                            <option value="day" <?= $period === 'day' ? 'selected' : '' ?>>24 heures</option>
                            <option value="week" <?= $period === 'week' ? 'selected' : '' ?>>7 jours</option>
                            <option value="month" <?= $period === 'month' ? 'selected' : '' ?>>30 jours</option>
                            <option value="year" <?= $period === 'year' ? 'selected' : '' ?>>12 mois</option>
                        </select>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <button type="submit" class="btn btn-primary w-100">Filtrer</button>
                    </div>
                    <div class="col-md-2 d-flex align-items-end">
                        <a href="/moderation/logs" class="btn btn-outline-secondary w-100">Réinitialiser</a>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Liste des logs -->
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Serveur</th>
                        <th>Utilisateur</th>
                        <th>Modérateur</th>
                        <th>Action</th>
                        <th>Raison</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($logs)): ?>
                    <tr>
                        <td colspan="8" class="text-center">Aucun log de modération trouvé</td>
                    </tr>
                    <?php else: ?>
                    <?php foreach ($logs as $log): ?>
                    <tr>
                        <td><?= $log['id'] ?></td>
                        <td><?= htmlspecialchars($log['guild_id']) ?></td>
                        <td>
                            <a href="/moderation/logs/user/<?= htmlspecialchars($log['user_id']) ?>">
                                <?= htmlspecialchars($log['user_id']) ?>
                            </a>
                        </td>
                        <td><?= htmlspecialchars($log['moderator_id']) ?></td>
                        <td>
                            <span class="badge bg-<?php
                                switch ($log['action_type']) {
                                    case 'warn': echo 'warning'; break;
                                    case 'kick': echo 'info'; break;
                                    case 'ban': echo 'danger'; break;
                                    case 'unban': echo 'success'; break;
                                    case 'mute': echo 'secondary'; break;
                                    case 'unmute': echo 'primary'; break;
                                    default: echo 'primary';
                                }
                            ?>">
                                <?= $actionTypes[$log['action_type']] ?? ucfirst($log['action_type']) ?>
                            </span>
                        </td>
                        <td><?= htmlspecialchars(substr($log['reason'], 0, 30)) ?><?= strlen($log['reason']) > 30 ? '...' : '' ?></td>
                        <td><?= date('d/m/Y H:i', strtotime($log['created_at'])) ?></td>
                        <td>
                            <a href="/moderation/logs/view/<?= $log['id'] ?>" class="btn btn-sm btn-info">
                                <i class="bi bi-eye"></i> Détails
                            </a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        <?php if ($pagination['total'] > 1): ?>
        <nav aria-label="Pagination des logs de modération">
            <ul class="pagination justify-content-center">
                <?php if ($pagination['current'] > 1): ?>
                <li class="page-item">
                    <a class="page-link" href="?page=1<?= isset($filters) ? '&' . http_build_query(array_filter($filters)) : '' ?>" aria-label="Première page">
                        <span aria-hidden="true">&laquo;&laquo;</span>
                    </a>
                </li>
                <li class="page-item">
                    <a class="page-link" href="?page=<?= $pagination['current'] - 1 ?><?= isset($filters) ? '&' . http_build_query(array_filter($filters)) : '' ?>" aria-label="Page précédente">
                        <span aria-hidden="true">&laquo;</span>
                    </a>
                </li>
                <?php endif; ?>
                
                <?php
                $start = max(1, $pagination['current'] - 2);
                $end = min($pagination['total'], $pagination['current'] + 2);
                
                if ($start > 1) {
                    echo '<li class="page-item disabled"><a class="page-link" href="#">...</a></li>';
                }
                
                for ($i = $start; $i <= $end; $i++) {
                    echo '<li class="page-item ' . ($pagination['current'] == $i ? 'active' : '') . '">';
                    echo '<a class="page-link" href="?page=' . $i . (isset($filters) ? '&' . http_build_query(array_filter($filters)) : '') . '">' . $i . '</a>';
                    echo '</li>';
                }
                
                if ($end < $pagination['total']) {
                    echo '<li class="page-item disabled"><a class="page-link" href="#">...</a></li>';
                }
                ?>
                
                <?php if ($pagination['current'] < $pagination['total']): ?>
                <li class="page-item">
                    <a class="page-link" href="?page=<?= $pagination['current'] + 1 ?><?= isset($filters) ? '&' . http_build_query(array_filter($filters)) : '' ?>" aria-label="Page suivante">
                        <span aria-hidden="true">&raquo;</span>
                    </a>
                </li>
                <li class="page-item">
                    <a class="page-link" href="?page=<?= $pagination['total'] ?><?= isset($filters) ? '&' . http_build_query(array_filter($filters)) : '' ?>" aria-label="Dernière page">
                        <span aria-hidden="true">&raquo;&raquo;</span>
                    </a>
                </li>
                <?php endif; ?>
            </ul>
        </nav>
        <p class="text-center text-muted">
            Affichage de <?= min(($pagination['current'] - 1) * $pagination['limit'] + 1, $pagination['total_items']) ?> à <?= min($pagination['current'] * $pagination['limit'], $pagination['total_items']) ?> sur <?= $pagination['total_items'] ?> logs
        </p>
        <?php endif; ?>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 