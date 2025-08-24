/**
 * @file system_health.js
 * @description Commande de vérification de santé système complète
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';
import fs from 'fs';
import { promisify } from 'util';

const stat = promisify(fs.stat);
const access = promisify(fs.access);

export default {
    data: new SlashCommandBuilder()
        .setName('health')
        .setDescription('Vérification complète de la santé du système')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    permissions: ['health.check'],
    category: 'admin',

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const healthCheck = await this.runHealthCheck(interaction.client);
            const embed = this.createHealthEmbed(healthCheck);

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'health');
        }
    },

    /**
     * Exécute tous les contrôles de santé
     */
    async runHealthCheck(client) {
        const checks = [];

        // 1. Vérification Discord
        checks.push(await this.checkDiscordConnection(client));

        // 2. Vérification base de données
        checks.push(await this.checkDatabase(client));

        // 3. Vérification système de fichiers
        checks.push(await this.checkFileSystem());

        // 4. Vérification mémoire
        checks.push(this.checkMemoryUsage());

        // 5. Vérification services
        checks.push(this.checkServices(client));

        // 6. Vérification sécurité
        checks.push(this.checkSecurity());

        const overallStatus = this.calculateOverallStatus(checks);

        return {
            status: overallStatus,
            timestamp: new Date(),
            checks
        };
    },

    /**
     * Vérification de la connexion Discord
     */
    async checkDiscordConnection(client) {
        const issues = [];
        let status = 'healthy';

        // Vérifier si le client est prêt
        if (!client.isReady()) {
            issues.push('Client Discord non prêt');
            status = 'unhealthy';
        }

        // Vérifier la latence
        const ping = client.ws.ping;
        if (ping > 500) {
            issues.push(`Latence élevée: ${ping}ms`);
            status = status === 'healthy' ? 'warning' : status;
        } else if (ping < 0) {
            issues.push('Latence non mesurable');
            status = 'warning';
        }

        // Vérifier les caches
        if (client.guilds.cache.size === 0) {
            issues.push('Aucun serveur en cache');
            status = 'warning';
        }

        return {
            name: 'Discord Connection',
            status,
            details: {
                ready: client.isReady(),
                ping: ping,
                guilds: client.guilds.cache.size,
                users: client.users.cache.size,
                uptime: process.uptime()
            },
            issues
        };
    },

    /**
     * Vérification de la base de données
     */
    async checkDatabase(client) {
        const issues = [];
        let status = 'healthy';

        const dbManager = client.databaseManager;

        if (!dbManager) {
            return {
                name: 'Database',
                status: 'unhealthy',
                details: { available: false },
                issues: ['DatabaseManager non initialisé']
            };
        }

        try {
            const isAvailable = dbManager.isAvailable();
            if (!isAvailable) {
                issues.push('Base de données non disponible');
                status = 'unhealthy';
            }

            const stats = dbManager.getStats();
            if (stats.errors > 0) {
                issues.push(`${stats.errors} erreurs détectées`);
                status = status === 'healthy' ? 'warning' : status;
            }

            // Test de connexion simple
            if (isAvailable) {
                await dbManager.query('SELECT 1 as test');
            }

            return {
                name: 'Database',
                status,
                details: {
                    available: isAvailable,
                    connected: dbManager.isConnected,
                    queries: stats.queries,
                    errors: stats.errors
                },
                issues
            };

        } catch (error) {
            return {
                name: 'Database',
                status: 'unhealthy',
                details: { error: error.message },
                issues: [`Erreur de connexion: ${error.message}`]
            };
        }
    },

    /**
     * Vérification du système de fichiers
     */
    async checkFileSystem() {
        const issues = [];
        let status = 'healthy';

        const criticalPaths = [
            'src/',
            'src/commands/',
            'src/events/',
            'src/utils/',
            'cache/',
            'logs/',
            '.env'
        ];

        for (const path of criticalPaths) {
            try {
                await access(path, fs.constants.F_OK);
            } catch (error) {
                if (path === '.env') {
                    issues.push('Fichier .env manquant');
                    status = 'warning';
                } else if (path === 'logs/' || path === 'cache/') {
                    // Ces dossiers peuvent ne pas exister, c'est normal
                    continue;
                } else {
                    issues.push(`Chemin critique manquant: ${path}`);
                    status = 'unhealthy';
                }
            }
        }

        // Vérifier les permissions d'écriture
        try {
            await access('logs/', fs.constants.W_OK);
        } catch (error) {
            issues.push('Permissions d\'écriture manquantes pour logs/');
            status = status === 'healthy' ? 'warning' : status;
        }

        return {
            name: 'File System',
            status,
            details: {
                workingDirectory: process.cwd(),
                pathsChecked: criticalPaths.length
            },
            issues
        };
    },

    /**
     * Vérification de l'utilisation mémoire
     */
    checkMemoryUsage() {
        const issues = [];
        let status = 'healthy';

        const memUsage = process.memoryUsage();
        const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
        const heapTotalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
        const rssMB = Math.round(memUsage.rss / 1024 / 1024);

        // Seuils d'alerte
        if (heapUsedMB > 1024) { // > 1GB
            issues.push(`Utilisation mémoire élevée: ${heapUsedMB}MB`);
            status = 'warning';
        }

        if (heapUsedMB > 2048) { // > 2GB
            status = 'unhealthy';
        }

        const heapUsagePercent = Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100);
        if (heapUsagePercent > 90) {
            issues.push(`Heap saturé à ${heapUsagePercent}%`);
            status = 'unhealthy';
        }

        return {
            name: 'Memory Usage',
            status,
            details: {
                heapUsed: `${heapUsedMB}MB`,
                heapTotal: `${heapTotalMB}MB`,
                rss: `${rssMB}MB`,
                external: `${Math.round(memUsage.external / 1024 / 1024)}MB`,
                heapUsagePercent: `${heapUsagePercent}%`
            },
            issues
        };
    },

    /**
     * Vérification des services
     */
    checkServices(client) {
        const issues = [];
        let status = 'healthy';

        const services = {
            studiService: client.studiService,
            documentationCacheService: client.documentationCacheService,
            monitoringService: client.monitoringService,
            performanceOptimizer: client.performanceOptimizer
        };

        const serviceStatuses = {};
        for (const [name, service] of Object.entries(services)) {
            serviceStatuses[name] = !!service;
            if (!service) {
                issues.push(`Service ${name} non initialisé`);
                status = status === 'healthy' ? 'warning' : status;
            }
        }

        // Vérifier les managers critiques
        const criticalManagers = {
            commandManager: client.commandManager,
            eventManager: client.eventManager,
            databaseManager: client.databaseManager,
            middlewareManager: client.middlewareManager
        };

        for (const [name, manager] of Object.entries(criticalManagers)) {
            if (!manager) {
                issues.push(`Manager critique ${name} manquant`);
                status = 'unhealthy';
            }
        }

        return {
            name: 'Services',
            status,
            details: {
                ...serviceStatuses,
                criticalManagersActive: Object.values(criticalManagers).every(m => !!m)
            },
            issues
        };
    },

    /**
     * Vérification de sécurité
     */
    checkSecurity() {
        const issues = [];
        let status = 'healthy';

        // Vérifier les variables d'environnement sensibles
        const sensitiveVars = ['BOT_TOKEN', 'DB_PASSWORD'];
        for (const varName of sensitiveVars) {
            if (process.env[varName] && (
                process.env[varName] === 'your_token_here' ||
                process.env[varName] === 'password' ||
                process.env[varName].length < 8
            )) {
                issues.push(`Variable ${varName} mal configurée`);
                status = 'warning';
            }
        }

        // Vérifier l'environnement
        if (process.env.NODE_ENV !== 'production') {
            issues.push('Environnement de développement détecté');
            status = status === 'healthy' ? 'warning' : status;
        }

        // Vérifier les permissions de fichiers (si sur Unix)
        if (process.platform !== 'win32') {
            try {
                const envStat = fs.statSync('.env');
                const permissions = (envStat.mode & parseInt('777', 8)).toString(8);
                if (permissions !== '600' && permissions !== '644') {
                    issues.push(`Permissions .env trop permissives: ${permissions}`);
                    status = status === 'healthy' ? 'warning' : status;
                }
            } catch (error) {
                // .env n'existe pas, déjà signalé dans checkFileSystem
            }
        }

        return {
            name: 'Security',
            status,
            details: {
                nodeEnv: process.env.NODE_ENV || 'undefined',
                platform: process.platform,
                hasToken: !!process.env.BOT_TOKEN
            },
            issues
        };
    },

    /**
     * Calcule le statut global
     */
    calculateOverallStatus(checks) {
        const statuses = checks.map(check => check.status);

        if (statuses.includes('unhealthy')) {
            return 'unhealthy';
        } else if (statuses.includes('warning')) {
            return 'warning';
        } else {
            return 'healthy';
        }
    },

    /**
     * Crée l'embed de santé
     */
    createHealthEmbed(healthCheck) {
        const statusColors = {
            'healthy': '#2ecc71',
            'warning': '#f39c12',
            'unhealthy': '#e74c3c'
        };

        const statusEmojis = {
            'healthy': '🟢',
            'warning': '🟡',
            'unhealthy': '🔴'
        };

        const embed = new EmbedBuilder()
            .setTitle('🏥 Santé du Système')
            .setColor(statusColors[healthCheck.status])
            .setTimestamp(healthCheck.timestamp);

        const overallEmoji = statusEmojis[healthCheck.status];
        embed.setDescription(`**Statut global:** ${overallEmoji} ${healthCheck.status.toUpperCase()}`);

        // Ajouter chaque vérification
        for (const check of healthCheck.checks) {
            const emoji = statusEmojis[check.status];
            let value = `${emoji} ${check.status.toUpperCase()}`;

            // Ajouter les détails importants
            if (check.name === 'Discord Connection') {
                value += `\nPing: ${check.details.ping}ms | Serveurs: ${check.details.guilds}`;
            } else if (check.name === 'Database') {
                value += `\nConnecté: ${check.details.connected ? 'Oui' : 'Non'}`;
                if (check.details.queries) value += ` | Requêtes: ${check.details.queries}`;
            } else if (check.name === 'Memory Usage') {
                value += `\nHeap: ${check.details.heapUsed}/${check.details.heapTotal}`;
            }

            // Ajouter les problèmes
            if (check.issues.length > 0) {
                value += `\n⚠️ ${check.issues.join(', ')}`;
            }

            embed.addFields({
                name: check.name,
                value: value.length > 1024 ? value.substring(0, 1021) + '...' : value,
                inline: true
            });
        }

        // Résumé
        const healthyCount = healthCheck.checks.filter(c => c.status === 'healthy').length;
        const warningCount = healthCheck.checks.filter(c => c.status === 'warning').length;
        const unhealthyCount = healthCheck.checks.filter(c => c.status === 'unhealthy').length;

        embed.setFooter({ 
            text: `✅ ${healthyCount} | ⚠️ ${warningCount} | ❌ ${unhealthyCount} • Santé système`
        });

        return embed;
    }
};