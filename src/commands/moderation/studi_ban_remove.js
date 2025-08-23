/**
 * @file studi_ban_remove.js
 * @description Retirer un utilisateur de la liste des bannis
 */

import { SlashCommandBuilder } from 'discord.js';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import * as Logger from '../../utils/logger.js'

export default {
  data: new SlashCommandBuilder()
      .setName('studi_ban_remove')
      .setDescription('Retirer un utilisateur de la liste des bannis de Studi.'),
  
  async execute(interaction) {
    
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        
        try {
            // Vérifier si l'utilisateur est banni
            const isBanned = await this.isUserBanned(targetUser.id);
            
            if (!isBanned) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('⚠️ Utilisateur non banni')
                            .setDescription(`${targetUser.username} n'est pas dans la liste des bannis.`)
                            .setColor('#f1c40f')
                            .setTimestamp()
                    ],
                    ephemeral: true
  }
};
