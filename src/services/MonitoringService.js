/**
 * Service de monitoring avancé pour le bot Discord
 */

import * as Logger from '../utils/logger.js';
import { EventEmitter } from 'events';

export class MonitoringService extends EventEmitter {
    /**
     * Initialise le service de monitoring
     * @param {Client} client - Client Discord
     * @param {DatabaseManager} databaseManager - Gestionnaire de base de données
     */
    constructor(client, databaseManager) {
        super();
        this.client = client;
        this.databaseManager = databaseManager;
        
        // Métriques en temps réel
        this.metrics = {
            // Performance
            uptime: 0,
            memoryUsage: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 },
            cpuUsage: 0,
            
            // Discord
            guilds: 0,
            users: 0,
            channels: 0,
            ping: 0,
            
            // Commandes
            commandsExecuted: 0,
            commandsPerMinute: 0,
            mostUsedCommands: new Map(),
            
            // Erreurs
            errors: 0,
            errorsPerMinute: 0,
            errorTypes: new Map(),
            
            // Base de données
            dbQueries: 0,
            dbQueriesPerMinute: 0,
            dbErrors: 0,
            dbConnectionStatus: 'unknown',
            
            // Services
            servicesStatus: new Map(),
            
            // Alertes
            activeAlerts: new Set()
        };
        
        // Historique des métriques (dernière heure)
        this.history = {
            commands: [],
            errors: [],
            memory: [],
            ping: []
        };
        
        // Seuils d'alerte
        this.thresholds = {
            memoryUsage: 1024 * 1024 * 1024, // 1GB
            pingLatency: 500, // 500ms
            errorRate: 10, // 10 erreurs/minute
            commandRate: 100 // 100 commandes/minute
        };
        
        this.isRunning = false;
        this.intervalId = null;
        this.startTime = Date.now();
    }

    /**
     * Démarre le monitoring
     */
    async start() {
        if (this.isRunning) return;
        
        Logger.info('📊 Démarrage du service de monitoring...');
        
        this.isRunning = true;
        this.startTime = Date.now();
        
        // Collecter les métriques toutes les 30 secondes
        this.intervalId = setInterval(() => {
            this.collectMetrics();
        }, 30000);
        
        // Nettoyer l'historique toutes les 5 minutes
        setInterval(() => {
            this.cleanHistory();
        }, 300000);
        
        // Vérifier les alertes toutes les minutes
        setInterval(() => {
            this.checkAlerts();
        }, 60000);
        
        // Collecter immédiatement
        this.collectMetrics();
        
        Logger.info('✅ Service de monitoring démarré');
    }

    /**
     * Collecte toutes les métriques
     */
    collectMetrics() {
        try {
            this.collectSystemMetrics();
            this.collectDiscordMetrics();
            this.collectServiceMetrics();
            this.updateHistory();
            
            // Émettre un événement pour les listeners externes
            this.emit('metricsUpdated', this.metrics);
            
        } catch (error) {
            Logger.error('Erreur lors de la collecte des métriques:', {
                error: error.message
            });
        }
    }

    /**
     * Collecte les métriques système
     */
    collectSystemMetrics() {
        // Uptime
        this.metrics.uptime = Date.now() - this.startTime;
        
        // Mémoire
        const memUsage = process.memoryUsage();
        this.metrics.memoryUsage = {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss
        };
        
        // CPU usage (approximation)
        const cpuUsage = process.cpuUsage();
        this.metrics.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // en secondes
    }

    /**
     * Collecte les métriques Discord
     */
    collectDiscordMetrics() {
        if (!this.client.isReady()) return;
        
        this.metrics.guilds = this.client.guilds.cache.size;
        this.metrics.users = this.client.users.cache.size;
        this.metrics.channels = this.client.channels.cache.size;
        this.metrics.ping = this.client.ws.ping;
    }

    /**
     * Collecte les métriques des services
     */
    collectServiceMetrics() {
        // Status des services
        this.metrics.servicesStatus.set('database', 
            this.databaseManager?.isAvailable() ? 'healthy' : 'unhealthy'
        );
        
        this.metrics.servicesStatus.set('studiService', 
            this.client.studiService ? 'healthy' : 'unhealthy'
        );
        
        this.metrics.servicesStatus.set('documentationCache', 
            this.client.documentationCacheService ? 'healthy' : 'unhealthy'
        );
        
        // Statistiques de la base de données
        if (this.databaseManager?.isAvailable()) {
            const dbStats = this.databaseManager.getStats();
            this.metrics.dbQueries = dbStats.queries;
            this.metrics.dbErrors = dbStats.errors;
            this.metrics.dbConnectionStatus = 'connected';
        } else {
            this.metrics.dbConnectionStatus = 'disconnected';
        }
    }

    /**
     * Met à jour l'historique des métriques
     */
    updateHistory() {
        const now = Date.now();
        const maxHistoryAge = 3600000; // 1 heure
        
        // Ajouter les nouvelles métriques
        this.history.memory.push({
            timestamp: now,
            value: this.metrics.memoryUsage.heapUsed
        });
        
        this.history.ping.push({
            timestamp: now,
            value: this.metrics.ping
        });
        
        // Nettoyer l'ancien historique
        Object.keys(this.history).forEach(key => {
            this.history[key] = this.history[key].filter(
                item => now - item.timestamp < maxHistoryAge
            );
        });
    }

    /**
     * Nettoie l'historique ancien
     */
    cleanHistory() {
        const now = Date.now();
        const maxAge = 3600000; // 1 heure
        
        Object.keys(this.history).forEach(key => {
            this.history[key] = this.history[key].filter(
                item => now - item.timestamp < maxAge
            );
        });
    }

    /**
     * Enregistre l'exécution d'une commande
     */
    recordCommand(commandName) {
        this.metrics.commandsExecuted++;
        
        // Compter les commandes les plus utilisées
        const current = this.metrics.mostUsedCommands.get(commandName) || 0;
        this.metrics.mostUsedCommands.set(commandName, current + 1);
        
        // Ajouter à l'historique
        this.history.commands.push({
            timestamp: Date.now(),
            command: commandName
        });
        
        // Calculer le taux par minute
        this.calculateCommandRate();
    }

    /**
     * Enregistre une erreur
     */
    recordError(errorType, errorMessage) {
        this.metrics.errors++;
        
        // Compter par type d'erreur
        const current = this.metrics.errorTypes.get(errorType) || 0;
        this.metrics.errorTypes.set(errorType, current + 1);
        
        // Ajouter à l'historique
        this.history.errors.push({
            timestamp: Date.now(),
            type: errorType,
            message: errorMessage
        });
        
        // Calculer le taux par minute
        this.calculateErrorRate();
    }

    /**
     * Calcule le taux de commandes par minute
     */
    calculateCommandRate() {
        const oneMinuteAgo = Date.now() - 60000;
        const recentCommands = this.history.commands.filter(
            cmd => cmd.timestamp > oneMinuteAgo
        );
        this.metrics.commandsPerMinute = recentCommands.length;
    }

    /**
     * Calcule le taux d'erreurs par minute
     */
    calculateErrorRate() {
        const oneMinuteAgo = Date.now() - 60000;
        const recentErrors = this.history.errors.filter(
            err => err.timestamp > oneMinuteAgo
        );
        this.metrics.errorsPerMinute = recentErrors.length;
    }

    /**
     * Vérifie les seuils d'alerte
     */
    checkAlerts() {
        const alerts = new Set();
        
        // Alerte mémoire
        if (this.metrics.memoryUsage.heapUsed > this.thresholds.memoryUsage) {
            alerts.add('HIGH_MEMORY_USAGE');
        }
        
        // Alerte ping
        if (this.metrics.ping > this.thresholds.pingLatency) {
            alerts.add('HIGH_PING_LATENCY');
        }
        
        // Alerte taux d'erreurs
        if (this.metrics.errorsPerMinute > this.thresholds.errorRate) {
            alerts.add('HIGH_ERROR_RATE');
        }
        
        // Alerte services indisponibles
        for (const [service, status] of this.metrics.servicesStatus) {
            if (status === 'unhealthy') {
                alerts.add(`SERVICE_DOWN_${service.toUpperCase()}`);
            }
        }
        
        // Déclencher les nouvelles alertes
        for (const alert of alerts) {
            if (!this.metrics.activeAlerts.has(alert)) {
                this.triggerAlert(alert);
            }
        }
        
        // Résoudre les alertes qui ne sont plus actives
        for (const alert of this.metrics.activeAlerts) {
            if (!alerts.has(alert)) {
                this.resolveAlert(alert);
            }
        }
        
        this.metrics.activeAlerts = alerts;
    }

    /**
     * Déclenche une alerte
     */
    triggerAlert(alertType) {
        Logger.warn(`🚨 Alerte déclenchée: ${alertType}`, {
            metrics: this.getAlertContext(alertType)
        });
        
        this.emit('alert', {
            type: alertType,
            timestamp: Date.now(),
            metrics: this.getAlertContext(alertType)
        });
    }

    /**
     * Résout une alerte
     */
    resolveAlert(alertType) {
        Logger.info(`✅ Alerte résolue: ${alertType}`);
        
        this.emit('alertResolved', {
            type: alertType,
            timestamp: Date.now()
        });
    }

    /**
     * Obtient le contexte pour une alerte
     */
    getAlertContext(alertType) {
        switch (alertType) {
            case 'HIGH_MEMORY_USAGE':
                return {
                    current: Math.round(this.metrics.memoryUsage.heapUsed / 1024 / 1024),
                    threshold: Math.round(this.thresholds.memoryUsage / 1024 / 1024),
                    unit: 'MB'
                };
            case 'HIGH_PING_LATENCY':
                return {
                    current: this.metrics.ping,
                    threshold: this.thresholds.pingLatency,
                    unit: 'ms'
                };
            case 'HIGH_ERROR_RATE':
                return {
                    current: this.metrics.errorsPerMinute,
                    threshold: this.thresholds.errorRate,
                    unit: 'errors/min'
                };
            default:
                return {};
        }
    }

    /**
     * Récupère un rapport de santé complet
     */
    getHealthReport() {
        return {
            status: this.getOverallStatus(),
            timestamp: Date.now(),
            metrics: { ...this.metrics },
            alerts: Array.from(this.metrics.activeAlerts),
            history: this.getHistorySummary()
        };
    }

    /**
     * Détermine le statut global
     */
    getOverallStatus() {
        if (this.metrics.activeAlerts.size > 0) {
            return 'warning';
        }
        
        const criticalServices = ['database'];
        for (const service of criticalServices) {
            if (this.metrics.servicesStatus.get(service) === 'unhealthy') {
                return 'unhealthy';
            }
        }
        
        return 'healthy';
    }

    /**
     * Résumé de l'historique
     */
    getHistorySummary() {
        return {
            commandsLast5Min: this.history.commands.filter(
                cmd => Date.now() - cmd.timestamp < 300000
            ).length,
            errorsLast5Min: this.history.errors.filter(
                err => Date.now() - err.timestamp < 300000
            ).length,
            averagePingLast5Min: this.calculateAveragePing(),
            peakMemoryLast5Min: this.calculatePeakMemory()
        };
    }

    /**
     * Calcule le ping moyen des 5 dernières minutes
     */
    calculateAveragePing() {
        const fiveMinutesAgo = Date.now() - 300000;
        const recentPings = this.history.ping.filter(
            p => p.timestamp > fiveMinutesAgo
        );
        
        if (recentPings.length === 0) return 0;
        
        const sum = recentPings.reduce((acc, p) => acc + p.value, 0);
        return Math.round(sum / recentPings.length);
    }

    /**
     * Calcule le pic de mémoire des 5 dernières minutes
     */
    calculatePeakMemory() {
        const fiveMinutesAgo = Date.now() - 300000;
        const recentMemory = this.history.memory.filter(
            m => m.timestamp > fiveMinutesAgo
        );
        
        if (recentMemory.length === 0) return 0;
        
        const peak = Math.max(...recentMemory.map(m => m.value));
        return Math.round(peak / 1024 / 1024); // en MB
    }

    /**
     * Arrêt du service
     */
    async stop() {
        if (!this.isRunning) return;
        
        Logger.info('🔽 Arrêt du service de monitoring...');
        
        this.isRunning = false;
        
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        
        Logger.info('✅ Service de monitoring arrêté');
    }
}