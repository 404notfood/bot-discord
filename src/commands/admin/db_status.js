/**
 * @fileoverview Commande pour vérifier l'état de la base de données
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('db_status')
        .setDescription('Affiche l\'état de la connexion à la base de données et des tables importantes.'),
    
    async execute(interaction) {
        try {
            // Vérifier si l'utilisateur est un admin du bot
            const isAdmin = await checkIfAdmin(interaction.user.id);
            
            if (!isAdmin) {
                await interaction.reply({
                    content: 'Vous devez être administrateur du bot pour utiliser cette commande.',
                    ephemeral: true
                });
                return;
            }
            
            await interaction.deferReply({ ephemeral: true });
            
            // Vérifier la connexion à la base de données
            const databaseEnabled = db.isDatabaseEnabled();
            
            // Créer un embed pour afficher les informations
            const embed = new EmbedBuilder()
                .setTitle('État de la base de données')
                .setColor(databaseEnabled ? '#2ecc71' : '#e74c3c')
                .setDescription(databaseEnabled 
                    ? '✅ Base de données connectée' 
                    : '❌ Base de données déconnectée')
                .setTimestamp();
            
            // Si la base de données est connectée, vérifier les tables de documentation
            if (databaseEnabled) {
                const docStatus = await db.checkDocTables();
                
                if (docStatus.success) {
                    // Ajouter les informations sur les tables
                    embed.addFields({ 
                        name: 'Tables de documentation', 
                        value: `Tables trouvées: ${docStatus.existingTables.join(', ') || 'Aucune'}`
                    });
                    
                    // Ajouter le nombre d'enregistrements
                    let countText = '';
                    for (const [table, count] of Object.entries(docStatus.counts)) {
                        countText += `${table}: ${count} enregistrements\n`;
                    }
                    
                    if (countText) {
                        embed.addFields({ name: 'Nombre d\'enregistrements', value: countText });
                    }
                    
                    // Ajouter des exemples de données
                    if (docStatus.sampleData.categories && docStatus.sampleData.categories.length > 0) {
                        let categoryText = '';
                        docStatus.sampleData.categories.forEach(cat => {
                            categoryText += `ID: ${cat.id}, Nom: ${cat.name}\n`;
                        });
                        
                        embed.addFields({ 
                            name: 'Exemple de catégories', 
                            value: categoryText || 'Aucune donnée'
                        });
                    }
                    
                    if (docStatus.sampleData.resources && docStatus.sampleData.resources.length > 0) {
                        let resourceText = '';
                        docStatus.sampleData.resources.forEach(res => {
                            resourceText += `ID: ${res.id}, Nom: ${res.name}, Langage: ${res.language}, Catégorie: ${res.category_id}\n`;
                        });
                        
                        embed.addFields({ 
                            name: 'Exemple de ressources', 
                            value: resourceText || 'Aucune donnée'
                        });
                    }
                } else {
                    // Afficher l'erreur
                    embed.addFields({ 
                        name: '❌ Erreur lors de la vérification des tables', 
                        value: docStatus.error || 'Erreur inconnue'
                    });
                }
            } else {
                embed.addFields({ 
                    name: 'Configuration', 
                    value: 'Vérifiez les variables d\'environnement DB_HOST, DB_USER, DB_PASSWORD et DB_NAME'
                });
            }
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            Logger.error('Erreur lors de l\'exécution de la commande db_status:', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id
            });
            
            // Vérifier si l'interaction est déjà répondue pour éviter des erreurs
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'Une erreur est survenue lors de l\'exécution de la commande.',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: 'Une erreur est survenue lors de l\'exécution de la commande.'
                });
            }
        }
    },
    
    // Alias pour assurer la compatibilité
    async run(interaction) {
        return await this.execute(interaction);
    }
};

/**
 * Vérifie si l'utilisateur est un administrateur du bot
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<boolean>} - True si l'utilisateur est admin
 */
async function checkIfAdmin(userId) {
    try {
        // Vérifier dans la base de données
        if (db.isDatabaseEnabled()) {
            const admin = await db.getOne('SELECT * FROM bot_admins WHERE user_id = ?', [userId]);
            if (admin) {
                return true;
            }
        }
        
        // Vérifier dans la configuration d'environnement (fallback)
        const adminIds = process.env.BOT_ADMIN_IDS ? process.env.BOT_ADMIN_IDS.split(',') : [];
        return adminIds.includes(userId);
    } catch (error) {
        Logger.error('Erreur lors de la vérification des droits d\'admin:', {
            error: error.message,
            userId
        });
        
        // En cas d'erreur, on permet l'accès si c'est dans la liste des admins de secours
        const fallbackAdminIds = process.env.FALLBACK_ADMIN_IDS ? process.env.FALLBACK_ADMIN_IDS.split(',') : [];
        return fallbackAdminIds.includes(userId);
    }
} 