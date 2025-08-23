<?php
/**
 * Vue pour la liste des membres
 */

// Définir le titre de la page
$title = 'Gestion des membres';
$currentPage = 'members';

// Inclure le layout
ob_start();
?>

<div class="d-flex justify-content-between align-items-center mb-4">
    <h1 class="mb-0">
        <i class="bi bi-people me-2"></i>
        Gestion des membres
    </h1>
    <div>
        <a href="/members/create" class="btn btn-primary">
            <i class="bi bi-person-plus me-1"></i> Ajouter un membre
        </a>
    </div>
</div>

<?php if (isset($success)): ?>
    <div class="alert alert-success alert-dismissible fade show" role="alert">
        <i class="bi bi-check-circle-fill me-2"></i>
        <?= $success ?>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

<?php if (isset($error)): ?>
    <div class="alert alert-danger alert-dismissible fade show" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i>
        <?= $error ?>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>
<?php endif; ?>

<div class="card shadow-sm">
    <div class="card-header bg-light d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Liste des membres</h5>
        <div class="d-flex">
            <div class="input-group">
                <input type="text" id="searchInput" class="form-control" placeholder="Rechercher..." aria-label="Rechercher">
                <button class="btn btn-outline-secondary" type="button">
                    <i class="bi bi-search"></i>
                </button>
            </div>
        </div>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover table-striped mb-0">
                <thead class="table-light">
                    <tr>
                        <th scope="col" width="50" class="text-center">#</th>
                        <th scope="col">Nom d'utilisateur</th>
                        <th scope="col">Email</th>
                        <th scope="col" width="120">Rôle</th>
                        <th scope="col" width="120" class="text-center">Statut</th>
                        <th scope="col" width="150" class="text-center">Dernière connexion</th>
                        <th scope="col" width="120" class="text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($members)): ?>
                        <tr>
                            <td colspan="7" class="text-center py-4">
                                <div class="text-muted">
                                    <i class="bi bi-info-circle fs-4 d-block mb-2"></i>
                                    Aucun membre trouvé
                                </div>
                            </td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($members as $member): ?>
                            <tr>
                                <td class="text-center"><?= $member['id'] ?></td>
                                <td>
                                    <?php if (isset($user_id) && $member['id'] === $user_id): ?>
                                        <span class="fw-bold text-primary">
                                            <?= htmlspecialchars($member['username']) ?>
                                            <i class="bi bi-check-circle-fill ms-1" title="Vous êtes actuellement connecté"></i>
                                        </span>
                                    <?php else: ?>
                                        <?= htmlspecialchars($member['username']) ?>
                                    <?php endif; ?>
                                </td>
                                <td><?= htmlspecialchars($member['email']) ?></td>
                                <td>
                                    <?php if ($member['role'] === 'admin'): ?>
                                        <span class="badge bg-danger">Administrateur</span>
                                    <?php elseif ($member['role'] === 'editor'): ?>
                                        <span class="badge bg-success">Éditeur</span>
                                    <?php else: ?>
                                        <span class="badge bg-secondary">Lecteur</span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-center">
                                    <?php if ($member['is_active']): ?>
                                        <span class="badge bg-success">Actif</span>
                                    <?php else: ?>
                                        <span class="badge bg-secondary">Inactif</span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-center">
                                    <?php if (!empty($member['last_login'])): ?>
                                        <span title="<?= date('d/m/Y H:i', strtotime($member['last_login'])) ?>">
                                            <?= date('d/m/Y', strtotime($member['last_login'])) ?>
                                        </span>
                                    <?php else: ?>
                                        <span class="text-muted">Jamais</span>
                                    <?php endif; ?>
                                </td>
                                <td class="text-center">
                                    <div class="btn-group btn-group-sm">
                                        <a href="/members/edit/<?= $member['id'] ?>" class="btn btn-outline-primary" title="Modifier">
                                            <i class="bi bi-pencil"></i>
                                        </a>
                                        <?php if (!isset($user_id) || $member['id'] !== $user_id): ?>
                                            <button type="button" class="btn btn-outline-danger" 
                                                    data-bs-toggle="modal" 
                                                    data-bs-target="#deleteModal" 
                                                    data-id="<?= $member['id'] ?>" 
                                                    data-username="<?= htmlspecialchars($member['username']) ?>"
                                                    title="Supprimer">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        <?php else: ?>
                                            <button type="button" class="btn btn-outline-danger" disabled title="Vous ne pouvez pas supprimer votre propre compte">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        <?php endif; ?>
                                    </div>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
    <?php if (!empty($members) && count($members) > 10): ?>
    <div class="card-footer bg-light">
        <nav aria-label="Pagination">
            <ul class="pagination justify-content-center mb-0">
                <li class="page-item disabled">
                    <a class="page-link" href="#" tabindex="-1" aria-disabled="true">Précédent</a>
                </li>
                <li class="page-item active"><a class="page-link" href="#">1</a></li>
                <li class="page-item"><a class="page-link" href="#">2</a></li>
                <li class="page-item"><a class="page-link" href="#">3</a></li>
                <li class="page-item">
                    <a class="page-link" href="#">Suivant</a>
                </li>
            </ul>
        </nav>
    </div>
    <?php endif; ?>
</div>

<!-- Modal de confirmation de suppression -->
<div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title" id="deleteModalLabel">
                    <i class="bi bi-exclamation-triangle-fill me-2"></i>
                    Confirmation de suppression
                </h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p>Êtes-vous sûr de vouloir supprimer le membre <strong id="memberName"></strong> ?</p>
                <p class="mb-0 text-danger">Cette action est irréversible.</p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                <form id="deleteForm" method="POST" action="">
                    <button type="submit" class="btn btn-danger">Supprimer</button>
                </form>
            </div>
        </div>
    </div>
</div>

<script>
    document.addEventListener('DOMContentLoaded', function() {
        // Recherche dans le tableau
        const searchInput = document.getElementById('searchInput');
        
        searchInput.addEventListener('keyup', function() {
            const searchText = this.value.toLowerCase();
            const tableRows = document.querySelectorAll('tbody tr');
            
            tableRows.forEach(row => {
                const username = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const email = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
                
                if (username.includes(searchText) || email.includes(searchText)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
        
        // Configuration du modal de suppression
        const deleteModal = document.getElementById('deleteModal');
        if (deleteModal) {
            deleteModal.addEventListener('show.bs.modal', function(event) {
                const button = event.relatedTarget;
                const id = button.getAttribute('data-id');
                const username = button.getAttribute('data-username');
                
                document.getElementById('memberName').textContent = username;
                document.getElementById('deleteForm').action = '/members/delete/' + id;
            });
        }
    });
</script>

<?php
$content = ob_get_clean();
require ROOT_DIR . '/Views/layout.php';
?> 