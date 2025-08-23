<?php
/**
 * Vue pour afficher les détails d'un sous-groupe
 */

// Définir le titre de la page
$title = isset($subgroup) ? 'Détails du sous-groupe: ' . $subgroup['name'] : 'Détails du sous-groupe';
$pageTitle = isset($subgroup) ? 'Détails du sous-groupe: ' . $subgroup['name'] : 'Détails du sous-groupe';
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
            <a href="/subgroups/edit/<?= $subgroup['id'] ?>" class="btn btn-sm btn-primary">
                <i class="bi bi-pencil"></i> Modifier
            </a>
            <a href="/subgroups/members/<?= $subgroup['id'] ?>" class="btn btn-sm btn-secondary">
                <i class="bi bi-people"></i> Gérer les membres
            </a>
            <?php endif; ?>
            <?php if (isset($isAdmin) && $isAdmin): ?>
            <a href="/subgroups/delete/<?= $subgroup['id'] ?>" class="btn btn-sm btn-danger">
                <i class="bi bi-trash"></i> Supprimer
            </a>
            <?php endif; ?>
            <a href="/projects/view/<?= $subgroup['project_id'] ?>" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour au projet
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
                        <td><?= htmlspecialchars($subgroup['name']) ?></td>
                    </tr>
                    <tr>
                        <th>Description</th>
                        <td><?= nl2br(htmlspecialchars($subgroup['description'])) ?></td>
                    </tr>
                    <tr>
                        <th>Projet</th>
                        <td>
                            <a href="/projects/view/<?= $subgroup['project_id'] ?>">
                                <?= htmlspecialchars($project['name'] ?? $subgroup['project_id']) ?>
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <th>Responsable</th>
                        <td><?= htmlspecialchars($subgroup['leader_id'] ?: 'Non défini') ?></td>
                    </tr>
                    <tr>
                        <th>Créé le</th>
                        <td><?= date('d/m/Y H:i', strtotime($subgroup['created_at'])) ?></td>
                    </tr>
                    <?php if (isset($subgroup['updated_at']) && $subgroup['updated_at']): ?>
                    <tr>
                        <th>Dernière mise à jour</th>
                        <td><?= date('d/m/Y H:i', strtotime($subgroup['updated_at'])) ?></td>
                    </tr>
                    <?php endif; ?>
                </table>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-12">
                <h4>Membres du sous-groupe</h4>
                <?php if (empty($members)): ?>
                <div class="alert alert-info">
                    Aucun membre n'a été ajouté à ce sous-groupe.
                </div>
                <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID Discord</th>
                                <th>Rôle</th>
                                <th>Date d'ajout</th>
                                <?php if (isset($isEditor) && $isEditor): ?>
                                <th>Actions</th>
                                <?php endif; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($members as $member): ?>
                            <tr>
                                <td><?= htmlspecialchars($member['user_id']) ?></td>
                                <td>
                                    <span class="badge <?= $member['role'] === 'leader' ? 'bg-primary' : 'bg-secondary' ?>">
                                        <?= ucfirst($member['role']) ?>
                                    </span>
                                </td>
                                <td><?= date('d/m/Y', strtotime($member['joined_at'])) ?></td>
                                <?php if (isset($isEditor) && $isEditor): ?>
                                <td>
                                    <form action="/subgroups/members/<?= $subgroup['id'] ?>" method="post" class="d-inline">
                                        <input type="hidden" name="action" value="remove">
                                        <input type="hidden" name="user_id" value="<?= $member['user_id'] ?>">
                                        <button type="submit" class="btn btn-sm btn-danger" onclick="return confirm('Êtes-vous sûr de vouloir retirer ce membre ?');">
                                            <i class="bi bi-person-x"></i> Retirer
                                        </button>
                                    </form>
                                    <?php if ($member['role'] !== 'leader'): ?>
                                    <form action="/subgroups/members/<?= $subgroup['id'] ?>" method="post" class="d-inline">
                                        <input type="hidden" name="action" value="promote">
                                        <input type="hidden" name="user_id" value="<?= $member['user_id'] ?>">
                                        <button type="submit" class="btn btn-sm btn-primary">
                                            <i class="bi bi-arrow-up-circle"></i> Promouvoir
                                        </button>
                                    </form>
                                    <?php endif; ?>
                                </td>
                                <?php endif; ?>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                <?php endif; ?>
                
                <?php if (isset($isEditor) && $isEditor): ?>
                <div class="mt-3">
                    <a href="/subgroups/members/<?= $subgroup['id'] ?>" class="btn btn-primary btn-sm">
                        <i class="bi bi-person-plus"></i> Gérer les membres
                    </a>
                </div>
                <?php endif; ?>
            </div>
        </div>
        
        <div class="row mt-4">
            <div class="col-md-12">
                <h4>Tâches du sous-groupe</h4>
                <?php if (empty($tasks)): ?>
                <div class="alert alert-info">
                    Aucune tâche n'a été créée pour ce sous-groupe.
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
                            <?php foreach ($tasks as $task): ?>
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
                    <a href="/tasks/create/<?= $subgroup['project_id'] ?>?subgroup_id=<?= $subgroup['id'] ?>" class="btn btn-primary btn-sm">
                        <i class="bi bi-plus-circle"></i> Ajouter une tâche
                    </a>
                </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 