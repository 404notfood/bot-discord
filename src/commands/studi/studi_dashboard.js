/**
 * @file studi_dashboard.js
 * @description Commande pour afficher le dashboard complet du système anti-Studi
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('studi_dashboard')
        .setDescription('Affiche le dashboard complet du système anti-Studi')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addStringOption(option =>
            option
                .setName('period')
                .setDescription('Période des statistiques')
                .addChoices(
                    { name: 'Aujourd\'hui', value: 'today' },
                    { name: 'Cette semaine', value: 'week' },
                    { name: 'Ce mois', value: 'month' },
                    { name: '7 derniers jours', value: '7days' },
                    { name: '30 derniers jours', value: '30days' }
                )
        )
        .addBooleanOption(option =>
            option
                .setName('detailed')
                .setDescription('Affichage détaillé avec graphiques')
        ),

    // Permissions requises pour cette commande
    permissions: ['studi.view_logs'],
    category: 'studi',

    async execute(interaction) {
        try {
            const databaseManager = interaction.client.databaseManager;
            
            if (!databaseManager || !databaseManager.isAvailable()) {
                throw ErrorHandler.createError('DATABASE_ERROR', 'Base de données non disponible');
            }

            const period = interaction.options.getString('period') || 'today';
            const detailed = interaction.options.getBoolean('detailed') || false;
            const guildId = interaction.guild.id;

            // Différer la réponse pour avoir plus de temps
            await interaction.deferReply();

            // Récupérer les données
            const dashboardData = await this.getDashboardData(databaseManager, guildId, period);
            const realtimeStats = this.getRealTimeStats(interaction.client, guildId);

            // Créer l'embed principal
            const embed = await this.createDashboardEmbed(
                dashboardData, 
                realtimeStats, 
                period, 
                detailed,
                interaction.guild
            );

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'studi_dashboard');
        }
    },

    /**
     * Récupère les données du dashboard
     * @param {DatabaseManager} databaseManager - Gestionnaire de base de données
     * @param {string} guildId - ID du serveur
     * @param {string} period - Période des statistiques
     * @returns {Promise<Object>}
     */
    async getDashboardData(databaseManager, guildId, period) {
        try {
            // Calculer les dates selon la période
            const dates = this.calculateDateRange(period);
            
            // Statistiques principales
            const stats = await databaseManager.query(
                `SELECT 
                    SUM(messages_deleted) as total_messages_deleted,
                    SUM(warnings_sent) as total_warnings,
                    SUM(timeouts_applied) as total_timeouts,
                    SUM(kicks_executed) as total_kicks,
                    SUM(bans_executed) as total_bans,
                    SUM(whitelist_bypasses) as total_bypasses
                 FROM studi_statistics 
                 WHERE guild_id = ? AND date BETWEEN ? AND ?`,
                [guildId, dates.start, dates.end]
            );

            // Offenseurs actifs
            const offenders = await databaseManager.query(
                `SELECT COUNT(*) as active_offenders
                 FROM studi_offenders_enhanced 
                 WHERE guild_id = ? AND last_offense_at >= ?`,
                [guildId, dates.start]
            );

            // Whitelist active
            const whitelist = await databaseManager.query(
                `SELECT COUNT(*) as active_whitelist
                 FROM studi_whitelist 
                 WHERE is_active = true AND (expires_at IS NULL OR expires_at > NOW())`
            );

            // Évolution quotidienne (pour les graphiques)
            const dailyStats = await databaseManager.query(
                `SELECT date, messages_deleted, warnings_sent, timeouts_applied, kicks_executed, bans_executed
                 FROM studi_statistics 
                 WHERE guild_id = ? AND date BETWEEN ? AND ?
                 ORDER BY date ASC`,
                [guildId, dates.start, dates.end]
            );

            // Top offenseurs
            const topOffenders = await databaseManager.query(
                `SELECT user_id, username, offense_count, escalation_level, last_offense_at
                 FROM studi_offenders_enhanced 
                 WHERE guild_id = ? AND last_offense_at >= ?
                 ORDER BY offense_count DESC, last_offense_at DESC
                 LIMIT 5`,
                [guildId, dates.start]
            );

            // Logs récents
            const recentLogs = await databaseManager.query(
                `SELECT user_id, action_type, created_at, detected_keywords
                 FROM studi_moderation_logs 
                 WHERE guild_id = ? AND created_at >= ?
                 ORDER BY created_at DESC
                 LIMIT 10`,
                [guildId, dates.start]
            );

            return {
                stats: stats[0] || {},
                activeOffenders: offenders[0].active_offenders || 0,
                activeWhitelist: whitelist[0].active_whitelist || 0,
                dailyStats,
                topOffenders,
                recentLogs,
                period: dates
            };

        } catch (error) {
            Logger.error('Erreur récupération données dashboard Studi:', {
                error: error.message,
                guildId,
                period
            });
            throw error;
        }
    },

    /**
     * Récupère les statistiques en temps réel
     * @param {Client} client - Client Discord
     * @param {string} guildId - ID du serveur
     * @returns {Object}
     */
    getRealTimeStats(client, guildId) {
        // Récupérer depuis le service Studi si disponible
        if (client.studiService && client.studiService.getRealTimeStats) {
            return client.studiService.getRealTimeStats(guildId);
        }

        return {
            messages_deleted: 0,
            warnings_sent: 0,
            timeouts_applied: 0,
            kicks_executed: 0,
            bans_executed: 0,
            whitelist_bypasses: 0
        };
    },

    /**
     * Crée l'embed du dashboard
     * @param {Object} data - Données du dashboard
     * @param {Object} realtimeStats - Statistiques temps réel
     * @param {string} period - Période sélectionnée
     * @param {boolean} detailed - Affichage détaillé
     * @param {Guild} guild - Serveur Discord
     * @returns {EmbedBuilder}
     */
    async createDashboardEmbed(data, realtimeStats, period, detailed, guild) {
        const embed = new EmbedBuilder()
            .setTitle(`🛡️ Dashboard Anti-Studi - ${guild.name}`)
            .setColor('#e74c3c')
            .setTimestamp();

        // Statistiques principales
        const stats = data.stats;
        const totalActions = (stats.total_warnings || 0) + (stats.total_timeouts || 0) + 
                           (stats.total_kicks || 0) + (stats.total_bans || 0);

        embed.addFields({
            name: '📊 Statistiques principales',
            value: `🗑️ Messages supprimés: **${stats.total_messages_deleted || 0}**\n` +
                   `⚠️ Avertissements: **${stats.total_warnings || 0}**\n` +
                   `🔇 Timeouts: **${stats.total_timeouts || 0}**\n` +
                   `👢 Expulsions: **${stats.total_kicks || 0}**\n` +
                   `🔨 Bannissements: **${stats.total_bans || 0}**\n` +
                   `✅ Bypasses whitelist: **${stats.total_bypasses || 0}**`,
            inline: true
        });

        // État du système
        embed.addFields({
            name: '🔧 État du système',
            value: `👥 Offenseurs actifs: **${data.activeOffenders}**\n` +
                   `📋 Utilisateurs en whitelist: **${data.activeWhitelist}**\n` +
                   `🎯 Actions totales: **${totalActions}**`,
            inline: true
        });

        // Statistiques temps réel (aujourd'hui uniquement)
        if (period === 'today') {
            const rtTotal = realtimeStats.warnings_sent + realtimeStats.timeouts_applied + 
                          realtimeStats.kicks_executed + realtimeStats.bans_executed;

            embed.addFields({
                name: '⚡ Temps réel (aujourd\'hui)',
                value: `🗑️ Messages: **${realtimeStats.messages_deleted}**\n` +
                       `⚠️ Avertissements: **${realtimeStats.warnings_sent}**\n` +
                       `🔇 Timeouts: **${realtimeStats.timeouts_applied}**\n` +
                       `👢 Expulsions: **${realtimeStats.kicks_executed}**\n` +
                       `🔨 Bans: **${realtimeStats.bans_executed}**\n` +
                       `🎯 Total actions: **${rtTotal}**`,
                inline: true
            });
        }

        // Top offenseurs
        if (data.topOffenders.length > 0) {
            const topList = data.topOffenders.map((offender, index) => {
                const levelEmoji = this.getEscalationEmoji(offender.escalation_level);
                return `${index + 1}. <@${offender.user_id}> ${levelEmoji} (**${offender.offense_count}** violations)`;
            }).join('\n');

            embed.addFields({
                name: '🥇 Top Offenseurs',
                value: topList,
                inline: false
            });
        }

        // Affichage détaillé
        if (detailed && data.dailyStats.length > 0) {
            // Graphique ASCII simple des messages supprimés
            const chart = this.createASCIIChart(data.dailyStats);
            if (chart) {
                embed.addFields({
                    name: '📈 Évolution (Messages supprimés)',
                    value: `\`\`\`${chart}\`\`\``,
                    inline: false
                });
            }

            // Activité récente
            if (data.recentLogs.length > 0) {
                const recentActivity = data.recentLogs.slice(0, 5).map(log => {
                    const actionEmoji = this.getActionEmoji(log.action_type);
                    const timeAgo = `<t:${Math.floor(new Date(log.created_at).getTime() / 1000)}:R>`;
                    return `${actionEmoji} <@${log.user_id}> - ${timeAgo}`;
                }).join('\n');

                embed.addFields({
                    name: '🕐 Activité récente',
                    value: recentActivity,
                    inline: false
                });
            }
        }

        // Footer avec période et mise à jour
        const periodText = {
            'today': 'Aujourd\'hui',
            'week': 'Cette semaine',
            'month': 'Ce mois',
            '7days': '7 derniers jours',
            '30days': '30 derniers jours'
        };

        embed.setFooter({ 
            text: `Période: ${periodText[period]} • Mis à jour` 
        });

        return embed;
    },

    /**
     * Calcule la plage de dates selon la période
     * @param {string} period - Période sélectionnée
     * @returns {Object}
     */
    calculateDateRange(period) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (period) {
            case 'today':
                return {
                    start: today.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };

            case 'week':
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                return {
                    start: startOfWeek.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };

            case 'month':
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                return {
                    start: startOfMonth.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };

            case '7days':
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(today.getDate() - 7);
                return {
                    start: sevenDaysAgo.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };

            case '30days':
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(today.getDate() - 30);
                return {
                    start: thirtyDaysAgo.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };

            default:
                return {
                    start: today.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                };
        }
    },

    /**
     * Crée un graphique ASCII simple
     * @param {Array} dailyStats - Statistiques quotidiennes
     * @returns {string|null}
     */
    createASCIIChart(dailyStats) {
        if (dailyStats.length === 0) return null;

        const maxValue = Math.max(...dailyStats.map(stat => stat.messages_deleted || 0));
        if (maxValue === 0) return 'Aucune activité détectée';

        const chartHeight = 8;
        let chart = '';

        // Créer le graphique ligne par ligne (de haut en bas)
        for (let y = chartHeight; y > 0; y--) {
            let line = '';
            for (const stat of dailyStats.slice(-10)) { // Derniers 10 jours max
                const value = stat.messages_deleted || 0;
                const normalizedValue = Math.ceil((value / maxValue) * chartHeight);
                line += normalizedValue >= y ? '█' : ' ';
            }
            chart += line + '\n';
        }

        return chart;
    },

    /**
     * Récupère l'emoji d'escalade
     * @param {string} level - Niveau d'escalade
     * @returns {string}
     */
    getEscalationEmoji(level) {
        const emojis = {
            'warning': '⚠️',
            'timeout': '🔇',
            'kick': '👢',
            'ban': '🔨'
        };
        return emojis[level] || '❓';
    },

    /**
     * Récupère l'emoji d'action
     * @param {string} actionType - Type d'action
     * @returns {string}
     */
    getActionEmoji(actionType) {
        const emojis = {
            'message_deleted': '🗑️',
            'warning_sent': '⚠️',
            'timeout_applied': '🔇',
            'user_kicked': '👢',
            'user_banned': '🔨',
            'whitelist_bypass': '✅'
        };
        return emojis[actionType] || '❓';
    }
};