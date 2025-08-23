/**
 * @file info.js
 * @description Commande d'informations sur le bot et le serveur
 */

import { SlashCommandBuilder, EmbedBuilder, version as discordJSVersion } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import os from 'os';

export default {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Affiche des informations sur le bot et le serveur'),
  
  async execute(interaction) {
    try {
      const client = interaction.client;
      
      // Collecter les informations sur le bot
      const uptime = this.formatUptime(client.uptime);
      const memoryUsage = process.memoryUsage().heapUsed / 1024 / 1024;
      const nodeVersion = process.version;
      const osInfo = `${os.type()} ${os.release()}`;
      
      // Créer un embed pour les informations
      const embed = new EmbedBuilder()
        .setTitle('📊 Informations')
        .setColor(0x3498db) // Bleu
        .setThumbnail(client.user.displayAvatarURL())
        .addFields(
          { name: '🤖 Bot', value: client.user.tag, inline: true },
          { name: '🆔 ID', value: client.user.id, inline: true },
          { name: '⏱️ En ligne depuis', value: uptime, inline: false },
          { name: '🏓 Latence', value: `${Math.round(client.ws.ping)}ms`, inline: true },
          { name: '💾 Mémoire', value: `${Math.round(memoryUsage * 100) / 100} MB`, inline: true },
          { name: '🖥️ Serveurs', value: `${client.guilds.cache.size}`, inline: true },
          { 
            name: '🔧 Environnement', 
            value: `Node.js: ${nodeVersion}\nDiscord.js: v${discordJSVersion}\nOS: ${osInfo}`,
            inline: false
          }
        )
        .setFooter({ text: 'Bot créé avec ♥' })
        .setTimestamp();
      
      // Ajouter des informations sur le serveur si la commande est exécutée dans un serveur
      if (interaction.guild) {
        const guild = interaction.guild;
        const owner = await guild.fetchOwner();
        
        embed.addFields(
          { name: '📝 Nom du serveur', value: guild.name, inline: true },
          { name: '👑 Propriétaire', value: owner.user.tag, inline: true },
          { name: '👥 Membres', value: `${guild.memberCount}`, inline: true },
          { name: '🔨 Salons', value: `${guild.channels.cache.size}`, inline: true },
          { name: '🎭 Rôles', value: `${guild.roles.cache.size}`, inline: true },
          { name: '🎉 Créé le', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true }
        );
      }
      
      // Envoyer la réponse
      await interaction.reply({ embeds: [embed] });
      
      // Journaliser l'action
      Logger.debug('Commande info exécutée', {
        userId: interaction.user.id,
        guildId: interaction.guild?.id
      });
    } catch (error) {
      Logger.error('Erreur lors de l\'exécution de la commande info', {
        error: error.message
      });
      
      if (!interaction.replied) {
        await interaction.reply({ content: 'Une erreur est survenue lors de l\'affichage des informations.', ephemeral: true });
      } else {
        await interaction.editReply('Une erreur est survenue lors de l\'affichage des informations.');
      }
    }
  },
  
  /**
   * Formate la durée d'activité en format lisible
   * @param {number} uptime - Durée d'activité en millisecondes
   * @returns {string} - Durée formatée
   */
  formatUptime(uptime) {
    const totalSeconds = Math.floor(uptime / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    const parts = [];
    if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
    if (minutes > 0) parts.push(`${minutes} minute${minutes > 1 ? 's' : ''}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} seconde${seconds !== 1 ? 's' : ''}`);
    
    return parts.join(', ');
  }
}; 