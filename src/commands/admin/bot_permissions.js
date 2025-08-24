/**
 * @file bot_permissions.js
 * @description Commande pour gérer les permissions spéciales du bot
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('bot_permissions')
        .setDescription('Gère les permissions spéciales du bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('grant')
                .setDescription('Accorder une permission spéciale à un utilisateur')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Utilisateur à qui accorder la permission')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('permission')
                        .setDescription('Permission à accorder')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Raison de l\'attribution')
                )
                .addStringOption(option =>
                    option
                        .setName('duration')
                        .setDescription('Durée de la permission')
                        .addChoices(
                            { name: '1 jour', value: '1d' },
                            { name: '1 semaine', value: '1w' },
                            { name: '1 mois', value: '1m' },
                            { name: 'Permanent', value: 'permanent' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('revoke')
                .setDescription('Révoquer une permission spéciale d\'un utilisateur')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Utilisateur à qui révoquer la permission')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('permission')
                        .setDescription('Permission à révoquer')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Vérifier si un utilisateur a une permission')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Utilisateur à vérifier')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('permission')
                        .setDescription('Permission à vérifier')
                        .setRequired(true)
                        .setAutocomplete(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Lister toutes les permissions disponibles')
        ),

    // Permissions requises pour cette commande
    permissions: ['users.manage_permissions'],
    category: 'admin',

    async execute(interaction) {
        try {
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
                case 'check':
                    await this.handleCheck(interaction, permissionManager);
                    break;
                case 'list':
                    await this.handleList(interaction, permissionManager);
                    break;
                default:
                    throw ErrorHandler.createError('VALIDATION_ERROR', 'Sous-commande non reconnue');
            }

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'bot_permissions');
        }
    },

    /**
     * Autocomplete pour les permissions
     */
    async autocomplete(interaction) {
        try {
            const focusedValue = interaction.options.getFocused();
            const databaseManager = interaction.client.databaseManager;

            if (!databaseManager || !databaseManager.isAvailable()) {
                return interaction.respond([]);
            }

            // Récupérer toutes les permissions
            const permissions = await databaseManager.select('bot_permissions', {}, {
                orderBy: 'permission_name'
            });

            // Filtrer selon la saisie
            const filtered = permissions
                .filter(perm => perm.permission_name.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25) // Discord limite à 25 choix
                .map(perm => ({
                    name: `${perm.permission_name}${perm.description ? ` - ${perm.description}` : ''}`,
                    value: perm.permission_name
                }));

            await interaction.respond(filtered);

        } catch (error) {
            Logger.error('Erreur autocomplete permissions:', { error: error.message });
            await interaction.respond([]);
        }
    },

    /**
     * Gère l'attribution d'une permission
     */
    async handleGrant(interaction, permissionManager) {
        const targetUser = interaction.options.getUser('user');
        const permission = interaction.options.getString('permission');
        const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée';
        const duration = interaction.options.getString('duration');
        const executorId = interaction.user.id;

        // Calculer la date d'expiration
        const expiresAt = this.calculateExpirationDate(duration);

        // Accorder la permission
        const success = await permissionManager.grantUserPermission(
            targetUser.id,
            permission,
            executorId,
            expiresAt,
            reason
        );

        if (!success) {
            throw ErrorHandler.createError('DATABASE_ERROR', 'Impossible d\'accorder la permission');
        }

        // Créer l'embed de confirmation
        const embed = new EmbedBuilder()
            .setTitle('✅ Permission accordée avec succès')
            .setColor('#2ecc71')
            .addFields(
                { name: '👤 Utilisateur', value: `${targetUser} (${targetUser.username})`, inline: true },
                { name: '🔑 Permission', value: `\`${permission}\``, inline: true },
                { name: '⏰ Durée', value: duration === 'permanent' ? 'Permanent' : duration || 'Permanent', inline: true },
                { name: '📝 Raison', value: reason },
                { name: '👨‍💼 Accordée par', value: `${interaction.user} (${interaction.user.username})` }
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

        Logger.info(`Permission accordée: ${permission} à ${targetUser.username}`, {
            executorId,
            targetId: targetUser.id,
            permission,
            duration,
            reason
        });
    },

    /**
     * Gère la révocation d'une permission
     */
    async handleRevoke(interaction, permissionManager) {
        const targetUser = interaction.options.getUser('user');
        const permission = interaction.options.getString('permission');
        const executorId = interaction.user.id;

        // Révoquer la permission
        const success = await permissionManager.revokeUserPermission(
            targetUser.id,
            permission,
            executorId
        );

        if (!success) {
            throw ErrorHandler.createError('DATABASE_ERROR', 'Impossible de révoquer la permission');
        }

        // Créer l'embed de confirmation
        const embed = new EmbedBuilder()
            .setTitle('🚫 Permission révoquée avec succès')
            .setColor('#e74c3c')
            .addFields(
                { name: '👤 Utilisateur', value: `${targetUser} (${targetUser.username})`, inline: true },
                { name: '🔑 Permission révoquée', value: `\`${permission}\``, inline: true },
                { name: '👨‍💼 Révoquée par', value: `${interaction.user} (${interaction.user.username})` }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        Logger.info(`Permission révoquée: ${permission} de ${targetUser.username}`, {
            executorId,
            targetId: targetUser.id,
            permission
        });
    },

    /**
     * Gère la vérification d'une permission
     */
    async handleCheck(interaction, permissionManager) {
        const targetUser = interaction.options.getUser('user');
        const permission = interaction.options.getString('permission');

        // Vérifier la permission
        const hasPermission = await permissionManager.hasPermission(targetUser.id, permission);

        // Récupérer les informations détaillées
        const userInfo = await permissionManager.getUserInfo(targetUser.id);

        const embed = new EmbedBuilder()
            .setTitle(`🔍 Vérification de permission`)
            .setColor(hasPermission ? '#2ecc71' : '#e74c3c')
            .addFields(
                { name: '👤 Utilisateur', value: `${targetUser} (${targetUser.username})`, inline: true },
                { name: '🔑 Permission', value: `\`${permission}\``, inline: true },
                { name: '✅ Résultat', value: hasPermission ? '**Autorisé** ✅' : '**Refusé** ❌', inline: true },
                { name: '🏷️ Rôles Bot', value: userInfo.roles.length > 0 ? userInfo.roles.join(', ') : 'Aucun', inline: true },
                { name: '👑 Super Admin', value: userInfo.isSuperAdmin ? 'Oui' : 'Non', inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    /**
     * Gère l'affichage de la liste des permissions
     */
    async handleList(interaction, permissionManager) {
        try {
            const databaseManager = interaction.client.databaseManager;
            if (!databaseManager || !databaseManager.isAvailable()) {
                throw ErrorHandler.createError('DATABASE_ERROR', 'Base de données non disponible');
            }

            const permissions = await databaseManager.select('bot_permissions', {}, {
                orderBy: 'permission_name'
            });

            if (permissions.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📜 Permissions Bot')
                    .setDescription('Aucune permission trouvée.')
                    .setColor('#95a5a6');

                await interaction.reply({ embeds: [embed] });
                return;
            }

            // Grouper par préfixe
            const groups = {};
            for (const perm of permissions) {
                const prefix = perm.permission_name.split('.')[0];
                if (!groups[prefix]) {
                    groups[prefix] = [];
                }
                groups[prefix].push(perm);
            }

            const embed = new EmbedBuilder()
                .setTitle('📜 Permissions Bot - Liste complète')
                .setColor('#3498db')
                .setTimestamp();

            // Ajouter chaque groupe
            for (const [prefix, perms] of Object.entries(groups)) {
                const permList = perms.map(perm => {
                    const systemIcon = perm.is_system ? '🔒' : '📝';
                    const description = perm.description ? ` - ${perm.description}` : '';
                    return `${systemIcon} \`${perm.permission_name}\`${description}`;
                }).join('\n');

                // Limiter la longueur pour Discord
                const truncatedList = permList.length > 1024 ? 
                    permList.substring(0, 1020) + '...' : 
                    permList;

                embed.addFields({
                    name: `${prefix.toUpperCase()} (${perms.length})`,
                    value: truncatedList,
                    inline: false
                });
            }

            embed.setFooter({ 
                text: `Total: ${permissions.length} permissions • 🔒 = Système • 📝 = Personnalisée` 
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            Logger.error('Erreur lors de la récupération des permissions:', {
                error: error.message
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
            '1m': 30 * 24 * 60 * 60 * 1000       // 1 mois
        };

        const durationMs = durationMap[duration];
        if (!durationMs) {
            return null;
        }

        return new Date(now.getTime() + durationMs);
    }
};