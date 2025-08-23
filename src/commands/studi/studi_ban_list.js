/**
 * Commande pour afficher la liste des utilisateurs bannis Studi
 */

import { PermissionFlagsBits, EmbedBuilder, InteractionResponseFlags } from 'discord.js';
import { BaseCommand } from '../../models/BaseCommand.js';
import studiService from '../../utils/StudiService.js';
import * as Logger from '../../utils/logger.js';

/**
 * Commande studi_ban_list
 */
export class StudiBanListCommand extends BaseCommand {
    /**
     * Crée une nouvelle instance de StudiBanListCommand
     */
    constructor() {
        super({
            name: 'studi_ban_list',
            description: 'Afficher la liste des utilisateurs bannis Studi',
            defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
            options: []
        });
    }

    /**
     * Exécute la commande
     * @param {Object} interaction - L'interaction Discord
     */
    async execute(interaction) {
        try {
            // Récupérer la liste des utilisateurs bannis
            const bannedUsers = studiService.getBannedUsers();
            
            if (bannedUsers.length === 0) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('📋 Liste des utilisateurs bannis Studi')
                            .setDescription('Aucun utilisateur n\'est actuellement banni.')
                            .setColor('#3498db')
                            .setTimestamp()
                    ]
                });
            }
            
            // Créer un embed avec la liste des utilisateurs bannis
            const embed = new EmbedBuilder()
                .setTitle('📋 Liste des utilisateurs bannis Studi')
                .setDescription(`${bannedUsers.length} utilisateur(s) banni(s)`)
                .setColor('#3498db')
                .setTimestamp();
            
            // Ajouter les utilisateurs à l'embed
            bannedUsers.forEach((user, index) => {
                const banDate = user.bannedAt ? new Date(user.bannedAt).toLocaleString() : 'Date inconnue';
                embed.addFields({
                    name: `${index + 1}. ${user.username} (${user.userId})`,
                    value: `**Raison:** ${user.reason}\n**Banni par:** <@${user.bannedBy}>\n**Date:** ${banDate}`
                });
            });
            
            await interaction.reply({ embeds: [embed] });
            
            // Enregistrer dans les logs
            Logger.info(`Liste des utilisateurs bannis Studi consultée`, {
                userId: interaction.user.id,
                username: interaction.user.username,
                bannedCount: bannedUsers.length
            });
            
        } catch (error) {
            Logger.error('Erreur lors de la récupération de la liste des utilisateurs bannis Studi:', { 
                error: error.message, 
                stack: error.stack 
            });
            
            // Vérifier si l'interaction a déjà reçu une réponse
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('❌ Erreur')
                                .setDescription('Une erreur est survenue lors de la récupération de la liste des utilisateurs bannis.')
                                .setColor('#e74c3c')
                                .setTimestamp()
                        ],
                        flags: [InteractionResponseFlags.Ephemeral]
                    });
                } catch (replyError) {
                    Logger.error('Erreur lors de la réponse à l\'interaction:', {
                        error: replyError.message
                    });
                }
            }
        }
    }
}

export default new StudiBanListCommand(); 