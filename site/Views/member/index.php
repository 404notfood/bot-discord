<?php require_once 'Views/includes/header.php'; ?>

<div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestion des membres</h1>
        <?php if (hasPermission('member_create')): ?>
            <a href="?controller=member&action=create" class="btn btn-primary">
                <i class="fas fa-plus-circle"></i> Nouveau membre
            </a>
        <?php endif; ?>
    </div>

    <?php if (isset($_SESSION['flash_message'])): ?>
        <div class="alert alert-<?= $_SESSION['flash_type'] ?> alert-dismissible fade show" role="alert">
            <?= $_SESSION['flash_message'] ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        <?php unset($_SESSION['flash_message'], $_SESSION['flash_type']); ?>
    <?php endif; ?>

    <div class="card shadow">
        <div class="card-body">
            <?php if (empty($members)): ?>
                <div class="alert alert-info">
                    Aucun membre n'a été trouvé dans la base de données.
                </div>
            <?php else: ?>
                <div class="table-responsive">
                    <table class="table table-striped table-hover">
                        <thead class="table-dark">
                            <tr>
                                <th>ID</th>
                                <th>Nom d'utilisateur</th>
                                <th>Email</th>
                                <th>Rôle</th>
                                <th>Statut</th>
                                <th>Date de création</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($members as $member): ?>
                                <tr>
                                    <td><?= htmlspecialchars($member['id']) ?></td>
                                    <td><?= htmlspecialchars($member['username']) ?></td>
                                    <td><?= htmlspecialchars($member['email']) ?></td>
                                    <td>
                                        <span class="badge <?= $member['role'] === 'admin' ? 'bg-danger' : 'bg-success' ?>">
                                            <?= ucfirst(htmlspecialchars($member['role'])) ?>
                                        </span>
                                    </td>
                                    <td>
                                        <?php if ($member['is_active'] == 1): ?>
                                            <span class="badge bg-success">Actif</span>
                                        <?php else: ?>
                                            <span class="badge bg-secondary">Inactif</span>
                                        <?php endif; ?>
                                    </td>
                                    <td><?= date('d/m/Y H:i', strtotime($member['created_at'])) ?></td>
                                    <td>
                                        <?php if (hasPermission('member_edit')): ?>
                                            <a href="?controller=member&action=edit&id=<?= $member['id'] ?>" class="btn btn-sm btn-info" title="Modifier">
                                                <i class="fas fa-edit"></i>
                                            </a>
                                        <?php endif; ?>

                                        <?php if (hasPermission('member_delete') && $member['id'] != $_SESSION['user_id']): ?>
                                            <a href="javascript:void(0);" onclick="confirmDelete(<?= $member['id'] ?>, '<?= htmlspecialchars($member['username']) ?>')" 
                                               class="btn btn-sm btn-danger" title="Supprimer">
                                                <i class="fas fa-trash"></i>
                                            </a>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </div>
    </div>
</div>

<!-- Modal de confirmation de suppression -->
<div class="modal fade" id="deleteModal" tabindex="-1" aria-labelledby="deleteModalLabel" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header bg-danger text-white">
                <h5 class="modal-title" id="deleteModalLabel">Confirmation de suppression</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                Êtes-vous sûr de vouloir supprimer le membre <strong id="memberName"></strong> ?
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Annuler</button>
                <a href="#" id="confirmDeleteButton" class="btn btn-danger">Supprimer</a>
            </div>
        </div>
    </div>
</div>

<script>
    function confirmDelete(id, username) {
        document.getElementById('memberName').textContent = username;
        document.getElementById('confirmDeleteButton').href = `?controller=member&action=delete&id=${id}`;
        var deleteModal = new bootstrap.Modal(document.getElementById('deleteModal'));
        deleteModal.show();
    }
</script>

<?php require_once 'Views/includes/footer.php'; ?> 