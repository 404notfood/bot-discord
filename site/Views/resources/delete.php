<?php
$title = 'Supprimer une ressource - Dashboard Bot Discord';
$pageTitle = 'Supprimer une ressource';
$currentPage = 'resources';
$loggedIn = true;
ob_start();
?>

<div class="card">
    <div class="card-body">
        <h5 class="card-title">Êtes-vous sûr de vouloir supprimer cette ressource ?</h5>
        <p class="card-text text-danger">Cette action est irréversible.</p>
        
        <div class="alert alert-info">
            <h6><?= htmlspecialchars($resource['name']) ?></h6>
            <p><strong>Catégorie:</strong> <?= htmlspecialchars($resource['category_name']) ?></p>
            <p><?= htmlspecialchars($resource['description']) ?></p>
            <p><strong>URL:</strong> <a href="<?= htmlspecialchars($resource['url']) ?>" target="_blank"><?= htmlspecialchars($resource['url']) ?></a></p>
        </div>
        
        <form method="post" action="/resources/delete/<?= $resource['id'] ?>">
            <div class="d-flex justify-content-between">
                <a href="/resources" class="btn btn-secondary">Annuler</a>
                <button type="submit" class="btn btn-danger">
                    <i class="bi bi-trash"></i> Supprimer définitivement
                </button>
            </div>
        </form>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 