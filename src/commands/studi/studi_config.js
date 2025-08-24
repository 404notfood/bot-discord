/**
 * Commande pour configurer le système anti-Studi
 */

import { PermissionFlagsBits, EmbedBuilder, InteractionResponseFlags } from 'discord.js';
import { BaseCommand } from '../../models/BaseCommand.js';
// Import supprimé - utilisera client.studiService
import * as Logger from '../../utils/logger.js';

/**
 * Commande studi_config
 */
export class StudiConfigCommand extends BaseCommand {
    /**
     * Crée une nouvelle instance de StudiConfigCommand
     */
    constructor() {
        super({
            name: 'studi_config',
            description: 'Configurer le système anti-Studi',
            defaultMemberPermissions: PermissionFlagsBits.Administrator,
            options: [
                {
                    name: 'status',
                    description: 'Activer ou désactiver le système',
                    type: 3, // STRING type
                    required: false,
                    choices: [
                        { name: 'Activer', value: 'enable' },
                        { name: 'Désactiver', value: 'disable' }
                    ]
                },
                {
                    name: 'warning_message',
                    description: 'Définir le message d\'avertissement',
                    type: 3, // STRING type
                    required: false
                },
                {
                    name: 'replacement_message',
                    description: 'Définir le message de remplacement',
                    type: 3, // STRING type
                    required: false
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
            const status = interaction.options.getString('status');
            const warningMessage = interaction.options.getString('warning_message');
            const replacementMessage = interaction.options.getString('replacement_message');
            
            // Si aucune option n'est fournie, afficher la configuration actuelle
            if (!status && !warningMessage && !replacementMessage) {
                return this.displayCurrentConfig(interaction);
            }
            
            // Mettre à jour le statut si spécifié
            if (status) {
                studiService.setEnabled(status === 'enable');
            }
            
            // Mettre à jour le message d'avertissement si spécifié
            if (warningMessage) {
                studiService.setWarningMessage(warningMessage);
            }
            
            // Mettre à jour le message de remplacement si spécifié
            if (replacementMessage) {
                studiService.setReplacementMessage(replacementMessage);
            }
            
            // Afficher la nouvelle configuration
            const embed = new EmbedBuilder()
                .setTitle('✅ Configuration mise à jour')
                .setDescription('La configuration du système anti-Studi a été mise à jour.')
                .setColor('#2ecc71')
                .addFields(
                    { 
                        name: 'Statut', 
                        value: studiService.isEnabled() ? '✅ Activé' : '❌ Désactivé', 
                        inline: true 
                    },
                    { 
                        name: 'Message d\'avertissement', 
                        value: studiService.config.warningMessage, 
                        inline: false 
                    },
                    { 
                        name: 'Message de remplacement', 
                        value: studiService.config.replacementMessage, 
                        inline: false 
                    }
                )
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
            
            // Enregistrer l'action dans les logs
            Logger.info(`Configuration du système anti-Studi modifiée`, {
                userId: interaction.user.id,
                username: interaction.user.username,
                statusChanged: status !== null,
                warningMessageChanged: warningMessage !== null,
                replacementMessageChanged: replacementMessage !== null
            });
            
        } catch (error) {
            Logger.error('Erreur lors de la mise à jour de la configuration anti-Studi:', { 
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
                                .setDescription('Une erreur est survenue lors de la mise à jour de la configuration')
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

    /**
     * Affiche la configuration actuelle
     * @param {Object} interaction - L'interaction Discord
     */
    async displayCurrentConfig(interaction) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('⚙️ Configuration actuelle')
                .setDescription('Configuration actuelle du système anti-Studi')
                .setColor('#3498db')
                .addFields(
                    { 
                        name: 'Statut', 
                        value: studiService.isEnabled() ? '✅ Activé' : '❌ Désactivé', 
                        inline: true 
                    },
                    { 
                        name: 'Message d\'avertissement', 
                        value: studiService.config.warningMessage, 
                        inline: false 
                    },
                    { 
                        name: 'Message de remplacement', 
                        value: studiService.config.replacementMessage, 
                        inline: false 
                    }
                )
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
            
            // Enregistrer dans les logs
            Logger.info(`Configuration du système anti-Studi consultée`, {
                userId: interaction.user.id,
                username: interaction.user.username
            });
        } catch (error) {
            Logger.error('Erreur lors de l\'affichage de la configuration:', { 
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
                                .setDescription('Une erreur est survenue lors de l\'affichage de la configuration')
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

export default new StudiConfigCommand(); 