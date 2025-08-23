/**
 * @file stats.js
 * @description Commande pour afficher les statistiques du bot
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import os from 'os';

export default {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Affiche les statistiques du bot'),
  
  async execute(interaction) {
    try {
      const client = interaction.client;
      
      // Statistiques de base
      const uptime = this.formatUptime(client.uptime);
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      const totalMemory = os.totalmem() / 1024 / 1024 / 1024;
      const freeMemory = os.freemem() / 1024 / 1024 / 1024;
      
      // Statistiques Discord
      const totalGuilds = client.guilds.cache.size;
      const totalChannels = client.channels.cache.size;
      const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
      
      // Créer l'embed
      const embed = new EmbedBuilder()
        .setTitle('📊 Statistiques du Bot')
        .setColor(0x2ecc71)
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: '⏱️ Uptime', value: uptime, inline: false },
          { name: '🖥️ Serveurs', value: `${totalGuilds}`, inline: true },
          { name: '📝 Salons', value: `${totalChannels}`, inline: true },
          { name: '👥 Utilisateurs', value: `${totalUsers}`, inline: true },
          { name: '🔄 Latence API', value: `${Math.round(client.ws.ping)}ms`, inline: true },
          { name: '💾 Mémoire utilisée', value: `${Math.round(memoryUsage * 100) / 100} MB`, inline: true },
          { name: '💻 Système', value: `${os.type()} ${os.release()}`, inline: true },
          { name: '📀 Mémoire serveur', value: `${Math.round(freeMemory * 100) / 100} GB libre / ${Math.round(totalMemory * 100) / 100} GB total`, inline: false }
        )
        .setFooter({ text: `ID du bot: ${client.user.id}` })
        .setTimestamp();
      
      // Envoyer la réponse (l'interaction est déjà différée par le gestionnaire)
      await interaction.editReply({ embeds: [embed] });
      
      // Journaliser l'action
      Logger.info('Commande stats exécutée', {
        userId: interaction.user.id,
        guildId: interaction.guild?.id
      });
    } catch (error) {
      Logger.error('Erreur lors de l\'exécution de la commande stats', {
        error: error.message,
        stack: error.stack
      });
      
      // L'interaction est déjà différée à ce stade
      try {
        await interaction.editReply({ content: 'Une erreur est survenue lors de l\'affichage des statistiques.' });
      } catch (editError) {
        Logger.error('Impossible de modifier la réponse', {
          error: editError.message
        });
      }
    }
  },
  
  /**
   * Formate la durée d'activité en format lisible
   * @param {number} ms - Durée d'activité en millisecondes
   * @returns {string} - Durée formatée
   */
  formatUptime(ms) {
    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    
    const parts = [];
    if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} seconde${seconds !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
  }
}; 