/**
 * @file add_admin.js
 * @description Commande pour ajouter un administrateur au bot
 */

import { SlashCommandBuilder } from 'discord.js';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import * as Logger from '../../utils/logger.js'

export default {
  data: new SlashCommandBuilder()
      .setName('add_admin')
      .setDescription('Ajouter un administrateur au bot.'),
  
  async execute(interaction) {
    
    return this.execute(interaction);
  }
};
