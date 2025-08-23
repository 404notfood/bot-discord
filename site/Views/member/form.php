<?php require_once 'Views/includes/header.php'; ?>

<div class="container mt-4">
    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card shadow">
                <div class="card-header bg-primary text-white">
                    <h2 class="h4 mb-0">
                        <?= isset($member) ? 'Modifier le membre' : 'Ajouter un nouveau membre' ?>
                    </h2>
                </div>
                <div class="card-body">
                    <?php if (isset($errors) && !empty($errors)): ?>
                        <div class="alert alert-danger">
                            <ul class="mb-0">
                                <?php foreach ($errors as $error): ?>
                                    <li><?= $error ?></li>
                                <?php endforeach; ?>
                            </ul>
                        </div>
                    <?php endif; ?>

                    <form action="?controller=member&action=<?= isset($member) ? 'update' : 'store' ?>" method="POST" class="needs-validation" novalidate>
                        <?php if (isset($member)): ?>
                            <input type="hidden" name="id" value="<?= $member['id'] ?>">
                        <?php endif; ?>

                        <div class="mb-3">
                            <label for="username" class="form-label">Nom d'utilisateur <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="username" name="username" 
                                   value="<?= isset($member) ? htmlspecialchars($member['username']) : htmlspecialchars($form_data['username'] ?? '') ?>" 
                                   required>
                            <div class="invalid-feedback">Veuillez saisir un nom d'utilisateur.</div>
                        </div>

                        <div class="mb-3">
                            <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
                            <input type="email" class="form-control" id="email" name="email" 
                                   value="<?= isset($member) ? htmlspecialchars($member['email']) : htmlspecialchars($form_data['email'] ?? '') ?>" 
                                   required>
                            <div class="invalid-feedback">Veuillez saisir une adresse email valide.</div>
                        </div>

                        <div class="mb-3">
                            <label for="password" class="form-label">
                                <?= isset($member) ? 'Mot de passe (laissez vide pour ne pas modifier)' : 'Mot de passe <span class="text-danger">*</span>' ?>
                            </label>
                            <input type="password" class="form-control" id="password" name="password" 
                                   <?= isset($member) ? '' : 'required' ?>>
                            <div class="invalid-feedback">Veuillez saisir un mot de passe.</div>
                        </div>

                        <div class="mb-3">
                            <label for="password_confirm" class="form-label">
                                <?= isset($member) ? 'Confirmation du mot de passe (si modifié)' : 'Confirmation du mot de passe <span class="text-danger">*</span>' ?>
                            </label>
                            <input type="password" class="form-control" id="password_confirm" name="password_confirm" 
                                   <?= isset($member) ? '' : 'required' ?>>
                            <div class="invalid-feedback">Veuillez confirmer votre mot de passe.</div>
                        </div>

                        <div class="mb-3">
                            <label for="role" class="form-label">Rôle <span class="text-danger">*</span></label>
                            <select class="form-select" id="role" name="role" required>
                                <option value="">Sélectionnez un rôle</option>
                                <option value="user" <?= (isset($member) && $member['role'] === 'user') || (isset($form_data) && ($form_data['role'] ?? '') === 'user') ? 'selected' : '' ?>>
                                    Utilisateur
                                </option>
                                <?php if (hasPermission('admin_management') || (isset($member) && $member['role'] === 'admin')): ?>
                                    <option value="admin" <?= (isset($member) && $member['role'] === 'admin') || (isset($form_data) && ($form_data['role'] ?? '') === 'admin') ? 'selected' : '' ?>>
                                        Administrateur
                                    </option>
                                <?php endif; ?>
                            </select>
                            <div class="invalid-feedback">Veuillez sélectionner un rôle.</div>
                        </div>

                        <div class="mb-3">
                            <label for="is_active" class="form-label">Statut</label>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" id="is_active" name="is_active" value="1"
                                       <?= (isset($member) && $member['is_active'] == 1) || (isset($form_data) && ($form_data['is_active'] ?? '') == 1) ? 'checked' : '' ?>>
                                <label class="form-check-label" for="is_active">Compte actif</label>
                            </div>
                        </div>

                        <div class="d-flex justify-content-between mt-4">
                            <a href="?controller=member" class="btn btn-secondary">
                                <i class="fas fa-arrow-left"></i> Retour
                            </a>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> <?= isset($member) ? 'Mettre à jour' : 'Enregistrer' ?>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
    // Validation du formulaire côté client
    (function() {
        'use strict';
        
        const forms = document.querySelectorAll('.needs-validation');
        
        Array.from(forms).forEach(form => {
            form.addEventListener('submit', event => {
                if (!form.checkValidity()) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                
                form.classList.add('was-validated');
            }, false);
        });
    })();
</script>

<?php require_once 'Views/includes/footer.php'; ?> 