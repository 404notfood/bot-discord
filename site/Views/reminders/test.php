<?php
ob_start();
?>

<div class="container-fluid px-4">
    <h1 class="mt-4"><?= htmlspecialchars($title) ?></h1>
    <ol class="breadcrumb mb-4">
        <li class="breadcrumb-item"><a href="/dashboard">Tableau de bord</a></li>
        <li class="breadcrumb-item"><a href="/reminders">Rappels</a></li>
        <li class="breadcrumb-item active">Tester</li>
    </ol>
    
    <div class="row">
        <div class="col-lg-8 mx-auto">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="fas fa-play me-1"></i>
                    Test du rappel
                </div>
                <div class="card-body">
                    <?php if ($success): ?>
                    <div class="alert alert-success alert-dismissible fade show" role="alert">
                        <i class="fas fa-check-circle me-2"></i>
                        <strong>Succès!</strong> Le rappel a été envoyé avec succès dans le canal 
                        <strong><?= htmlspecialchars('#' . ($reminder['channel_name'] ?? $reminder['channel_id'])) ?></strong>.
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
                    </div>
                    <?php endif; ?>
                    
                    <?php if (!empty($errors)): ?>
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        <strong>Erreurs:</strong>
                        <ul class="mb-0">
                            <?php foreach ($errors as $error): ?>
                            <li><?= htmlspecialchars($error) ?></li>
                            <?php endforeach; ?>
                        </ul>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
                    </div>
                    <?php endif; ?>
                    
                    <div class="card bg-light mb-4">
                        <div class="card-header">Détails du rappel</div>
                        <div class="card-body">
                            <table class="table table-striped mb-0">
                                <tr>
                                    <th style="width: 30%;">Message</th>
                                    <td><?= nl2br(htmlspecialchars($reminder['message'] ?? '')) ?></td>
                                </tr>
                                <tr>
                                    <th>Canal</th>
                                    <td><?= htmlspecialchars('#' . ($reminder['channel_name'] ?? $reminder['channel_id'])) ?></td>
                                </tr>
                                <?php if (!empty($reminder['remind_at'])): ?>
                                <tr>
                                    <th>Date d'envoi</th>
                                    <td><?= date('d/m/Y à H:i', strtotime($reminder['remind_at'])) ?></td>
                                </tr>
                                <?php endif; ?>
                                <tr>
                                    <th>Mention @everyone</th>
                                    <td>Non</td>
                                </tr>
                            </table>
                        </div>
                    </div>
                    
                    <?php if (!$success): ?>
                    <form method="post" action="/reminders/test/<?= $reminder['id'] ?>">
                        <div class="alert alert-info">
                            <i class="fas fa-info-circle me-2"></i>
                            Tester un rappel l'enverra immédiatement dans le canal Discord correspondant, indépendamment de sa programmation.
                        </div>
                        
                        <div class="d-flex justify-content-between">
                            <a href="/reminders" class="btn btn-secondary">Retour à la liste</a>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-paper-plane me-1"></i> Envoyer maintenant
                            </button>
                        </div>
                    </form>
                    <?php else: ?>
                    <div class="text-center">
                        <a href="/reminders" class="btn btn-primary">
                            <i class="fas fa-arrow-left me-1"></i> Retour à la liste des rappels
                        </a>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 