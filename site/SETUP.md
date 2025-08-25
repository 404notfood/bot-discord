# Guide d'installation - Bot Discord Taureau Celtique

## Prérequis

- PHP 8.2+
- Node.js 18+
- MySQL/MariaDB
- Composer
- NPM/Yarn

## Installation

### 1. Cloner et installer les dépendances

```bash
cd site/
composer install
npm install
```

### 2. Configuration de l'environnement

```bash
# Copier le fichier d'environnement
cp .env.example .env

# Générer la clé d'application
php artisan key:generate
```

### 3. Configurer la base de données

Modifiez le fichier `.env` avec vos paramètres de base de données :

```env
DB_CONNECTION=sqlite
# Ou pour MySQL :
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=discord_bot
# DB_USERNAME=root
# DB_PASSWORD=

# Configuration Discord Bot
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_APPLICATION_ID=your_application_id
DISCORD_PUBLIC_KEY=your_public_key
DISCORD_GUILD_ID=your_guild_id

# Base de données Discord (pour l'API)
DISCORD_DB_CONNECTION=mysql
DISCORD_DB_HOST=127.0.0.1
DISCORD_DB_PORT=3306
DISCORD_DB_DATABASE=discord_bot
DISCORD_DB_USERNAME=root
DISCORD_DB_PASSWORD=

# Clé secrète pour l'API
API_SECRET_KEY=your_secret_api_key
```

### 4. Exécuter les migrations et seeders

```bash
# Créer les tables
php artisan migrate

# Peupler avec des données de test
php artisan db:seed
```

### 5. Construire les assets frontend

```bash
# Développement
npm run dev

# Production
npm run build
```

### 6. Lancer le serveur

```bash
# Serveur de développement
php artisan serve

# Ou utiliser le script de développement complet
composer run dev
```

## Connexion au dashboard

- URL : http://localhost:8000
- Comptes de test :
  - Admin : `admin@discord-bot.local` / `password`
  - Éditeur : `moderator@discord-bot.local` / `password`
  - Viewer : `viewer@discord-bot.local` / `password`

## API Discord

L'API est disponible à l'adresse `/api/discord/*` avec authentification par token.

Exemples d'endpoints :
- `GET /api/discord/stats` - Statistiques générales
- `GET /api/discord/moderation/logs` - Logs de modération
- `POST /api/discord/moderation/logs` - Créer un log

## Tests

```bash
php artisan test
```

## Production

Pour déployer en production :

1. Configurez votre serveur web (Nginx/Apache)
2. Mettez à jour `.env` avec les bonnes valeurs
3. Exécutez :

```bash
composer install --optimize-autoloader --no-dev
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Structure du projet

- `app/Http/Controllers/` - Contrôleurs web et API
- `app/Models/` - Modèles Eloquent
- `database/migrations/` - Migrations de base de données
- `resources/js/` - Code React/TypeScript
- `routes/` - Définition des routes