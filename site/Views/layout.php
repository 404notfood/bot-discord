<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= $title ?? 'Dashboard Bot Discord' ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
    <link rel="stylesheet" href="/Public/css/style.css">
</head>
<body>
    <?php if (isset($loggedIn) && $loggedIn): ?>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container-fluid">
            <a class="navbar-brand" href="/dashboard">Bot Discord Dashboard</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link <?= $currentPage === 'dashboard' ? 'active' : '' ?>" href="/dashboard">Accueil</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?= $currentPage === 'users' ? 'active' : '' ?>" href="/dashboard/users">Utilisateurs</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?= $currentPage === 'resources' ? 'active' : '' ?>" href="/resources">Ressources</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?= $currentPage === 'categories' ? 'active' : '' ?>" href="/categories">Catégories</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?= $currentPage === 'projects' ? 'active' : '' ?>" href="/projects">Projets</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link <?= $currentPage === 'reminders' ? 'active' : '' ?>" href="/reminders">Rappels</a>
                    </li>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle <?= in_array($currentPage, ['moderation']) ? 'active' : '' ?>" href="#" id="moderationDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            Modération
                        </a>
                        <ul class="dropdown-menu" aria-labelledby="moderationDropdown">
                            <li><a class="dropdown-item" href="/moderation/logs">Logs de modération</a></li>
                            <li><a class="dropdown-item" href="/moderation/stats">Statistiques</a></li>
                        </ul>
                    </li>
                    <?php if (isset($role) && ($role === 'admin' || $role === 'editor')): ?>
                    <li class="nav-item">
                        <a class="nav-link <?= $currentPage === 'studi' ? 'active' : '' ?>" href="/studi">Studi</a>
                    </li>
                    <?php endif; ?>
                    <?php if (isset($role) && $role === 'admin'): ?>
                    <li class="nav-item">
                        <a class="nav-link <?= $currentPage === 'members' ? 'active' : '' ?>" href="/members">Membres</a>
                    </li>
                    <?php endif; ?>
                </ul>
                <div class="d-flex">
                    <span class="navbar-text me-3">
                        <i class="bi bi-person-circle"></i> <?= htmlspecialchars($username ?? 'Utilisateur') ?> (<?= htmlspecialchars($role ?? 'invité') ?>)
                    </span>
                    <a href="/logout" class="btn btn-sm btn-outline-light">Déconnexion</a>
                </div>
            </div>
        </div>
    </nav>
    <?php endif; ?>

    <div class="container mt-4">
        <?php if (isset($pageTitle)): ?>
        <h1 class="mb-4"><?= $pageTitle ?></h1>
        <?php endif; ?>
        
        <?php if (isset($flashMessage)): ?>
        <div class="alert alert-<?= $flashType ?? 'info' ?> alert-dismissible fade show" role="alert">
            <?= $flashMessage ?>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
        <?php endif; ?>
        
        <?= $content ?>
    </div>

    <footer class="mt-5 py-3 bg-light text-center">
        <div class="container">
            <p class="mb-0">&copy; <?= date('Y') ?> Bot Discord Dashboard</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="/Public/js/main.js"></script>
</body>
</html> 