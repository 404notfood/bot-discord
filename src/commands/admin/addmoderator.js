/**
 * @fileoverview Commande pour ajouter un modérateur au bot
 */

import { PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { BaseCommand } from '../../models/BaseCommand.js';
import * as Logger from '../../utils/logger.js';

/**
 * Commande pour ajouter un modérateur au bot
 */
export class AddModeratorCommand extends BaseCommand {
    /**
     * Crée une nouvelle instance de AddModeratorCommand
     */
    constructor() {
        super({
            name: 'addmoderator',
            description: 'Ajouter un modérateur au bot.',
            defaultMemberPermissions: PermissionFlagsBits.Administrator,
            options: [
                {
                    name: 'user',
                    description: 'L\'utilisateur à ajouter en tant que modérateur.',
                    type: 6, // USER type
                    required: true
                }
            ]
        });
    }

    /**
     * Exécute la commande
     * @param {Object} interaction - L'interaction Discord
     */
    async execute(interaction) {
        try {
            await interaction.deferReply();
            
            const targetUser = interaction.options.getUser('user');
            const username = targetUser.username;
            const userId = targetUser.id;

            // Vérifier la base de données
            if (!interaction.client.databaseManager || !interaction.client.databaseManager.isAvailable()) {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Base de données non disponible')
                    .setDescription('Impossible d\\'ajouter des modérateurs. La base de données n\\'est pas accessible.')
                    .setColor('#e74c3c')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }

            // Vérifier si l'utilisateur est déjà modérateur
            if (await this.isModerator(userId, interaction.client)) {
                const embed = new EmbedBuilder()
                    .setTitle('⚠️ Utilisateur déjà modérateur')
                    .setDescription(`${username} est déjà modérateur du bot.`)
                    .setColor('#f1c40f')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            // Vérifier si l'utilisateur est déjà administrateur
            if (await this.isAdmin(userId, interaction.client)) {
                const embed = new EmbedBuilder()
                    .setTitle('ℹ️ Information')
                    .setDescription(`${username} est déjà administrateur du bot. Les administrateurs ont déjà tous les droits de modération.`)
                    .setColor('#3498db')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }

            // Ajouter le modérateur
            const success = await this.addModerator(userId, username, interaction.user.id, interaction.client);
            
            if (success) {
                // Créer un embed pour afficher la confirmation
                const embed = new EmbedBuilder()
                    .setTitle('✅ Modérateur ajouté')
                    .setDescription(`${username} a été ajouté comme modérateur du bot.`)
                    .setColor('#2ecc71')
                    .addFields(
                        { name: 'Utilisateur', value: `<@${userId}>`, inline: true },
                        { name: 'Ajouté par', value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
                
                // Journaliser l'action
                Logger.info(`Modérateur ajouté: ${username}`, {
                    userId,
                    addedBy: interaction.user.id
                });
                
                // Essayer d'envoyer une notification à l'utilisateur
                try {
                    const userDM = await targetUser.createDM();
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('🛡️ Nouveau rôle: Modérateur')
                        .setDescription(`Vous avez été désigné comme modérateur du bot par <@${interaction.user.id}>.`)
                        .setColor('#2ecc71')
                        .setTimestamp();
                    
                    await userDM.send({ embeds: [dmEmbed] });
                } catch (dmError) {
                    // Ignorer les erreurs de DM (l'utilisateur peut avoir désactivé les DMs)
                    Logger.warn(`Impossible d'envoyer un DM à l'utilisateur ${username}`, {
                        userId,
                        error: dmError.message
                    });
                }
            } else {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Erreur')
                    .setDescription('Une erreur est survenue lors de l\'ajout du modérateur.')
                    .setColor('#e74c3c')
                    .setTimestamp();
                
                await interaction.editReply({ embeds: [embed] });
            }
        } catch (error) {
            Logger.error('Erreur pour la commande addmoderator:', {
                error: error.message,
                stack: error.stack,
                user: interaction.user.id
            });
            
            try {
                const embed = new EmbedBuilder()
                    .setTitle('❌ Erreur')
                    .setDescription('Une erreur est survenue lors de l\'ajout du modérateur.')
                    .setColor('#e74c3c')
                    .setTimestamp();
                
                if (interaction.deferred) {
                    await interaction.editReply({ embeds: [embed] });
                } else if (!interaction.replied) {
                    await interaction.reply({ embeds: [embed], ephemeral: true });
                }
            } catch (replyError) {
                Logger.error('Erreur lors de la réponse à l\'erreur:', {
                    error: replyError.message
                });
            }
        }
    }

    /**
     * Alias pour execute, pour assurer la compatibilité avec les deux méthodes
     * @param {Object} interaction - L'interaction Discord
     */
    async run(interaction) {
        return this.execute(interaction);
    }

    /**
     * Vérifie si un utilisateur est déjà modérateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<boolean>} - True si l'utilisateur est modérateur
     */
    async isModerator(userId, client) {
        const databaseManager = client?.databaseManager;
        
        if (!databaseManager || !databaseManager.isAvailable()) {
            return false;
        }
        
        try {
            const result = await databaseManager.query(
                'SELECT * FROM bot_moderators WHERE user_id = ?',
                [userId]
            );
            return result.length > 0;
        } catch (error) {
            Logger.error('Erreur vérification modérateur:', { error: error.message, userId });
            return false;
        }
    }

    /**
     * Vérifie si un utilisateur est administrateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<boolean>} - True si l'utilisateur est admin
     */
    async isAdmin(userId, client) {
        const databaseManager = client?.databaseManager;
        
        if (!databaseManager || !databaseManager.isAvailable()) {
            return false;
        }
        
        try {
            const result = await databaseManager.query(
                'SELECT * FROM bot_admins WHERE user_id = ?',
                [userId]
            );
            return result.length > 0;
        } catch (error) {
            Logger.error('Erreur vérification admin:', { error: error.message, userId });
            return false;
        }
    }

    /**
     * Ajoute un utilisateur comme modérateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {string} addedBy - ID de la personne qui ajoute
     * @returns {Promise<boolean>} - True si l'ajout est réussi
     */
    async addModerator(userId, username, addedBy, client) {
        const databaseManager = client?.databaseManager;
        
        if (!databaseManager || !databaseManager.isAvailable()) {
            return false;
        }
        
        try {
            await databaseManager.query(
                'INSERT INTO bot_moderators (user_id, username, added_by) VALUES (?, ?, ?)',
                [userId, username, addedBy]
            );
            return true;
        } catch (error) {
            Logger.error('Erreur ajout modérateur:', { error: error.message, userId });
            return false;
        }
    }
}

export default new AddModeratorCommand(); 