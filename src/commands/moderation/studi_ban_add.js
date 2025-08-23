/**
 * @file studi_ban_add.js
 * @description Ajouter un utilisateur à la liste des bannis
 */

import { SlashCommandBuilder } from 'discord.js';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import * as Logger from '../../utils/logger.js'

export default {
  data: new SlashCommandBuilder()
      .setName('studi_ban_add')
      .setDescription('Ajouter un utilisateur à la liste des bannis de Studi.'),
  
  async execute(interaction) {
    
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason');
        const duration = interaction.options.getInteger('duration') || 0;
        
        try {
            // Vérifier si l'utilisateur est déjà banni
            const isBanned = await this.isUserBanned(targetUser.id);
            
            if (isBanned) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('⚠️ Utilisateur déjà banni')
                            .setDescription(`${targetUser.username} est déjà dans la liste des bannis.`)
                            .setColor('#f1c40f')
                            .setTimestamp()
                    ],
                    ephemeral: true
  }
};
