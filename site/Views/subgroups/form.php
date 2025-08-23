<?php
/**
 * Vue pour le formulaire d'ajout ou de modification d'un sous-groupe
 */

// Définir le titre de la page
$title = isset($title) ? $title : (isset($subgroup) && !$isNew ? 'Modifier le sous-groupe' : 'Nouveau sous-groupe');
$pageTitle = isset($title) ? $title : (isset($subgroup) && !$isNew ? 'Modifier le sous-groupe' : 'Créer un nouveau sous-groupe');
$currentPage = 'projects';
$loggedIn = true;

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><?= $pageTitle ?></h5>
        <div>
            <?php if (isset($subgroup) && isset($subgroup['id']) && !$isNew): ?>
            <a href="/subgroups/view/<?= $subgroup['id'] ?>" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour aux détails
            </a>
            <?php elseif (isset($project) && isset($project['id'])): ?>
            <a href="/projects/view/<?= $project['id'] ?>" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour au projet
            </a>
            <?php else: ?>
            <a href="/projects" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour aux projets
            </a>
            <?php endif; ?>
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
        
        <form action="<?= $isNew ? '/subgroups/create' . (isset($project) && isset($project['id']) ? '/' . $project['id'] : '') : '/subgroups/edit/' . $subgroup['id'] ?>" method="post" class="needs-validation" novalidate>
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="name" class="form-label">Nom du sous-groupe <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="name" name="name" value="<?= isset($subgroup) ? htmlspecialchars($subgroup['name']) : '' ?>" required>
                        <div class="invalid-feedback">Le nom du sous-groupe est requis.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="description" class="form-label">Description</label>
                        <textarea class="form-control" id="description" name="description" rows="4"><?= isset($subgroup) ? htmlspecialchars($subgroup['description']) : '' ?></textarea>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="project_id" class="form-label">Projet <span class="text-danger">*</span></label>
                        <?php if (isset($project) && isset($project['id'])): ?>
                        <input type="text" class="form-control" value="<?= htmlspecialchars($project['name']) ?>" readonly>
                        <input type="hidden" name="project_id" value="<?= $project['id'] ?>">
                        <?php else: ?>
                        <select class="form-select" id="project_id" name="project_id" required>
                            <option value="">Sélectionner un projet</option>
                            <?php foreach ($projects as $proj): ?>
                            <option value="<?= $proj['id'] ?>" <?= isset($subgroup) && isset($subgroup['project_id']) && $subgroup['project_id'] == $proj['id'] ? 'selected' : '' ?>>
                                <?= htmlspecialchars($proj['name']) ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                        <div class="invalid-feedback">Le projet est requis.</div>
                        <?php endif; ?>
                    </div>
                    
                    <div class="mb-3">
                        <label for="leader_id" class="form-label">Responsable (ID Discord)</label>
                        <input type="text" class="form-control" id="leader_id" name="leader_id" value="<?= isset($subgroup) && isset($subgroup['leader_id']) ? htmlspecialchars($subgroup['leader_id']) : '' ?>">
                        <div class="form-text">Entrez l'ID Discord du responsable du sous-groupe (facultatif)</div>
                    </div>
                </div>
            </div>
            
            <div class="d-flex justify-content-end mt-4">
                <a href="<?= isset($project) && isset($project['id']) ? '/projects/view/' . $project['id'] : (isset($subgroup) && isset($subgroup['id']) ? '/subgroups/view/' . $subgroup['id'] : '/projects') ?>" class="btn btn-secondary me-2">Annuler</a>
                <button type="submit" class="btn btn-primary">
                    <?= $isNew ? 'Créer le sous-groupe' : 'Mettre à jour' ?>
                </button>
            </div>
        </form>
    </div>
</div>

<script>
// Script de validation du formulaire
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {
        const forms = document.querySelectorAll('.needs-validation');
        
        Array.from(forms).forEach(function(form) {
            form.addEventListener('submit', function(event) {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                
                form.classList.add('was-validated');
            }, false);
        });
    });
})();
</script>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 