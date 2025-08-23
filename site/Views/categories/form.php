<?php
/**
 * Vue partagée pour le formulaire de création/édition d'une catégorie
 */

// Définir le titre de la page
$title = isset($category['id']) ? 'Modifier la catégorie' : 'Nouvelle catégorie';
$currentPage = 'categories';

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
            <?php if (isset($category['id'])): ?>
            Modifier la catégorie : <?= htmlspecialchars($category['name']) ?>
            <?php else: ?>
            Créer une nouvelle catégorie
            <?php endif; ?>
        </h5>
        <div>
            <a href="/categories" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour à la liste
            </a>
        </div>
    </div>
    <div class="card-body">
        <?php if (isset($error)): ?>
        <div class="alert alert-danger">
            <?= $error ?>
        </div>
        <?php endif; ?>

        <form action="<?= isset($category['id']) ? '/categories/edit/' . $category['id'] : '/categories/create' ?>" method="post">
            <div class="mb-3">
                <label for="name" class="form-label">Nom de la catégorie</label>
                <input type="text" class="form-control" id="name" name="name" value="<?= htmlspecialchars($category['name'] ?? '') ?>" required>
                <div class="form-text">Le nom doit être unique et représentatif du contenu.</div>
            </div>
            
            <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea class="form-control" id="description" name="description" rows="4"><?= htmlspecialchars($category['description'] ?? '') ?></textarea>
                <div class="form-text">Une description claire aide les utilisateurs à comprendre le type de ressources incluses.</div>
            </div>
            
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> 
                    <?= isset($category['id']) ? 'Enregistrer les modifications' : 'Enregistrer' ?>
                </button>
                <a href="/categories" class="btn btn-outline-secondary">Annuler</a>
            </div>
        </form>
    </div>
</div>

<?php if (isset($category['id']) && isset($resourceCount) && $resourceCount > 0): ?>
<div class="card shadow-sm mt-4">
    <div class="card-header">
        <h5 class="mb-0">Ressources dans cette catégorie</h5>
    </div>
    <div class="card-body">
        <p>Cette catégorie contient <strong><?= $resourceCount ?></strong> ressource(s).</p>
        <a href="/resources?category=<?= $category['id'] ?>" class="btn btn-info">
            <i class="bi bi-box"></i> Voir les ressources
        </a>
    </div>
</div>
<?php endif; ?>

<?php
$content = ob_get_clean();
require ROOT_DIR . '/Views/layout.php';
?> 