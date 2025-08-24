#!/bin/bash
# Script pour configurer le dashboard

echo "🚀 Configuration du dashboard..."

# Créer les tables dashboard
echo "📋 Création des tables dashboard..."
mysql -u discord_bot -p discord_bot < create-dashboard-tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Tables créées avec succès"
else
    echo "❌ Erreur lors de la création des tables"
    exit 1
fi

echo ""
echo "🔐 Informations de connexion:"
echo "   Utilisateur: admin"
echo "   Mot de passe: admin123"
echo ""
echo "🌐 Accédez au dashboard:"
echo "   http://bot.rtfm2win.ovh/site/"
echo ""
echo "📋 Configuration terminée!"