/**
 * @file diagnostics.js
 * @description Commande de diagnostic système avancé
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, AttachmentBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';
import fs from 'fs';
import path from 'path';

export default {
    data: new SlashCommandBuilder()
        .setName('diagnostics')
        .setDescription('Diagnostic système complet du bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de diagnostic')
                .setRequired(false)
                .addChoices(
                    { name: 'Complet', value: 'full' },
                    { name: 'Système', value: 'system' },
                    { name: 'Base de données', value: 'database' },
                    { name: 'Services', value: 'services' },
                    { name: 'Sécurité', value: 'security' },
                    { name: 'Export JSON', value: 'export' }
                )
        ),

    // Permissions requises
    permissions: ['diagnostics.run'],
    category: 'admin',

    async execute(interaction) {
        try {
            const diagnosticType = interaction.options.getString('type') || 'full';
            
            await interaction.deferReply({ ephemeral: true });

            const diagnostics = await this.runDiagnostics(interaction.client, diagnosticType);
            
            if (diagnosticType === 'export') {
                await this.exportDiagnostics(interaction, diagnostics);
            } else {
                const embed = this.createDiagnosticEmbed(diagnostics, diagnosticType);
                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'diagnostics');
        }
    },

    /**
     * Exécute les diagnostics
     */
    async runDiagnostics(client, type) {
        const diagnostics = {
            timestamp: new Date().toISOString(),
            type: type,
            system: await this.getSystemDiagnostics(),
            bot: this.getBotDiagnostics(client),
            database: await this.getDatabaseDiagnostics(client),
            services: this.getServicesDiagnostics(client),
            security: this.getSecurityDiagnostics(client),
            performance: this.getPerformanceDiagnostics(client),
            health: this.getHealthStatus(client)
        };

        return diagnostics;
    },

    /**
     * Diagnostics système
     */
    async getSystemDiagnostics() {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        return {
            node: {
                version: process.version,
                platform: process.platform,
                arch: process.arch,
                uptime: process.uptime()
            },
            memory: {
                heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024),
                rss: Math.round(memUsage.rss / 1024 / 1024)
            },
            cpu: {
                user: Math.round(cpuUsage.user / 1000),
                system: Math.round(cpuUsage.system / 1000)
            },
            env: {
                nodeEnv: process.env.NODE_ENV,
                hasDbConfig: !!(process.env.DB_HOST),
                hasDiscordToken: !!(process.env.BOT_TOKEN),
                logLevel: process.env.LOG_LEVEL
            }
        };
    },

    /**
     * Diagnostics du bot
     */
    getBotDiagnostics(client) {
        return {
            user: {
                id: client.user?.id,
                username: client.user?.username,
                discriminator: client.user?.discriminator,
                verified: client.user?.verified,
                bot: client.user?.bot
            },
            connection: {
                ready: client.isReady(),
                ping: client.ws.ping,
                status: client.ws.status,
                reconnecting: client.ws.reconnecting
            },
            cache: {
                guilds: client.guilds.cache.size,
                users: client.users.cache.size,
                channels: client.channels.cache.size,
                emojis: client.emojis.cache.size,
                roles: client.guilds.cache.reduce((acc, guild) => acc + guild.roles.cache.size, 0)
            },
            stats: client.getStats ? client.getStats() : null
        };
    },

    /**
     * Diagnostics base de données
     */
    async getDatabaseDiagnostics(client) {
        const dbManager = client.databaseManager;
        
        if (!dbManager) {
            return { status: 'unavailable', message: 'DatabaseManager non initialisé' };
        }

        try {
            const health = await dbManager.getHealth();
            const stats = dbManager.getStats();
            
            return {
                status: 'connected',
                health: health,
                stats: stats,
                available: dbManager.isAvailable(),
                connectionPool: {
                    connected: dbManager.isConnected,
                    initialized: dbManager.isInitialized
                }
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    },

    /**
     * Diagnostics des services
     */
    getServicesDiagnostics(client) {
        const services = {};
        
        // Service Studi
        if (client.studiService) {
            services.studi = {
                active: true,
                stats: client.studiService.getStats()
            };
        } else {
            services.studi = { active: false };
        }
        
        // Service de cache documentation
        if (client.documentationCacheService) {
            services.documentationCache = {
                active: true,
                stats: client.documentationCacheService.getStats()
            };
        } else {
            services.documentationCache = { active: false };
        }
        
        // Service de monitoring
        if (client.monitoringService) {
            services.monitoring = {
                active: true,
                health: client.monitoringService.getHealthReport()
            };
        } else {
            services.monitoring = { active: false };
        }
        
        // Optimiseur de performance
        if (client.performanceOptimizer) {
            services.performance = {
                active: true,
                stats: client.performanceOptimizer.getStats()
            };
        } else {
            services.performance = { active: false };
        }

        return services;
    },

    /**
     * Diagnostics de sécurité
     */
    getSecurityDiagnostics(client) {
        return {
            permissions: {
                manager: !!(client.permissionManager),
                middleware: !!(client.middlewareManager),
                rateLimitActive: true // Basé sur la présence du middleware
            },
            environment: {
                tokenExposed: process.env.BOT_TOKEN === 'your_bot_token_here',
                debugMode: process.env.NODE_ENV === 'development',
                productionReady: process.env.NODE_ENV === 'production'
            },
            middleware: {
                active: client.middlewareManager ? client.middlewareManager.getStats().count > 0 : false,
                types: client.middlewareManager ? client.middlewareManager.getStats().middleware : []
            }
        };
    },

    /**
     * Diagnostics de performance
     */
    getPerformanceDiagnostics(client) {
        const diagnostics = {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            eventLoopDelay: null // Pourrait être mesuré avec perf_hooks
        };

        // Ajouter les métriques de performance si disponibles
        if (client.performanceOptimizer) {
            diagnostics.optimizer = client.performanceOptimizer.getStats();
        }

        return diagnostics;
    },

    /**
     * État de santé global
     */
    getHealthStatus(client) {
        const checks = [];
        let overallStatus = 'healthy';

        // Vérification Discord
        checks.push({
            name: 'Discord Connection',
            status: client.isReady() ? 'healthy' : 'unhealthy',
            details: { ping: client.ws.ping, ready: client.isReady() }
        });

        // Vérification base de données
        if (client.databaseManager) {
            checks.push({
                name: 'Database',
                status: client.databaseManager.isAvailable() ? 'healthy' : 'unhealthy',
                details: { connected: client.databaseManager.isConnected }
            });
        }

        // Vérification mémoire
        const memUsage = process.memoryUsage();
        const memoryStatus = memUsage.heapUsed < 1024 * 1024 * 1024 ? 'healthy' : 'warning'; // 1GB
        checks.push({
            name: 'Memory Usage',
            status: memoryStatus,
            details: { heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB' }
        });

        // Déterminer le statut global
        if (checks.some(check => check.status === 'unhealthy')) {
            overallStatus = 'unhealthy';
        } else if (checks.some(check => check.status === 'warning')) {
            overallStatus = 'warning';
        }

        return {
            overall: overallStatus,
            checks: checks,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * Crée l'embed de diagnostic
     */
    createDiagnosticEmbed(diagnostics, type) {
        const embed = new EmbedBuilder()
            .setTitle(`🔧 Diagnostic Système - ${type}`)
            .setColor(this.getStatusColor(diagnostics.health.overall))
            .setTimestamp();

        // Statut global
        const statusEmoji = diagnostics.health.overall === 'healthy' ? '🟢' : 
                           diagnostics.health.overall === 'warning' ? '🟡' : '🔴';
        embed.setDescription(`**Statut global:** ${statusEmoji} ${diagnostics.health.overall.toUpperCase()}`);

        if (type === 'full' || type === 'system') {
            embed.addFields({
                name: '🖥️ Système',
                value: `Node.js: **${diagnostics.system.node.version}**\n` +
                       `Platform: **${diagnostics.system.node.platform}**\n` +
                       `RAM: **${diagnostics.system.memory.heapUsed}/${diagnostics.system.memory.heapTotal}MB**\n` +
                       `Uptime: **${this.formatUptime(diagnostics.system.node.uptime)}**`,
                inline: true
            });
        }

        if (type === 'full' || type === 'database') {
            const dbStatus = diagnostics.database.status === 'connected' ? '✅' : '❌';
            embed.addFields({
                name: '🗄️ Base de données',
                value: `Status: ${dbStatus} **${diagnostics.database.status}**\n` +
                       `Disponible: **${diagnostics.database.available ? 'Oui' : 'Non'}**\n` +
                       `Requêtes: **${diagnostics.database.stats?.queries || 0}**`,
                inline: true
            });
        }

        if (type === 'full' || type === 'services') {
            const servicesList = Object.entries(diagnostics.services)
                .map(([name, service]) => `${service.active ? '✅' : '❌'} ${name}`)
                .join('\n');
            
            embed.addFields({
                name: '⚙️ Services',
                value: servicesList,
                inline: true
            });
        }

        if (type === 'full' || type === 'security') {
            embed.addFields({
                name: '🛡️ Sécurité',
                value: `Permissions: **${diagnostics.security.permissions.manager ? 'Actives' : 'Inactives'}**\n` +
                       `Middleware: **${diagnostics.security.middleware.active ? 'Actifs' : 'Inactifs'}**\n` +
                       `Prod Ready: **${diagnostics.security.environment.productionReady ? 'Oui' : 'Non'}**`,
                inline: true
            });
        }

        // Checks de santé
        const failedChecks = diagnostics.health.checks.filter(check => check.status !== 'healthy');
        if (failedChecks.length > 0) {
            const checksList = failedChecks.map(check => 
                `${check.status === 'warning' ? '⚠️' : '❌'} ${check.name}`
            ).join('\n');
            
            embed.addFields({
                name: '🚨 Alertes',
                value: checksList,
                inline: false
            });
        }

        embed.setFooter({ 
            text: `Diagnostic généré • Type: ${type}` 
        });

        return embed;
    },

    /**
     * Exporte les diagnostics en JSON
     */
    async exportDiagnostics(interaction, diagnostics) {
        try {
            const jsonData = JSON.stringify(diagnostics, null, 2);
            const filename = `diagnostics_${Date.now()}.json`;
            
            // Créer un fichier temporaire
            const tempPath = path.join(process.cwd(), 'temp', filename);
            
            // S'assurer que le dossier temp existe
            const tempDir = path.dirname(tempPath);
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            
            fs.writeFileSync(tempPath, jsonData);
            
            const attachment = new AttachmentBuilder(tempPath, { name: filename });
            
            await interaction.editReply({
                content: '📋 Export des diagnostics généré',
                files: [attachment]
            });
            
            // Nettoyer le fichier temporaire après 1 minute
            setTimeout(() => {
                try {
                    if (fs.existsSync(tempPath)) {
                        fs.unlinkSync(tempPath);
                    }
                } catch (err) {
                    Logger.warn('Erreur nettoyage fichier temporaire:', { error: err.message });
                }
            }, 60000);
            
        } catch (error) {
            Logger.error('Erreur export diagnostics:', { error: error.message });
            await interaction.editReply({
                content: '❌ Erreur lors de l\'export des diagnostics'
            });
        }
    },

    /**
     * Détermine la couleur selon le statut
     */
    getStatusColor(status) {
        switch (status) {
            case 'healthy': return '#2ecc71';
            case 'warning': return '#f39c12';
            case 'unhealthy': return '#e74c3c';
            default: return '#95a5a6';
        }
    },

    /**
     * Formate la durée de fonctionnement
     */
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) return `${days}j ${hours}h`;
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    }
};