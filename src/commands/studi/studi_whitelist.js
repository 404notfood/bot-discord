/**
 * @file studi_whitelist.js
 * @description Commande pour gérer la whitelist anti-Studi
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('studi_whitelist')
        .setDescription('Gère la whitelist du système anti-Studi')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Ajouter un utilisateur à la whitelist')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Utilisateur à ajouter à la whitelist')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('reason')
                        .setDescription('Raison de l\'ajout à la whitelist')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option
                        .setName('duration')
                        .setDescription('Durée de l\'exemption (optionnel)')
                        .addChoices(
                            { name: '1 jour', value: '1d' },
                            { name: '1 semaine', value: '1w' },
                            { name: '1 mois', value: '1m' },
                            { name: '3 mois', value: '3m' },
                            { name: '6 mois', value: '6m' },
                            { name: 'Permanent', value: 'permanent' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Retirer un utilisateur de la whitelist')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Utilisateur à retirer de la whitelist')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Afficher la whitelist anti-Studi')
                .addBooleanOption(option =>
                    option
                        .setName('show_expired')
                        .setDescription('Afficher aussi les entrées expirées')
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('check')
                .setDescription('Vérifier si un utilisateur est en whitelist')
                .addUserOption(option =>
                    option
                        .setName('user')
                        .setDescription('Utilisateur à vérifier')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('cleanup')
                .setDescription('Nettoyer les entrées expirées de la whitelist')
        ),

    // Permissions requises pour cette commande
    permissions: ['studi.whitelist'],
    category: 'studi',

    async execute(interaction) {
        try {
            const databaseManager = interaction.client.databaseManager;
            
            if (!databaseManager || !databaseManager.isAvailable()) {
                throw ErrorHandler.createError('DATABASE_ERROR', 'Base de données non disponible');
            }

            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
                case 'add':
                    await this.handleAdd(interaction, databaseManager);
                    break;
                case 'remove':
                    await this.handleRemove(interaction, databaseManager);
                    break;
                case 'list':
                    await this.handleList(interaction, databaseManager);
                    break;
                case 'check':
                    await this.handleCheck(interaction, databaseManager);
                    break;
                case 'cleanup':
                    await this.handleCleanup(interaction, databaseManager);
                    break;
                default:
                    throw ErrorHandler.createError('VALIDATION_ERROR', 'Sous-commande non reconnue');
            }

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'studi_whitelist');
        }
    },

    /**
     * Gère l'ajout d'un utilisateur à la whitelist
     */
    async handleAdd(interaction, databaseManager) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getString('duration');
        const executorId = interaction.user.id;

        // Calculer la date d'expiration
        const expiresAt = this.calculateExpirationDate(duration);

        // Vérifier si l'utilisateur est déjà en whitelist active
        const existing = await databaseManager.select('studi_whitelist', {
            user_id: targetUser.id,
            is_active: true
        });

        if (existing.length > 0) {
            const entry = existing[0];
            const isExpired = entry.expires_at && new Date() > new Date(entry.expires_at);
            
            if (!isExpired) {
                throw ErrorHandler.createError('VALIDATION_ERROR', 
                    `${targetUser.username} est déjà en whitelist active`);
            }
        }

        // Ajouter à la whitelist
        try {
            await databaseManager.query(
                `INSERT INTO studi_whitelist (user_id, username, reason, added_by, expires_at, is_active)
                 VALUES (?, ?, ?, ?, ?, true)
                 ON DUPLICATE KEY UPDATE
                 username = VALUES(username),
                 reason = VALUES(reason),
                 added_by = VALUES(added_by),
                 expires_at = VALUES(expires_at),
                 is_active = true,
                 added_at = CURRENT_TIMESTAMP`,
                [targetUser.id, targetUser.username, reason, executorId, expiresAt]
            );

            // Nettoyer le cache du service Studi si disponible
            if (interaction.client.studiService && interaction.client.studiService.clearCache) {
                interaction.client.studiService.clearCache();
            }

            // Créer l'embed de confirmation
            const embed = new EmbedBuilder()
                .setTitle('✅ Utilisateur ajouté à la whitelist')
                .setColor('#2ecc71')
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser} (${targetUser.username})`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false },
                    { name: '⏰ Durée', value: duration === 'permanent' ? 'Permanent' : duration || 'Permanent', inline: true },
                    { name: '👨‍💼 Ajouté par', value: `${interaction.user} (${interaction.user.username})`, inline: true }
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

            Logger.info(`Utilisateur ajouté à la whitelist Studi: ${targetUser.username}`, {
                executorId,
                targetId: targetUser.id,
                reason,
                duration
            });

        } catch (error) {
            Logger.error('Erreur ajout whitelist Studi:', {
                error: error.message,
                targetId: targetUser.id
            });
            throw ErrorHandler.createError('DATABASE_ERROR', 'Erreur lors de l\'ajout à la whitelist');
        }
    },

    /**
     * Gère la suppression d'un utilisateur de la whitelist
     */
    async handleRemove(interaction, databaseManager) {
        const targetUser = interaction.options.getUser('user');
        const executorId = interaction.user.id;

        // Vérifier si l'utilisateur est en whitelist
        const existing = await databaseManager.select('studi_whitelist', {
            user_id: targetUser.id,
            is_active: true
        });

        if (existing.length === 0) {
            throw ErrorHandler.createError('VALIDATION_ERROR', 
                `${targetUser.username} n'est pas en whitelist active`);
        }

        // Désactiver l'entrée
        try {
            await databaseManager.update('studi_whitelist', 
                { is_active: false }, 
                existing[0].id
            );

            // Nettoyer le cache du service Studi si disponible
            if (interaction.client.studiService && interaction.client.studiService.clearCache) {
                interaction.client.studiService.clearCache();
            }

            const embed = new EmbedBuilder()
                .setTitle('🚫 Utilisateur retiré de la whitelist')
                .setColor('#e74c3c')
                .addFields(
                    { name: '👤 Utilisateur', value: `${targetUser} (${targetUser.username})`, inline: true },
                    { name: '👨‍💼 Retiré par', value: `${interaction.user} (${interaction.user.username})`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            Logger.info(`Utilisateur retiré de la whitelist Studi: ${targetUser.username}`, {
                executorId,
                targetId: targetUser.id
            });

        } catch (error) {
            Logger.error('Erreur suppression whitelist Studi:', {
                error: error.message,
                targetId: targetUser.id
            });
            throw ErrorHandler.createError('DATABASE_ERROR', 'Erreur lors du retrait de la whitelist');
        }
    },

    /**
     * Gère l'affichage de la whitelist
     */
    async handleList(interaction, databaseManager) {
        const showExpired = interaction.options.getBoolean('show_expired') || false;

        try {
            let whereClause = {};
            if (!showExpired) {
                whereClause.is_active = true;
            }

            const whitelist = await databaseManager.select('studi_whitelist', whereClause, {
                orderBy: 'added_at',
                order: 'DESC'
            });

            if (whitelist.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle('📋 Whitelist Anti-Studi')
                    .setDescription('Aucun utilisateur en whitelist.')
                    .setColor('#95a5a6');

                await interaction.reply({ embeds: [embed] });
                return;
            }

            // Séparer les entrées actives et expirées
            const activeEntries = [];
            const expiredEntries = [];
            const now = new Date();

            for (const entry of whitelist) {
                const isExpired = entry.expires_at && now > new Date(entry.expires_at);
                const isActive = entry.is_active && !isExpired;
                
                if (isActive) {
                    activeEntries.push(entry);
                } else {
                    expiredEntries.push(entry);
                }
            }

            const embed = new EmbedBuilder()
                .setTitle('📋 Whitelist Anti-Studi')
                .setColor('#3498db')
                .setTimestamp();

            // Ajouter les entrées actives
            if (activeEntries.length > 0) {
                const activeList = activeEntries.map(entry => {
                    const expiryText = entry.expires_at ? 
                        ` (expire <t:${Math.floor(new Date(entry.expires_at).getTime() / 1000)}:R>)` : 
                        ' (permanent)';
                    return `• <@${entry.user_id}> - ${entry.reason}${expiryText}`;
                }).join('\n');

                embed.addFields({
                    name: `✅ Actives (${activeEntries.length})`,
                    value: activeList.length > 1024 ? activeList.substring(0, 1020) + '...' : activeList,
                    inline: false
                });
            }

            // Ajouter les entrées expirées si demandées
            if (showExpired && expiredEntries.length > 0) {
                const expiredList = expiredEntries.map(entry => {
                    const statusText = entry.is_active ? ' (expirée)' : ' (désactivée)';
                    return `• <@${entry.user_id}> - ${entry.reason}${statusText}`;
                }).join('\n');

                embed.addFields({
                    name: `❌ Expirées/Désactivées (${expiredEntries.length})`,
                    value: expiredList.length > 1024 ? expiredList.substring(0, 1020) + '...' : expiredList,
                    inline: false
                });
            }

            embed.setFooter({ 
                text: `Total: ${whitelist.length} entrée(s) | Actives: ${activeEntries.length}` 
            });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            Logger.error('Erreur affichage whitelist Studi:', {
                error: error.message
            });
            throw error;
        }
    },

    /**
     * Gère la vérification d'un utilisateur
     */
    async handleCheck(interaction, databaseManager) {
        const targetUser = interaction.options.getUser('user');

        try {
            const whitelist = await databaseManager.select('studi_whitelist', {
                user_id: targetUser.id
            }, {
                orderBy: 'added_at',
                order: 'DESC'
            });

            const embed = new EmbedBuilder()
                .setTitle(`🔍 Vérification whitelist - ${targetUser.username}`)
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setTimestamp();

            if (whitelist.length === 0) {
                embed.setDescription('❌ Cet utilisateur n\'a jamais été ajouté à la whitelist.')
                    .setColor('#e74c3c');
            } else {
                const latestEntry = whitelist[0];
                const now = new Date();
                const isExpired = latestEntry.expires_at && now > new Date(latestEntry.expires_at);
                const isActive = latestEntry.is_active && !isExpired;

                embed.setColor(isActive ? '#2ecc71' : '#e74c3c')
                    .addFields(
                        { name: '✅ Statut', value: isActive ? 'En whitelist active' : 'Pas en whitelist', inline: true },
                        { name: '📝 Dernière raison', value: latestEntry.reason || 'Non spécifiée', inline: false },
                        { name: '📅 Ajouté le', value: `<t:${Math.floor(new Date(latestEntry.added_at).getTime() / 1000)}:F>`, inline: true }
                    );

                if (latestEntry.expires_at) {
                    embed.addFields({
                        name: isExpired ? '❌ Expiré le' : '📅 Expire le',
                        value: `<t:${Math.floor(new Date(latestEntry.expires_at).getTime() / 1000)}:F>`,
                        inline: true
                    });
                } else {
                    embed.addFields({
                        name: '⏰ Duration',
                        value: 'Permanent',
                        inline: true
                    });
                }

                if (whitelist.length > 1) {
                    embed.addFields({
                        name: '📊 Historique',
                        value: `${whitelist.length} entrée(s) au total`,
                        inline: true
                    });
                }
            }

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            Logger.error('Erreur vérification whitelist Studi:', {
                error: error.message,
                targetId: targetUser.id
            });
            throw error;
        }
    },

    /**
     * Gère le nettoyage des entrées expirées
     */
    async handleCleanup(interaction, databaseManager) {
        try {
            // Désactiver les entrées expirées
            const result = await databaseManager.query(
                'UPDATE studi_whitelist SET is_active = false WHERE expires_at IS NOT NULL AND expires_at < NOW() AND is_active = true'
            );

            const cleanedCount = result.affectedRows || 0;

            // Nettoyer le cache du service Studi si disponible
            if (interaction.client.studiService && interaction.client.studiService.clearCache) {
                interaction.client.studiService.clearCache();
            }

            const embed = new EmbedBuilder()
                .setTitle('🧹 Nettoyage de la whitelist')
                .setDescription(`${cleanedCount} entrée(s) expirée(s) nettoyée(s).`)
                .setColor('#3498db')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            Logger.info(`Nettoyage whitelist Studi: ${cleanedCount} entrées`, {
                executorId: interaction.user.id,
                cleanedCount
            });

        } catch (error) {
            Logger.error('Erreur nettoyage whitelist Studi:', {
                error: error.message
            });
            throw ErrorHandler.createError('DATABASE_ERROR', 'Erreur lors du nettoyage');
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
    }
};