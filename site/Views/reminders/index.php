<?php
ob_start();
?>

<div class="container-fluid px-4">
    <h1 class="mt-4"><?= htmlspecialchars($title) ?></h1>
    <ol class="breadcrumb mb-4">
        <li class="breadcrumb-item"><a href="/dashboard">Tableau de bord</a></li>
        <li class="breadcrumb-item active">Rappels</li>
    </ol>
    
    <div class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
            <div>
                <i class="fas fa-bell me-1"></i>
                Rappels programmés
            </div>
            <?php if (isset($_SESSION['member_role']) && ($_SESSION['member_role'] === 'admin' || $_SESSION['member_role'] === 'editor')): ?>
            <a href="/reminders/create" class="btn btn-primary btn-sm">
                <i class="fas fa-plus me-1"></i> Ajouter un rappel
            </a>
            <?php endif; ?>
        </div>
        <div class="card-body">
            <?php if (empty($reminders)): ?>
            <div class="alert alert-info">
                <i class="fas fa-info-circle me-2"></i>
                Aucun rappel programmé pour le moment.
            </div>
            <?php else: ?>
            <div class="table-responsive">
                <table class="table table-bordered table-striped">
                    <thead>
                        <tr>
                            <th>Titre</th>
                            <th>Fréquence</th>
                            <th>Canal</th>
                            <th>Mention @everyone</th>
                            <th>Dernière exécution</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($reminders as $reminder): ?>
                        <tr>
                            <td><?= htmlspecialchars($reminder['message'] ?? 'Sans titre') ?></td>
                            <td>
                                <?php
                                $reminderModel = new \Models\Reminder();
                                echo htmlspecialchars($reminderModel->getFrequencyDescription($reminder));
                                ?>
                            </td>
                            <td>
                                <span class="badge bg-primary">
                                    <?= htmlspecialchars('#' . ($reminder['channel_name'] ?? $reminder['channel_id'])) ?>
                                </span>
                            </td>
                            <td>
                                <?php if (isset($reminder['mention_everyone']) && $reminder['mention_everyone']): ?>
                                <span class="badge bg-success">Oui</span>
                                <?php else: ?>
                                <span class="badge bg-secondary">Non</span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if (!empty($reminder['last_run_at'])): ?>
                                <?= date('d/m/Y H:i', strtotime($reminder['last_run_at'])) ?>
                                <?php else: ?>
                                <em class="text-muted">Jamais</em>
                                <?php endif; ?>
                            </td>
                            <td>
                                <div class="btn-group" role="group">
                                    <?php if (isset($_SESSION['member_role']) && ($_SESSION['member_role'] === 'admin')): ?>
                                    <a href="/reminders/test/<?= $reminder['id'] ?>" class="btn btn-outline-primary btn-sm" title="Tester le rappel">
                                        <i class="fas fa-play"></i>
                                    </a>
                                    <?php endif; ?>
                                    
                                    <?php if (isset($_SESSION['member_role']) && ($_SESSION['member_role'] === 'admin' || $_SESSION['member_role'] === 'editor')): ?>
                                    <a href="/reminders/edit/<?= $reminder['id'] ?>" class="btn btn-outline-secondary btn-sm" title="Modifier">
                                        <i class="fas fa-edit"></i>
                                    </a>
                                    <a href="/reminders/delete/<?= $reminder['id'] ?>" class="btn btn-outline-danger btn-sm" title="Supprimer">
                                        <i class="fas fa-trash"></i>
                                    </a>
                                    <?php endif; ?>
                                </div>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
            <?php endif; ?>
        </div>
    </div>
    
    <div class="card mb-4">
        <div class="card-header">
            <i class="fas fa-info-circle me-1"></i>
            À propos des rappels
        </div>
        <div class="card-body">
            <p>Les rappels sont des messages automatiques envoyés par le bot Discord selon une fréquence définie. Ils sont utiles pour :</p>
            <ul>
                <li>Rappeler les règles de bienveillance de la communauté</li>
                <li>Informer sur les échéances des projets</li>
                <li>Faire des annonces régulières</li>
            </ul>
            <p>Le rappel hebdomadaire est configuré par défaut pour être envoyé tous les lundis à 8h.</p>
        </div>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 