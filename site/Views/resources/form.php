<?php
$title = ($isNew ? 'Ajouter' : 'Modifier') . ' une ressource - Dashboard Bot Discord';
$pageTitle = ($isNew ? 'Ajouter' : 'Modifier') . ' une ressource';
$currentPage = 'resources';
$loggedIn = true;
ob_start();
?>

<div class="card">
    <div class="card-body">
        <?php if (!empty($errors)): ?>
        <div class="alert alert-danger">
            <ul class="mb-0">
                <?php foreach ($errors as $error): ?>
                <li><?= htmlspecialchars($error) ?></li>
                <?php endforeach; ?>
            </ul>
        </div>
        <?php endif; ?>
        
        <form method="post" action="<?= $isNew ? '/resources/create' : '/resources/edit/' . $resource['id'] ?>">
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="name" class="form-label">Nom</label>
                    <input type="text" class="form-control" id="name" name="name" value="<?= htmlspecialchars($resource['name']) ?>" required>
                </div>
                <div class="col-md-6">
                    <label for="category_id" class="form-label">Catégorie</label>
                    <select class="form-select" id="category_id" name="category_id" required>
                        <option value="">Sélectionner une catégorie</option>
                        <?php foreach ($categories as $category): ?>
                        <option value="<?= $category['id'] ?>" <?= $category['id'] == $resource['category_id'] ? 'selected' : '' ?>>
                            <?= htmlspecialchars($category['name']) ?>
                        </option>
                        <?php endforeach; ?>
                    </select>
                </div>
            </div>
            
            <div class="mb-3">
                <label for="description" class="form-label">Description</label>
                <textarea class="form-control" id="description" name="description" rows="3" required><?= htmlspecialchars($resource['description']) ?></textarea>
            </div>
            
            <div class="mb-3">
                <label for="url" class="form-label">URL principale</label>
                <input type="url" class="form-control" id="url" name="url" value="<?= htmlspecialchars($resource['url']) ?>" required>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="search_url" class="form-label">URL de recherche (optionnelle)</label>
                    <input type="url" class="form-control" id="search_url" name="search_url" value="<?= htmlspecialchars($resource['search_url'] ?? '') ?>">
                    <div class="form-text">URL utilisée pour effectuer des recherches sur la ressource.</div>
                </div>
                <div class="col-md-6">
                    <label for="tutorial_url" class="form-label">URL de tutoriel (optionnelle)</label>
                    <input type="url" class="form-control" id="tutorial_url" name="tutorial_url" value="<?= htmlspecialchars($resource['tutorial_url'] ?? '') ?>">
                    <div class="form-text">URL vers un tutoriel ou une documentation.</div>
                </div>
            </div>
            
            <div class="mb-3 form-check form-switch">
                <input class="form-check-input" type="checkbox" id="is_active" name="is_active" value="1" <?= $resource['is_active'] ? 'checked' : '' ?>>
                <label class="form-check-label" for="is_active">Activer cette ressource</label>
                <div class="form-text">Les ressources inactives ne sont pas affichées aux utilisateurs.</div>
            </div>
            
            <div class="d-flex justify-content-between">
                <a href="/resources" class="btn btn-secondary">Annuler</a>
                <button type="submit" class="btn btn-primary">
                    <?= $isNew ? 'Créer' : 'Mettre à jour' ?>
                </button>
            </div>
        </form>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 