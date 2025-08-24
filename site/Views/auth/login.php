<?php
$title = 'Taureau Celtique - Bot Discord WebDev';
$loggedIn = false;
ob_start();
?>

<!-- Section héro -->
<div class="hero-section bg-primary text-white py-5 mb-4">
    <div class="container">
        <div class="row align-items-center">
            <div class="col-lg-6">
                <h1 class="display-4 fw-bold mb-3">🐂 Taureau Celtique</h1>
                <p class="lead mb-4">Votre assistant Discord pour le développement web et la gestion de projets</p>
                <div class="d-flex gap-2 flex-wrap">
                    <span class="badge bg-light text-primary px-3 py-2">JavaScript</span>
                    <span class="badge bg-light text-primary px-3 py-2">PHP</span>
                    <span class="badge bg-light text-primary px-3 py-2">Python</span>
                    <span class="badge bg-light text-primary px-3 py-2">React</span>
                    <span class="badge bg-light text-primary px-3 py-2">Node.js</span>
                </div>
            </div>
            <div class="col-lg-6 text-center">
                <div class="bot-avatar mb-3">
                    <div class="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" 
                         style="width: 150px; height: 150px; font-size: 4rem;">
                        🤖
                    </div>
                </div>
                <p class="mb-0">Connecté • 1 serveur • Prêt à aider</p>
            </div>
        </div>
    </div>
</div>

<div class="container">
    <div class="row">
        <!-- Fonctionnalités principales -->
        <div class="col-lg-8">
            <h2 class="mb-4">🚀 Fonctionnalités</h2>
            
            <div class="row g-4 mb-5">
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="icon-circle bg-primary text-white me-3">📚</div>
                                <h5 class="mb-0">Documentation</h5>
                            </div>
                            <p class="text-muted mb-0">Accès rapide à la documentation de tous les langages et frameworks populaires</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="icon-circle bg-success text-white me-3">📋</div>
                                <h5 class="mb-0">Gestion de projets</h5>
                            </div>
                            <p class="text-muted mb-0">Organisez vos projets, créez des équipes et suivez l'avancement</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="icon-circle bg-warning text-white me-3">⏰</div>
                                <h5 class="mb-0">Rappels</h5>
                            </div>
                            <p class="text-muted mb-0">Programmez des rappels pour ne jamais oublier vos deadlines</p>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm">
                        <div class="card-body">
                            <div class="d-flex align-items-center mb-3">
                                <div class="icon-circle bg-danger text-white me-3">🛡️</div>
                                <h5 class="mb-0">Modération</h5>
                            </div>
                            <p class="text-muted mb-0">Système anti-spam et modération automatique avancée</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Statistiques -->
            <h3 class="mb-4">📊 Statistiques</h3>
            <div class="row g-3 mb-4">
                <div class="col-6 col-md-3">
                    <div class="text-center p-3 bg-light rounded">
                        <div class="h4 mb-1 text-primary fw-bold">41</div>
                        <small class="text-muted">Commandes</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="text-center p-3 bg-light rounded">
                        <div class="h4 mb-1 text-success fw-bold">24/7</div>
                        <small class="text-muted">Disponibilité</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="text-center p-3 bg-light rounded">
                        <div class="h4 mb-1 text-warning fw-bold">5ms</div>
                        <small class="text-muted">Latence</small>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="text-center p-3 bg-light rounded">
                        <div class="h4 mb-1 text-info fw-bold">99.9%</div>
                        <small class="text-muted">Uptime</small>
                    </div>
                </div>
            </div>
        </div>

        <!-- Panneau de connexion -->
        <div class="col-lg-4">
            <div class="card shadow sticky-top" style="top: 2rem;">
                <div class="card-header bg-dark text-white text-center">
                    <h5 class="mb-0">🔐 Accès Dashboard</h5>
                </div>
                <div class="card-body">
                    <?php if (!empty($error)): ?>
                    <div class="alert alert-danger" role="alert">
                        <?= htmlspecialchars($error) ?>
                    </div>
                    <?php endif; ?>
                    
                    <form action="/login" method="post">
                        <div class="mb-3">
                            <label for="username" class="form-label">Nom d'utilisateur</label>
                            <input type="text" class="form-control" id="username" name="username" required autofocus>
                        </div>
                        <div class="mb-3">
                            <label for="password" class="form-label">Mot de passe</label>
                            <input type="password" class="form-control" id="password" name="password" required>
                        </div>
                        <div class="d-grid">
                            <button type="submit" class="btn btn-primary">Se connecter</button>
                        </div>
                    </form>
                    
                    <hr class="my-3">
                    
                    <div class="text-center">
                        <small class="text-muted">Accès réservé aux administrateurs</small>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Section commandes populaires -->
    <div class="row mt-5">
        <div class="col-12">
            <h3 class="mb-4">⚡ Commandes populaires</h3>
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <code>/docs</code>
                            <p class="mb-0 mt-2 small text-muted">Rechercher dans la documentation</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <code>/projet</code>
                            <p class="mb-0 mt-2 small text-muted">Gérer vos projets</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card border-0 bg-light">
                        <div class="card-body">
                            <code>/rappel</code>
                            <p class="mb-0 mt-2 small text-muted">Programmer un rappel</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<style>
.hero-section {
    background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
}

.icon-circle {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
}

.card {
    transition: transform 0.2s ease-in-out;
}

.card:hover {
    transform: translateY(-2px);
}

@media (max-width: 768px) {
    .display-4 {
        font-size: 2rem;
    }
    
    .hero-section {
        text-align: center;
    }
}
</style>

<?php
$content = ob_get_clean();
require dirname(__DIR__) . '/layout.php';
?>