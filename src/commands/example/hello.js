/**
 * @file hello.js
 * @description Commande d'exemple "hello" qui montre la structure correcte
 */

import { SlashCommandBuilder } from 'discord.js';


export default {
  data: new SlashCommandBuilder()
      .setName('hello_example')
      .setDescription('Répond avec un message de salutation'),
  
  async execute(interaction) {
    
    return this.execute(interaction);
  }
};
