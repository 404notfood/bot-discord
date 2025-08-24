#!/bin/bash
# Script de déploiement du dashboard

echo "🚀 Déploiement du dashboard sur VPS..."

# Créer les tables de dashboard
echo "📋 Création des tables dashboard..."
mysql -u discord_bot -p discord_bot < create-dashboard-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Tables créées avec succès"
else
    echo "❌ Erreur lors de la création des tables"
    exit 1
fi

echo ""
echo "📂 Transférer les fichiers du site..."
rsync -av --exclude='.git' --exclude='node_modules' --exclude='*.log' \
    site/ discord@vps:~/web/bot.rtfm2win.ovh/public_html/

if [ $? -eq 0 ]; then
    echo "✅ Fichiers transférés avec succès"
else
    echo "❌ Erreur lors du transfert"
    exit 1
fi

echo ""
echo "🔐 Test de connexion à la base..."
ssh discord@vps "cd ~/web/bot.rtfm2win.ovh/public_html && php test_db.php"

echo ""
echo "👤 Création de l'utilisateur admin..."
ssh discord@vps "cd ~/web/bot.rtfm2win.ovh/public_html && php create_admin.php"

echo ""
echo "🎉 Déploiement terminé!"
echo ""
echo "🌐 Dashboard disponible à: http://bot.rtfm2win.ovh/"
echo "🔐 Connexion:"
echo "   Utilisateur: admin"
echo "   Mot de passe: admin123"
echo ""
echo "⚠️  N'oubliez pas de changer le mot de passe après la première connexion!"