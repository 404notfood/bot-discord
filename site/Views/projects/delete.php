<?php
/**
 * Vue pour confirmer la suppression d'un projet
 */

// Définir le titre de la page
$title = isset($project) ? 'Supprimer le projet: ' . $project['name'] : 'Supprimer le projet';
$pageTitle = isset($project) ? 'Supprimer le projet: ' . $project['name'] : 'Supprimer le projet';
$currentPage = 'projects';
$loggedIn = true;

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><?= $pageTitle ?></h5>
        <div>
            <a href="/projects/view/<?= $project['id'] ?>" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour aux détails
            </a>
            <a href="/projects" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-list"></i> Liste des projets
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
            <p>Vous êtes sur le point de supprimer le projet <strong><?= htmlspecialchars($project['name']) ?></strong> et toutes ses données associées. Cette action est irréversible.</p>
            <hr>
            <p class="mb-0">Les éléments suivants seront également supprimés :</p>
            <ul>
                <li>Toutes les tâches associées au projet</li>
                <li>Tous les sous-groupes associés au projet</li>
                <li>Tous les canaux Discord associés au projet</li>
            </ul>
        </div>
        
        <div class="row mb-4">
            <div class="col-md-6">
                <h4>Informations du projet</h4>
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
                        <th>Date de création</th>
                        <td><?= date('d/m/Y', strtotime($project['created_at'])) ?></td>
                    </tr>
                </table>
            </div>
        </div>
        
        <form action="/projects/delete/<?= $project['id'] ?>" method="post" class="mt-4">
            <div class="d-flex justify-content-end">
                <a href="/projects/view/<?= $project['id'] ?>" class="btn btn-secondary me-2">
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