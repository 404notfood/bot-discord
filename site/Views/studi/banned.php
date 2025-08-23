<?php
/**
 * Vue pour afficher les utilisateurs bannis du système Studi
 */

// Définir le titre de la page
$title = 'Utilisateurs bannis - Studi';
$pageTitle = 'Utilisateurs bannis du système Studi';
$currentPage = 'studi';
$loggedIn = true;

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Utilisateurs bannis</h5>
        <div>
            <a href="/studi" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-arrow-left"></i> Retour au tableau de bord
            </a>
            <a href="/studi/config" class="btn btn-sm btn-outline-dark">
                <i class="bi bi-gear-fill"></i> Configuration
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
        <div class="alert alert-danger mb-4">
            <div class="d-flex">
                <div class="me-3">
                    <i class="bi bi-shield-x fs-1"></i>
                </div>
                <div>
                    <h5 class="alert-heading">Liste des utilisateurs bannis par le système Studi</h5>
                    <p class="mb-0">
                        <?php if (isset($stats) && isset($stats['banned_count'])): ?>
                        Il y a actuellement <strong><?= $stats['banned_count'] ?> utilisateur(s)</strong> banni(s) par le système Studi.
                        <?php else: ?>
                        Aucune information sur les utilisateurs bannis n'est disponible.
                        <?php endif; ?>
                    </p>
                </div>
            </div>
        </div>
        
        <!-- Filtres -->
        <div class="card mb-4">
            <div class="card-header">
                <h6 class="mb-0">Filtres</h6>
            </div>
            <div class="card-body">
                <form action="/studi/banned" method="get" class="row g-3">
                    <div class="col-md-4">
                        <label for="user_id" class="form-label">ID Utilisateur</label>
                        <input type="text" class="form-control" id="user_id" name="user_id" value="<?= htmlspecialchars($filters['user_id'] ?? '') ?>">
                    </div>
                    <div class="col-md-4">
                        <label for="guild_id" class="form-label">ID Serveur</label>
                        <input type="text" class="form-control" id="guild_id" name="guild_id" value="<?= htmlspecialchars($filters['guild_id'] ?? '') ?>">
                    </div>
                    <div class="col-md-4 d-flex align-items-end">
                        <button type="submit" class="btn btn-primary me-2">Filtrer</button>
                        <a href="/studi/banned" class="btn btn-outline-secondary">Réinitialiser</a>
                    </div>
                </form>
            </div>
        </div>
        
        <!-- Liste des utilisateurs bannis -->
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Utilisateur ID</th>
                        <th>Serveur</th>
                        <th>Infractions</th>
                        <th>Date de bannissement</th>
                        <th>Raison</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($bannedUsers)): ?>
                    <tr>
                        <td colspan="6" class="text-center">Aucun utilisateur banni trouvé</td>
                    </tr>
                    <?php else: ?>
                    <?php foreach ($bannedUsers as $user): ?>
                    <tr>
                        <td><?= htmlspecialchars($user['user_id']) ?></td>
                        <td><?= htmlspecialchars($user['guild_id']) ?></td>
                        <td><span class="badge bg-danger"><?= $user['offense_count'] ?></span></td>
                        <td><?= date('d/m/Y H:i', strtotime($user['banned_at'])) ?></td>
                        <td><?= htmlspecialchars($user['reason']) ?></td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <a href="/studi/view-offender/<?= $user['user_id'] ?>" class="btn btn-info">
                                    <i class="bi bi-eye"></i> Détails
                                </a>
                                <a href="/studi/unban/<?= $user['user_id'] ?>/<?= $user['guild_id'] ?>" class="btn btn-success">
                                    <i class="bi bi-unlock"></i> Débannir
                                </a>
                                <a href="/studi/reset-offenses/<?= $user['user_id'] ?>" class="btn btn-warning">
                                    <i class="bi bi-arrow-counterclockwise"></i> Réinitialiser
                                </a>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
        
        <!-- Pagination -->
        <?php if (isset($pagination) && $pagination['total'] > 1): ?>
        <nav aria-label="Pagination des utilisateurs bannis">
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
            Affichage de <?= min(($pagination['current'] - 1) * $pagination['limit'] + 1, $pagination['total_items']) ?> à <?= min($pagination['current'] * $pagination['limit'], $pagination['total_items']) ?> sur <?= $pagination['total_items'] ?> utilisateurs bannis
        </p>
        <?php endif; ?>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 