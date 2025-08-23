<?php
/**
 * Vue pour afficher la liste des utilisateurs Discord
 */

// Définir le titre de la page
$title = 'Utilisateurs Discord';
$currentPage = 'users';

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Liste des utilisateurs Discord</h5>
        <div>
            <a href="/dashboard" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-arrow-left"></i> Retour au dashboard
            </a>
        </div>
    </div>
    <div class="card-body">
        <?php if (empty($users)): ?>
            <div class="alert alert-info">
                Aucun utilisateur n'a été trouvé.
            </div>
        <?php else: ?>
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Discord ID</th>
                            <th>Nom d'utilisateur</th>
                            <th>Dernière activité</th>
                            <th>Langue</th>
                            <th>Inscrit le</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($users as $user): ?>
                            <tr>
                                <td><?= $user['id'] ?></td>
                                <td><?= htmlspecialchars($user['discord_id']) ?></td>
                                <td><?= htmlspecialchars($user['username']) ?></td>
                                <td><?= date('d/m/Y H:i', strtotime($user['last_seen'])) ?></td>
                                <td><?= htmlspecialchars($user['preferred_language']) ?></td>
                                <td><?= date('d/m/Y', strtotime($user['created_at'])) ?></td>
                                <td>
                                    <a href="/dashboard/user/<?= $user['id'] ?>" class="btn btn-sm btn-info">
                                        <i class="bi bi-eye"></i> Détails
                                    </a>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            
            <!-- Pagination -->
            <?php if ($totalPages > 1): ?>
                <nav aria-label="Pagination des utilisateurs">
                    <ul class="pagination justify-content-center">
                        <?php if ($currentPage > 1): ?>
                            <li class="page-item">
                                <a class="page-link" href="/dashboard/users?page=<?= $currentPage - 1 ?>">Précédent</a>
                            </li>
                        <?php else: ?>
                            <li class="page-item disabled">
                                <span class="page-link">Précédent</span>
                            </li>
                        <?php endif; ?>
                        
                        <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                            <li class="page-item <?= $i === $currentPage ? 'active' : '' ?>">
                                <a class="page-link" href="/dashboard/users?page=<?= $i ?>"><?= $i ?></a>
                            </li>
                        <?php endfor; ?>
                        
                        <?php if ($currentPage < $totalPages): ?>
                            <li class="page-item">
                                <a class="page-link" href="/dashboard/users?page=<?= $currentPage + 1 ?>">Suivant</a>
                            </li>
                        <?php else: ?>
                            <li class="page-item disabled">
                                <span class="page-link">Suivant</span>
                            </li>
                        <?php endif; ?>
                    </ul>
                </nav>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</div>

<?php
$content = ob_get_clean();
require ROOT_DIR . '/Views/layout.php';
?> 