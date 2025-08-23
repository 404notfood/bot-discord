<?php
$title = 'Page non trouvée - Dashboard Bot Discord';
$loggedIn = isset($_SESSION['member_id']);
ob_start();
?>

<div class="text-center my-5">
    <h1 class="display-1 fw-bold">404</h1>
    <p class="fs-3 text-muted">Page non trouvée</p>
    <p class="lead">
        La page que vous recherchez n'existe pas ou a été déplacée.
    </p>
    <div class="mt-4">
        <?php if ($loggedIn): ?>
        <a href="/dashboard" class="btn btn-primary">Retour au tableau de bord</a>
        <?php else: ?>
        <a href="/login" class="btn btn-primary">Connexion</a>
        <?php endif; ?>
    </div>
</div>

<?php
$content = ob_get_clean();
require __DIR__ . '/layout.php';
?> 