#!/bin/bash

echo "=== Installation du Bot Discord ==="
echo "Ce script va installer et configurer votre bot Discord."

# Vérification des prérequis
command -v node >/dev/null 2>&1 || { echo "Node.js est requis mais n'est pas installé. Aborting."; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "npm est requis mais n'est pas installé. Aborting."; exit 1; }
command -v mysql >/dev/null 2>&1 || { echo "MySQL est requis mais n'est pas installé. Aborting."; exit 1; }

# Vérification de la version de Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1)
NODE_MINOR=$(echo $NODE_VERSION | cut -d'.' -f2)

if [ $NODE_MAJOR -lt 16 ] || ([ $NODE_MAJOR -eq 16 ] && [ $NODE_MINOR -lt 6 ]); then
    echo "Une version de Node.js 16.6.0 ou supérieure est requise."
    echo "Version actuelle: $NODE_VERSION"
    exit 1
fi

echo "✓ Node.js v$NODE_VERSION détecté"

# Installation des dépendances
echo "=== Installation des dépendances ==="
npm install
if [ $? -ne 0 ]; then
    echo "Erreur lors de l'installation des dépendances. Vérifiez le journal des erreurs ci-dessus."
    exit 1
fi
echo "✓ Dépendances installées avec succès"

# Configuration de la base de données
echo "=== Configuration de la base de données ==="
read -p "Nom d'utilisateur MySQL: " DB_USER
read -sp "Mot de passe MySQL: " DB_PASSWORD
echo ""
read -p "Nom de la base de données (sera créée si elle n'existe pas): " DB_NAME
read -p "Hôte MySQL [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

# Création de la base de données si elle n'existe pas
echo "Création de la base de données si elle n'existe pas..."
mysql -u$DB_USER -p$DB_PASSWORD -h$DB_HOST -e "CREATE DATABASE IF NOT EXISTS $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
if [ $? -ne 0 ]; then
    echo "Erreur lors de la création de la base de données."
    exit 1
fi

# Import du schéma SQL
echo "Import du schéma SQL..."
mysql -u$DB_USER -p$DB_PASSWORD -h$DB_HOST $DB_NAME < init.sql
if [ $? -ne 0 ]; then
    echo "Erreur lors de l'import du schéma SQL."
    exit 1
fi
echo "✓ Base de données configurée avec succès"

# Configuration du bot Discord
echo "=== Configuration du bot Discord ==="
echo "Vous devez créer une application sur https://discord.com/developers/applications"
read -p "Token du bot Discord: " BOT_TOKEN
read -p "ID client de l'application: " CLIENT_ID
read -p "ID du serveur Discord: " GUILD_ID

# Création du fichier .env
echo "Création du fichier .env..."
cat > .env << EOL
# Configuration Discord
BOT_TOKEN=$BOT_TOKEN
CLIENT_ID=$CLIENT_ID
GUILD_ID=$GUILD_ID

# Configuration Base de données
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Configuration supplémentaire
LOG_LEVEL=info
EOL
echo "✓ Fichier .env créé avec succès"

# Initialisation des données
echo "=== Initialisation des données ==="
echo "Importation des ressources de documentation..."
node scripts/import_resources.js
if [ $? -ne 0 ]; then
    echo "Erreur lors de l'importation des ressources. Vérifiez le journal des erreurs ci-dessus."
    exit 1
fi

echo "Organisation des fichiers cache..."
node scripts/organize_cache.js
if [ $? -ne 0 ]; then
    echo "Erreur lors de l'organisation des fichiers cache. Vérifiez le journal des erreurs ci-dessus."
    exit 1
fi

echo "Génération des fichiers cache..."
node scripts/cache_generator.js
if [ $? -ne 0 ]; then
    echo "Erreur lors de la génération des fichiers cache. Vérifiez le journal des erreurs ci-dessus."
    exit 1
fi
echo "✓ Initialisation des données terminée"

# Enregistrement des commandes Discord
echo "=== Enregistrement des commandes Discord ==="
node src/deploy-commands.js
if [ $? -ne 0 ]; then
    echo "Erreur lors de l'enregistrement des commandes. Vérifiez le journal des erreurs ci-dessus."
    exit 1
fi
echo "✓ Commandes enregistrées avec succès"

# Création du dossier de logs s'il n'existe pas
mkdir -p logs

echo "=== Installation terminée ==="
echo "Pour démarrer le bot en développement: npm run dev"
echo "Pour démarrer le bot en production: npm start"
echo "Pour plus d'informations, consultez le fichier INSTALLATION.md" 