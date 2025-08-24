/**
 * Classe principale du bot Discord refactorisée
 */

import { Client } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import * as Logger from './utils/logger.js';
import { ErrorHandler } from './utils/ErrorHandler.js';

// Managers
import { CommandManager } from './managers/CommandManager.js';
import { EventManager } from './managers/EventManager.js';
import { DatabaseManager } from './managers/DatabaseManager.js';
import { PermissionManager } from './managers/PermissionManager.js';
import { MiddlewareManager } from './middleware/MiddlewareManager.js';

// Middlewares de base
import { LoggingMiddleware } from './middleware/middlewares/LoggingMiddleware.js';
import { RateLimitMiddleware } from './middleware/middlewares/RateLimitMiddleware.js';
import { ValidationMiddleware } from './middleware/middlewares/ValidationMiddleware.js';
import { PermissionMiddleware } from './middleware/middlewares/PermissionMiddleware.js';

// Autres services
import ReminderManager from './utils/reminderManager.js';
import ApiServer from './api/apiServer.js';
import { EnhancedStudiService } from './services/EnhancedStudiService.js';
import { DocumentationCacheService } from './services/DocumentationCacheService.js';
import { MonitoringService } from './services/MonitoringService.js';
import { PerformanceOptimizer } from './services/PerformanceOptimizer.js';
import initScheduledTasks from './events/scheduleTasks.js';

// Configuration ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DiscordBot {
    /**
     * Initialise une nouvelle instance du bot
     */
    constructor() {
        // Client Discord
        this.client = new Client({
            intents: config.intents,
            partials: config.partials
        });

        // Managers
        this.commandManager = new CommandManager(this.client);
        this.eventManager = new EventManager(this.client);
        this.databaseManager = new DatabaseManager();
        this.permissionManager = new PermissionManager(this.databaseManager);
        this.middlewareManager = new MiddlewareManager();

        // Services optionnels
        this.reminderManager = null;
        this.apiServer = null;
        this.studiService = null;
        this.scheduledTasksManager = null;
        this.documentationCacheService = null;
        this.monitoringService = null;
        this.performanceOptimizer = null;

        // État du bot
        this.isReady = false;
        this.startTime = null;
        this.shutdownInProgress = false;

        // Statistiques
        this.stats = {
            startTime: null,
            commandsExecuted: 0,
            errorsHandled: 0,
            uptime: 0
        };
    }

    /**
     * Initialise tous les composants du bot
     */
    async initialize() {
        try {
            Logger.info('🤖 Initialisation du bot Discord...');
            this.stats.startTime = new Date();

            // 1. Initialiser le logger
            Logger.init({ logLevel: config.logLevel });

            // 2. Initialiser la base de données
            await this.initializeDatabase();

            // 3. Initialiser le gestionnaire de permissions
            await this.initializePermissions();

            // 4. Configurer les middlewares
            this.configureMiddlewares();

            // 5. Charger les commandes et événements
            await this.loadCommands();
            await this.loadEvents();

            // 6. Configurer les gestionnaires d'événements personnalisés
            this.setupCustomEventHandlers();

            // 7. Initialiser les services spécialisés
            await this.initializeStudiService();
            await this.initializeDocumentationCache();
            await this.initializeMonitoring();

            Logger.info('✅ Initialisation terminée');
            return true;

        } catch (error) {
            Logger.fatal('💥 Erreur fatale lors de l\'initialisation:', {
                error: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    /**
     * Initialise la base de données
     */
    async initializeDatabase() {
        Logger.info('📊 Initialisation de la base de données...');
        
        const dbInitialized = await this.databaseManager.initialize();
        
        if (dbInitialized) {
            Logger.info('✅ Base de données connectée');
        } else {
            Logger.warn('⚠️  Mode limité: fonctionnement sans base de données');
        }
    }

    /**
     * Initialise le gestionnaire de permissions
     */
    async initializePermissions() {
        Logger.info('🔐 Initialisation des permissions...');
        
        const permissionsInitialized = await this.permissionManager.initialize();
        
        if (permissionsInitialized) {
            // Rendre le gestionnaire accessible au client
            this.client.permissionManager = this.permissionManager;
            Logger.info('✅ Gestionnaire de permissions initialisé');
        } else {
            Logger.warn('⚠️  Permissions en mode dégradé');
        }
    }

    /**
     * Initialise le service Studi
     */
    async initializeStudiService() {
        Logger.info('🛡️ Initialisation du service anti-Studi...');
        
        try {
            this.studiService = new EnhancedStudiService(this.databaseManager);
            const initialized = await this.studiService.initialize();
            
            if (initialized) {
                // Rendre le service accessible au client
                this.client.studiService = this.studiService;
                Logger.info('✅ Service anti-Studi initialisé');
            } else {
                Logger.warn('⚠️  Service Studi en mode dégradé');
            }

        } catch (error) {
            Logger.error('Erreur lors de l\'initialisation du service Studi:', {
                error: error.message
            });
        }
    }

    /**
     * Initialise le service de cache documentation
     */
    async initializeDocumentationCache() {
        Logger.info('📚 Initialisation du cache documentation...');
        
        try {
            this.documentationCacheService = new DocumentationCacheService(this.databaseManager);
            const initialized = await this.documentationCacheService.initialize();
            
            if (initialized) {
                // Rendre le service accessible au client
                this.client.documentationCacheService = this.documentationCacheService;
                Logger.info('✅ Cache documentation initialisé');
            } else {
                Logger.warn('⚠️  Cache documentation en mode dégradé');
            }

        } catch (error) {
            Logger.error('Erreur lors de l\'initialisation du cache documentation:', {
                error: error.message
            });
        }
    }

    /**
     * Initialise le service de monitoring
     */
    async initializeMonitoring() {
        Logger.info('📊 Initialisation du monitoring...');
        
        try {
            this.monitoringService = new MonitoringService(this.client, this.databaseManager);
            
            // Écouter les alertes
            this.monitoringService.on('alert', (alert) => {
                Logger.warn(`🚨 Alerte monitoring: ${alert.type}`, alert.metrics);
            });

            this.monitoringService.on('alertResolved', (alert) => {
                Logger.info(`✅ Alerte résolue: ${alert.type}`);
            });

            // Rendre le service accessible au client
            this.client.monitoringService = this.monitoringService;
            
            Logger.info('✅ Service de monitoring initialisé');

        } catch (error) {
            Logger.error('Erreur lors de l\'initialisation du monitoring:', {
                error: error.message
            });
        }
    }

    /**
     * Configure les middlewares par défaut
     */
    configureMiddlewares() {
        Logger.info('🔧 Configuration des middlewares...');
        
        // Ordre d'exécution important : plus petit priority = exécuté en premier
        this.middlewareManager.use(LoggingMiddleware, 10);        // Log d'abord
        this.middlewareManager.use(ValidationMiddleware, 20);     // Valider ensuite  
        this.middlewareManager.use(RateLimitMiddleware, 30);      // Rate limit après validation
        
        // Initialiser et ajouter le middleware de permissions
        PermissionMiddleware.initialize(this.permissionManager);
        this.middlewareManager.use(PermissionMiddleware, 40);     // Permissions en dernier

        Logger.info('✅ Middlewares configurés');
    }

    /**
     * Charge toutes les commandes
     */
    async loadCommands() {
        const commandsPath = path.join(__dirname, 'commands');
        const commandCount = await this.commandManager.loadCommands(commandsPath);
        
        if (commandCount === 0) {
            Logger.warn('⚠️  Aucune commande chargée');
        }
    }

    /**
     * Charge tous les événements
     */
    async loadEvents() {
        const eventsPath = path.join(__dirname, 'events');
        const eventCount = await this.eventManager.loadEvents(eventsPath);
        
        if (eventCount === 0) {
            Logger.warn('⚠️  Aucun événement chargé');
        }
    }

    /**
     * Configure les gestionnaires d'événements personnalisés
     */
    setupCustomEventHandlers() {
        // Gestionnaire d'interactions personnalisé avec middlewares
        this.client.on('interactionCreate', async (interaction) => {
            try {
                // Exécuter les middlewares
                const canProceed = await this.middlewareManager.execute(interaction, this.client);
                
                if (!canProceed) {
                    Logger.debug('Interaction bloquée par les middlewares');
                    return;
                }

                // Traiter l'interaction selon son type
                if (interaction.isChatInputCommand()) {
                    await this.handleSlashCommand(interaction);
                    
                    // Enregistrer la commande dans le monitoring
                    if (this.monitoringService) {
                        this.monitoringService.recordCommand(interaction.commandName);
                    }
                } else if (interaction.isButton()) {
                    await this.handleButtonInteraction(interaction);
                } else if (interaction.isSelectMenu()) {
                    await this.handleSelectMenuInteraction(interaction);
                } else if (interaction.isModalSubmit()) {
                    await this.handleModalSubmitInteraction(interaction);
                }

                this.stats.commandsExecuted++;

            } catch (error) {
                this.stats.errorsHandled++;
                
                // Enregistrer l'erreur dans le monitoring
                if (this.monitoringService) {
                    this.monitoringService.recordError('interaction_error', error.message);
                }
                
                await ErrorHandler.handleInteractionError(error, interaction);
            }
        });

        // Gestionnaire de ready personnalisé
        this.client.once('ready', async () => {
            this.isReady = true;
            this.startTime = new Date();
            
            Logger.info(`🚀 Bot connecté en tant que ${this.client.user.tag}`);
            Logger.info(`📊 ${this.client.guilds.cache.size} serveurs, ${this.client.users.cache.size} utilisateurs`);

            // Initialiser les services post-connexion
            await this.initializePostConnectionServices();

            // Démarrer le monitoring après l'initialisation complète
            if (this.monitoringService) {
                await this.monitoringService.start();
            }

            // Démarrer l'optimiseur de performance
            if (this.monitoringService) {
                this.performanceOptimizer = new PerformanceOptimizer(this.client, this.monitoringService);
                await this.performanceOptimizer.start();
            }
        });

        // Gestionnaire d'erreurs non capturées
        this.client.on('error', (error) => {
            Logger.error('Erreur Discord.js:', { error: error.message });
        });
    }

    /**
     * Initialise les services qui nécessitent une connexion Discord active
     */
    async initializePostConnectionServices() {
        try {
            // Gestionnaire de rappels
            if (this.databaseManager.isAvailable()) {
                Logger.info('⏰ Initialisation du gestionnaire de rappels...');
                this.reminderManager = new ReminderManager(this.client);
                await this.reminderManager.initialize();
            }

            // Serveur API
            Logger.info('🌐 Initialisation du serveur API...');
            this.apiServer = new ApiServer(this.client, this.reminderManager);
            this.apiServer.start();

            // Tâches planifiées
            Logger.info('⏱️ Initialisation des tâches planifiées...');
            this.scheduledTasksManager = initScheduledTasks(this.client);

            // Définir le statut du bot
            this.client.user.setPresence({
                status: 'online',
                activities: [{
                    name: '/aide',
                    type: 3 // "Watching"
                }]
            });

        } catch (error) {
            Logger.error('Erreur lors de l\'initialisation des services post-connexion:', {
                error: error.message
            });
        }
    }

    /**
     * Gère les commandes slash
     */
    async handleSlashCommand(interaction) {
        await this.commandManager.executeCommand(interaction);
    }

    /**
     * Gère les interactions de boutons
     */
    async handleButtonInteraction(interaction) {
        // À implémenter selon vos besoins
        Logger.debug('Interaction bouton reçue', { customId: interaction.customId });
        
        try {
            await interaction.reply({ 
                content: '🔘 Bouton cliqué !', 
                ephemeral: true 
            });
        } catch (error) {
            Logger.error('Erreur gestion bouton:', { error: error.message });
        }
    }

    /**
     * Gère les interactions de menus de sélection
     */
    async handleSelectMenuInteraction(interaction) {
        // À implémenter selon vos besoins
        Logger.debug('Interaction menu reçue', { 
            customId: interaction.customId,
            values: interaction.values 
        });
        
        try {
            await interaction.reply({ 
                content: `📋 Sélection: ${interaction.values.join(', ')}`, 
                ephemeral: true 
            });
        } catch (error) {
            Logger.error('Erreur gestion menu:', { error: error.message });
        }
    }

    /**
     * Gère les soumissions de modaux
     */
    async handleModalSubmitInteraction(interaction) {
        // À implémenter selon vos besoins
        Logger.debug('Modal soumis', { customId: interaction.customId });
        
        try {
            await interaction.reply({ 
                content: '📝 Modal traité !', 
                ephemeral: true 
            });
        } catch (error) {
            Logger.error('Erreur gestion modal:', { error: error.message });
        }
    }

    /**
     * Démarre le bot
     */
    async start() {
        try {
            // Initialiser tous les composants
            const initialized = await this.initialize();
            if (!initialized) {
                Logger.fatal('❌ Impossible d\'initialiser le bot');
                process.exit(1);
            }

            // Se connecter à Discord
            Logger.info('🔌 Connexion à Discord...');
            await this.client.login(config.token);

        } catch (error) {
            Logger.fatal('💥 Erreur fatale lors du démarrage:', {
                error: error.message,
                stack: error.stack
            });
            process.exit(1);
        }
    }

    /**
     * Arrête proprement le bot
     */
    async shutdown(reason = 'Arrêt demandé') {
        if (this.shutdownInProgress) {
            Logger.warn('Arrêt déjà en cours...');
            return;
        }

        this.shutdownInProgress = true;
        Logger.info(`🛑 Arrêt du bot: ${reason}`);

        try {
            // Arrêter le serveur API
            if (this.apiServer) {
                Logger.info('🌐 Arrêt du serveur API...');
                this.apiServer.stop();
            }

            // Arrêter le gestionnaire de rappels
            if (this.reminderManager) {
                Logger.info('⏰ Arrêt du gestionnaire de rappels...');
                // Assuming reminderManager has a shutdown method
                if (this.reminderManager.shutdown) {
                    await this.reminderManager.shutdown();
                }
            }

            // Arrêter le service Studi
            if (this.studiService) {
                Logger.info('🛡️ Arrêt du service anti-Studi...');
                await this.studiService.shutdown();
            }

            // Arrêter le cache documentation
            if (this.documentationCacheService) {
                Logger.info('📚 Arrêt du cache documentation...');
                await this.documentationCacheService.shutdown();
            }

            // Arrêter l'optimiseur de performance
            if (this.performanceOptimizer) {
                Logger.info('⚡ Arrêt de l\'optimiseur de performance...');
                await this.performanceOptimizer.stop();
            }

            // Arrêter le monitoring
            if (this.monitoringService) {
                Logger.info('📊 Arrêt du monitoring...');
                await this.monitoringService.stop();
            }

            // Fermer la connexion base de données
            if (this.databaseManager) {
                Logger.info('📊 Fermeture de la base de données...');
                await this.databaseManager.close();
            }

            // Nettoyer les événements
            if (this.eventManager) {
                Logger.info('🗃️  Nettoyage des événements...');
                this.eventManager.cleanup();
            }

            // Déconnecter le client Discord
            if (this.client) {
                Logger.info('🔌 Déconnexion de Discord...');
                this.client.destroy();
            }

            Logger.info('✅ Arrêt terminé proprement');

        } catch (error) {
            Logger.error('❌ Erreur lors de l\'arrêt:', {
                error: error.message
            });
        }
    }

    /**
     * Récupère les statistiques du bot
     */
    getStats() {
        const now = Date.now();
        const uptime = this.startTime ? now - this.startTime.getTime() : 0;

        return {
            // Stats générales
            isReady: this.isReady,
            uptime,
            uptimeFormatted: this.formatUptime(uptime),
            startTime: this.stats.startTime,
            
            // Stats de performance  
            commandsExecuted: this.stats.commandsExecuted,
            errorsHandled: this.stats.errorsHandled,
            
            // Stats Discord
            guilds: this.client.guilds.cache.size,
            users: this.client.users.cache.size,
            channels: this.client.channels.cache.size,
            
            // Stats des managers
            commands: this.commandManager.getStats(),
            events: this.eventManager.getStats(),
            database: this.databaseManager.getStats(),
            permissions: this.permissionManager.getStats(),
            middlewares: this.middlewareManager.getStats(),
            errors: ErrorHandler.getStats(),
            studi: this.studiService ? this.studiService.getStats() : null,
            documentationCache: this.documentationCacheService ? this.documentationCacheService.getStats() : null,
            monitoring: this.monitoringService ? this.monitoringService.getHealthReport() : null,
            performance: this.performanceOptimizer ? this.performanceOptimizer.getStats() : null
        };
    }

    /**
     * Formate le temps de fonctionnement
     */
    formatUptime(uptime) {
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days}j ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Récupère l'état de santé du bot
     */
    async getHealth() {
        return {
            status: this.isReady ? 'healthy' : 'starting',
            uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
            database: await this.databaseManager.getHealth(),
            discord: {
                connected: this.client.isReady(),
                ping: this.client.ws.ping,
                guilds: this.client.guilds.cache.size
            },
            services: {
                reminderManager: !!this.reminderManager,
                apiServer: !!this.apiServer,
                studiService: !!this.studiService,
                documentationCacheService: !!this.documentationCacheService,
                monitoringService: !!this.monitoringService,
                performanceOptimizer: !!this.performanceOptimizer
            }
        };
    }
}