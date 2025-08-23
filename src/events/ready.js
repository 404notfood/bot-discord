/**
 * Gestionnaire d'événement "ready" pour le bot Discord
 */

import { Events } from 'discord.js';
import * as Logger from '../utils/logger.js';
import scheduleTasks from './scheduleTasks.js';

/**
 * Gestionnaire d'événement ready
 * @type {Object}
 */
export default {
  name: Events.ClientReady,
  once: true, // Cet événement ne doit être déclenché qu'une seule fois

  /**
   * Fonction exécutée lorsque le client est prêt
   * @param {Client} client - Le client Discord
   */
  async execute(client) {
    // Journaliser la connexion réussie
    Logger.info(`Bot connecté en tant que ${client.user.tag}`);
    
    // Définir le statut du bot
    client.user.setPresence({
      status: 'online',
      activities: [
        {
          name: '/aide',
          type: 3 // "Watching"
        }
      ]
    });
    
    // Afficher quelques statistiques
    Logger.info(`Prêt à servir dans ${client.guilds.cache.size} serveurs`);
    Logger.info(`${client.commands.size} commandes chargées`);
    
    // Initialiser les tâches planifiées
    scheduleTasks(client);
  }
}; 