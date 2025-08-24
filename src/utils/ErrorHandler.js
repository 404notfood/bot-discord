/**
 * Gestionnaire centralisé des erreurs
 */

import * as Logger from './logger.js';

export class ErrorHandler {
    /**
     * Types d'erreurs avec leurs configurations
     */
    static errorTypes = {
        COMMAND_ERROR: {
            name: 'CommandError',
            userMessage: ' Une erreur est survenue lors de l\'exécution de la commande.',
            logLevel: 'error'
        },
        VALIDATION_ERROR: {
            name: 'ValidationError',
            userMessage: ' Paramètres invalides.',
            logLevel: 'warn'
        },
        PERMISSION_ERROR: {
            name: 'PermissionError',
            userMessage: ' Vous n\'avez pas les permissions nécessaires.',
            logLevel: 'warn'
        },
        DATABASE_ERROR: {
            name: 'DatabaseError',
            userMessage: ' Erreur de base de données. Veuillez réessayer plus tard.',
            logLevel: 'error'
        },
        RATE_LIMIT_ERROR: {
            name: 'RateLimitError',
            userMessage: '⏱ Vous allez trop vite ! Patientez un peu.',
            logLevel: 'info'
        },
        NETWORK_ERROR: {
            name: 'NetworkError',
            userMessage: ' Problème de connexion. Réessayez dans quelques instants.',
            logLevel: 'error'
        },
        BOT_ERROR: {
            name: 'BotError',
            userMessage: ' Erreur interne du bot.',
            logLevel: 'error'
        }
    };

    /**
     * Statistiques des erreurs
     */
    static stats = {
        total: 0,
        byType: {},
        byCommand: {},
        byUser: {},
        lastError: null
    };

    /**
     * Gère une erreur et renvoie la réponse appropriée
     * @param {Error} error - L'erreur à traiter
     * @param {Object} context - Contexte de l'erreur
     * @returns {Object} Réponse formatée
     */
    static handle(error, context = {}) {
        // Mettre à jour les statistiques
        this.updateStats(error, context);

        // Déterminer le type d'erreur
        const errorType = this.determineErrorType(error);
        const errorConfig = this.errorTypes[errorType];

        // Logger l'erreur selon son niveau
        this.logError(error, errorConfig, context);

        // Retourner la réponse formatée
        return {
            type: errorType,
            userMessage: errorConfig.userMessage,
            shouldNotifyUser: this.shouldNotifyUser(errorType),
            isEphemeral: this.shouldBeEphemeral(errorType),
            logId: this.generateLogId()
        };
    }

    /**
     * Détermine le type d'erreur à partir de l'objet Error
     * @param {Error} error - L'erreur à analyser
     * @returns {string} Type d'erreur
     */
    static determineErrorType(error) {
        // Vérifier le type explicite défini sur l'erreur
        if (error.type && this.errorTypes[error.type]) {
            return error.type;
        }

        // Analyser le message d'erreur
        const message = error.message.toLowerCase();

        if (message.includes('permission') || message.includes('unauthorized')) {
            return 'PERMISSION_ERROR';
        }
        
        if (message.includes('validation') || message.includes('invalid')) {
            return 'VALIDATION_ERROR';
        }
        
        if (message.includes('database') || message.includes('sql')) {
            return 'DATABASE_ERROR';
        }
        
        if (message.includes('rate limit') || message.includes('too many')) {
            return 'RATE_LIMIT_ERROR';
        }
        
        if (message.includes('network') || message.includes('connection') || message.includes('timeout')) {
            return 'NETWORK_ERROR';
        }

        // Analyser le nom de l'erreur
        if (error.name === 'ValidationError') {
            return 'VALIDATION_ERROR';
        }

        // Par défaut, considérer comme une erreur de commande
        return 'COMMAND_ERROR';
    }

    /**
     * Met à jour les statistiques d'erreur
     * @param {Error} error - L'erreur
     * @param {Object} context - Contexte de l'erreur
     */
    static updateStats(error, context) {
        this.stats.total++;
        this.stats.lastError = {
            error: error.message,
            context,
            timestamp: new Date()
        };

        // Compter par type
        const errorType = this.determineErrorType(error);
        this.stats.byType[errorType] = (this.stats.byType[errorType] || 0) + 1;

        // Compter par commande
        if (context.commandName) {
            this.stats.byCommand[context.commandName] = 
                (this.stats.byCommand[context.commandName] || 0) + 1;
        }

        // Compter par utilisateur
        if (context.userId) {
            this.stats.byUser[context.userId] = 
                (this.stats.byUser[context.userId] || 0) + 1;
        }
    }

    /**
     * Logger l'erreur selon son niveau de gravité
     * @param {Error} error - L'erreur
     * @param {Object} errorConfig - Configuration du type d'erreur
     * @param {Object} context - Contexte de l'erreur
     */
    static logError(error, errorConfig, context) {
        const logData = {
            error: error.message,
            stack: error.stack,
            type: errorConfig.name,
            ...context,
            timestamp: new Date().toISOString()
        };

        switch (errorConfig.logLevel) {
            case 'error':
                Logger.error(`${errorConfig.name}: ${error.message}`, logData);
                break;
            case 'warn':
                Logger.warn(`${errorConfig.name}: ${error.message}`, logData);
                break;
            case 'info':
                Logger.info(`${errorConfig.name}: ${error.message}`, logData);
                break;
            default:
                Logger.debug(`${errorConfig.name}: ${error.message}`, logData);
        }
    }

    /**
     * Détermine si l'utilisateur doit être notifié de cette erreur
     * @param {string} errorType - Type d'erreur
     * @returns {boolean}
     */
    static shouldNotifyUser(errorType) {
        // Ne pas notifier pour certains types d'erreurs internes
        const silentErrors = [];
        return !silentErrors.includes(errorType);
    }

    /**
     * Détermine si le message d'erreur doit être éphémère
     * @param {string} errorType - Type d'erreur
     * @returns {boolean}
     */
    static shouldBeEphemeral(errorType) {
        // Les erreurs sensibles ou personnelles doivent être éphémères
        const ephemeralErrors = ['PERMISSION_ERROR', 'VALIDATION_ERROR', 'RATE_LIMIT_ERROR'];
        return ephemeralErrors.includes(errorType);
    }

    /**
     * Génère un ID unique pour cette erreur
     * @returns {string}
     */
    static generateLogId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Gère une erreur d'interaction Discord
     * @param {Error} error - L'erreur
     * @param {Interaction} interaction - L'interaction Discord
     * @param {string} commandName - Nom de la commande (optionnel)
     */
    static async handleInteractionError(error, interaction, commandName = null) {
        const context = {
            userId: interaction.user?.id,
            guildId: interaction.guild?.id,
            channelId: interaction.channelId,
            commandName: commandName || interaction.commandName,
            interactionType: interaction.type
        };

        const errorResponse = this.handle(error, context);

        // Envoyer une réponse à l'utilisateur si nécessaire
        if (errorResponse.shouldNotifyUser) {
            await this.sendErrorMessage(interaction, errorResponse);
        }

        return errorResponse;
    }

    /**
     * Envoie un message d'erreur à l'utilisateur
     * @param {Interaction} interaction - L'interaction Discord
     * @param {Object} errorResponse - Réponse d'erreur formatée
     */
    static async sendErrorMessage(interaction, errorResponse) {
        try {
            const content = errorResponse.userMessage;
            const options = { 
                content, 
                ephemeral: errorResponse.isEphemeral 
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.followUp(options);
            } else {
                await interaction.reply(options);
            }
        } catch (replyError) {
            Logger.error('Impossible d\'envoyer le message d\'erreur:', {
                originalError: errorResponse.userMessage,
                replyError: replyError.message
            });
        }
    }

    /**
     * Crée une erreur personnalisée avec un type spécifique
     * @param {string} type - Type d'erreur
     * @param {string} message - Message d'erreur
     * @param {Object} metadata - Métadonnées additionnelles
     * @returns {Error}
     */
    static createError(type, message, metadata = {}) {
        const error = new Error(message);
        error.type = type;
        error.metadata = metadata;
        return error;
    }

    /**
     * Récupère les statistiques d'erreur
     * @returns {Object}
     */
    static getStats() {
        return {
            ...this.stats,
            topErrorTypes: this.getTopErrorTypes(),
            topCommands: this.getTopErrorCommands(),
            errorRate: this.calculateErrorRate()
        };
    }

    /**
     * Récupère les types d'erreur les plus fréquents
     * @returns {Array}
     */
    static getTopErrorTypes() {
        return Object.entries(this.stats.byType)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([type, count]) => ({ type, count }));
    }

    /**
     * Récupère les commandes avec le plus d'erreurs
     * @returns {Array}
     */
    static getTopErrorCommands() {
        return Object.entries(this.stats.byCommand)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([command, count]) => ({ command, count }));
    }

    /**
     * Calcule le taux d'erreur approximatif
     * @returns {number}
     */
    static calculateErrorRate() {
        // Approximation basée sur les erreurs des dernières 24h
        // À implémenter plus précisément avec des métriques temporelles
        return this.stats.total;
    }

    /**
     * Réinitialise les statistiques
     */
    static resetStats() {
        this.stats = {
            total: 0,
            byType: {},
            byCommand: {},
            byUser: {},
            lastError: null
        };
    }
}