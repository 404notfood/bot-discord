<?php
/**
 * Vue pour le formulaire d'ajout ou de modification d'un projet
 */

// Définir le titre de la page
$title = isset($project) ? 'Modifier le projet' : 'Nouveau projet';
$pageTitle = isset($project) ? 'Modifier le projet' : 'Créer un nouveau projet';
$currentPage = 'projects';
$loggedIn = true;

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0"><?= $pageTitle ?></h5>
        <div>
            <a href="/projects" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour à la liste
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
        
        <form action="<?= isset($project) && isset($project['id']) ? '/projects/update/' . $project['id'] : '/projects/store' ?>" method="post" class="needs-validation" novalidate>
            <div class="row g-3">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="name" class="form-label">Nom du projet <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="name" name="name" value="<?= isset($project) ? htmlspecialchars($project['name']) : '' ?>" required>
                        <div class="invalid-feedback">Le nom du projet est requis.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="description" class="form-label">Description <span class="text-danger">*</span></label>
                        <textarea class="form-control" id="description" name="description" rows="4" required><?= isset($project) ? htmlspecialchars($project['description']) : '' ?></textarea>
                        <div class="invalid-feedback">La description du projet est requise.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="owner_id" class="form-label">Responsable <span class="text-danger">*</span></label>
                        <input type="text" class="form-control" id="owner_id" name="owner_id" value="<?= isset($project) ? htmlspecialchars($project['owner_id']) : '' ?>" required>
                        <div class="invalid-feedback">L'ID Discord du responsable est requis.</div>
                        <div class="form-text">Entrez l'ID Discord du responsable du projet</div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="mb-3">
                        <label for="status" class="form-label">Statut <span class="text-danger">*</span></label>
                        <select class="form-select" id="status" name="status" required>
                            <option value="">Sélectionner un statut</option>
                            <?php foreach ($statuses as $value => $label): ?>
                            <option value="<?= $value ?>" <?= isset($project) && isset($project['status']) && $project['status'] == $value ? 'selected' : '' ?>>
                                <?= $label ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                        <div class="invalid-feedback">Le statut du projet est requis.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="start_date" class="form-label">Date de début <span class="text-danger">*</span></label>
                        <input type="date" class="form-control" id="start_date" name="start_date" value="<?= isset($project) && isset($project['start_date']) ? date('Y-m-d', strtotime($project['start_date'])) : date('Y-m-d') ?>" required>
                        <div class="invalid-feedback">La date de début est requise.</div>
                    </div>
                    
                    <div class="mb-3">
                        <label for="due_date" class="form-label">Date de fin prévue <span class="text-danger">*</span></label>
                        <input type="date" class="form-control" id="due_date" name="due_date" value="<?= isset($project) && isset($project['due_date']) ? date('Y-m-d', strtotime($project['due_date'])) : '' ?>" required>
                        <div class="invalid-feedback">La date de fin prévue est requise.</div>
                    </div>
                    
                  
                </div>
            </div>
            
            <div class="d-flex justify-content-end mt-4">
                <a href="/projects" class="btn btn-secondary me-2">Annuler</a>
                <button type="submit" class="btn btn-primary">
                    <?= isset($project) ? 'Mettre à jour' : 'Créer le projet' ?>
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