<?php
$title = 'Accueil - Dashboard Bot Discord';
$pageTitle = 'Tableau de bord';
$currentPage = 'dashboard';
$loggedIn = true;
ob_start();
?>

<div class="row mb-4">
    <div class="col-md-3">
        <div class="card bg-primary text-white">
            <div class="card-body">
                <h5 class="card-title">Utilisateurs</h5>
                <p class="card-text display-4"><?= $userStats['total'] ?></p>
                <p class="card-text">
                    <small><?= $userStats['active'] ?> actifs (30j)</small><br>
                    <small><?= $userStats['new'] ?> nouveaux (7j)</small>
                </p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-success text-white">
            <div class="card-body">
                <h5 class="card-title">Ressources</h5>
                <p class="card-text display-4"><?= count($topResources) ?></p>
                <p class="card-text">
                    <small><?= count($categories) ?> catégories</small>
                </p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-info text-white">
            <div class="card-body">
                <h5 class="card-title">Commandes</h5>
                <p class="card-text display-4"><?= $topCommands[0]['count'] ?? 0 ?></p>
                <p class="card-text">
                    <small>Commande la plus utilisée</small><br>
                    <small><?= $topCommands[0]['command_name'] ?? 'Aucune' ?></small>
                </p>
            </div>
        </div>
    </div>
    <div class="col-md-3">
        <div class="card bg-warning text-dark">
            <div class="card-body">
                <h5 class="card-title">Utilisateur actif</h5>
                <p class="card-text display-4"><?= $topUsers[0]['command_count'] ?? 0 ?></p>
                <p class="card-text">
                    <small>Commandes utilisées</small><br>
                    <small><?= $topUsers[0]['username'] ?? 'Aucun' ?></small>
                </p>
            </div>
        </div>
    </div>
</div>

<!-- Nouvelles fonctionnalités -->
<div class="row mb-4">
    <div class="col-12">
        <h4 class="border-bottom pb-2 mb-3">Fonctionnalités avancées</h4>
    </div>
    <div class="col-md-4">
        <div class="card h-100">
            <div class="card-header bg-purple text-white">
                <h5 class="card-title mb-0"><i class="bi bi-kanban"></i> Gestion de Projets</h5>
            </div>
            <div class="card-body">
                <p class="card-text">Gérez les projets de votre serveur Discord, avec sous-groupes, tâches et canaux dédiés.</p>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Projets actifs
                        <span class="badge bg-purple rounded-pill"><?= $projectStats['in_progress'] ?? 0 ?></span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Sous-groupes
                        <span class="badge bg-purple rounded-pill"><?= $projectStats['total_subgroups'] ?? 0 ?></span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Tâches
                        <span class="badge bg-purple rounded-pill"><?= $projectStats['total_tasks'] ?? 0 ?></span>
                    </li>
                </ul>
            </div>
            <div class="card-footer">
                <a href="/projects" class="btn btn-sm btn-primary w-100">Accéder aux projets</a>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card h-100">
            <div class="card-header bg-danger text-white">
                <h5 class="card-title mb-0"><i class="bi bi-shield-check"></i> Logs de Modération</h5>
            </div>
            <div class="card-body">
                <p class="card-text">Consultez l'historique des actions de modération sur votre serveur et analysez les statistiques.</p>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Actions (30j)
                        <span class="badge bg-danger rounded-pill"><?= $modStats['total'] ?? 0 ?></span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Utilisateurs modérés
                        <span class="badge bg-danger rounded-pill"><?= $modStats['unique_users'] ?? 0 ?></span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Bannissements
                        <span class="badge bg-danger rounded-pill"><?= $modStats['ban_count'] ?? 0 ?></span>
                    </li>
                </ul>
            </div>
            <div class="card-footer">
                <a href="/moderation/logs" class="btn btn-sm btn-danger w-100">Voir les logs</a>
            </div>
        </div>
    </div>
    <div class="col-md-4">
        <div class="card h-100">
            <div class="card-header bg-dark text-white">
                <h5 class="card-title mb-0"><i class="bi bi-mortarboard-fill"></i> Système Studi</h5>
            </div>
            <div class="card-body">
                <p class="card-text">
                    Gérez le système de gestion des infractions Studi pour votre serveur éducatif.
                    <span class="badge bg-<?= ($studiConfig && $studiConfig['is_enabled']) ? 'success' : 'secondary' ?>">
                        <?= ($studiConfig && $studiConfig['is_enabled']) ? 'Activé' : 'Désactivé' ?>
                    </span>
                </p>
                <ul class="list-group list-group-flush">
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Contrevenants
                        <span class="badge bg-dark rounded-pill"><?= $studiStats['total_offenders'] ?? 0 ?></span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Total infractions
                        <span class="badge bg-dark rounded-pill"><?= $studiStats['total_offenses'] ?? 0 ?></span>
                    </li>
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        Utilisateurs bannis
                        <span class="badge bg-dark rounded-pill"><?= $studiStats['banned_count'] ?? 0 ?></span>
                    </li>
                </ul>
            </div>
            <div class="card-footer">
                <a href="/studi" class="btn btn-sm btn-dark w-100">Accéder à Studi</a>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-6">
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Commandes les plus utilisées</h5>
            </div>
            <div class="card-body">
                <canvas id="commandsChart" width="400" height="250"></canvas>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Ressources les plus utilisées</h5>
            </div>
            <div class="card-body">
                <canvas id="resourcesChart" width="400" height="250"></canvas>
            </div>
        </div>
    </div>
</div>

<div class="row">
    <div class="col-md-6">
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Utilisateurs les plus actifs</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Utilisateur</th>
                                <th>Discord ID</th>
                                <th>Commandes</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($topUsers as $user): ?>
                            <tr>
                                <td>
                                    <a href="/dashboard/user/<?= $user['id'] ?>">
                                        <?= htmlspecialchars($user['username']) ?>
                                    </a>
                                </td>
                                <td><?= htmlspecialchars($user['discord_id']) ?></td>
                                <td><?= $user['command_count'] ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
    <div class="col-md-6">
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="card-title mb-0">Catégories</h5>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>Catégorie</th>
                                <th>Ressources</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($categories as $category): ?>
                            <tr>
                                <td><?= htmlspecialchars($category['name']) ?></td>
                                <td><?= $category['resource_count'] ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Graphique des commandes
    const commandsData = <?= json_encode(array_map(function($cmd) { 
            return ['name' => $cmd['command_name'], 'count' => $cmd['count']]; 
        }, $topCommands)) ?>;
    
    new Chart(document.getElementById('commandsChart'), {
        type: 'bar',
        data: {
            labels: commandsData.map(cmd => cmd.name),
            datasets: [{
                label: 'Nombre d\'utilisations',
                data: commandsData.map(cmd => cmd.count),
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
    
    // Graphique des ressources
    const resourcesData = <?= json_encode(array_map(function($res) { 
            return ['name' => $res['name'], 'count' => $res['usage_count']]; 
        }, $topResources)) ?>;
    
    new Chart(document.getElementById('resourcesChart'), {
        type: 'bar',
        data: {
            labels: resourcesData.map(res => res.name),
            datasets: [{
                label: 'Nombre d\'utilisations',
                data: resourcesData.map(res => res.count),
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        },
        options: {
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