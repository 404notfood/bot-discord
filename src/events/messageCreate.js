/**
 * Gestionnaire d'événement messageCreate pour le système anti-Studi
 */

import { EmbedBuilder } from 'discord.js';
import { EnhancedStudiService } from '../services/EnhancedStudiService.js';
import * as Logger from '../utils/logger.js';

/**
 * Classe de gestion de l'événement messageCreate
 */
export class MessageCreateEvent {
    /**
     * Constructeur de l'événement
     */
    constructor() {
        this.name = 'messageCreate';
        this.once = false;
    }

    /**
     * Exécute la logique de l'événement
     * @param {Object} message - Le message Discord
     * @param {Object} client - Le client Discord
     */
    async execute(message, client) {
        // Ignorer les messages des bots
        if (message.author.bot) return;

        // Accéder au service Studi depuis le client
        const studiService = client.studiService;
        if (!studiService) {
            Logger.warn('Service Studi non disponible');
            return;
        }

        try {
            // Traiter le message avec le service amélioré
            await studiService.processMessage(message);

        } catch (error) {
            Logger.error('Erreur lors du traitement du message par le service Studi:', {
                error: error.message,
                stack: error.stack,
                userId: message.author.id,
                messageId: message.id,
                guildId: message.guild?.id
            });
        }
    }
}

export default new MessageCreateEvent(); 