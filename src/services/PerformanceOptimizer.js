/**
 * Service d'optimisation automatique des performances
 */

import * as Logger from '../utils/logger.js';

export class PerformanceOptimizer {
    /**
     * Initialise l'optimiseur de performance
     * @param {Client} client - Client Discord
     * @param {MonitoringService} monitoringService - Service de monitoring
     */
    constructor(client, monitoringService) {
        this.client = client;
        this.monitoringService = monitoringService;
        
        this.isRunning = false;
        this.optimizationIntervalId = null;
        
        // Configuration des optimisations
        this.config = {
            // Seuils pour déclencher les optimisations
            memoryThreshold: 500 * 1024 * 1024, // 500MB
            cacheCleanupInterval: 300000, // 5 minutes
            garbageCollectionThreshold: 750 * 1024 * 1024, // 750MB
            
            // Tailles de cache optimales
            maxCacheSize: 1000,
            maxHistorySize: 100,
            
            // Limites de connexion
            maxIdleConnections: 5,
            connectionTimeout: 30000
        };
        
        this.stats = {
            optimizationsRun: 0,
            memoryFreed: 0,
            cachesCleaned: 0,
            lastOptimization: null
        };
    }

    /**
     * Démarre l'optimiseur
     */
    async start() {
        if (this.isRunning) return;
        
        Logger.info('⚡ Démarrage de l\'optimiseur de performance...');
        
        this.isRunning = true;
        
        // Écouter les alertes du monitoring
        if (this.monitoringService) {
            this.monitoringService.on('alert', (alert) => {
                this.handleAlert(alert);
            });
        }
        
        // Optimisations périodiques
        this.optimizationIntervalId = setInterval(() => {
            this.runPeriodicOptimizations();
        }, this.config.cacheCleanupInterval);
        
        Logger.info('✅ Optimiseur de performance démarré');
    }

    /**
     * Gère les alertes du monitoring
     */
    async handleAlert(alert) {
        Logger.info(`⚡ Optimisation déclenchée par alerte: ${alert.type}`);
        
        switch (alert.type) {
            case 'HIGH_MEMORY_USAGE':
                await this.optimizeMemory();
                break;
            case 'HIGH_ERROR_RATE':
                await this.optimizeErrorHandling();
                break;
            case 'HIGH_PING_LATENCY':
                await this.optimizeNetwork();
                break;
        }
    }

    /**
     * Exécute les optimisations périodiques
     */
    async runPeriodicOptimizations() {
        try {
            Logger.debug('Exécution des optimisations périodiques...');
            
            await this.cleanupCaches();
            await this.optimizeMemory();
            await this.optimizeDiscordCaches();
            
            this.stats.optimizationsRun++;
            this.stats.lastOptimization = new Date();
            
        } catch (error) {
            Logger.error('Erreur lors de l\'optimisation périodique:', {
                error: error.message
            });
        }
    }

    /**
     * Optimise l'utilisation mémoire
     */
    async optimizeMemory() {
        const memUsage = process.memoryUsage();
        const heapUsed = memUsage.heapUsed;
        
        if (heapUsed > this.config.memoryThreshold) {
            Logger.info('🧹 Optimisation mémoire déclenchée', {
                heapUsed: Math.round(heapUsed / 1024 / 1024) + 'MB'
            });
            
            const beforeGC = heapUsed;
            
            // Nettoyer les caches applicatifs
            await this.cleanupApplicationCaches();
            
            // Forcer le garbage collection si disponible
            if (global.gc) {
                global.gc();
            }
            
            const afterMemUsage = process.memoryUsage();
            const memoryFreed = beforeGC - afterMemUsage.heapUsed;
            
            this.stats.memoryFreed += memoryFreed;
            
            Logger.info('✅ Optimisation mémoire terminée', {
                freed: Math.round(memoryFreed / 1024 / 1024) + 'MB',
                newUsage: Math.round(afterMemUsage.heapUsed / 1024 / 1024) + 'MB'
            });
        }
    }

    /**
     * Nettoie les caches applicatifs
     */
    async cleanupApplicationCaches() {
        // Nettoyer le cache de documentation
        if (this.client.documentationCacheService) {
            await this.optimizeDocumentationCache();
        }
        
        // Nettoyer les historiques du monitoring
        if (this.client.monitoringService) {
            this.optimizeMonitoringHistory();
        }
        
        // Nettoyer les caches des services
        await this.optimizeServiceCaches();
    }

    /**
     * Optimise le cache de documentation
     */
    async optimizeDocumentationCache() {
        try {
            const cacheService = this.client.documentationCacheService;
            
            // Limiter la taille des caches en mémoire
            if (cacheService.languagesCache.size > this.config.maxCacheSize) {
                Logger.info('🧹 Nettoyage du cache des langages...');
                const excess = cacheService.languagesCache.size - this.config.maxCacheSize;
                const entries = Array.from(cacheService.languagesCache.entries());
                
                // Supprimer les entrées les plus anciennes
                for (let i = 0; i < excess; i++) {
                    cacheService.languagesCache.delete(entries[i][0]);
                }
            }
            
            if (cacheService.resourcesCache.size > this.config.maxCacheSize) {
                Logger.info('🧹 Nettoyage du cache des ressources...');
                const excess = cacheService.resourcesCache.size - this.config.maxCacheSize;
                const entries = Array.from(cacheService.resourcesCache.entries());
                
                // Supprimer les entrées les plus anciennes
                for (let i = 0; i < excess; i++) {
                    cacheService.resourcesCache.delete(entries[i][0]);
                }
            }
            
        } catch (error) {
            Logger.error('Erreur optimisation cache documentation:', {
                error: error.message
            });
        }
    }

    /**
     * Optimise l'historique du monitoring
     */
    optimizeMonitoringHistory() {
        try {
            const monitoring = this.client.monitoringService;
            
            Object.keys(monitoring.history).forEach(key => {
                if (monitoring.history[key].length > this.config.maxHistorySize) {
                    const excess = monitoring.history[key].length - this.config.maxHistorySize;
                    monitoring.history[key].splice(0, excess);
                }
            });
            
            Logger.debug('Historique monitoring optimisé');
            
        } catch (error) {
            Logger.error('Erreur optimisation historique monitoring:', {
                error: error.message
            });
        }
    }

    /**
     * Optimise les caches des services
     */
    async optimizeServiceCaches() {
        try {
            // Nettoyer les caches du service Studi
            if (this.client.studiService) {
                await this.optimizeStudiCache();
            }
            
            // Nettoyer les caches des managers
            this.optimizeManagerCaches();
            
        } catch (error) {
            Logger.error('Erreur optimisation caches services:', {
                error: error.message
            });
        }
    }

    /**
     * Optimise le cache du service Studi
     */
    async optimizeStudiCache() {
        try {
            const studiService = this.client.studiService;
            
            // Limiter la taille du cache des offenseurs
            if (studiService.offendersCache && studiService.offendersCache.size > this.config.maxCacheSize) {
                Logger.info('🧹 Nettoyage du cache Studi offenseurs...');
                const excess = studiService.offendersCache.size - this.config.maxCacheSize;
                const entries = Array.from(studiService.offendersCache.entries());
                
                // Supprimer les entrées les plus anciennes
                for (let i = 0; i < excess; i++) {
                    studiService.offendersCache.delete(entries[i][0]);
                }
            }
            
        } catch (error) {
            Logger.error('Erreur optimisation cache Studi:', {
                error: error.message
            });
        }
    }

    /**
     * Optimise les caches des managers
     */
    optimizeManagerCaches() {
        try {
            // Nettoyer les statistiques des managers si elles deviennent trop grandes
            const managers = [
                this.client.commandManager,
                this.client.eventManager,
                this.client.databaseManager,
                this.client.permissionManager
            ];
            
            managers.forEach(manager => {
                if (manager && manager.stats) {
                    // Réinitialiser les compteurs si ils deviennent trop grands
                    if (manager.stats.queries > 1000000) {
                        manager.stats.queries = 0;
                        Logger.debug(`Compteur requêtes réinitialisé pour ${manager.constructor.name}`);
                    }
                }
            });
            
        } catch (error) {
            Logger.error('Erreur optimisation managers:', {
                error: error.message
            });
        }
    }

    /**
     * Nettoie les caches génériques
     */
    async cleanupCaches() {
        try {
            this.stats.cachesCleaned++;
            Logger.debug('Nettoyage des caches génériques...');
            
            // Ici on peut ajouter d'autres nettoyages de cache
            
        } catch (error) {
            Logger.error('Erreur nettoyage caches:', {
                error: error.message
            });
        }
    }

    /**
     * Optimise les caches Discord.js
     */
    async optimizeDiscordCaches() {
        try {
            // Nettoyer les caches Discord.js si ils deviennent trop grands
            const maxCacheSize = 10000;
            
            if (this.client.users.cache.size > maxCacheSize) {
                Logger.info('🧹 Nettoyage du cache utilisateurs Discord...');
                const excess = this.client.users.cache.size - maxCacheSize;
                const users = Array.from(this.client.users.cache.values());
                
                // Supprimer les utilisateurs les moins actifs
                for (let i = 0; i < excess; i++) {
                    this.client.users.cache.delete(users[i].id);
                }
            }
            
        } catch (error) {
            Logger.error('Erreur optimisation caches Discord:', {
                error: error.message
            });
        }
    }

    /**
     * Optimise la gestion des erreurs
     */
    async optimizeErrorHandling() {
        Logger.info('⚡ Optimisation de la gestion des erreurs...');
        
        try {
            // Ici on peut implémenter des optimisations spécifiques aux erreurs
            // Par exemple, augmenter temporairement les timeouts, etc.
            
        } catch (error) {
            Logger.error('Erreur optimisation gestion erreurs:', {
                error: error.message
            });
        }
    }

    /**
     * Optimise le réseau
     */
    async optimizeNetwork() {
        Logger.info('⚡ Optimisation réseau...');
        
        try {
            // Ici on peut implémenter des optimisations réseau
            // Par exemple, ajuster les pools de connexion
            
        } catch (error) {
            Logger.error('Erreur optimisation réseau:', {
                error: error.message
            });
        }
    }

    /**
     * Récupère les statistiques d'optimisation
     */
    getStats() {
        return {
            ...this.stats,
            isRunning: this.isRunning,
            config: this.config
        };
    }

    /**
     * Arrêt de l'optimiseur
     */
    async stop() {
        if (!this.isRunning) return;
        
        Logger.info('🔽 Arrêt de l\'optimiseur de performance...');
        
        this.isRunning = false;
        
        if (this.optimizationIntervalId) {
            clearInterval(this.optimizationIntervalId);
            this.optimizationIntervalId = null;
        }
        
        Logger.info('✅ Optimiseur de performance arrêté');
    }
}