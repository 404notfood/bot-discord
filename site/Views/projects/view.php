<?php
/**
 * Vue pour afficher les détails d'un projet
 */

// Définir le titre de la page
$title = isset($project) ? 'Détails du projet: ' . $project['name'] : 'Détails du projet';
$pageTitle = isset($project) ? 'Détails du projet: ' . $project['name'] : 'Détails du projet';
$currentPage = 'projects';
$loggedIn = true;

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><?= $pageTitle ?></h5>
        <div>
            <?php if (isset($isEditor) && $isEditor): ?>
            <a href="/projects/edit/<?= $project['id'] ?>" class="btn btn-sm btn-primary">
                <i class="bi bi-pencil"></i> Modifier
            </a>
            <?php endif; ?>
            <?php if (isset($isAdmin) && $isAdmin): ?>
            <a href="/projects/delete/<?= $project['id'] ?>" class="btn btn-sm btn-danger">
                <i class="bi bi-trash"></i> Supprimer
            </a>
            <?php endif; ?>
            <a href="/projects" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour à la liste
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
            <div class="col-md-6">
                <h4>Informations générales</h4>
                <table class="table table-striped">
                    <tr>
                        <th>Nom</th>
                        <td><?= htmlspecialchars($project['name']) ?></td>
                    </tr>
                    <tr>
                        <th>Description</th>
                        <td><?= nl2br(htmlspecialchars($project['description'])) ?></td>
                    </tr>
                    <tr>
                        <th>Responsable</th>
                        <td><?= htmlspecialchars($project['owner_id']) ?></td>
                    </tr>
                    <tr>
                        <th>Statut</th>
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
                    </tr>
                    <tr>
                        <th>Date de début</th>
                        <td><?= date('d/m/Y', strtotime($project['start_date'])) ?></td>
                    </tr>
                    <tr>
                        <th>Date de fin prévue</th>
                        <td><?= date('d/m/Y', strtotime($project['due_date'])) ?></td>
                    </tr>
                    <tr>
                        <th>Créé le</th>
                        <td><?= date('d/m/Y H:i', strtotime($project['created_at'])) ?></td>
                    </tr>
                    <?php if (isset($project['updated_at']) && $project['updated_at']): ?>
                    <tr>
                        <th>Dernière mise à jour</th>
                        <td><?= date('d/m/Y H:i', strtotime($project['updated_at'])) ?></td>
                    </tr>
                    <?php endif; ?>
                </table>
            </div>
            
            <div class="col-md-6">
                <h4>Statistiques des tâches</h4>
                <?php if (isset($taskStats)): ?>
                <div class="row">
                    <div class="col-md-6 mb-3">
                        <div class="card bg-primary text-white">
                            <div class="card-body text-center">
                                <h3><?= $taskStats['total'] ?? 0 ?></h3>
                                <p class="mb-0">Tâches au total</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="card bg-success text-white">
                            <div class="card-body text-center">
                                <h3><?= $taskStats['in_progress'] ?? 0 ?></h3>
                                <p class="mb-0">Tâches en cours</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="card bg-warning text-dark">
                            <div class="card-body text-center">
                                <h3><?= $taskStats['pending'] ?? 0 ?></h3>
                                <p class="mb-0">Tâches en attente</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6 mb-3">
                        <div class="card bg-info text-white">
                            <div class="card-body text-center">
                                <h3><?= $taskStats['completed'] ?? 0 ?></h3>
                                <p class="mb-0">Tâches terminées</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mt-3">
                    <h5>Répartition par priorité</h5>
                    <div class="progress" style="height: 20px;">
                        <?php 
                        $total = max(1, $taskStats['total'] ?? 1); // Éviter division par zéro
                        $lowPct = round(($taskStats['priority_low'] ?? 0) / $total * 100);
                        $mediumPct = round(($taskStats['priority_medium'] ?? 0) / $total * 100);
                        $highPct = round(($taskStats['priority_high'] ?? 0) / $total * 100);
                        $urgentPct = round(($taskStats['priority_urgent'] ?? 0) / $total * 100);
                        ?>
                        <div class="progress-bar bg-success" role="progressbar" style="width: <?= $lowPct ?>%" aria-valuenow="<?= $lowPct ?>" aria-valuemin="0" aria-valuemax="100" title="Faible: <?= $taskStats['priority_low'] ?? 0 ?>">
                            <?= $lowPct ?>%
                        </div>
                        <div class="progress-bar bg-info" role="progressbar" style="width: <?= $mediumPct ?>%" aria-valuenow="<?= $mediumPct ?>" aria-valuemin="0" aria-valuemax="100" title="Moyenne: <?= $taskStats['priority_medium'] ?? 0 ?>">
                            <?= $mediumPct ?>%
                        </div>
                        <div class="progress-bar bg-warning" role="progressbar" style="width: <?= $highPct ?>%" aria-valuenow="<?= $highPct ?>" aria-valuemin="0" aria-valuemax="100" title="Haute: <?= $taskStats['priority_high'] ?? 0 ?>">
                            <?= $highPct ?>%
                        </div>
                        <div class="progress-bar bg-danger" role="progressbar" style="width: <?= $urgentPct ?>%" aria-valuenow="<?= $urgentPct ?>" aria-valuemin="0" aria-valuemax="100" title="Urgente: <?= $taskStats['priority_urgent'] ?? 0 ?>">
                            <?= $urgentPct ?>%
                        </div>
                    </div>
                    <div class="d-flex justify-content-between mt-2 small">
                        <span class="text-success">Faible: <?= $taskStats['priority_low'] ?? 0 ?></span>
                        <span class="text-info">Moyenne: <?= $taskStats['priority_medium'] ?? 0 ?></span>
                        <span class="text-warning">Haute: <?= $taskStats['priority_high'] ?? 0 ?></span>
                        <span class="text-danger">Urgente: <?= $taskStats['priority_urgent'] ?? 0 ?></span>
                    </div>
                </div>
                <?php else: ?>
                <div class="alert alert-info">
                    Aucune statistique disponible pour ce projet.
                </div>
                <?php endif; ?>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-12">
                <h4>Sous-groupes</h4>
                <?php if (empty($project['subgroups'])): ?>
                <div class="alert alert-info">
                    Aucun sous-groupe n'a été créé pour ce projet.
                </div>
                <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Nom</th>
                                <th>Description</th>
                                <th>Responsable</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($project['subgroups'] as $subgroup): ?>
                            <tr>
                                <td><?= htmlspecialchars($subgroup['name']) ?></td>
                                <td><?= htmlspecialchars($subgroup['description']) ?></td>
                                <td><?= htmlspecialchars($subgroup['leader_id']) ?></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <a href="/subgroups/view/<?= $subgroup['id'] ?>" class="btn btn-info">
                                            <i class="bi bi-eye"></i> Voir
                                        </a>
                                        <?php if (isset($isEditor) && $isEditor): ?>
                                        <a href="/subgroups/edit/<?= $subgroup['id'] ?>" class="btn btn-primary">
                                            <i class="bi bi-pencil"></i> Modifier
                                        </a>
                                        <?php endif; ?>
                                        <?php if (isset($isAdmin) && $isAdmin): ?>
                                        <a href="/subgroups/delete/<?= $subgroup['id'] ?>" class="btn btn-danger">
                                            <i class="bi bi-trash"></i> Supprimer
                                        </a>
                                        <?php endif; ?>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                <?php endif; ?>
                
                <?php if (isset($isEditor) && $isEditor): ?>
                <div class="mt-3">
                    <a href="/subgroups/create/<?= $project['id'] ?>" class="btn btn-primary btn-sm">
                        <i class="bi bi-plus-circle"></i> Ajouter un sous-groupe
                    </a>
                </div>
                <?php endif; ?>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-12">
                <h4>Tâches</h4>
                <?php if (empty($project['tasks'])): ?>
                <div class="alert alert-info">
                    Aucune tâche n'a été créée pour ce projet.
                </div>
                <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Titre</th>
                                <th>Statut</th>
                                <th>Priorité</th>
                                <th>Assignée à</th>
                                <th>Date d'échéance</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($project['tasks'] as $task): ?>
                            <tr>
                                <td><?= htmlspecialchars($task['title']) ?></td>
                                <td>
                                    <span class="badge bg-<?php
                                        switch ($task['status']) {
                                            case 'pending': echo 'warning'; break;
                                            case 'in_progress': echo 'success'; break;
                                            case 'review': echo 'info'; break;
                                            case 'completed': echo 'primary'; break;
                                            case 'cancelled': echo 'danger'; break;
                                            default: echo 'secondary';
                                        }
                                    ?>">
                                        <?php
                                        switch ($task['status']) {
                                            case 'pending': echo 'En attente'; break;
                                            case 'in_progress': echo 'En cours'; break;
                                            case 'review': echo 'En révision'; break;
                                            case 'completed': echo 'Terminée'; break;
                                            case 'cancelled': echo 'Annulée'; break;
                                            default: echo ucfirst($task['status']);
                                        }
                                        ?>
                                    </span>
                                </td>
                                <td>
                                    <span class="badge bg-<?php
                                        switch ($task['priority']) {
                                            case 'low': echo 'success'; break;
                                            case 'medium': echo 'info'; break;
                                            case 'high': echo 'warning'; break;
                                            case 'urgent': echo 'danger'; break;
                                            default: echo 'secondary';
                                        }
                                    ?>">
                                        <?php
                                        switch ($task['priority']) {
                                            case 'low': echo 'Faible'; break;
                                            case 'medium': echo 'Moyenne'; break;
                                            case 'high': echo 'Haute'; break;
                                            case 'urgent': echo 'Urgente'; break;
                                            default: echo ucfirst($task['priority']);
                                        }
                                        ?>
                                    </span>
                                </td>
                                <td><?= $task['assigned_to'] ? htmlspecialchars($task['assigned_to']) : '<span class="text-muted">Non assignée</span>' ?></td>
                                <td><?= $task['due_date'] ? date('d/m/Y', strtotime($task['due_date'])) : '<span class="text-muted">Non définie</span>' ?></td>
                                <td>
                                    <div class="btn-group btn-group-sm">
                                        <a href="/tasks/view/<?= $task['id'] ?>" class="btn btn-info">
                                            <i class="bi bi-eye"></i> Voir
                                        </a>
                                        <?php if (isset($isEditor) && $isEditor): ?>
                                        <a href="/tasks/edit/<?= $task['id'] ?>" class="btn btn-primary">
                                            <i class="bi bi-pencil"></i> Modifier
                                        </a>
                                        <?php endif; ?>
                                        <?php if (isset($isAdmin) && $isAdmin): ?>
                                        <a href="/tasks/delete/<?= $task['id'] ?>" class="btn btn-danger">
                                            <i class="bi bi-trash"></i> Supprimer
                                        </a>
                                        <?php endif; ?>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                <?php endif; ?>
                
                <?php if (isset($isEditor) && $isEditor): ?>
                <div class="mt-3">
                    <a href="/tasks/create/<?= $project['id'] ?>" class="btn btn-primary btn-sm">
                        <i class="bi bi-plus-circle"></i> Ajouter une tâche
                    </a>
                </div>
                <?php endif; ?>
            </div>
        </div>
        
        <?php if (!empty($project['channels'])): ?>
        <div class="row mt-4">
            <div class="col-md-12">
                <h4>Canaux Discord</h4>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID du canal</th>
                                <th>Type</th>
                                <th>Date de création</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($project['channels'] as $channel): ?>
                            <tr>
                                <td><?= htmlspecialchars($channel['channel_id']) ?></td>
                                <td>
                                    <?php
                                    switch ($channel['channel_type']) {
                                        case 'general': echo 'Général'; break;
                                        case 'tasks': echo 'Tâches'; break;
                                        case 'resources': echo 'Ressources'; break;
                                        case 'announcements': echo 'Annonces'; break;
                                        default: echo ucfirst($channel['channel_type']);
                                    }
                                    ?>
                                </td>
                                <td><?= date('d/m/Y H:i', strtotime($channel['created_at'])) ?></td>
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