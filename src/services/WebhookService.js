/**
 * Service de webhooks pour envoyer des données en temps réel au dashboard PHP
 */

// Utiliser fetch natif de Node.js 18+
import * as Logger from '../utils/logger.js';

export class WebhookService {
    constructor() {
        this.dashboardUrl = process.env.DASHBOARD_WEBHOOK_URL || 'http://localhost/api/discord-webhook';
        this.webhookSecret = process.env.WEBHOOK_SECRET || 'default-secret';
        this.enabled = process.env.WEBHOOKS_ENABLED === 'true';
        
        if (!this.enabled) {
            Logger.info('Webhooks désactivés via configuration');
        }
    }

    /**
     * Envoyer un événement au dashboard
     */
    async sendEvent(eventType, data) {
        if (!this.enabled) {
            return;
        }

        try {
            const payload = {
                type: eventType,
                timestamp: new Date().toISOString(),
                data: data,
                bot_id: process.env.CLIENT_ID
            };

            const response = await fetch(this.dashboardUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TaureauCeltique-Bot/4.2.a',
                    'X-Webhook-Secret': this.webhookSecret
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                Logger.warn(`Webhook failed: ${response.status} ${response.statusText}`);
            }

        } catch (error) {
            Logger.error('Erreur envoi webhook:', {
                error: error.message,
                eventType,
                dashboardUrl: this.dashboardUrl
            });
        }
    }

    /**
     * Notifier l'utilisation d'une commande
     */
    async notifyCommandUsed(interaction, success = true, responseTime = null) {
        await this.sendEvent('command_used', {
            command_name: interaction.commandName,
            user_id: interaction.user.id,
            user_name: interaction.user.username,
            guild_id: interaction.guild?.id,
            channel_id: interaction.channel?.id,
            success: success,
            response_time: responseTime,
            options: interaction.options?.data || []
        });
    }

    /**
     * Notifier un changement de statut du bot
     */
    async notifyStatusChange(status, details = {}) {
        await this.sendEvent('bot_status_change', {
            status: status,
            uptime: process.uptime(),
            memory_usage: process.memoryUsage(),
            ...details
        });
    }

    /**
     * Notifier qu'un utilisateur a rejoint
     */
    async notifyUserJoined(member) {
        await this.sendEvent('user_joined', {
            user_id: member.user.id,
            user_name: member.user.username,
            guild_id: member.guild.id,
            joined_at: member.joinedAt?.toISOString()
        });
    }

    /**
     * Notifier qu'un utilisateur a quitté
     */
    async notifyUserLeft(member) {
        await this.sendEvent('user_left', {
            user_id: member.user.id,
            user_name: member.user.username,
            guild_id: member.guild.id,
            left_at: new Date().toISOString()
        });
    }

    /**
     * Notifier une action de modération
     */
    async notifyModerationAction(action, target, moderator, reason = null) {
        await this.sendEvent('moderation_action', {
            action: action,
            target_user_id: target.id,
            target_user_name: target.username,
            moderator_user_id: moderator.id,
            moderator_user_name: moderator.username,
            reason: reason,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Notifier une erreur critique
     */
    async notifyError(error, context = {}) {
        await this.sendEvent('error', {
            message: error.message,
            stack: error.stack,
            context: context,
            severity: 'critical'
        });
    }

    /**
     * Envoyer les métriques système
     */
    async sendSystemMetrics() {
        if (!this.enabled) {
            return;
        }

        const metrics = {
            memory: process.memoryUsage(),
            uptime: process.uptime(),
            cpu_usage: process.cpuUsage(),
            version: process.version,
            platform: process.platform,
            arch: process.arch
        };

        await this.sendEvent('system_metrics', metrics);
    }

    /**
     * Envoyer les statistiques Discord
     */
    async sendDiscordStats(client) {
        if (!this.enabled || !client.isReady()) {
            return;
        }

        const stats = {
            guilds_count: client.guilds.cache.size,
            users_count: client.users.cache.size,
            channels_count: client.channels.cache.size,
            commands_count: client.commands ? client.commands.size : 0,
            latency: client.ws.ping,
            status: client.user.presence?.status || 'online'
        };

        await this.sendEvent('discord_stats', stats);
    }

    /**
     * Démarrer l'envoi périodique de métriques
     */
    startPeriodicMetrics(client) {
        if (!this.enabled) {
            return;
        }

        // Envoyer les métriques toutes les 30 secondes
        setInterval(async () => {
            try {
                await this.sendSystemMetrics();
                await this.sendDiscordStats(client);
            } catch (error) {
                Logger.error('Erreur envoi métriques périodiques:', {
                    error: error.message
                });
            }
        }, 30000);

        Logger.info('Webhooks de métriques périodiques démarrés (30s)');
    }

    /**
     * Notifier le démarrage du bot
     */
    async notifyBotStarted(client) {
        await this.notifyStatusChange('started', {
            bot_name: client.user?.username,
            bot_id: client.user?.id,
            guilds: client.guilds.cache.size,
            version: '4.2.a'
        });
        
        Logger.info('Notification de démarrage envoyée au dashboard');
    }

    /**
     * Notifier l'arrêt du bot
     */
    async notifyBotStopped() {
        await this.notifyStatusChange('stopped', {
            shutdown_time: new Date().toISOString()
        });
        
        Logger.info('Notification d\'arrêt envoyée au dashboard');
    }
}

// Instance singleton
let webhookInstance = null;

export function getWebhookService() {
    if (!webhookInstance) {
        webhookInstance = new WebhookService();
    }
    return webhookInstance;
}