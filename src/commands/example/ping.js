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
      await interaction.reply('Pong!');
      
      Logger.debug('Commande ping exécutée', {
        userId: interaction.user.id,
        guildId: interaction.guild?.id
      });
    } catch (error) {
      Logger.error('Erreur lors de l\'exécution de la commande ping', {
        error: error.message
      });
      
      // Ne pas essayer de répondre si une réponse a déjà été envoyée
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Une erreur est survenue.', ephemeral: true });
      }
    }
  }
}; 