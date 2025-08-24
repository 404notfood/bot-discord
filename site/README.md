# Dashboard Bot Discord

Un tableau de bord en PHP pour visualiser et gérer les données d'un bot Discord.

## Fonctionnalités

- **Interface d'administration** avec authentification sécurisée
- **Gestion des ressources** pour votre bot Discord (ajout, modification, suppression)
- **Gestion des catégories** pour organiser les ressources
- **Statistiques d'utilisation** pour suivre l'activité des utilisateurs
- **Gestion des membres** du tableau de bord avec différents niveaux d'accès
- **Architecture MVC** en programmation orientée objet

## Prérequis

- **PHP 8.3 ou supérieur** (recommandé PHP 8.4 pour la sécurité)
- **MySQL 8.0 ou supérieur** (ou MariaDB 10.6+)
- **Serveur web** (Apache 2.4+, Nginx 1.20+)
- **Node.js 22.12.0+** (pour intégration avec le bot Discord)
- **Composer** pour la gestion des dépendances PHP

## Installation

1. **Cloner le dépôt**

```bash
git clone https://github.com/votre-utilisateur/bot-discord-dashboard.git
cd bot-discord-dashboard
```

2. **Importer la base de données**

Importez le fichier `bot.sql` dans votre base de données MySQL :

```bash
mysql -u votre_utilisateur -p nom_de_votre_base < bot.sql
```

3. **Configurer l'application**

Modifiez le fichier `Config/config.php` avec vos paramètres de base de données et autres configurations :

```php
// Configuration de la base de données
'database' => [
    'host'     => 'localhost',
    'dbname'   => 'bot_discord', // Nom de votre base de données
    'username' => 'root',        // Votre nom d'utilisateur MySQL
    'password' => '',            // Votre mot de passe MySQL
    'charset'  => 'utf8mb4',
],
```

4. **Configurer le serveur web**

Assurez-vous que le dossier de l'application est accessible par votre serveur web et que le point d'entrée est `index.php`.

### Configuration Apache

Exemple de configuration dans un fichier `.htaccess` à la racine du projet :

```
RewriteEngine On
RewriteBase /
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ index.php [QSA,L]
```

## Utilisation

1. Accédez à la page d'accueil de l'application dans votre navigateur
2. Connectez-vous avec les identifiants par défaut :
   - Nom d'utilisateur : `admin`
   - Mot de passe : `admin123`
3. Vous pouvez maintenant commencer à gérer les ressources et les catégories utilisées par votre bot Discord

## Structure du projet

Le projet suit une architecture MVC (Modèle-Vue-Contrôleur) :

- `Core/` : Contient les classes de base du framework
- `Models/` : Contient les modèles pour interagir avec la base de données
- `Views/` : Contient les vues pour l'affichage
- `Controllers/` : Contient les contrôleurs pour gérer les requêtes
- `Config/` : Contient les fichiers de configuration
- `Public/` : Contient les ressources publiques (CSS, JS, images)

## Niveaux d'accès

L'application dispose de trois niveaux d'accès :

1. **Viewer** : Peut voir les ressources et les statistiques
2. **Editor** : Peut créer et modifier des ressources et des catégories
3. **Admin** : Peut gérer les membres du dashboard et supprimer des ressources/catégories

## Sécurité

- Mots de passe hachés avec `password_hash()`
- Protection contre les injections SQL avec PDO
- Filtrage des entrées utilisateur
- Journalisation des actions des utilisateurs

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails. 