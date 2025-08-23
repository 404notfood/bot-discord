<?php
/**
 * Vue pour confirmer la suppression d'une catégorie
 */

// Définir le titre de la page
$title = 'Supprimer la catégorie';
$currentPage = 'categories';

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header bg-danger text-white">
        <h5 class="mb-0">Confirmation de suppression</h5>
    </div>
    <div class="card-body">
        <div class="alert alert-warning">
            <h5 class="alert-heading">Attention !</h5>
            <p>Vous êtes sur le point de supprimer la catégorie <strong><?= htmlspecialchars($category['name']) ?></strong>.</p>
            
            <?php if ($resourceCount > 0): ?>
            <p class="mb-0">
                <strong>Cette catégorie contient <?= $resourceCount ?> ressource(s).</strong>
                Si vous continuez, toutes ces ressources seront également supprimées.
            </p>
            <?php else: ?>
            <p class="mb-0">Cette catégorie ne contient aucune ressource et peut être supprimée en toute sécurité.</p>
            <?php endif; ?>
        </div>

        <div class="my-4">
            <h6>Détails de la catégorie :</h6>
            <table class="table table-sm">
                <tr>
                    <th style="width: 150px;">ID</th>
                    <td><?= $category['id'] ?></td>
                </tr>
                <tr>
                    <th>Nom</th>
                    <td><?= htmlspecialchars($category['name']) ?></td>
                </tr>
                <tr>
                    <th>Description</th>
                    <td><?= !empty($category['description']) ? htmlspecialchars($category['description']) : '<em class="text-muted">Pas de description</em>' ?></td>
                </tr>
                <tr>
                    <th>Créée le</th>
                    <td><?= date('d/m/Y H:i', strtotime($category['created_at'])) ?></td>
                </tr>
                <?php if (isset($category['updated_at'])): ?>
                <tr>
                    <th>Modifiée le</th>
                    <td><?= date('d/m/Y H:i', strtotime($category['updated_at'])) ?></td>
                </tr>
                <?php endif; ?>
                <tr>
                    <th>Ressources</th>
                    <td><span class="badge bg-primary"><?= $resourceCount ?></span></td>
                </tr>
            </table>
        </div>

        <div class="d-flex justify-content-end mt-4">
            <form action="/categories/delete/<?= $category['id'] ?>" method="post" class="me-2">
                <button type="submit" class="btn btn-danger">
                    <i class="bi bi-trash"></i> Confirmer la suppression
                </button>
            </form>
            <a href="/categories" class="btn btn-secondary">
                <i class="bi bi-x-circle"></i> Annuler
            </a>
        </div>
    </div>
</div>

<?php if ($resourceCount > 0): ?>
<div class="card shadow-sm mt-4">
    <div class="card-header">
        <h5 class="mb-0">Ressources qui seront supprimées</h5>
    </div>
    <div class="card-body">
        <?php if (isset($resources) && !empty($resources)): ?>
        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-sm table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>URL</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($resources as $resource): ?>
                    <tr>
                        <td><?= $resource['id'] ?></td>
                        <td><?= htmlspecialchars($resource['name']) ?></td>
                        <td>
                            <a href="<?= htmlspecialchars($resource['url']) ?>" target="_blank" class="text-truncate d-inline-block" style="max-width: 300px;">
                                <?= htmlspecialchars($resource['url']) ?>
                            </a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php else: ?>
        <p class="mb-0">Liste des ressources non disponible.</p>
        <?php endif; ?>
    </div>
</div>
<?php endif; ?>

<?php
$content = ob_get_clean();
require ROOT_DIR . '/Views/layout.php';
?> 