/**
 * Middleware de validation des interactions
 */

import * as Logger from '../../utils/logger.js';

export class ValidationMiddleware {
    static name = 'validation';

    /**
     * Exécute le middleware de validation
     * @param {Object} context - Contexte de l'interaction
     * @returns {Promise<boolean>}
     */
    static async execute(context) {
        const { interaction, client } = context;

        try {
            // Vérifier que l'interaction est valide
            if (!interaction) {
                Logger.warn('Interaction nulle reçue');
                return false;
            }

            // Vérifier que l'utilisateur existe
            if (!interaction.user || !interaction.user.id) {
                Logger.warn('Interaction sans utilisateur valide');
                return false;
            }

            // Vérifier le type d'interaction supporté
            if (!this.isSupportedInteractionType(interaction)) {
                Logger.debug('Type d\'interaction non supporté', { 
                    type: interaction.type 
                });
                return false;
            }

            // Validation spécifique aux commandes slash
            if (interaction.isChatInputCommand()) {
                return await this.validateSlashCommand(interaction, client);
            }

            // Validation spécifique aux boutons
            if (interaction.isButton()) {
                return await this.validateButton(interaction);
            }

            // Validation spécifique aux menus de sélection
            if (interaction.isSelectMenu()) {
                return await this.validateSelectMenu(interaction);
            }

            // Validation spécifique aux modaux
            if (interaction.isModalSubmit()) {
                return await this.validateModal(interaction);
            }

            return true;

        } catch (error) {
            Logger.error('Erreur dans ValidationMiddleware:', {
                error: error.message,
                interactionType: interaction.type,
                userId: interaction.user?.id
            });
            return false;
        }
    }

    /**
     * Vérifie si le type d'interaction est supporté
     * @param {Interaction} interaction - Interaction Discord
     * @returns {boolean}
     */
    static isSupportedInteractionType(interaction) {
        return interaction.isChatInputCommand() ||
               interaction.isButton() ||
               interaction.isSelectMenu() ||
               interaction.isModalSubmit();
    }

    /**
     * Valide une commande slash
     * @param {CommandInteraction} interaction - Interaction de commande
     * @param {Client} client - Client Discord
     * @returns {Promise<boolean>}
     */
    static async validateSlashCommand(interaction, client) {
        // Vérifier que la commande existe
        const command = client.commands?.get(interaction.commandName);
        if (!command) {
            Logger.warn('Commande inconnue:', { 
                commandName: interaction.commandName,
                userId: interaction.user.id 
            });
            
            await this.sendErrorMessage(interaction, 
                '❌ Cette commande n\'est pas disponible.'
            );
            return false;
        }

        // Vérifier que la commande a une méthode execute
        if (!command.execute || typeof command.execute !== 'function') {
            Logger.error('Commande sans méthode execute:', { 
                commandName: interaction.commandName 
            });
            
            await this.sendErrorMessage(interaction,
                '❌ Cette commande n\'est pas correctement configurée.'
            );
            return false;
        }

        // Vérifier les permissions du serveur (si applicable)
        if (interaction.guild && command.data.default_member_permissions) {
            const memberPermissions = interaction.member.permissions;
            const requiredPermissions = BigInt(command.data.default_member_permissions);
            
            if (!memberPermissions.has(requiredPermissions)) {
                Logger.warn('Permissions insuffisantes:', {
                    commandName: interaction.commandName,
                    userId: interaction.user.id,
                    required: command.data.default_member_permissions
                });
                
                await this.sendErrorMessage(interaction,
                    '❌ Vous n\'avez pas les permissions nécessaires pour utiliser cette commande.'
                );
                return false;
            }
        }

        // Note: La commande sera stockée dans le contexte par le MiddlewareManager
        // après validation réussie

        return true;
    }

    /**
     * Valide une interaction de bouton
     * @param {ButtonInteraction} interaction - Interaction de bouton
     * @returns {Promise<boolean>}
     */
    static async validateButton(interaction) {
        // Vérifier que le bouton a un customId
        if (!interaction.customId) {
            Logger.warn('Bouton sans customId:', { 
                userId: interaction.user.id 
            });
            return false;
        }

        // Vérifier que le message existe encore
        if (!interaction.message) {
            Logger.warn('Interaction de bouton sans message:', {
                customId: interaction.customId,
                userId: interaction.user.id
            });
            return false;
        }

        return true;
    }

    /**
     * Valide une interaction de menu de sélection
     * @param {SelectMenuInteraction} interaction - Interaction de menu
     * @returns {Promise<boolean>}
     */
    static async validateSelectMenu(interaction) {
        // Vérifier que le menu a un customId
        if (!interaction.customId) {
            Logger.warn('Menu de sélection sans customId:', { 
                userId: interaction.user.id 
            });
            return false;
        }

        // Vérifier qu'il y a des valeurs sélectionnées
        if (!interaction.values || interaction.values.length === 0) {
            Logger.warn('Menu de sélection sans valeurs:', {
                customId: interaction.customId,
                userId: interaction.user.id
            });
            return false;
        }

        return true;
    }

    /**
     * Valide une soumission de modal
     * @param {ModalSubmitInteraction} interaction - Interaction de modal
     * @returns {Promise<boolean>}
     */
    static async validateModal(interaction) {
        // Vérifier que le modal a un customId
        if (!interaction.customId) {
            Logger.warn('Modal sans customId:', { 
                userId: interaction.user.id 
            });
            return false;
        }

        // Vérifier que les champs existent
        if (!interaction.fields) {
            Logger.warn('Modal sans champs:', {
                customId: interaction.customId,
                userId: interaction.user.id
            });
            return false;
        }

        return true;
    }

    /**
     * Envoie un message d'erreur à l'utilisateur
     * @param {Interaction} interaction - Interaction Discord
     * @param {string} message - Message d'erreur
     */
    static async sendErrorMessage(interaction, message) {
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: message, ephemeral: true });
            } else {
                await interaction.reply({ content: message, ephemeral: true });
            }
        } catch (error) {
            Logger.error('Erreur envoi message de validation:', { 
                error: error.message 
            });
        }
    }
}