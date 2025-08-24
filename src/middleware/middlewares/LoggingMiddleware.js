/**
 * Middleware de logging des interactions
 */

import * as Logger from '../../utils/logger.js';

export class LoggingMiddleware {
    static name = 'logging';

    /**
     * Exécute le middleware de logging
     * @param {Object} context - Contexte de l'interaction
     * @returns {Promise<boolean>}
     */
    static async execute(context) {
        const { interaction } = context;
        
        // Logger les informations de base de l'interaction
        Logger.info('Interaction reçue', {
            type: interaction.type,
            commandName: interaction.commandName || 'N/A',
            userId: interaction.user.id,
            username: interaction.user.username,
            guildId: interaction.guild?.id || 'DM',
            guildName: interaction.guild?.name || 'Message privé',
            channelId: interaction.channelId,
            timestamp: new Date().toISOString()
        });

        // Stocker les infos dans le contexte pour les autres middlewares
        context.data.set('startTime', Date.now());
        context.data.set('userId', interaction.user.id);
        context.data.set('guildId', interaction.guild?.id);

        return true; // Continuer l'exécution
    }
}