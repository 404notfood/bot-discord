<?php
/**
 * Vue pour la création d'un nouveau membre
 */

// Définir le titre de la page
$title = 'Ajouter un membre';
$currentPage = 'members';

// Inclure le layout
ob_start();
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h1 class="mb-0">
        <i class="bi bi-person-plus me-2"></i>
        Ajouter un nouveau membre
    </h1>
    <div>
        <a href="/members" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left"></i> Retour à la liste
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
        <h5 class="mb-0">Informations du nouveau membre</h5>
    </div>
    <div class="card-body">
        <form action="/members/create" method="POST" class="needs-validation" novalidate>
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="username" class="form-label fw-bold">Nom d'utilisateur</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-person"></i></span>
                        <input type="text" id="username" name="username" class="form-control" 
                               value="<?= isset($formData['username']) ? htmlspecialchars($formData['username']) : '' ?>" required>
                        <div class="invalid-feedback">Veuillez saisir un nom d'utilisateur.</div>
                    </div>
                    <div class="form-text">Le nom d'utilisateur doit contenir au moins 3 caractères.</div>
                </div>
                <div class="col-md-6">
                    <label for="email" class="form-label fw-bold">Adresse email</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-envelope"></i></span>
                        <input type="email" id="email" name="email" class="form-control" 
                               value="<?= isset($formData['email']) ? htmlspecialchars($formData['email']) : '' ?>" required>
                        <div class="invalid-feedback">Veuillez saisir une adresse email valide.</div>
                    </div>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="role" class="form-label fw-bold">Rôle</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-shield-lock"></i></span>
                        <select id="role" name="role" class="form-select" required>
                            <option value="">Sélectionner un rôle</option>
                            <option value="admin" <?= (isset($formData['role']) && $formData['role'] === 'admin') ? 'selected' : '' ?>>Administrateur</option>
                            <option value="editor" <?= (isset($formData['role']) && $formData['role'] === 'editor') ? 'selected' : '' ?>>Éditeur</option>
                            <option value="user" <?= (isset($formData['role']) && $formData['role'] === 'user') ? 'selected' : '' ?>>Lecteur</option>
                        </select>
                        <div class="invalid-feedback">Veuillez sélectionner un rôle.</div>
                    </div>
                    <div class="form-text">
                        <span class="fw-bold text-primary">Information :</span> 
                        <ul class="mb-0 ps-3 mt-1">
                            <li><strong>Administrateur</strong> : Accès complet à toutes les fonctionnalités</li>
                            <li><strong>Éditeur</strong> : Peut créer et modifier du contenu</li>
                            <li><strong>Lecteur</strong> : Peut uniquement consulter le contenu</li>
                        </ul>
                    </div>
                </div>
                <div class="col-md-6">
                    <label for="is_active" class="form-label fw-bold">Statut</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-toggle-on"></i></span>
                        <select id="is_active" name="is_active" class="form-select" required>
                            <option value="1" <?= (!isset($formData['is_active']) || $formData['is_active'] == 1) ? 'selected' : '' ?>>Actif</option>
                            <option value="0" <?= (isset($formData['is_active']) && $formData['is_active'] == 0) ? 'selected' : '' ?>>Inactif</option>
                        </select>
                    </div>
                    <div class="form-text">
                        Un utilisateur inactif ne pourra pas se connecter à l'application.
                    </div>
                </div>
            </div>
            
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="password" class="form-label fw-bold">Mot de passe</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-key"></i></span>
                        <input type="password" id="password" name="password" class="form-control" required autocomplete="new-password">
                        <button class="btn btn-outline-secondary" type="button" id="togglePassword">
                            <i class="bi bi-eye"></i>
                        </button>
                        <div class="invalid-feedback">Veuillez saisir un mot de passe.</div>
                    </div>
                    <div class="form-text">Le mot de passe doit contenir au moins 8 caractères.</div>
                </div>
                <div class="col-md-6">
                    <label for="password_confirm" class="form-label fw-bold">Confirmer le mot de passe</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-key-fill"></i></span>
                        <input type="password" id="password_confirm" name="password_confirm" class="form-control" required autocomplete="new-password">
                        <button class="btn btn-outline-secondary" type="button" id="togglePasswordConfirm">
                            <i class="bi bi-eye"></i>
                        </button>
                        <div class="invalid-feedback">Veuillez confirmer le mot de passe.</div>
                    </div>
                    <div class="form-text">Les mots de passe doivent correspondre.</div>
                </div>
            </div>
            
            <hr class="my-4">
            
            <div class="text-end">
                <button type="reset" class="btn btn-outline-secondary me-2">
                    <i class="bi bi-arrow-clockwise"></i> Réinitialiser
                </button>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-person-plus-fill"></i> Créer le membre
                </button>
            </div>
        </form>
    </div>
</div>

<script>
    // Afficher/masquer les mots de passe
    document.addEventListener('DOMContentLoaded', function() {
        // Pour le premier champ de mot de passe
        const togglePassword = document.getElementById('togglePassword');
        const password = document.getElementById('password');
        
        togglePassword.addEventListener('click', function() {
            const type = password.getAttribute('type') === 'password' ? 'text' : 'password';
            password.setAttribute('type', type);
            
            // Changer l'icône
            this.querySelector('i').classList.toggle('bi-eye');
            this.querySelector('i').classList.toggle('bi-eye-slash');
        });
        
        // Pour le champ de confirmation de mot de passe
        const togglePasswordConfirm = document.getElementById('togglePasswordConfirm');
        const passwordConfirm = document.getElementById('password_confirm');
        
        togglePasswordConfirm.addEventListener('click', function() {
            const type = passwordConfirm.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordConfirm.setAttribute('type', type);
            
            // Changer l'icône
            this.querySelector('i').classList.toggle('bi-eye');
            this.querySelector('i').classList.toggle('bi-eye-slash');
        });
        
        // Validation du formulaire
        const form = document.querySelector('.needs-validation');
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            
            // Vérifier que les mots de passe correspondent
            if (password.value !== passwordConfirm.value) {
                passwordConfirm.setCustomValidity('Les mots de passe ne correspondent pas');
                event.preventDefault();
                event.stopPropagation();
            } else {
                passwordConfirm.setCustomValidity('');
            }
            
            form.classList.add('was-validated');
        });
    });
</script>

<?php
$content = ob_get_clean();
require ROOT_DIR . '/Views/layout.php';
?> 