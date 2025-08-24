/**
 * Gestionnaire centralisé des événements Discord
 */

import fs from 'fs';
import path from 'path';
import * as Logger from '../utils/logger.js';

export class EventManager {
    /**
     * Initialise le gestionnaire d'événements
     * @param {Client} client - Client Discord
     */
    constructor(client) {
        this.client = client;
        this.events = new Map();
        this.eventListeners = new Map();
    }

    /**
     * Charge tous les événements depuis le répertoire events
     * @param {string} eventsPath - Chemin vers le dossier des événements
     */
    async loadEvents(eventsPath) {
        try {
            if (!fs.existsSync(eventsPath)) {
                Logger.warn('Répertoire events introuvable:', { path: eventsPath });
                return 0;
            }

            const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
            let loadedEvents = 0;

            for (const file of eventFiles) {
                try {
                    const eventLoaded = await this.loadEvent(eventsPath, file);
                    if (eventLoaded) {
                        loadedEvents++;
                    }
                } catch (error) {
                    Logger.error(`Erreur lors du chargement de l'événement ${file}:`, { 
                        error: error.message 
                    });
                }
            }

            Logger.info(`EventManager: ${loadedEvents} événements chargés`);
            return loadedEvents;
        } catch (error) {
            Logger.error('Erreur lors du chargement des événements:', { error: error.message });
            throw error;
        }
    }

    /**
     * Charge un événement spécifique
     * @param {string} eventsPath - Chemin du dossier events
     * @param {string} fileName - Nom du fichier d'événement
     * @returns {boolean} True si l'événement a été chargé
     */
    async loadEvent(eventsPath, fileName) {
        const filePath = path.join(eventsPath, fileName);
        
        try {
            const eventModule = await import(`file://${filePath}`);
            const event = eventModule.default;

            if (!this.validateEvent(event, fileName)) {
                return false;
            }

            // Enregistrer l'événement
            this.registerEvent(event, filePath);
            
            Logger.debug(`Événement chargé: ${event.name}`, { 
                file: fileName,
                once: event.once || false 
            });

            return true;
        } catch (error) {
            Logger.error(`Erreur lors du chargement de l'événement ${fileName}:`, { 
                error: error.message,
                stack: error.stack
            });
            return false;
        }
    }

    /**
     * Valide qu'un événement a le format requis
     * @param {Object} event - Objet événement
     * @param {string} fileName - Nom du fichier
     * @returns {boolean}
     */
    validateEvent(event, fileName) {
        if (!event) {
            Logger.warn(`Événement ${fileName}: export par défaut manquant`);
            return false;
        }

        if (!event.name) {
            Logger.warn(`Événement ${fileName}: propriété 'name' manquante`);
            return false;
        }

        if (!event.execute || typeof event.execute !== 'function') {
            Logger.warn(`Événement ${fileName}: méthode 'execute' manquante ou invalide`);
            return false;
        }

        return true;
    }

    /**
     * Enregistre un événement auprès du client Discord
     * @param {Object} event - Objet événement
     * @param {string} filePath - Chemin du fichier
     */
    registerEvent(event, filePath) {
        // Wrapper pour gérer les erreurs et les logs
        const eventHandler = async (...args) => {
            try {
                await this.executeEvent(event, ...args);
            } catch (error) {
                Logger.error(`Erreur dans l'événement ${event.name}:`, {
                    error: error.message,
                    stack: error.stack,
                    eventName: event.name
                });
            }
        };

        // Enregistrer auprès du client Discord
        if (event.once) {
            this.client.once(event.name, eventHandler);
        } else {
            this.client.on(event.name, eventHandler);
        }

        // Stocker les métadonnées de l'événement
        this.events.set(event.name, {
            ...event,
            filePath,
            registeredAt: new Date(),
            executionCount: 0,
            lastExecuted: null,
            errors: 0
        });

        // Stocker la référence du listener pour pouvoir le supprimer plus tard
        this.eventListeners.set(event.name, eventHandler);
    }

    /**
     * Exécute un événement avec logging et métriques
     * @param {Object} event - Objet événement
     * @param {...any} args - Arguments de l'événement
     */
    async executeEvent(event, ...args) {
        const startTime = Date.now();
        
        try {
            // Logger l'exécution (seulement pour les événements importants)
            if (this.shouldLogEvent(event.name)) {
                Logger.debug(`Exécution événement: ${event.name}`, {
                    eventName: event.name
                });
            }

            // Exécuter l'événement
            await event.execute(...args, this.client);

            // Mettre à jour les métadonnées
            const eventData = this.events.get(event.name);
            if (eventData) {
                eventData.executionCount++;
                eventData.lastExecuted = new Date();
                eventData.lastExecutionTime = Date.now() - startTime;
            }

        } catch (error) {
            // Mettre à jour le compteur d'erreurs
            const eventData = this.events.get(event.name);
            if (eventData) {
                eventData.errors++;
            }

            throw error; // Re-lancer pour que le wrapper puisse logger
        }
    }

    /**
     * Détermine si un événement doit être loggé
     * @param {string} eventName - Nom de l'événement
     * @returns {boolean}
     */
    shouldLogEvent(eventName) {
        // Ne pas logger les événements très fréquents
        const noisyEvents = ['messageCreate', 'typingStart', 'presenceUpdate'];
        return !noisyEvents.includes(eventName);
    }

    /**
     * Désenregistre un événement
     * @param {string} eventName - Nom de l'événement
     * @returns {boolean} True si l'événement a été désenregistré
     */
    unregisterEvent(eventName) {
        const listener = this.eventListeners.get(eventName);
        const eventData = this.events.get(eventName);

        if (listener && eventData) {
            this.client.removeListener(eventName, listener);
            this.eventListeners.delete(eventName);
            this.events.delete(eventName);
            
            Logger.info(`Événement désenregistré: ${eventName}`);
            return true;
        }

        return false;
    }

    /**
     * Recharge un événement
     * @param {string} eventName - Nom de l'événement
     * @param {string} eventsPath - Chemin du dossier events
     */
    async reloadEvent(eventName, eventsPath) {
        const eventData = this.events.get(eventName);
        
        if (!eventData) {
            Logger.warn(`Événement ${eventName} introuvable pour rechargement`);
            return false;
        }

        // Désenregistrer l'ancien événement
        this.unregisterEvent(eventName);

        // Recharger depuis le fichier
        const fileName = path.basename(eventData.filePath);
        const reloaded = await this.loadEvent(eventsPath, fileName);

        if (reloaded) {
            Logger.info(`Événement rechargé: ${eventName}`);
        } else {
            Logger.error(`Échec du rechargement de l'événement: ${eventName}`);
        }

        return reloaded;
    }

    /**
     * Récupère les informations d'un événement
     * @param {string} eventName - Nom de l'événement
     * @returns {Object|null}
     */
    getEventInfo(eventName) {
        return this.events.get(eventName) || null;
    }

    /**
     * Récupère la liste de tous les événements
     * @returns {Array}
     */
    getAllEvents() {
        return Array.from(this.events.keys());
    }

    /**
     * Récupère les statistiques des événements
     * @returns {Object}
     */
    getStats() {
        const events = Array.from(this.events.values());
        
        return {
            totalEvents: this.events.size,
            totalExecutions: events.reduce((sum, event) => sum + event.executionCount, 0),
            totalErrors: events.reduce((sum, event) => sum + event.errors, 0),
            mostExecuted: this.getMostExecutedEvent(),
            mostErrors: this.getMostErrorEvent()
        };
    }

    /**
     * Récupère l'événement le plus exécuté
     * @returns {Object|null}
     */
    getMostExecutedEvent() {
        let mostExecuted = null;
        let maxExecutions = 0;

        for (const [name, data] of this.events.entries()) {
            if (data.executionCount > maxExecutions) {
                maxExecutions = data.executionCount;
                mostExecuted = { name, executions: maxExecutions };
            }
        }

        return mostExecuted;
    }

    /**
     * Récupère l'événement avec le plus d'erreurs
     * @returns {Object|null}
     */
    getMostErrorEvent() {
        let mostErrors = null;
        let maxErrors = 0;

        for (const [name, data] of this.events.entries()) {
            if (data.errors > maxErrors) {
                maxErrors = data.errors;
                mostErrors = { name, errors: maxErrors };
            }
        }

        return mostErrors;
    }

    /**
     * Nettoie les événements en mémoire
     */
    cleanup() {
        // Désenregistrer tous les événements
        for (const eventName of this.events.keys()) {
            this.unregisterEvent(eventName);
        }

        Logger.info('EventManager: Nettoyage terminé');
    }
}