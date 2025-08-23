<?php
/**
 * Vue pour afficher la liste des projets
 */

// Définir le titre de la page
$title = 'Projets';
$pageTitle = 'Gestion des projets';
$currentPage = 'projects';
$loggedIn = true;

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Liste des projets</h5>
        <div>
            <?php if (isset($isEditor) && $isEditor): ?>
            <a href="/projects/create" class="btn btn-sm btn-primary">
                <i class="bi bi-plus-circle"></i> Nouveau projet
            </a>
            <?php endif; ?>
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
        
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="card bg-primary text-white mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['total'] ?></h3>
                        <p class="card-text">Projets au total</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-success text-white mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['in_progress'] ?></h3>
                        <p class="card-text">Projets en cours</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-warning text-dark mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['planning'] ?></h3>
                        <p class="card-text">Projets en planification</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="card bg-info text-white mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['completed'] ?></h3>
                        <p class="card-text">Projets terminés</p>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Responsable</th>
                        <th>Statut</th>
                        <th>Date de début</th>
                        <th>Date de fin</th>
                        <th>Sous-groupes</th>
                        <th>Tâches</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($projects)): ?>
                    <tr>
                        <td colspan="8" class="text-center">Aucun projet trouvé</td>
                    </tr>
                    <?php else: ?>
                    <?php foreach ($projects as $project): ?>
                    <tr>
                        <td><?= htmlspecialchars($project['name']) ?></td>
                        <td><?= htmlspecialchars($project['owner_id']) ?></td>
                        <td>
                            <span class="badge bg-<?php
                                switch ($project['status']) {
                                    case 'planning': echo 'warning'; break;
                                    case 'in_progress': echo 'success'; break;
                                    case 'paused': echo 'secondary'; break;
                                    case 'completed': echo 'info'; break;
                                    case 'cancelled': echo 'danger'; break;
                                    default: echo 'primary';
                                }
                            ?>">
                                <?php
                                switch ($project['status']) {
                                    case 'planning': echo 'Planification'; break;
                                    case 'in_progress': echo 'En cours'; break;
                                    case 'paused': echo 'En pause'; break;
                                    case 'completed': echo 'Terminé'; break;
                                    case 'cancelled': echo 'Annulé'; break;
                                    default: echo ucfirst($project['status']);
                                }
                                ?>
                            </span>
                        </td>
                        <td><?= date('d/m/Y', strtotime($project['start_date'])) ?></td>
                        <td><?= date('d/m/Y', strtotime($project['due_date'])) ?></td>
                        <td><?= $project['subgroup_count'] ?? 0 ?></td>
                        <td><?= $project['task_count'] ?? 0 ?></td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <a href="/projects/view/<?= $project['id'] ?>" class="btn btn-info">
                                    <i class="bi bi-eye"></i> Voir
                                </a>
                                <?php if (isset($isEditor) && $isEditor): ?>
                                <a href="/projects/edit/<?= $project['id'] ?>" class="btn btn-primary">
                                    <i class="bi bi-pencil"></i> Modifier
                                </a>
                                <?php endif; ?>
                                <?php if (isset($isAdmin) && $isAdmin): ?>
                                <a href="/projects/delete/<?= $project['id'] ?>" class="btn btn-danger">
                                    <i class="bi bi-trash"></i> Supprimer
                                </a>
                                <?php endif; ?>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 