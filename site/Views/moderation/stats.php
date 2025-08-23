<?php
/**
 * Vue pour afficher les statistiques de modération
 */

// Définir le titre de la page
$title = 'Statistiques de modération';
$pageTitle = 'Statistiques de modération';
$currentPage = 'moderation';
$loggedIn = true;

// Inclure le layout
ob_start();
?>

<div class="card shadow-sm mb-4">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Statistiques de modération</h5>
        <div>
            <a href="/moderation/logs" class="btn btn-sm btn-outline-primary">
                <i class="bi bi-list-ul"></i> Logs de modération
            </a>
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
        
        <!-- Filtres -->
        <div class="row mb-4">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-body">
                        <form action="/moderation/stats" method="get" class="row g-3">
                            <div class="col-md-4">
                                <label for="guild_id" class="form-label">Serveur ID</label>
                                <input type="text" class="form-control" id="guild_id" name="guild_id" value="<?= htmlspecialchars($guildId ?? '') ?>" placeholder="Tous les serveurs">
                            </div>
                            <div class="col-md-4">
                                <label for="period" class="form-label">Période</label>
                                <select class="form-select" id="period" name="period">
                                    <?php foreach ($periods as $key => $label): ?>
                                    <option value="<?= $key ?>" <?= $period === $key ? 'selected' : '' ?>><?= $label ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            <div class="col-md-4 d-flex align-items-end">
                                <button type="submit" class="btn btn-primary w-100">Appliquer</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Statistiques générales -->
        <div class="row mb-4">
            <div class="col-md-12">
                <h4 class="border-bottom pb-2 mb-3">Statistiques générales</h4>
            </div>
            <div class="col-md-2">
                <div class="card bg-primary text-white mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['total'] ?? 0 ?></h3>
                        <p class="card-text">Actions totales</p>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card bg-danger text-white mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['ban_count'] ?? 0 ?></h3>
                        <p class="card-text">Bannissements</p>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card bg-success text-white mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['unban_count'] ?? 0 ?></h3>
                        <p class="card-text">Débannissements</p>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card bg-warning text-dark mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['warn_count'] ?? 0 ?></h3>
                        <p class="card-text">Avertissements</p>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card bg-info text-white mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['kick_count'] ?? 0 ?></h3>
                        <p class="card-text">Expulsions</p>
                    </div>
                </div>
            </div>
            <div class="col-md-2">
                <div class="card bg-secondary text-white mb-3">
                    <div class="card-body text-center">
                        <h3 class="card-title"><?= $stats['mute_count'] ?? 0 ?></h3>
                        <p class="card-text">Mutes</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Statistiques des utilisateurs et modérateurs -->
        <div class="row mb-4">
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Utilisateurs modérés</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="mb-0 text-primary"><?= $stats['unique_users'] ?? 0 ?></h2>
                            <span class="text-muted">Utilisateurs uniques</span>
                        </div>
                        <canvas id="userActionsChart" width="400" height="250"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-6">
                <div class="card h-100">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Modérateurs actifs</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="mb-0 text-success"><?= $stats['unique_mods'] ?? 0 ?></h2>
                            <span class="text-muted">Modérateurs uniques</span>
                        </div>
                        
                        <?php if (!empty($stats['top_moderators'])): ?>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Modérateur ID</th>
                                        <th>Actions</th>
                                        <th>% du total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($stats['top_moderators'] as $mod): ?>
                                    <tr>
                                        <td><?= htmlspecialchars($mod['moderator_id']) ?></td>
                                        <td><?= $mod['action_count'] ?></td>
                                        <td>
                                            <div class="progress">
                                                <div class="progress-bar bg-success" role="progressbar" style="width: <?= ($mod['action_count'] / $stats['total']) * 100 ?>%"
                                                    aria-valuenow="<?= ($mod['action_count'] / $stats['total']) * 100 ?>" aria-valuemin="0" aria-valuemax="100">
                                                    <?= round(($mod['action_count'] / $stats['total']) * 100, 1) ?>%
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                        <?php else: ?>
                        <p class="text-center text-muted">Aucune donnée disponible</p>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Graphique d'évolution -->
        <div class="row">
            <div class="col-md-12">
                <div class="card">
                    <div class="card-header">
                        <h5 class="card-title mb-0">Évolution des actions de modération</h5>
                    </div>
                    <div class="card-body">
                        <p class="text-muted text-center">Ce graphique montre l'évolution des actions de modération sur la période sélectionnée.</p>
                        <canvas id="timelineChart" height="300"></canvas>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Données fictives pour le graphique (à remplacer par de vraies données)
    const actionTypesData = {
        labels: ['Avertissements', 'Expulsions', 'Bannissements', 'Mutes', 'Autre'],
        datasets: [{
            label: 'Nombre d\'actions',
            data: [
                <?= $stats['warn_count'] ?? 0 ?>, 
                <?= $stats['kick_count'] ?? 0 ?>, 
                <?= $stats['ban_count'] ?? 0 ?>, 
                <?= $stats['mute_count'] ?? 0 ?>,
                <?= ($stats['total'] ?? 0) - (($stats['warn_count'] ?? 0) + ($stats['kick_count'] ?? 0) + ($stats['ban_count'] ?? 0) + ($stats['mute_count'] ?? 0)) ?>
            ],
            backgroundColor: [
                'rgba(255, 193, 7, 0.6)',
                'rgba(23, 162, 184, 0.6)',
                'rgba(220, 53, 69, 0.6)',
                'rgba(108, 117, 125, 0.6)',
                'rgba(13, 110, 253, 0.6)'
            ],
            borderColor: [
                'rgba(255, 193, 7, 1)',
                'rgba(23, 162, 184, 1)',
                'rgba(220, 53, 69, 1)',
                'rgba(108, 117, 125, 1)',
                'rgba(13, 110, 253, 1)'
            ],
            borderWidth: 1
        }]
    };
    
    new Chart(document.getElementById('userActionsChart'), {
        type: 'pie',
        data: actionTypesData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Données fictives pour le graphique d'évolution (à remplacer par de vraies données)
    const timelineData = {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [{
            label: 'Actions de modération',
            data: [5, 8, 12, 7, 15, 10, 6],
            backgroundColor: 'rgba(13, 110, 253, 0.2)',
            borderColor: 'rgba(13, 110, 253, 1)',
            borderWidth: 2,
            tension: 0.4,
            fill: true
        }]
    };
    
    new Chart(document.getElementById('timelineChart'), {
        type: 'line',
        data: timelineData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
});
</script>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 