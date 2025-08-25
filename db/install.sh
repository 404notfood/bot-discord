#!/bin/bash
# =============================================================================
# SCRIPT D'INSTALLATION RAPIDE DE LA BASE DE DONNÉES DISCORD BOT
# =============================================================================

set -e  # Arrêter le script en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration par défaut
DB_NAME="discord_bot"
DB_USER="discord_bot"
DB_HOST="localhost"

echo -e "${BLUE}"
echo "========================================"
echo "  INSTALLATION BASE DE DONNÉES"
echo "  DISCORD BOT + LARAVEL SITE"
echo "========================================"
echo -e "${NC}"

# Demander les informations de connexion MySQL
read -p "Nom d'utilisateur MySQL root [root]: " MYSQL_ROOT_USER
MYSQL_ROOT_USER=${MYSQL_ROOT_USER:-root}

read -s -p "Mot de passe MySQL root: " MYSQL_ROOT_PASSWORD
echo

read -p "Nom de la base de données [$DB_NAME]: " INPUT_DB_NAME
DB_NAME=${INPUT_DB_NAME:-$DB_NAME}

read -p "Nom d'utilisateur de la base [$DB_USER]: " INPUT_DB_USER
DB_USER=${INPUT_DB_USER:-$DB_USER}

read -s -p "Mot de passe pour l'utilisateur $DB_USER: " DB_PASSWORD
echo

print_status "Configuration:"
echo "  - Base de données: $DB_NAME"
echo "  - Utilisateur: $DB_USER"
echo "  - Host: $DB_HOST"

read -p "Continuer avec cette configuration? [y/N]: " CONFIRM
if [[ $CONFIRM != [yY] && $CONFIRM != [yY][eE][sS] ]]; then
    print_error "Installation annulée."
    exit 1
fi

# 1. Créer la base de données et l'utilisateur
print_status "Création de la base de données et de l'utilisateur..."
mysql -u "$MYSQL_ROOT_USER" -p"$MYSQL_ROOT_PASSWORD" << EOF
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

DROP USER IF EXISTS '$DB_USER'@'$DB_HOST';
CREATE USER '$DB_USER'@'$DB_HOST' IDENTIFIED BY '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'$DB_HOST';
FLUSH PRIVILEGES;
EOF

print_success "Base de données et utilisateur créés avec succès!"

# 2. Importer le schéma complet
print_status "Importation du schéma de base de données..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "01_schema/00_complete_schema.sql"
print_success "Schéma importé avec succès!"

# 3. Importer les données initiales
print_status "Importation des données initiales..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "02_data/00_initial_data.sql"
print_success "Données initiales importées avec succès!"

# 4. Créer/mettre à jour le fichier .env du bot
print_status "Configuration du fichier .env du bot..."
cat > "../.env" << EOF
# Discord Bot Configuration
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here

# Database Configuration
DB_HOST=$DB_HOST
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_NAME=$DB_NAME

# Log Level
LOG_LEVEL=INFO

# API Configuration
API_PORT=3000
API_SECRET_KEY=your_api_secret_here

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=5
RATE_LIMIT_WINDOW_MS=60000

# Admin IDs (fallback)
BOT_ADMIN_IDS=your_discord_user_id_here
FALLBACK_ADMIN_IDS=your_discord_user_id_here
EOF

# 5. Configurer le site Laravel si le dossier existe
if [ -d "../site" ]; then
    print_status "Configuration du site Laravel..."
    
    if [ ! -f "../site/.env" ]; then
        cp "../site/.env.example" "../site/.env"
    fi
    
    # Mettre à jour les variables de base de données dans le .env Laravel
    sed -i.bak "s/DB_CONNECTION=.*/DB_CONNECTION=mysql/" "../site/.env"
    sed -i.bak "s/DB_HOST=.*/DB_HOST=$DB_HOST/" "../site/.env"
    sed -i.bak "s/DB_PORT=.*/DB_PORT=3306/" "../site/.env"
    sed -i.bak "s/DB_DATABASE=.*/DB_DATABASE=$DB_NAME/" "../site/.env"
    sed -i.bak "s/DB_USERNAME=.*/DB_USERNAME=$DB_USER/" "../site/.env"
    sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" "../site/.env"
    
    # Configuration Discord dans Laravel
    sed -i.bak "s/DISCORD_DB_HOST=.*/DISCORD_DB_HOST=$DB_HOST/" "../site/.env"
    sed -i.bak "s/DISCORD_DB_DATABASE=.*/DISCORD_DB_DATABASE=$DB_NAME/" "../site/.env"
    sed -i.bak "s/DISCORD_DB_USERNAME=.*/DISCORD_DB_USERNAME=$DB_USER/" "../site/.env"
    sed -i.bak "s/DISCORD_DB_PASSWORD=.*/DISCORD_DB_PASSWORD=$DB_PASSWORD/" "../site/.env"
    
    rm "../site/.env.bak" 2>/dev/null || true
    
    print_success "Configuration Laravel mise à jour!"
fi

# 6. Afficher les informations finales
print_success "Installation terminée avec succès!"
echo
print_status "Prochaines étapes:"
echo "1. Configurez votre BOT_TOKEN, CLIENT_ID et GUILD_ID dans le fichier .env"
echo "2. Remplacez 'your_discord_user_id_here' par votre vraie ID Discord"
echo "3. Pour le site Laravel:"
echo "   cd ../site"
echo "   php artisan key:generate"
echo "   php artisan migrate --seed"
echo "   php artisan serve"
echo "4. Pour démarrer le bot:"
echo "   cd .."
echo "   npm start"
echo
print_warning "N'oubliez pas de sécuriser vos mots de passe et tokens!"

# Test de connexion
print_status "Test de la connexion à la base de données..."
mysql -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" -e "SELECT 'Connexion réussie!' as status;"
print_success "Base de données accessible et prête à l'emploi!"