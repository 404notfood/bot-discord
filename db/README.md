# Base de données Discord Bot

Ce dossier contient la structure complète de la base de données pour le bot Discord et le site Laravel.

## Structure

- `01_schema/` : Schémas des tables par catégorie
- `02_data/` : Données initiales et exemples
- `03_migrations/` : Scripts de migration

## Installation rapide

```bash
# 1. Créer la base de données
mysql -u root -p -e "CREATE DATABASE discord_bot CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Créer l'utilisateur
mysql -u root -p -e "CREATE USER 'discord_bot'@'localhost' IDENTIFIED BY 'your_password_here';"
mysql -u root -p -e "GRANT ALL PRIVILEGES ON discord_bot.* TO 'discord_bot'@'localhost';"
mysql -u root -p -e "FLUSH PRIVILEGES;"

# 3. Importer le schéma complet
mysql -u discord_bot -p discord_bot < 01_schema/00_complete_schema.sql

# 4. Importer les données de base
mysql -u discord_bot -p discord_bot < 02_data/00_initial_data.sql
```

## Migration Laravel

```bash
cd site/
php artisan migrate
php artisan db:seed
```

## Tables principales

### Bot Discord
- `bot_admins` - Administrateurs du bot
- `bot_moderators` - Modérateurs du bot  
- `bot_config` - Configuration du bot
- `command_logs` - Logs des commandes
- `moderation_logs` - Logs de modération

### Projets
- `main_projects` - Projets principaux
- `project_subgroups` - Sous-groupes de projets
- `project_group_members` - Membres des sous-groupes

### Documentation
- `doc_categories` - Catégories de documentation
- `doc_resources` - Resources de documentation

### Système Studi
- `studi_config` - Configuration anti-Studi
- `studi_banned_users` - Utilisateurs bannis Studi
- `studi_offenses` - Infractions Studi

### Dashboard/Site
- `users` - Utilisateurs Laravel
- `dashboard_members` - Membres du dashboard
- `alert_configs` - Configurations d'alertes