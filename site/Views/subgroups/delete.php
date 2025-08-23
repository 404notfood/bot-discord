<?php
/**
 * Vue pour confirmer la suppression d'un sous-groupe
 */

// Définir le titre de la page
$title = isset($subgroup) ? 'Supprimer le sous-groupe: ' . $subgroup['name'] : 'Supprimer le sous-groupe';
$pageTitle = isset($subgroup) ? 'Supprimer le sous-groupe: ' . $subgroup['name'] : 'Supprimer le sous-groupe';
$currentPage = 'projects';
$loggedIn = true;

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><?= $pageTitle ?></h5>
        <div>
            <a href="/subgroups/view/<?= $subgroup['id'] ?>" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour aux détails
            </a>
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
        
        <div class="alert alert-warning">
            <h4 class="alert-heading">Attention !</h4>
            <p>Vous êtes sur le point de supprimer le sous-groupe <strong><?= htmlspecialchars($subgroup['name']) ?></strong> et toutes ses données associées. Cette action est irréversible.</p>
            <hr>
            <p class="mb-0">Les éléments suivants seront également supprimés :</p>
            <ul>
                <li>Tous les membres du sous-groupe</li>
                <li>Toutes les tâches associées au sous-groupe (sauf si vous choisissez de les réassigner au projet principal)</li>
            </ul>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <h4>Informations du sous-groupe</h4>
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
                        <td><?= htmlspecialchars($subgroup['project_id']) ?></td>
                    </tr>
                    <tr>
                        <th>Responsable</th>
                        <td><?= htmlspecialchars($subgroup['leader_id'] ?: 'Non défini') ?></td>
                    </tr>
                    <tr>
                        <th>Date de création</th>
                        <td><?= date('d/m/Y', strtotime($subgroup['created_at'])) ?></td>
                    </tr>
                </table>
            </div>
        </div>
        
        <form action="/subgroups/delete/<?= $subgroup['id'] ?>" method="post" class="mt-4">
            <div class="form-check mb-3">
                <input class="form-check-input" type="checkbox" id="reassign_tasks" name="reassign_tasks" value="1">
                <label class="form-check-label" for="reassign_tasks">
                    Réassigner les tâches au projet principal au lieu de les supprimer
                </label>
            </div>
            
            <div class="d-flex justify-content-end">
                <a href="/subgroups/view/<?= $subgroup['id'] ?>" class="btn btn-secondary me-2">
                    <i class="bi bi-x-circle"></i> Annuler
                </a>
                <button type="submit" class="btn btn-danger">
                    <i class="bi bi-trash"></i> Confirmer la suppression
                </button>
            </div>
        </form>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 