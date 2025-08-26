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
  
  permissions: ['bot.admin'],
  category: 'admin',
  
  async execute(interaction) {
    try {
      // Calculer la latence
      const latency = Date.now() - interaction.createdTimestamp;
      
      // Répondre directement à l'interaction
      await interaction.reply(`Pong! Latence: ${latency}ms`);
      
      Logger.debug('Commande ping exécutée', {
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
        latency
      });
    } catch (error) {
      Logger.error('Erreur lors de l\'exécution de la commande ping', {
        error: error.message
      });
      
      // Gérer l'erreur de réponse
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'Une erreur est survenue.', ephemeral: true });
        } else {
          await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
        }
      } catch (replyError) {
        Logger.error('Impossible de répondre à l\'interaction', {
          error: replyError.message
        });
      }
    }
  }
}; 