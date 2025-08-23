/**
 * @file info.js
 * @description Commande info qui affiche des informations sur le bot et le serveur
 */

import { SlashCommandBuilder } from 'discord.js';


export default {
  data: new SlashCommandBuilder()
      .setName('info_example')
      .setDescription('Affiche des informations sur le bot et le serveur'),
  
  async execute(interaction) {
    
    return this.execute(interaction);
  }
};
