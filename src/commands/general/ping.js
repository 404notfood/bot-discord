/**
 * @file ping.js
 * @description Commande ping pour tester la latence du bot
 */

import { SlashCommandBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Répond avec Pong!'),
  
  async execute(interaction) {
    try {
      // Calculer la latence
      const latency = Date.now() - interaction.createdTimestamp;
      
      // La réponse est déjà différée par le gestionnaire d'événements
      await interaction.editReply(`Pong! Latence: ${latency}ms`);
      
      Logger.debug('Commande ping exécutée', {
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
        latency
      });
    } catch (error) {
      Logger.error('Erreur lors de l\'exécution de la commande ping', {
        error: error.message
      });
      
      // L'interaction est déjà différée à ce stade
      try {
        await interaction.editReply({ content: 'Une erreur est survenue.' });
      } catch (editError) {
        Logger.error('Impossible de modifier la réponse', {
          error: editError.message
        });
      }
    }
  }
}; 