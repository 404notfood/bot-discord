<?php
/**
 * Vue pour afficher la liste des sous-groupes
 */

// Définir le titre de la page
$title = isset($title) ? $title : 'Sous-groupes';
$pageTitle = isset($title) ? $title : 'Liste des sous-groupes';
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
            <?php if (isset($projectId)): ?>
            <a href="/subgroups/create/<?= $projectId ?>" class="btn btn-sm btn-primary">
                <i class="bi bi-plus-circle"></i> Nouveau sous-groupe
            </a>
            <a href="/projects/view/<?= $projectId ?>" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour au projet
            </a>
            <?php else: ?>
            <a href="/subgroups/create" class="btn btn-sm btn-primary">
                <i class="bi bi-plus-circle"></i> Nouveau sous-groupe
            </a>
            <?php endif; ?>
            <?php endif; ?>
            <a href="/projects" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-list"></i> Projets
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
        
        <?php if (empty($subgroups)): ?>
        <div class="alert alert-info">
            <?php if (isset($projectId)): ?>
            Aucun sous-groupe n'a été créé pour ce projet.
            <?php else: ?>
            Aucun sous-groupe n'a été créé.
            <?php endif; ?>
        </div>
        <?php else: ?>
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Nom</th>
                        <th>Description</th>
                        <?php if (!isset($projectId)): ?>
                        <th>Projet</th>
                        <?php endif; ?>
                        <th>Responsable</th>
                        <th>Membres</th>
                        <th>Tâches</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($subgroups as $subgroup): ?>
                    <tr>
                        <td><?= htmlspecialchars($subgroup['name']) ?></td>
                        <td><?= substr(htmlspecialchars($subgroup['description']), 0, 100) . (strlen($subgroup['description']) > 100 ? '...' : '') ?></td>
                        <?php if (!isset($projectId)): ?>
                        <td>
                            <a href="/projects/view/<?= $subgroup['project_id'] ?>">
                                <?= htmlspecialchars($subgroup['project_name'] ?? $subgroup['project_id']) ?>
                            </a>
                        </td>
                        <?php endif; ?>
                        <td><?= htmlspecialchars($subgroup['leader_id'] ?: 'Non défini') ?></td>
                        <td><?= isset($subgroup['member_count']) ? $subgroup['member_count'] : 0 ?></td>
                        <td><?= isset($subgroup['task_count']) ? $subgroup['task_count'] : 0 ?></td>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <a href="/subgroups/view/<?= $subgroup['id'] ?>" class="btn btn-info">
                                    <i class="bi bi-eye"></i> Voir
                                </a>
                                <?php if (isset($isEditor) && $isEditor): ?>
                                <a href="/subgroups/edit/<?= $subgroup['id'] ?>" class="btn btn-primary">
                                    <i class="bi bi-pencil"></i> Modifier
                                </a>
                                <a href="/subgroups/members/<?= $subgroup['id'] ?>" class="btn btn-secondary">
                                    <i class="bi bi-people"></i> Membres
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
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 