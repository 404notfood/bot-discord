<?php
ob_start();
?>

<div class="container-fluid px-4">
    <h1 class="mt-4"><?= htmlspecialchars($title) ?></h1>
    <ol class="breadcrumb mb-4">
        <li class="breadcrumb-item"><a href="/dashboard">Tableau de bord</a></li>
        <li class="breadcrumb-item"><a href="/settings">Paramètres</a></li>
        <li class="breadcrumb-item"><a href="/settings/discord">Discord</a></li>
        <li class="breadcrumb-item active">Test de connexion</li>
    </ol>
    
    <div class="row">
        <div class="col-md-8 offset-md-2">
            <div class="card mb-4">
                <div class="card-header">
                    <i class="fab fa-discord me-1"></i>
                    Résultat du test de connexion
                </div>
                <div class="card-body">
                    <?php if ($success): ?>
                    <div class="alert alert-success" role="alert">
                        <i class="fas fa-check-circle me-2"></i> <?= htmlspecialchars($message) ?>
                    </div>
                    
                    <?php if ($result): ?>
                    <div class="mt-4">
                        <h5>Informations sur le bot</h5>
                        <div class="table-responsive">
                            <table class="table table-bordered">
                                <tbody>
                                    <tr>
                                        <th scope="row" style="width: 30%">ID</th>
                                        <td><?= htmlspecialchars($result['id']) ?></td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Nom d'utilisateur</th>
                                        <td><?= htmlspecialchars($result['username']) ?><?= isset($result['discriminator']) ? '#' . htmlspecialchars($result['discriminator']) : '' ?></td>
                                    </tr>
                                    <tr>
                                        <th scope="row">Avatar</th>
                                        <td>
                                            <?php if (isset($result['avatar']) && $result['avatar']): ?>
                                            <img src="https://cdn.discordapp.com/avatars/<?= htmlspecialchars($result['id']) ?>/<?= htmlspecialchars($result['avatar']) ?>.png" 
                                                 alt="Avatar" class="img-thumbnail" style="max-width: 100px;">
                                            <?php else: ?>
                                            <span class="text-muted">Pas d'avatar</span>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <?php endif; ?>
                    
                    <?php else: ?>
                    <div class="alert alert-danger" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i> La connexion a échoué
                    </div>
                    
                    <?php if (!empty($errors)): ?>
                    <div class="mt-3">
                        <h5>Erreurs:</h5>
                        <ul>
                            <?php foreach ($errors as $error): ?>
                            <li><?= htmlspecialchars($error) ?></li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                    <?php endif; ?>
                    
                    <div class="alert alert-info mt-4" role="alert">
                        <h5><i class="fas fa-info-circle me-2"></i> Conseils de dépannage:</h5>
                        <ul class="mb-0">
                            <li>Vérifiez que le token du bot est correctement saisi.</li>
                            <li>Assurez-vous que le bot est en ligne dans Discord.</li>
                            <li>Vérifiez les journaux d'erreur de l'application pour plus de détails.</li>
                            <li>Assurez-vous que l'application dispose d'une connexion Internet fonctionnelle.</li>
                        </ul>
                    </div>
                    <?php endif; ?>
                </div>
                <div class="card-footer">
                    <div class="d-flex justify-content-between">
                        <a href="/settings/discord" class="btn btn-primary">Retour aux paramètres Discord</a>
                        <?php if (!$success): ?>
                        <a href="/settings/test-discord" class="btn btn-outline-primary">Tester à nouveau</a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?> 