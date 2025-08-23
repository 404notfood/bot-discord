<?php
$title = 'Ressources - Dashboard Bot Discord';
$pageTitle = 'Gestion des ressources';
$currentPage = 'resources';
$loggedIn = true;
ob_start();
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <div>
        <form action="/resources" method="get" class="d-flex">
            <input type="text" name="search" class="form-control me-2" placeholder="Rechercher une ressource..." value="<?= htmlspecialchars($_GET['search'] ?? '') ?>">
            <button type="submit" class="btn btn-outline-primary">Rechercher</button>
        </form>
    </div>
    <?php if ($isEditor): ?>
    <div>
        <a href="/resources/create" class="btn btn-primary">
            <i class="bi bi-plus-circle"></i> Ajouter une ressource
        </a>
    </div>
    <?php endif; ?>
</div>

<?php if (empty($resources)): ?>
<div class="alert alert-info">
    Aucune ressource trouvée.
</div>
<?php else: ?>

<div class="table-responsive">
    <table class="table table-hover table-striped">
        <thead class="table-dark">
            <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Catégorie</th>
                <th>Statut</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($resources as $resource): ?>
            <tr>
                <td><?= htmlspecialchars($resource['name']) ?></td>
                <td><?= htmlspecialchars(substr($resource['description'], 0, 100)) . (strlen($resource['description']) > 100 ? '...' : '') ?></td>
                <td><?= htmlspecialchars($resource['category_name']) ?></td>
                <td>
                    <?php if ($resource['is_active']): ?>
                    <span class="badge bg-success">Actif</span>
                    <?php else: ?>
                    <span class="badge bg-danger">Inactif</span>
                    <?php endif; ?>
                </td>
                <td>
                    <div class="btn-group">
                        <a href="<?= htmlspecialchars($resource['url']) ?>" target="_blank" class="btn btn-sm btn-outline-info" title="Visiter">
                            <i class="bi bi-box-arrow-up-right"></i>
                        </a>
                        <?php if ($isEditor): ?>
                        <a href="/resources/edit/<?= $resource['id'] ?>" class="btn btn-sm btn-outline-primary" title="Modifier">
                            <i class="bi bi-pencil"></i>
                        </a>
                        <?php endif; ?>
                        <?php if ($isAdmin): ?>
                        <a href="/resources/delete/<?= $resource['id'] ?>" class="btn btn-sm btn-outline-danger" title="Supprimer">
                            <i class="bi bi-trash"></i>
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

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 