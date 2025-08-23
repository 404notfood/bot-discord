@echo off
SETLOCAL EnableDelayedExpansion

echo === Installation du Bot Discord ===
echo Ce script va installer et configurer votre bot Discord.

REM Vérification des prérequis
where node >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Node.js est requis mais n'est pas installé. Veuillez l'installer avant de continuer.
    exit /b 1
)

where npm >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo npm est requis mais n'est pas installé. Veuillez l'installer avant de continuer.
    exit /b 1
)

where mysql >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo MySQL est requis mais n'est pas installé. Veuillez l'installer avant de continuer.
    echo Vous pouvez également utiliser MySQL via XAMPP ou WAMP si vous préférez.
    exit /b 1
)

REM Vérification de la version de Node.js
FOR /F "tokens=1,2,3 delims=v." %%a IN ('node -v') DO (
    SET NODE_MAJOR=%%b
    SET NODE_MINOR=%%c
)

IF %NODE_MAJOR% LSS 16 (
    echo Une version de Node.js 16.6.0 ou supérieure est requise.
    echo Version actuelle: v%NODE_MAJOR%.%NODE_MINOR%
    exit /b 1
)

IF %NODE_MAJOR% EQU 16 (
    IF %NODE_MINOR% LSS 6 (
        echo Une version de Node.js 16.6.0 ou supérieure est requise.
        echo Version actuelle: v%NODE_MAJOR%.%NODE_MINOR%
        exit /b 1
    )
)

echo ✓ Node.js v%NODE_MAJOR%.%NODE_MINOR% détecté

REM Installation des dépendances
echo === Installation des dépendances ===
call npm install
IF %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de l'installation des dépendances. Vérifiez le journal des erreurs ci-dessus.
    exit /b 1
)
echo ✓ Dépendances installées avec succès

REM Configuration de la base de données
echo === Configuration de la base de données ===
set /p DB_USER="Nom d'utilisateur MySQL: "
set /p DB_PASSWORD="Mot de passe MySQL: "
set /p DB_NAME="Nom de la base de données (sera créée si elle n'existe pas): "
set /p DB_HOST="Hôte MySQL [localhost]: "

IF "!DB_HOST!"=="" (
    SET DB_HOST=localhost
)

REM Création de la base de données si elle n'existe pas
echo Création de la base de données si elle n'existe pas...
mysql -u%DB_USER% -p%DB_PASSWORD% -h%DB_HOST% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
IF %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de la création de la base de données.
    exit /b 1
)

REM Import du schéma SQL
echo Import du schéma SQL...
mysql -u%DB_USER% -p%DB_PASSWORD% -h%DB_HOST% %DB_NAME% < init.sql
IF %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de l'import du schéma SQL.
    exit /b 1
)
echo ✓ Base de données configurée avec succès

REM Configuration du bot Discord
echo === Configuration du bot Discord ===
echo Vous devez créer une application sur https://discord.com/developers/applications
set /p BOT_TOKEN="Token du bot Discord: "
set /p CLIENT_ID="ID client de l'application: "
set /p GUILD_ID="ID du serveur Discord: "

REM Création du fichier .env
echo Création du fichier .env...
(
echo # Configuration Discord
echo BOT_TOKEN=%BOT_TOKEN%
echo CLIENT_ID=%CLIENT_ID%
echo GUILD_ID=%GUILD_ID%
echo.
echo # Configuration Base de données
echo DB_HOST=%DB_HOST%
echo DB_USER=%DB_USER%
echo DB_PASSWORD=%DB_PASSWORD%
echo DB_NAME=%DB_NAME%
echo.
echo # Configuration supplémentaire
echo LOG_LEVEL=info
) > .env
echo ✓ Fichier .env créé avec succès

REM Initialisation des données
echo === Initialisation des données ===
echo Importation des ressources de documentation...
node scripts/import_resources.js
IF %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de l'importation des ressources. Vérifiez le journal des erreurs ci-dessus.
    exit /b 1
)

echo Organisation des fichiers cache...
node scripts/organize_cache.js
IF %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de l'organisation des fichiers cache. Vérifiez le journal des erreurs ci-dessus.
    exit /b 1
)

echo Génération des fichiers cache...
node scripts/cache_generator.js
IF %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de la génération des fichiers cache. Vérifiez le journal des erreurs ci-dessus.
    exit /b 1
)
echo ✓ Initialisation des données terminée

REM Enregistrement des commandes Discord
echo === Enregistrement des commandes Discord ===
node src/deploy-commands.js
IF %ERRORLEVEL% NEQ 0 (
    echo Erreur lors de l'enregistrement des commandes. Vérifiez le journal des erreurs ci-dessus.
    exit /b 1
)
echo ✓ Commandes enregistrées avec succès

REM Création du dossier de logs s'il n'existe pas
if not exist logs mkdir logs

echo === Installation terminée ===
echo Pour démarrer le bot en développement: npm run dev
echo Pour démarrer le bot en production: npm start
echo Pour plus d'informations, consultez le fichier INSTALLATION.md

pause 