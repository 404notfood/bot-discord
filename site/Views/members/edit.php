<?php
/**
 * Vue pour la modification d'un membre
 */

// Définir le titre de la page
$title = 'Modifier un membre';
$currentPage = 'members';

// Inclure le layout
ob_start();
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h1><i class="bi bi-person-gear me-2"></i> Modifier un membre</h1>
    <div>
        <a href="/members" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-1"></i> Retour à la liste
        </a>
    </div>
</div>

<?php if (isset($error)): ?>
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <?= $error ?>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

<div class="card shadow-sm">
    <div class="card-header bg-light">
        <h5 class="mb-0">Informations du membre</h5>
    </div>
    <div class="card-body">
        <form action="" method="POST" id="editMemberForm">
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="username" class="form-label">Nom d'utilisateur <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="username" name="username" value="<?= htmlspecialchars($member['username'] ?? '') ?>" required>
                    <div class="invalid-feedback">Le nom d'utilisateur est requis</div>
                    <?php if (isset($errors['username'])): ?>
                        <div class="text-danger mt-1"><?= $errors['username'] ?></div>
                    <?php endif; ?>
                </div>
                
                <div class="col-md-6 mb-3">
                    <label for="email" class="form-label">Adresse email <span class="text-danger">*</span></label>
                    <input type="email" class="form-control" id="email" name="email" value="<?= htmlspecialchars($member['email'] ?? '') ?>" required>
                    <div class="invalid-feedback">Une adresse email valide est requise</div>
                    <?php if (isset($errors['email'])): ?>
                        <div class="text-danger mt-1"><?= $errors['email'] ?></div>
                    <?php endif; ?>
                </div>
            </div>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="role" class="form-label">Rôle <span class="text-danger">*</span></label>
                    <select class="form-select" id="role" name="role" required>
                        <option value="">Sélectionner un rôle</option>
                        <option value="admin" <?= (isset($member['role']) && $member['role'] === 'admin') ? 'selected' : '' ?>>Administrateur</option>
                        <option value="editor" <?= (isset($member['role']) && $member['role'] === 'editor') ? 'selected' : '' ?>>Éditeur</option>
                        <option value="user" <?= (isset($member['role']) && $member['role'] === 'user') ? 'selected' : '' ?>>Lecteur</option>
                    </select>
                    <div class="invalid-feedback">Veuillez sélectionner un rôle</div>
                    <?php if (isset($errors['role'])): ?>
                        <div class="text-danger mt-1"><?= $errors['role'] ?></div>
                    <?php endif; ?>
                </div>
                
                <div class="col-md-6 mb-3">
                    <label for="status" class="form-label">Statut <span class="text-danger">*</span></label>
                    <div class="form-check form-switch mt-2">
                        <input class="form-check-input" type="checkbox" id="status" name="is_active" value="1" <?= (isset($member['is_active']) && $member['is_active']) ? 'checked' : '' ?>>
                        <label class="form-check-label" for="status">Compte actif</label>
                    </div>
                    <?php if (isset($errors['is_active'])): ?>
                        <div class="text-danger mt-1"><?= $errors['is_active'] ?></div>
                    <?php endif; ?>
                </div>
            </div>
            
            <hr class="my-4">
            
            <h5 class="mb-3">Changer le mot de passe</h5>
            <p class="text-muted mb-3">Laissez les champs vides si vous ne souhaitez pas modifier le mot de passe</p>
            
            <div class="row">
                <div class="col-md-6 mb-3">
                    <label for="password" class="form-label">Nouveau mot de passe</label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="password" name="password" minlength="8">
                        <button class="btn btn-outline-secondary toggle-password" type="button" data-target="password">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                    <div class="form-text">Minimum 8 caractères</div>
                    <?php if (isset($errors['password'])): ?>
                        <div class="text-danger mt-1"><?= $errors['password'] ?></div>
                    <?php endif; ?>
                </div>
                
                <div class="col-md-6 mb-3">
                    <label for="confirm_password" class="form-label">Confirmer le nouveau mot de passe</label>
                    <div class="input-group">
                        <input type="password" class="form-control" id="confirm_password" name="confirm_password" minlength="8">
                        <button class="btn btn-outline-secondary toggle-password" type="button" data-target="confirm_password">
                            <i class="bi bi-eye"></i>
                        </button>
                    </div>
                    <div class="invalid-feedback">Les mots de passe ne correspondent pas</div>
                </div>
            </div>
            
            <div class="d-flex justify-content-end mt-4">
                <button type="reset" class="btn btn-outline-secondary me-2">Réinitialiser</button>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save me-1"></i> Enregistrer les modifications
                </button>
            </div>
        </form>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Gestion de l'affichage du mot de passe
        const toggleButtons = document.querySelectorAll('.toggle-password');
        
        toggleButtons.forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const passwordInput = document.getElementById(targetId);
                const icon = this.querySelector('i');
                
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    icon.classList.replace('bi-eye', 'bi-eye-slash');
                } else {
                    passwordInput.type = 'password';
                    icon.classList.replace('bi-eye-slash', 'bi-eye');
                }
            });
        });
        
        // Validation du formulaire
        const form = document.getElementById('editMemberForm');
        const password = document.getElementById('password');
        const confirmPassword = document.getElementById('confirm_password');
        
        form.addEventListener('submit', function(event) {
            if (password.value || confirmPassword.value) {
                if (password.value !== confirmPassword.value) {
                    confirmPassword.setCustomValidity('Les mots de passe ne correspondent pas');
                    event.preventDefault();
                } else {
                    confirmPassword.setCustomValidity('');
                }
            }
        });
        
        // Réinitialisation de la validation lors de la modification
        confirmPassword.addEventListener('input', function() {
            if (password.value === confirmPassword.value) {
                confirmPassword.setCustomValidity('');
            } else {
                confirmPassword.setCustomValidity('Les mots de passe ne correspondent pas');
            }
        });

        // Gestion des utilisateurs qui ne peuvent pas se désactiver eux-mêmes
        const statusSwitch = document.getElementById('status');
        const currentUserId = <?= $_SESSION['user_id'] ?? 0 ?>;
        const memberId = <?= $member['id'] ?? 0 ?>;
        
        if (currentUserId === memberId) {
            statusSwitch.addEventListener('change', function() {
                if (!this.checked) {
                    alert('Vous ne pouvez pas désactiver votre propre compte.');
                    this.checked = true;
                }
            });
        }
    });
</script>

<?php
$content = ob_get_clean();
require ROOT_DIR . '/Views/layout.php';
?> 