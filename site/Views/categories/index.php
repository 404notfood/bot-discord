<?php
/**
 * Vue pour afficher la liste des catégories
 */

// Définir le titre de la page
$title = 'Catégories';
$currentPage = 'categories';

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Liste des catégories</h5>
        <div>
            <?php if (isset($role) && $role === 'admin'): ?>
            <a href="/categories/create" class="btn btn-sm btn-primary">
                <i class="bi bi-plus-circle"></i> Nouvelle catégorie
            </a>
            <?php endif; ?>
            <a href="/dashboard" class="btn btn-sm btn-outline-secondary">
                <i class="bi bi-speedometer2"></i> Dashboard
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

        <?php if (empty($categories)): ?>
        <div class="alert alert-info">
            Aucune catégorie n'a été trouvée.
        </div>
        <?php else: ?>
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nom</th>
                        <th>Description</th>
                        <th>Ressources</th>
                        <th>Créée le</th>
                        <?php if (isset($role) && $role === 'admin'): ?>
                        <th>Actions</th>
                        <?php endif; ?>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($categories as $category): ?>
                    <tr>
                        <td><?= $category['id'] ?></td>
                        <td><?= htmlspecialchars($category['name']) ?></td>
                        <td>
                            <?php if (!empty($category['description'])): ?>
                            <?= htmlspecialchars(substr($category['description'], 0, 100)) ?>
                            <?= strlen($category['description']) > 100 ? '...' : '' ?>
                            <?php else: ?>
                            <em class="text-muted">Pas de description</em>
                            <?php endif; ?>
                        </td>
                        <td>
                            <span class="badge bg-primary"><?= $category['resource_count'] ?></span>
                        </td>
                        <td><?= date('d/m/Y', strtotime($category['created_at'])) ?></td>
                        <?php if (isset($role) && $role === 'admin'): ?>
                        <td>
                            <div class="btn-group btn-group-sm">
                                <a href="/resources?category=<?= $category['id'] ?>" class="btn btn-info">
                                    <i class="bi bi-box"></i> Ressources
                                </a>
                                <a href="/categories/edit/<?= $category['id'] ?>" class="btn btn-warning">
                                    <i class="bi bi-pencil"></i> Modifier
                                </a>
                                <a href="/categories/delete/<?= $category['id'] ?>" class="btn btn-danger" 
                                   onclick="return confirm('Êtes-vous sûr de vouloir supprimer cette catégorie ?');">
                                    <i class="bi bi-trash"></i> Supprimer
                                </a>
                            </div>
                        </td>
                        <?php endif; ?>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        <?php endif; ?>
    </div>
</div>

<?php if (isset($role) && $role === 'admin'): ?>
<div class="card shadow-sm mt-4">
    <div class="card-header">
        <h5 class="mb-0">Utilisation des catégories</h5>
    </div>
    <div class="card-body">
        <div class="row">
            <div class="col-md-6">
                <canvas id="categoryChart" width="400" height="300"></canvas>
            </div>
            <div class="col-md-6">
                <h6>Distribution des ressources par catégorie</h6>
                <p class="text-muted">
                    Ce graphique montre la répartition des ressources entre les différentes catégories.
                    Une distribution équilibrée facilite la navigation pour les utilisateurs.
                </p>
                <div class="mt-3">
                    <strong>Total des catégories:</strong> <?= count($categories) ?>
                </div>
                <?php
                $totalResources = array_sum(array_column($categories, 'resource_count'));
                ?>
                <div>
                    <strong>Total des ressources:</strong> <?= $totalResources ?>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Préparer les données pour le graphique
    const categoryNames = <?= json_encode(array_column($categories, 'name')) ?>;
    const resourceCounts = <?= json_encode(array_column($categories, 'resource_count')) ?>;
    const backgroundColors = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', 
        '#6f42c1', '#fd7e14', '#20c9a6', '#858796', '#5a5c69'
    ];
    
    // Créer le graphique
    const ctx = document.getElementById('categoryChart').getContext('2d');
    new Chart(ctx, {
        type: 'pie',
        data: {
            labels: categoryNames,
            datasets: [{
                data: resourceCounts,
                backgroundColor: backgroundColors,
                hoverBackgroundColor: backgroundColors.map(color => color + 'dd'),
                hoverBorderColor: "rgba(234, 236, 244, 1)",
            }]
        },
        options: {
            maintainAspectRatio: false,
            tooltips: {
                callbacks: {
                    label: function(tooltipItem, data) {
                        const dataset = data.datasets[tooltipItem.datasetIndex];
                        const total = dataset.data.reduce((acc, val) => acc + val, 0);
                        const currentValue = dataset.data[tooltipItem.index];
                        const percentage = Math.round((currentValue / total) * 100);
                        return `${data.labels[tooltipItem.index]}: ${currentValue} (${percentage}%)`;
                    }
                }
            },
            legend: {
                display: true,
                position: 'right'
            },
            cutoutPercentage: 0,
        }
    });
});
</script>
<?php endif; ?>

<?php
$content = ob_get_clean();
require ROOT_DIR . '/Views/layout.php';
?> 