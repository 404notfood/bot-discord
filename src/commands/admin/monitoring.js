/**
 * @file monitoring.js
 * @description Commande pour afficher les métriques de monitoring du bot
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('monitoring')
        .setDescription('Affiche les métriques de monitoring du bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de rapport à afficher')
                .setRequired(false)
                .addChoices(
                    { name: 'Vue générale', value: 'overview' },
                    { name: 'Performance', value: 'performance' },
                    { name: 'Commandes', value: 'commands' },
                    { name: 'Erreurs', value: 'errors' },
                    { name: 'Services', value: 'services' },
                    { name: 'Alertes', value: 'alerts' }
                )
        ),

    // Permissions requises pour cette commande
    permissions: ['monitoring.view'],
    category: 'admin',

    async execute(interaction) {
        try {
            const monitoringService = interaction.client.monitoringService;
            
            if (!monitoringService) {
                throw ErrorHandler.createError('SERVICE_ERROR', 'Service de monitoring non disponible');
            }

            const reportType = interaction.options.getString('type') || 'overview';
            
            await interaction.deferReply();

            const healthReport = monitoringService.getHealthReport();
            const embed = await this.createMonitoringEmbed(healthReport, reportType, interaction.guild);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'monitoring');
        }
    },

    /**
     * Crée l'embed de monitoring
     * @param {Object} healthReport - Rapport de santé
     * @param {string} reportType - Type de rapport
     * @param {Guild} guild - Serveur Discord
     * @returns {EmbedBuilder}
     */
    async createMonitoringEmbed(healthReport, reportType, guild) {
        const embed = new EmbedBuilder()
            .setTitle(`📊 Monitoring - ${guild.name}`)
            .setTimestamp();

        // Couleur selon le statut
        const statusColors = {
            'healthy': '#2ecc71',
            'warning': '#f39c12', 
            'unhealthy': '#e74c3c'
        };
        embed.setColor(statusColors[healthReport.status] || '#95a5a6');

        // Badge de statut
        const statusEmojis = {
            'healthy': '🟢',
            'warning': '🟡',
            'unhealthy': '🔴'
        };
        const statusBadge = `${statusEmojis[healthReport.status]} ${healthReport.status.toUpperCase()}`;

        switch (reportType) {
            case 'overview':
                return this.createOverviewEmbed(embed, healthReport, statusBadge);
            case 'performance':
                return this.createPerformanceEmbed(embed, healthReport, statusBadge);
            case 'commands':
                return this.createCommandsEmbed(embed, healthReport, statusBadge);
            case 'errors':
                return this.createErrorsEmbed(embed, healthReport, statusBadge);
            case 'services':
                return this.createServicesEmbed(embed, healthReport, statusBadge);
            case 'alerts':
                return this.createAlertsEmbed(embed, healthReport, statusBadge);
            default:
                return this.createOverviewEmbed(embed, healthReport, statusBadge);
        }
    },

    /**
     * Vue d'ensemble
     */
    createOverviewEmbed(embed, report, statusBadge) {
        embed.setDescription(`**Statut général:** ${statusBadge}`);

        // Métriques principales
        const uptime = this.formatUptime(report.metrics.uptime);
        const memoryUsed = Math.round(report.metrics.memoryUsage.heapUsed / 1024 / 1024);
        const memoryTotal = Math.round(report.metrics.memoryUsage.heapTotal / 1024 / 1024);

        embed.addFields({
            name: '⚡ Performance',
            value: `🕐 Uptime: **${uptime}**\n` +
                   `💾 RAM: **${memoryUsed}/${memoryTotal} MB**\n` +
                   `📡 Ping: **${report.metrics.ping}ms**`,
            inline: true
        });

        embed.addFields({
            name: '🌐 Discord',
            value: `🏠 Serveurs: **${report.metrics.guilds}**\n` +
                   `👥 Utilisateurs: **${report.metrics.users}**\n` +
                   `📺 Canaux: **${report.metrics.channels}**`,
            inline: true
        });

        embed.addFields({
            name: '📊 Activité',
            value: `⚡ Commandes: **${report.metrics.commandsExecuted}**\n` +
                   `🔄 Par minute: **${report.metrics.commandsPerMinute}**\n` +
                   `❌ Erreurs: **${report.metrics.errors}**`,
            inline: true
        });

        // Alertes actives
        if (report.alerts.length > 0) {
            const alertsList = report.alerts.map(alert => `🚨 ${alert}`).join('\n');
            embed.addFields({
                name: '🚨 Alertes actives',
                value: alertsList,
                inline: false
            });
        }

        return embed;
    },

    /**
     * Détails de performance
     */
    createPerformanceEmbed(embed, report, statusBadge) {
        embed.setDescription(`**Performance système** ${statusBadge}`);

        const memUsage = report.metrics.memoryUsage;
        const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
        const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
        const external = Math.round(memUsage.external / 1024 / 1024);
        const rss = Math.round(memUsage.rss / 1024 / 1024);

        embed.addFields({
            name: '💾 Mémoire détaillée',
            value: `Heap utilisée: **${heapUsed} MB**\n` +
                   `Heap totale: **${heapTotal} MB**\n` +
                   `Externe: **${external} MB**\n` +
                   `RSS: **${rss} MB**`,
            inline: true
        });

        embed.addFields({
            name: '⚡ Performance réseau',
            value: `Ping WebSocket: **${report.metrics.ping}ms**\n` +
                   `Ping moyen (5min): **${report.history.averagePingLast5Min}ms**\n` +
                   `Pic mémoire (5min): **${report.history.peakMemoryLast5Min}MB**`,
            inline: true
        });

        embed.addFields({
            name: '🔄 Activité récente',
            value: `Commandes (5min): **${report.history.commandsLast5Min}**\n` +
                   `Erreurs (5min): **${report.history.errorsLast5Min}**\n` +
                   `Uptime: **${this.formatUptime(report.metrics.uptime)}**`,
            inline: true
        });

        return embed;
    },

    /**
     * Statistiques des commandes
     */
    createCommandsEmbed(embed, report, statusBadge) {
        embed.setDescription(`**Statistiques des commandes** ${statusBadge}`);

        embed.addFields({
            name: '📊 Métriques globales',
            value: `Total exécutées: **${report.metrics.commandsExecuted}**\n` +
                   `Par minute: **${report.metrics.commandsPerMinute}**\n` +
                   `Dernières 5min: **${report.history.commandsLast5Min}**`,
            inline: true
        });

        // Top des commandes les plus utilisées
        if (report.metrics.mostUsedCommands.size > 0) {
            const topCommands = Array.from(report.metrics.mostUsedCommands.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map((entry, index) => `${index + 1}. **${entry[0]}** (${entry[1]}x)`)
                .join('\n');

            embed.addFields({
                name: '🏆 Top commandes',
                value: topCommands,
                inline: false
            });
        }

        return embed;
    },

    /**
     * Statistiques des erreurs
     */
    createErrorsEmbed(embed, report, statusBadge) {
        embed.setDescription(`**Statistiques des erreurs** ${statusBadge}`);

        embed.addFields({
            name: '❌ Métriques d\'erreurs',
            value: `Total: **${report.metrics.errors}**\n` +
                   `Par minute: **${report.metrics.errorsPerMinute}**\n` +
                   `Dernières 5min: **${report.history.errorsLast5Min}**`,
            inline: true
        });

        // Types d'erreurs
        if (report.metrics.errorTypes.size > 0) {
            const topErrors = Array.from(report.metrics.errorTypes.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map((entry, index) => `${index + 1}. **${entry[0]}** (${entry[1]}x)`)
                .join('\n');

            embed.addFields({
                name: '🔍 Types d\'erreurs',
                value: topErrors,
                inline: false
            });
        }

        return embed;
    },

    /**
     * État des services
     */
    createServicesEmbed(embed, report, statusBadge) {
        embed.setDescription(`**État des services** ${statusBadge}`);

        const services = Array.from(report.metrics.servicesStatus.entries());
        const healthyServices = services.filter(([, status]) => status === 'healthy');
        const unhealthyServices = services.filter(([, status]) => status === 'unhealthy');

        if (healthyServices.length > 0) {
            const healthyList = healthyServices.map(([name]) => `✅ ${name}`).join('\n');
            embed.addFields({
                name: '✅ Services opérationnels',
                value: healthyList,
                inline: true
            });
        }

        if (unhealthyServices.length > 0) {
            const unhealthyList = unhealthyServices.map(([name]) => `❌ ${name}`).join('\n');
            embed.addFields({
                name: '❌ Services indisponibles',
                value: unhealthyList,
                inline: true
            });
        }

        // Base de données
        embed.addFields({
            name: '🗄️ Base de données',
            value: `État: **${report.metrics.dbConnectionStatus}**\n` +
                   `Requêtes: **${report.metrics.dbQueries}**\n` +
                   `Erreurs DB: **${report.metrics.dbErrors}**`,
            inline: true
        });

        return embed;
    },

    /**
     * Alertes actives
     */
    createAlertsEmbed(embed, report, statusBadge) {
        embed.setDescription(`**Alertes système** ${statusBadge}`);

        if (report.alerts.length === 0) {
            embed.addFields({
                name: '✅ Aucune alerte',
                value: 'Tous les systèmes fonctionnent normalement',
                inline: false
            });
        } else {
            const alertsList = report.alerts.map(alert => {
                const alertEmojis = {
                    'HIGH_MEMORY_USAGE': '💾🔴',
                    'HIGH_PING_LATENCY': '📡🔴',
                    'HIGH_ERROR_RATE': '❌🔴',
                    'SERVICE_DOWN': '🚫🔴'
                };
                
                const emoji = alertEmojis[alert] || '🚨';
                return `${emoji} **${alert.replace(/_/g, ' ')}**`;
            }).join('\n');

            embed.addFields({
                name: '🚨 Alertes actives',
                value: alertsList,
                inline: false
            });
        }

        return embed;
    },

    /**
     * Formate la durée de fonctionnement
     */
    formatUptime(uptime) {
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}j ${hours % 24}h`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
};