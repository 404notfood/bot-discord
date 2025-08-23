/**
 * @file ban_remove.js
 * @description Commande pour retirer un utilisateur de la liste des bannis
 */

import { SlashCommandBuilder } from 'discord.js';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import * as Logger from '../../utils/logger.js'

export default {
  data: new SlashCommandBuilder()
      .setName('ban_remove')
      .setDescription('Retirer un utilisateur de la liste des bannis.'),
  
  async execute(interaction) {
    
    return this.execute(interaction);
  }
};
