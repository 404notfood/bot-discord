<?php
ob_start();
?>

<div class="container-fluid px-4">
    <h1 class="mt-4"><?= htmlspecialchars($title) ?></h1>
    <ol class="breadcrumb mb-4">
        <li class="breadcrumb-item"><a href="/dashboard">Tableau de bord</a></li>
        <li class="breadcrumb-item"><a href="/reminders">Rappels</a></li>
        <li class="breadcrumb-item active">Supprimer</li>
    </ol>
    
    <div class="row">
        <div class="col-lg-8 mx-auto">
            <div class="card mb-4">
                <div class="card-header bg-danger text-white">
                    <i class="fas fa-exclamation-triangle me-1"></i>
                    Confirmation de suppression
                </div>
                <div class="card-body">
                    <?php if (!empty($errors)): ?>
                    <div class="alert alert-danger alert-dismissible fade show" role="alert">
                        <strong>Erreurs:</strong>
                        <ul class="mb-0">
                            <?php foreach ($errors as $error): ?>
                            <li><?= htmlspecialchars($error) ?></li>
                            <?php endforeach; ?>
                        </ul>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fermer"></button>
                    </div>
                    <?php endif; ?>
                    
                    <div class="alert alert-warning">
                        <p><strong>Attention:</strong> Vous êtes sur le point de supprimer le rappel suivant :</p>
                        <ul>
                            <li><strong>Message:</strong> <?= nl2br(htmlspecialchars(mb_substr($reminder['message'] ?? '', 0, 100) . (mb_strlen($reminder['message'] ?? '') > 100 ? '...' : ''))) ?></li>
                            <li><strong>Canal:</strong> <?= htmlspecialchars('#' . ($reminder['channel_name'] ?? $reminder['channel_id'])) ?></li>
                            <?php if (!empty($reminder['remind_at'])): ?>
                            <li><strong>Date:</strong> <?= date('d/m/Y à H:i', strtotime($reminder['remind_at'])) ?></li>
                            <?php endif; ?>
                        </ul>
                        <p class="mb-0">Cette action est <strong>irréversible</strong>. Voulez-vous vraiment supprimer ce rappel ?</p>
                    </div>
                    
                    <form method="post" action="/reminders/delete/<?= $reminder['id'] ?>">
                        <div class="d-flex justify-content-between">
                            <a href="/reminders" class="btn btn-secondary">Annuler</a>
                            <button type="submit" class="btn btn-danger">
                                <i class="fas fa-trash me-1"></i> Confirmer la suppression
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 