/**
 * @file ban_add.js
 * @description Commande pour ajouter un utilisateur a la liste des bannis
 */

import { SlashCommandBuilder } from 'discord.js';
import { PermissionFlagsBits, EmbedBuilder } from 'discord.js'
import * as Logger from '../../utils/logger.js'

export default {
  data: new SlashCommandBuilder()
      .setName('ban_add')
      .setDescription('Ajouter un utilisateur a la liste des bannis.'),
  
  async execute(interaction) {
    
    return this.execute(interaction);
  }
};
