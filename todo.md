Supprimer tout le contenu du dossier site/ sauf .env et les données importantes
Créer la structure de base : index.php, .htaccess simple, dossiers Controllers/, Views/, Config/
Créer un .htaccess minimal qui redirige tout vers index.php
Créer un routeur simple et fonctionnel (sans debug excessif)
Configurer la connexion à la base de données (Config/database.php)
Créer un système d'authentification simple (login/logout)
Créer une page dashboard de base après connexion
Créer un template de base avec header/footer
Tester : page d'accueil, login, dashboard, logout
Ajouter l'intégration avec les données du bot Discord

 site/
   ├── index.php (point d'entrée unique)
   ├── .htaccess (redirection simple)
   ├── config.php (configuration de base)
   ├── auth.php (gestion login/logout)
   ├── dashboard.php (page principale après login)
   └── style.css (styles de base)