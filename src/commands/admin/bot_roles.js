/**
 * @file bot_roles.js
 * @description Commande pour gérer les rôles Bot (Admin, Moderator, Helper)
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('bot_roles')
        .setDescription('Gère les rôles du bot (Admin, Moderator, Helper)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('grant')
                .setDescription('Accorder un rôle Bot à un utilisateur')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Utilisateur à qui accorder le rôle')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('role')
                        .setDescription('Rôle à accorder')
                        .setRequired(true)
                        .addChoices(
                            { name: '👑 Admin Bot', value: 'admin' },
                            { name: '🛡️ Moderator Bot', value: 'moderator' },
                            { name: '🤝 Helper Bot', value: 'helper' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('duration')
                        .setDescription('Durée du rôle (optionnel)')
                        .addChoices(
                            { name: '1 jour', value: '1d' },
                            { name: '1 semaine', value: '1w' },
                            { name: '1 mois', value: '1m' },
                            { name: '3 mois', value: '3m' },
                            { name: '6 mois', value: '6m' },
                            { name: 'Permanent', value: 'permanent' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Raison de l\'attribution du rôle')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('revoke')
                .setDescription('Révoquer un rôle Bot d\'un utilisateur')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Utilisateur à qui révoquer le rôle')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('role')
                        .setDescription('Rôle à révoquer')
                        .setRequired(true)
                        .addChoices(
                            { name: '👑 Admin Bot', value: 'admin' },
                            { name: '🛡️ Moderator Bot', value: 'moderator' },
                            { name: '🤝 Helper Bot', value: 'helper' }
                        )
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Raison de la révocation du rôle')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Liste tous les utilisateurs avec des rôles Bot')
                .addStringOption(option =>
                    option
                        .setName('role')
                        .setDescription('Filtrer par rôle spécifique')
                        .addChoices(
                            { name: '👑 Admin Bot', value: 'admin' },
                            { name: '🛡️ Moderator Bot', value: 'moderator' },
                            { name: '🤝 Helper Bot', value: 'helper' },
                            { name: '📋 Tous', value: 'all' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Affiche les informations de rôles d\'un utilisateur')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Utilisateur à consulter')
                        .setRequired(true)
                )
        ),

    // Permissions requises pour cette commande
    permissions: ['users.manage_roles'],
    category: 'admin',

    async execute(interaction) {
        try {
            // Récupérer le gestionnaire de permissions depuis le client
            const permissionManager = interaction.client.permissionManager;
            
            if (!permissionManager) {
                throw ErrorHandler.createError('BOT_ERROR', 'Gestionnaire de permissions non disponible');
            }

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'grant':
                    await this.handleGrant(interaction, permissionManager);
                    break;
                case 'revoke':
                    await this.handleRevoke(interaction, permissionManager);
                    break;
                case 'list':
                    await this.handleList(interaction, permissionManager);
                    break;
                case 'info':
                    await this.handleInfo(interaction, permissionManager);
                    break;
                default:
                    throw ErrorHandler.createError('VALIDATION_ERROR', 'Sous-commande non reconnue');
            }

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'bot_roles');
        }
    },

    /**
     * Gère l'attribution d'un rôle
     */
    async handleGrant(interaction, permissionManager) {
        const targetUser = interaction.options.getUser('user');
        const roleType = interaction.options.getString('role');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée';
        const executorId = interaction.user.id;

        // Vérifier qu'on ne s'accorde pas un rôle à soi-même
        if (targetUser.id === executorId) {
            throw ErrorHandler.createError('PERMISSION_ERROR', 
                'Vous ne pouvez pas vous accorder un rôle à vous-même');
        }

        // Calculer la date d'expiration
        const expiresAt = this.calculateExpirationDate(duration);

        // Vérifier les rôles existants
        const existingRoles = await permissionManager.getUserRoles(targetUser.id);
        if (existingRoles.includes(roleType)) {
            throw ErrorHandler.createError('VALIDATION_ERROR', 
                `${targetUser.username} a déjà le rôle ${this.getRoleDisplayName(roleType)}`);
        }

        // Accorder le rôle
        const success = await permissionManager.grantRole(
            targetUser.id, 
            roleType, 
            executorId, 
            expiresAt
        );

        if (!success) {
            throw ErrorHandler.createError('DATABASE_ERROR', 'Impossible d\'accorder le rôle');
        }

        // Créer l'embed de confirmation
        const embed = new EmbedBuilder()
            .setTitle('✅ Rôle accordé avec succès')
            .setColor('#2ecc71')
            .addFields(
                { name: '👤 Utilisateur', value: `${targetUser} (${targetUser.username})`, inline: true },
                { name: '🏷️ Rôle', value: this.getRoleDisplayName(roleType), inline: true },
                { name: '⏰ Durée', value: duration === 'permanent' ? 'Permanent' : duration || 'Permanent', inline: true },
                { name: '📝 Raison', value: reason },
                { name: '👨‍💼 Accordé par', value: `${interaction.user} (${interaction.user.username})` }
            )
            .setTimestamp();

        if (expiresAt) {
            embed.addFields({
                name: '📅 Expire le',
                value: `<t:${Math.floor(expiresAt.getTime() / 1000)}:F>`,
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed] });

        Logger.info(`Rôle Bot accordé: ${roleType} à ${targetUser.username}`, {
            executorId,
            targetId: targetUser.id,
            roleType,
            duration,
            reason
        });
    },

    /**
     * Gère la révocation d'un rôle
     */
    async handleRevoke(interaction, permissionManager) {
        const targetUser = interaction.options.getUser('user');
        const roleType = interaction.options.getString('role');
        const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée';
        const executorId = interaction.user.id;

        // Vérifier que l'utilisateur a bien ce rôle
        const userRoles = await permissionManager.getUserRoles(targetUser.id);
        if (!userRoles.includes(roleType)) {
            throw ErrorHandler.createError('VALIDATION_ERROR', 
                `${targetUser.username} n'a pas le rôle ${this.getRoleDisplayName(roleType)}`);
        }

        // Révoquer le rôle
        const success = await permissionManager.revokeRole(targetUser.id, roleType, executorId);

        if (!success) {
            throw ErrorHandler.createError('DATABASE_ERROR', 'Impossible de révoquer le rôle');
        }

        // Créer l'embed de confirmation
        const embed = new EmbedBuilder()
            .setTitle('🚫 Rôle révoqué avec succès')
            .setColor('#e74c3c')
            .addFields(
                { name: '👤 Utilisateur', value: `${targetUser} (${targetUser.username})`, inline: true },
                { name: '🏷️ Rôle révoqué', value: this.getRoleDisplayName(roleType), inline: true },
                { name: '📝 Raison', value: reason },
                { name: '👨‍💼 Révoqué par', value: `${interaction.user} (${interaction.user.username})` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        Logger.info(`Rôle Bot révoqué: ${roleType} de ${targetUser.username}`, {
            executorId,
            targetId: targetUser.id,
            roleType,
            reason
        });
    },

    /**
     * Gère l'affichage de la liste des rôles
     */
    async handleList(interaction, permissionManager) {
        const filterRole = interaction.options.getString('role') || 'all';
        
        try {
            // Récupérer tous les rôles depuis la base de données
            const databaseManager = interaction.client.databaseManager;
            if (!databaseManager || !databaseManager.isAvailable()) {
                throw ErrorHandler.createError('DATABASE_ERROR', 'Base de données non disponible');
            }

            let whereClause = { is_active: true };
            if (filterRole !== 'all') {
                whereClause.role_type = filterRole;
            }

            const roles = await databaseManager.select('bot_roles', whereClause, {
                orderBy: 'role_type, granted_at',
                order: 'ASC'
            });

            if (roles.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📋 Rôles Bot')
                    .setDescription('Aucun utilisateur trouvé avec des rôles Bot actifs.')
                    .setColor('#95a5a6');

                await interaction.reply({ embeds: [embed] });
                return;
            }

            // Grouper par type de rôle
            const roleGroups = {
                admin: [],
                moderator: [],
                helper: []
            };

            for (const role of roles) {
                if (roleGroups[role.role_type]) {
                    roleGroups[role.role_type].push(role);
                }
            }

            // Créer l'embed
            const embed = new EmbedBuilder()
                .setTitle('📋 Rôles Bot - Liste des utilisateurs')
                .setColor('#3498db')
                .setTimestamp();

            // Ajouter les champs pour chaque type de rôle
            for (const [roleType, users] of Object.entries(roleGroups)) {
                if (users.length > 0) {
                    const userList = users.map(user => {
                        const expiryText = user.expires_at ? 
                            ` (expire <t:${Math.floor(new Date(user.expires_at).getTime() / 1000)}:R>)` : 
                            '';
                        return `• <@${user.user_id}>${expiryText}`;
                    }).join('\n');

                    embed.addFields({
                        name: `${this.getRoleDisplayName(roleType)} (${users.length})`,
                        value: userList.length > 1024 ? userList.substring(0, 1020) + '...' : userList,
                        inline: false
                    });
                }
            }

            embed.setFooter({ text: `Total: ${roles.length} utilisateur(s) avec des rôles Bot` });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            Logger.error('Erreur lors de la récupération de la liste des rôles:', {
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Gère l'affichage des informations d'un utilisateur
     */
    async handleInfo(interaction, permissionManager) {
        const targetUser = interaction.options.getUser('user');
        
        try {
            const userInfo = await permissionManager.getUserInfo(targetUser.id);

            const embed = new EmbedBuilder()
                .setTitle(`🔍 Informations Bot - ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setColor('#3498db')
                .setTimestamp();

            // Rôles
            if (userInfo.roles.length > 0) {
                const roleList = userInfo.roles.map(role => this.getRoleDisplayName(role)).join(', ');
                embed.addFields({ 
                    name: '🏷️ Rôles Bot', 
                    value: roleList, 
                    inline: true 
                });
            } else {
                embed.addFields({ 
                    name: '🏷️ Rôles Bot', 
                    value: 'Aucun', 
                    inline: true 
                });
            }

            // Super Admin
            embed.addFields({ 
                name: '👑 Super Admin', 
                value: userInfo.isSuperAdmin ? 'Oui' : 'Non', 
                inline: true 
            });

            // Nombre de permissions
            embed.addFields({ 
                name: '🔑 Permissions', 
                value: `${userInfo.permissions.length} permissions`, 
                inline: true 
            });

            // Top permissions (si il y en a)
            if (userInfo.permissions.length > 0) {
                const topPermissions = userInfo.permissions
                    .slice(0, 10) // Limiter à 10 pour éviter de dépasser la limite
                    .map(perm => `• ${perm}`)
                    .join('\n');
                
                embed.addFields({
                    name: '📜 Permissions principales',
                    value: topPermissions,
                    inline: false
                });
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            Logger.error('Erreur lors de la récupération des informations utilisateur:', {
                error: error.message,
                targetUserId: targetUser.id
            });
            throw error;
        }
    },

    /**
     * Calcule la date d'expiration basée sur la durée
     * @param {string} duration - Durée sélectionnée
     * @returns {Date|null} Date d'expiration ou null si permanent
     */
    calculateExpirationDate(duration) {
        if (!duration || duration === 'permanent') {
            return null;
        }

        const now = new Date();
        const durationMap = {
            '1d': 24 * 60 * 60 * 1000,           // 1 jour
            '1w': 7 * 24 * 60 * 60 * 1000,       // 1 semaine
            '1m': 30 * 24 * 60 * 60 * 1000,      // 1 mois
            '3m': 90 * 24 * 60 * 60 * 1000,      // 3 mois
            '6m': 180 * 24 * 60 * 60 * 1000      // 6 mois
        };

        const durationMs = durationMap[duration];
        if (!durationMs) {
            return null;
        }

        return new Date(now.getTime() + durationMs);
    },

    /**
     * Récupère le nom d'affichage d'un rôle
     * @param {string} roleType - Type de rôle
     * @returns {string} Nom d'affichage
     */
    getRoleDisplayName(roleType) {
        const displayNames = {
            'admin': '👑 Admin Bot',
            'moderator': '🛡️ Moderator Bot',
            'helper': '🤝 Helper Bot'
        };

        return displayNames[roleType] || roleType;
    }
};