<?php
$title = 'Erreur serveur - Dashboard Bot Discord';
$loggedIn = isset($_SESSION['member_id']);
ob_start();
?>

<div class="text-center my-5">
    <h1 class="display-1 fw-bold">500</h1>
    <p class="fs-3 text-muted">Erreur serveur</p>
    <p class="lead">
        Une erreur inattendue s'est produite. Veuillez réessayer plus tard.
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