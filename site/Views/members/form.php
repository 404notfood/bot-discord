<?php
/**
 * Vue partagée pour le formulaire de création/édition d'un membre
 */

// Définir le titre de la page
$title = isset($member['id']) ? 'Modifier le membre' : 'Nouveau membre';
$currentPage = 'members';

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
            <?php if (isset($member['id'])): ?>
            Modifier le membre : <?= htmlspecialchars($member['username']) ?>
            <?php else: ?>
            Ajouter un nouveau membre
            <?php endif; ?>
        </h5>
        <div>
            <a href="/members" class="btn btn-sm btn-outline-secondary">
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

        <form action="<?= isset($member['id']) ? '/members/edit/' . $member['id'] : '/members/create' ?>" method="post">
            <div class="mb-3">
                <label for="username" class="form-label">Nom d'utilisateur</label>
                <input type="text" class="form-control" id="username" name="username" value="<?= htmlspecialchars($member['username'] ?? '') ?>" required>
                <div class="form-text">Le nom d'utilisateur doit être unique et ne pas contenir d'espaces.</div>
            </div>
            
            <div class="mb-3">
                <label for="email" class="form-label">Adresse email</label>
                <input type="email" class="form-control" id="email" name="email" value="<?= htmlspecialchars($member['email'] ?? '') ?>" required>
                <div class="form-text">L'adresse email doit être unique et valide.</div>
            </div>
            
            <div class="mb-3">
                <label for="password" class="form-label">
                    <?= isset($member['id']) ? 'Nouveau mot de passe (laisser vide pour conserver l\'actuel)' : 'Mot de passe' ?>
                </label>
                <input type="password" class="form-control" id="password" name="password" <?= isset($member['id']) ? '' : 'required' ?>>
                <div class="form-text">
                    <?= isset($member['id']) 
                        ? 'Laissez ce champ vide si vous ne souhaitez pas modifier le mot de passe.' 
                        : 'Le mot de passe doit contenir au moins 8 caractères.' ?>
                </div>
            </div>
            
            <div class="mb-3">
                <label for="role" class="form-label">Rôle</label>
                <select class="form-select" id="role" name="role" required>
                    <option value="viewer" <?= (isset($member['role']) && $member['role'] === 'viewer') ? 'selected' : '' ?>>Lecteur</option>
                    <option value="editor" <?= (isset($member['role']) && $member['role'] === 'editor') ? 'selected' : '' ?>>Éditeur</option>
                    <option value="admin" <?= (isset($member['role']) && $member['role'] === 'admin') ? 'selected' : '' ?>>Administrateur</option>
                </select>
                <div class="form-text">
                    <ul class="mb-0">
                        <li><strong>Lecteur</strong> : Peut consulter les données uniquement</li>
                        <li><strong>Éditeur</strong> : Peut consulter et modifier les ressources et catégories</li>
                        <li><strong>Administrateur</strong> : Accès complet à toutes les fonctionnalités</li>
                    </ul>
                </div>
            </div>
            
            <div class="mb-3 form-check">
                <input type="checkbox" class="form-check-input" id="is_active" name="is_active" value="1"
                       <?= (!isset($member['is_active']) || $member['is_active']) ? 'checked' : '' ?>>
                <label class="form-check-label" for="is_active">Compte actif</label>
                <div class="form-text">Un compte inactif ne peut pas se connecter au dashboard.</div>
            </div>
            
            <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> 
                    <?= isset($member['id']) ? 'Enregistrer les modifications' : 'Enregistrer' ?>
                </button>
                <a href="/members" class="btn btn-outline-secondary">Annuler</a>
            </div>
        </form>
    </div>
</div>

<?php if (isset($member['id']) && isset($activityLogs) && !empty($activityLogs)): ?>
<div class="card shadow-sm mt-4">
    <div class="card-header">
        <h5 class="mb-0">Historique d'activité</h5>
    </div>
    <div class="card-body">
        <div class="table-responsive" style="max-height: 300px; overflow-y: auto;">
            <table class="table table-sm table-hover">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Action</th>
                        <th>Détails</th>
                        <th>Adresse IP</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($activityLogs as $log): ?>
                    <tr>
                        <td><?= date('d/m/Y H:i', strtotime($log['created_at'])) ?></td>
                        <td><?= htmlspecialchars($log['action']) ?></td>
                        <td><?= htmlspecialchars($log['details']) ?></td>
                        <td><small><?= htmlspecialchars($log['ip_address']) ?></small></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>
<?php endif; ?>

<?php
$content = ob_get_clean();
require ROOT_DIR . '/Views/layout.php';
?> 