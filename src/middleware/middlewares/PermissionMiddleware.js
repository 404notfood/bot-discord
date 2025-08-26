/**
 * Middleware de vérification des permissions
 */

import * as Logger from '../../utils/logger.js';

export class PermissionMiddleware {
    static name = 'permissions';
    static permissionManager = null;

    /**
     * Initialise le middleware avec le gestionnaire de permissions
     * @param {PermissionManager} permissionManager - Instance du gestionnaire de permissions
     */
    static initialize(permissionManager) {
        this.permissionManager = permissionManager;
    }

    /**
     * Exécute le middleware de permissions
     * @param {Object} context - Contexte de l'interaction
     * @returns {Promise<boolean>}
     */
    static async execute(context) {
        if (!this.permissionManager) {
            Logger.warn('PermissionMiddleware: Gestionnaire de permissions non initialisé');
            return true; // Permettre l'exécution par défaut
        }

        const { interaction } = context;
        
        // Ne vérifier les permissions que pour les commandes slash
        if (!interaction.isChatInputCommand()) {
            return true;
        }

        try {
            const commandName = interaction.commandName;
            const userId = interaction.user.id;
            
            // Récupérer la commande depuis le contexte ou le client
            const command = interaction.client.commands?.get(commandName);
            if (!command) {
                Logger.warn('PermissionMiddleware: Commande introuvable', { commandName });
                return true; // Laisser ValidationMiddleware gérer
            }

            // Vérifier si la commande nécessite des permissions spéciales
            const requiredPermissions = this.getCommandPermissions(command, commandName);
            
            if (requiredPermissions.length === 0) {
                // Aucune permission requise, autoriser
                return true;
            }

            // Vérifier chaque permission requise
            for (const permission of requiredPermissions) {
                const hasPermission = await this.permissionManager.hasPermission(userId, permission);
                
                if (!hasPermission) {
                    Logger.warn('PermissionMiddleware: Permission refusée', {
                        userId,
                        commandName,
                        permission,
                        requiredPermissions
                    });
                    
                    await this.sendPermissionDeniedMessage(interaction, permission, requiredPermissions);
                    return false; // Bloquer l'exécution
                }
            }

            // Logger l'utilisation de commande avec permissions
            Logger.info('PermissionMiddleware: Commande autorisée', {
                userId,
                commandName,
                permissions: requiredPermissions
            });

            // Stocker les infos de permission dans le contexte
            context.data.set('permissions', requiredPermissions);
            context.data.set('userRoles', await this.permissionManager.getUserRoles(userId));

            return true; // Autoriser l'exécution

        } catch (error) {
            Logger.error('PermissionMiddleware: Erreur lors de la vérification:', {
                error: error.message,
                userId: interaction.user?.id,
                commandName: interaction.commandName
            });
            
            // En cas d'erreur, refuser par sécurité
            await this.sendErrorMessage(interaction);
            return false;
        }
    }

    /**
     * Détermine les permissions requises pour une commande
     * @param {Object} command - Objet commande
     * @param {string} commandName - Nom de la commande
     * @returns {Array<string>} Liste des permissions requises
     */
    static getCommandPermissions(command, commandName) {
        const permissions = [];

        // Vérifier les permissions explicites définies sur la commande
        if (command.permissions) {
            if (Array.isArray(command.permissions)) {
                permissions.push(...command.permissions);
            } else if (typeof command.permissions === 'string') {
                permissions.push(command.permissions);
            }
        }

        // Permissions basées sur la catégorie de commande
        if (command.category) {
            const categoryPermissions = this.getCategoryPermissions(command.category);
            permissions.push(...categoryPermissions);
        }

        // Permissions basées sur le nom de la commande
        const commandPermissions = this.getCommandNamePermissions(commandName);
        permissions.push(...commandPermissions);

        // Supprimer les doublons
        return [...new Set(permissions)];
    }

    /**
     * Récupère les permissions basées sur la catégorie
     * @param {string} category - Catégorie de la commande
     * @returns {Array<string>}
     */
    static getCategoryPermissions(category) {
        const categoryMap = {
            'admin': ['commands.admin', 'bot.admin'],
            'moderation': ['commands.moderation'],
            'database': ['commands.database'],
            'studi': ['studi.manage'],
            'projects': [], // Pas de permissions spéciales pour les projets
            'general': []   // Commandes publiques
        };

        return categoryMap[category] || [];
    }

    /**
     * Récupère les permissions basées sur le nom de la commande
     * @param {string} commandName - Nom de la commande
     * @returns {Array<string>}
     */
    static getCommandNamePermissions(commandName) {
        // Mapping spécifique de commandes vers permissions
        const commandMap = {
            // Commandes admin
            'add_admin': ['users.manage_roles', 'bot.admin'],
            'remove_admin': ['users.manage_roles', 'bot.admin'],
            'addmoderator': ['users.manage_roles'],
            'remove_mod': ['users.manage_roles'],
            'list_staff': ['users.view_info'],
            
            // Commandes de base de données
            'db_fix': ['commands.database'],
            'db_reset': ['commands.database'],
            'db_status': ['commands.database'],
            'studi_db_init': ['commands.database', 'studi.manage'],
            
            // Commandes de statistiques
            'stats': ['commands.stats'],
            
            // Commandes de configuration
            'config': ['commands.config'],
            'studi_config': ['studi.manage'],
            
            // Commandes Studi
            'studi_ban_add': ['studi.manage'],
            'studi_ban_remove': ['studi.manage'],
            'studi_ban_list': ['studi.view_logs'],
            'studi_offenders': ['studi.view_logs'],
            'studi_status': ['studi.view_logs'],
            
            // Commandes de modération générales
            'ban_add': ['commands.moderation'],
            'ban_remove': ['commands.moderation'],
            'rappel': ['commands.moderation'],
            
            // Commandes réservées aux administrateurs
            'ping': ['bot.admin'],
            'info': ['bot.admin']
        };

        return commandMap[commandName] || [];
    }

    /**
     * Envoie un message de permission refusée
     * @param {Interaction} interaction - Interaction Discord
     * @param {string} missingPermission - Permission manquante
     * @param {Array<string>} requiredPermissions - Toutes les permissions requises
     */
    static async sendPermissionDeniedMessage(interaction, missingPermission, requiredPermissions) {
        const message = this.formatPermissionDeniedMessage(missingPermission, requiredPermissions);
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: message, ephemeral: true });
            } else {
                await interaction.reply({ content: message, ephemeral: true });
            }
        } catch (error) {
            Logger.error('PermissionMiddleware: Erreur envoi message refus:', {
                error: error.message
            });
        }
    }

    /**
     * Formate le message de permission refusée
     * @param {string} missingPermission - Permission manquante
     * @param {Array<string>} requiredPermissions - Permissions requises
     * @returns {string}
     */
    static formatPermissionDeniedMessage(missingPermission, requiredPermissions) {
        const permissionNames = {
            'bot.admin': 'Administrateur Bot',
            'bot.moderator': 'Modérateur Bot',
            'bot.helper': 'Assistant Bot',
            'commands.admin': 'Commandes Administratives',
            'commands.moderation': 'Commandes de Modération',
            'commands.database': 'Commandes de Base de Données',
            'commands.stats': 'Statistiques',
            'commands.config': 'Configuration',
            'studi.manage': 'Gestion Anti-Studi',
            'studi.whitelist': 'Whitelist Studi',
            'studi.view_logs': 'Logs Studi',
            'users.manage_roles': 'Gestion des Rôles',
            'users.manage_permissions': 'Gestion des Permissions',
            'users.view_info': 'Informations Utilisateur',
            'system.restart': 'Redémarrage Système',
            'system.shutdown': 'Arrêt Système',
            'system.maintenance': 'Mode Maintenance'
        };

        const friendlyName = permissionNames[missingPermission] || missingPermission;
        
        let message = `🚫 **Accès refusé**\n\n`;
        message += `Cette commande nécessite la permission : **${friendlyName}**\n\n`;
        
        if (requiredPermissions.length > 1) {
            message += `Permissions requises :\n`;
            requiredPermissions.forEach(perm => {
                const name = permissionNames[perm] || perm;
                message += `• ${name}\n`;
            });
        }
        
        message += `\n💡 Contactez un administrateur du bot pour obtenir les permissions nécessaires.`;
        
        return message;
    }

    /**
     * Envoie un message d'erreur générique
     * @param {Interaction} interaction - Interaction Discord
     */
    static async sendErrorMessage(interaction) {
        const message = '❌ Erreur lors de la vérification des permissions. Veuillez réessayer.';
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: message, ephemeral: true });
            } else {
                await interaction.reply({ content: message, ephemeral: true });
            }
        } catch (error) {
            Logger.error('PermissionMiddleware: Erreur envoi message d\'erreur:', {
                error: error.message
            });
        }
    }

    /**
     * Vérifie si un utilisateur peut gérer les permissions d'un autre
     * @param {string} executorId - ID de l'utilisateur qui veut effectuer l'action
     * @param {string} targetId - ID de l'utilisateur cible
     * @returns {Promise<boolean>}
     */
    static async canManageUser(executorId, targetId) {
        if (!this.permissionManager) {
            return false;
        }

        try {
            // Un utilisateur ne peut pas se gérer lui-même pour les permissions critiques
            if (executorId === targetId) {
                return false;
            }

            // Vérifier que l'exécuteur a la permission de gérer les rôles
            const canManage = await this.permissionManager.hasPermission(
                executorId, 
                'users.manage_roles'
            );

            return canManage;
        } catch (error) {
            Logger.error('PermissionMiddleware: Erreur vérification gestion utilisateur:', {
                error: error.message
            });
            return false;
        }
    }

    /**
     * Récupère les statistiques du middleware
     * @returns {Object}
     */
    static getStats() {
        return {
            initialized: !!this.permissionManager,
            permissionManager: this.permissionManager?.getStats() || null
        };
    }
}