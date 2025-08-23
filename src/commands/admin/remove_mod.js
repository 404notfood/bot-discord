/**
 * @file remove_mod.js
 * @description Commande pour retirer un modérateur du bot
 */

import { SlashCommandBuilder } from 'discord.js';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import * as Logger from '../../utils/logger.js'

export default {
  data: new SlashCommandBuilder()
      .setName('remove_mod')
      .setDescription('Retirer un modérateur du bot.'),
  
  async execute(interaction) {
    
    return this.execute(interaction);
  }
};
