<?php
/**
 * Vue pour la confirmation de suppression d'un membre
 */

// Définir le titre de la page
$title = 'Supprimer le membre';
$currentPage = 'members';

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header bg-danger text-white d-flex justify-content-between align-items-center">
        <h5 class="mb-0">
            <i class="bi bi-exclamation-triangle-fill me-2"></i>
            Confirmation de suppression
        </h5>
        <div>
            <a href="/members" class="btn btn-sm btn-outline-light">
                <i class="bi bi-arrow-left"></i> Retour à la liste
            </a>
        </div>
    </div>
    <div class="card-body">
        <div class="alert alert-warning">
            <i class="bi bi-exclamation-triangle-fill"></i> 
            Vous êtes sur le point de supprimer définitivement le membre <strong><?= htmlspecialchars($member['username']) ?></strong>.
            Cette action est irréversible.
        </div>
        
        <h6 class="mt-4 mb-3">Détails du membre :</h6>
        <table class="table table-sm table-striped border">
            <tbody>
                <tr>
                    <th style="width: 150px;">ID</th>
                    <td><?= $member['id'] ?></td>
                </tr>
                <tr>
                    <th>Nom d'utilisateur</th>
                    <td><?= htmlspecialchars($member['username']) ?></td>
                </tr>
                <tr>
                    <th>Email</th>
                    <td><?= htmlspecialchars($member['email']) ?></td>
                </tr>
                <tr>
                    <th>Rôle</th>
                    <td>
                        <?php 
                        switch($member['role']) {
                            case 'admin':
                                echo '<span class="badge bg-danger">Administrateur</span>';
                                break;
                            case 'editor':
                                echo '<span class="badge bg-warning text-dark">Éditeur</span>';
                                break;
                            default:
                                echo '<span class="badge bg-secondary">Lecteur</span>';
                        }
                        ?>
                    </td>
                </tr>
                <tr>
                    <th>Statut</th>
                    <td>
                        <?= $member['is_active'] 
                            ? '<span class="badge bg-success">Actif</span>' 
                            : '<span class="badge bg-danger">Inactif</span>' ?>
                    </td>
                </tr>
                <tr>
                    <th>Date de création</th>
                    <td><?= date('d/m/Y H:i', strtotime($member['created_at'])) ?></td>
                </tr>
                <tr>
                    <th>Dernière connexion</th>
                    <td>
                        <?= $member['last_login'] 
                            ? date('d/m/Y H:i', strtotime($member['last_login'])) 
                            : '<em>Jamais connecté</em>' ?>
                    </td>
                </tr>
            </tbody>
        </table>
        
        <div class="mt-4">
            <form action="/members/delete/<?= $member['id'] ?>" method="post">
                <div class="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button type="submit" class="btn btn-danger">
                        <i class="bi bi-trash"></i> Confirmer la suppression
                    </button>
                    <a href="/members" class="btn btn-outline-secondary">Annuler</a>
                </div>
            </form>
        </div>
    </div>
</div>

<?php
$content = ob_get_clean();
require ROOT_DIR . '/Views/layout.php';
?> 