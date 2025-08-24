/**
 * Middleware de limitation du taux de requêtes (rate limiting)
 */

import * as Logger from '../../utils/logger.js';

export class RateLimitMiddleware {
    static name = 'rateLimit';
    static userLimits = new Map();
    static globalLimits = new Map();

    // Configuration par défaut
    static config = {
        userLimit: 10,          // 10 commandes par utilisateur
        userWindow: 60000,      // Par minute (60 secondes)
        globalLimit: 100,       // 100 commandes total
        globalWindow: 60000,    // Par minute
        enabled: true
    };

    /**
     * Configure les limites de rate limiting
     * @param {Object} newConfig - Nouvelle configuration
     */
    static configure(newConfig) {
        this.config = { ...this.config, ...newConfig };
        Logger.info('RateLimitMiddleware configuré:', this.config);
    }

    /**
     * Exécute le middleware de rate limiting
     * @param {Object} context - Contexte de l'interaction
     * @returns {Promise<boolean>}
     */
    static async execute(context) {
        if (!this.config.enabled) {
            return true;
        }

        const { interaction } = context;
        const userId = interaction.user.id;
        const now = Date.now();

        // Vérifier le rate limiting global
        if (this.isGlobalLimitExceeded(now)) {
            Logger.warn('Rate limit global dépassé');
            await this.sendRateLimitMessage(interaction, 'global');
            return false;
        }

        // Vérifier le rate limiting par utilisateur
        if (this.isUserLimitExceeded(userId, now)) {
            Logger.warn('Rate limit utilisateur dépassé', { userId });
            await this.sendRateLimitMessage(interaction, 'user');
            return false;
        }

        // Enregistrer cette interaction
        this.recordInteraction(userId, now);

        return true;
    }

    /**
     * Vérifie si la limite globale est dépassée
     * @param {number} now - Timestamp actuel
     * @returns {boolean}
     */
    static isGlobalLimitExceeded(now) {
        this.cleanupOldEntries(this.globalLimits, now, this.config.globalWindow);
        
        const globalCount = Array.from(this.globalLimits.values())
            .reduce((sum, timestamps) => sum + timestamps.length, 0);

        return globalCount >= this.config.globalLimit;
    }

    /**
     * Vérifie si la limite utilisateur est dépassée
     * @param {string} userId - ID de l'utilisateur
     * @param {number} now - Timestamp actuel
     * @returns {boolean}
     */
    static isUserLimitExceeded(userId, now) {
        if (!this.userLimits.has(userId)) {
            return false;
        }

        const userTimestamps = this.userLimits.get(userId);
        this.cleanupOldTimestamps(userTimestamps, now, this.config.userWindow);

        return userTimestamps.length >= this.config.userLimit;
    }

    /**
     * Enregistre une interaction
     * @param {string} userId - ID de l'utilisateur
     * @param {number} timestamp - Timestamp de l'interaction
     */
    static recordInteraction(userId, timestamp) {
        // Enregistrer pour l'utilisateur
        if (!this.userLimits.has(userId)) {
            this.userLimits.set(userId, []);
        }
        this.userLimits.get(userId).push(timestamp);

        // Enregistrer globalement
        if (!this.globalLimits.has(userId)) {
            this.globalLimits.set(userId, []);
        }
        this.globalLimits.get(userId).push(timestamp);
    }

    /**
     * Nettoie les entrées anciennes d'une Map
     * @param {Map} limitsMap - Map à nettoyer
     * @param {number} now - Timestamp actuel
     * @param {number} window - Fenêtre de temps
     */
    static cleanupOldEntries(limitsMap, now, window) {
        for (const [userId, timestamps] of limitsMap.entries()) {
            this.cleanupOldTimestamps(timestamps, now, window);
            if (timestamps.length === 0) {
                limitsMap.delete(userId);
            }
        }
    }

    /**
     * Nettoie les timestamps anciens d'un tableau
     * @param {Array} timestamps - Tableau de timestamps
     * @param {number} now - Timestamp actuel
     * @param {number} window - Fenêtre de temps
     */
    static cleanupOldTimestamps(timestamps, now, window) {
        const cutoff = now - window;
        const validIndex = timestamps.findIndex(timestamp => timestamp > cutoff);
        
        if (validIndex > 0) {
            timestamps.splice(0, validIndex);
        } else if (validIndex === -1) {
            timestamps.length = 0;
        }
    }

    /**
     * Envoie un message de rate limiting à l'utilisateur
     * @param {Interaction} interaction - Interaction Discord
     * @param {string} type - Type de limite ('user' ou 'global')
     */
    static async sendRateLimitMessage(interaction, type) {
        const messages = {
            user: '⏱️ Vous envoyez trop de commandes ! Veuillez patienter avant de réessayer.',
            global: '⏱️ Le bot reçoit trop de commandes actuellement. Veuillez réessayer dans quelques instants.'
        };

        const message = messages[type] || messages.user;

        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: message, ephemeral: true });
            } else {
                await interaction.reply({ content: message, ephemeral: true });
            }
        } catch (error) {
            Logger.error('Erreur envoi message rate limit:', { error: error.message });
        }
    }

    /**
     * Récupère les statistiques de rate limiting
     * @returns {Object}
     */
    static getStats() {
        const now = Date.now();
        
        // Nettoyer avant de compter
        this.cleanupOldEntries(this.userLimits, now, this.config.userWindow);
        this.cleanupOldEntries(this.globalLimits, now, this.config.globalWindow);

        const totalUsers = this.userLimits.size;
        const totalInteractions = Array.from(this.userLimits.values())
            .reduce((sum, timestamps) => sum + timestamps.length, 0);

        return {
            config: this.config,
            activeUsers: totalUsers,
            totalInteractions,
            averagePerUser: totalUsers > 0 ? Math.round(totalInteractions / totalUsers) : 0
        };
    }

    /**
     * Réinitialise toutes les limites
     */
    static reset() {
        this.userLimits.clear();
        this.globalLimits.clear();
        Logger.info('Rate limits réinitialisés');
    }
}