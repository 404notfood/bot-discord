/**
 * @file config.js
 * @description Configuration des parametres
 */

import { SlashCommandBuilder } from 'discord.js';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import * as Logger from '../../utils/logger.js'

export default {
  data: new SlashCommandBuilder()
      .setName('config')
      .setDescription('Configure les parametres du bot.'),
  
  async execute(interaction) {
    
    return this.execute(interaction);
  }
};
