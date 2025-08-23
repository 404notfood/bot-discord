/**
 * @file remove_admin.js
 * @description Commande pour retirer un administrateur du bot
 */

import { SlashCommandBuilder } from 'discord.js';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import * as Logger from '../../utils/logger.js'

export default {
  data: new SlashCommandBuilder()
      .setName('remove_admin')
      .setDescription('Retirer un administrateur du bot.'),
  
  async execute(interaction) {
    
    return this.execute(interaction);
  }
};
