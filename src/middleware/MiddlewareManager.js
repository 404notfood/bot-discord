/**
 * Gestionnaire de middleware pour les interactions Discord
 */

import * as Logger from '../utils/logger.js';

export class MiddlewareManager {
    /**
     * Initialise le gestionnaire de middleware
     */
    constructor() {
        this.middlewares = [];
        this.stats = {
            executed: 0,
            blocked: 0,
            errors: 0
        };
    }

    /**
     * Ajoute un middleware à la stack
     * @param {Function|Object} middleware - Fonction middleware ou objet avec méthode execute
     * @param {number} priority - Priorité (plus petit = exécuté en premier)
     */
    use(middleware, priority = 100) {
        const middlewareObj = {
            execute: typeof middleware === 'function' ? middleware : middleware.execute,
            name: middleware.name || `middleware_${Date.now()}`,
            priority: priority,
            stats: {
                executed: 0,
                blocked: 0,
                errors: 0,
                totalTime: 0
            }
        };

        // Valider le middleware
        if (typeof middlewareObj.execute !== 'function') {
            throw new Error(`Middleware ${middlewareObj.name}: fonction execute manquante`);
        }

        // Insérer selon la priorité
        const insertIndex = this.middlewares.findIndex(m => m.priority > priority);
        if (insertIndex === -1) {
            this.middlewares.push(middlewareObj);
        } else {
            this.middlewares.splice(insertIndex, 0, middlewareObj);
        }

        Logger.debug(`Middleware ajouté: ${middlewareObj.name}`, { 
            priority,
            totalMiddlewares: this.middlewares.length 
        });
    }

    /**
     * Exécute tous les middlewares pour une interaction
     * @param {Interaction} interaction - Interaction Discord
     * @param {Client} client - Client Discord
     * @returns {Promise<boolean>} True si l'interaction peut continuer
     */
    async execute(interaction, client) {
        const context = {
            interaction,
            client,
            data: new Map(),
            blocked: false,
            blockReason: null
        };

        for (const middleware of this.middlewares) {
            if (context.blocked) {
                break;
            }

            const startTime = Date.now();
            
            try {
                this.stats.executed++;
                middleware.stats.executed++;

                // Exécuter le middleware
                const result = await middleware.execute(context);
                
                const duration = Date.now() - startTime;
                middleware.stats.totalTime += duration;

                // Si le middleware retourne false, bloquer l'exécution
                if (result === false) {
                    context.blocked = true;
                    context.blockReason = `Bloqué par middleware: ${middleware.name}`;
                    
                    this.stats.blocked++;
                    middleware.stats.blocked++;
                    
                    Logger.debug(`Interaction bloquée par middleware: ${middleware.name}`, {
                        userId: interaction.user?.id,
                        commandName: interaction.commandName,
                        reason: context.blockReason
                    });
                    
                    break;
                }

            } catch (error) {
                const duration = Date.now() - startTime;
                middleware.stats.totalTime += duration;
                middleware.stats.errors++;
                this.stats.errors++;

                Logger.error(`Erreur dans middleware ${middleware.name}:`, {
                    error: error.message,
                    userId: interaction.user?.id,
                    commandName: interaction.commandName,
                    duration
                });

                // En cas d'erreur, on peut choisir de continuer ou bloquer
                // Par défaut, on continue sauf si le middleware lève une erreur critique
                if (error.critical) {
                    context.blocked = true;
                    context.blockReason = `Erreur critique dans ${middleware.name}: ${error.message}`;
                    break;
                }
            }
        }

        return !context.blocked;
    }

    /**
     * Supprime un middleware par son nom
     * @param {string} name - Nom du middleware
     * @returns {boolean} True si supprimé
     */
    remove(name) {
        const index = this.middlewares.findIndex(m => m.name === name);
        if (index !== -1) {
            this.middlewares.splice(index, 1);
            Logger.debug(`Middleware supprimé: ${name}`);
            return true;
        }
        return false;
    }

    /**
     * Récupère un middleware par son nom
     * @param {string} name - Nom du middleware
     * @returns {Object|null}
     */
    get(name) {
        return this.middlewares.find(m => m.name === name) || null;
    }

    /**
     * Liste tous les middlewares
     * @returns {Array}
     */
    list() {
        return this.middlewares.map(m => ({
            name: m.name,
            priority: m.priority,
            stats: m.stats
        }));
    }

    /**
     * Réinitialise les statistiques
     */
    resetStats() {
        this.stats = { executed: 0, blocked: 0, errors: 0 };
        this.middlewares.forEach(m => {
            m.stats = { executed: 0, blocked: 0, errors: 0, totalTime: 0 };
        });
    }

    /**
     * Récupère les statistiques globales
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            totalMiddlewares: this.middlewares.length,
            middlewares: this.middlewares.map(m => ({
                name: m.name,
                priority: m.priority,
                stats: m.stats,
                averageTime: m.stats.executed > 0 ? 
                    Math.round(m.stats.totalTime / m.stats.executed) : 0
            }))
        };
    }
}