/**
 * @file list_staff.js
 * @description Commande pour lister les administrateurs et modérateurs du bot
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('list_staff')
    .setDescription('Liste les administrateurs et modérateurs du bot'),
  
  async execute(interaction) {
    try {
      // Créer un embed pour afficher les équipes
      const embed = new EmbedBuilder()
        .setTitle('👑 Équipe du bot')
        .setColor(0x3498db)
        .setDescription('Liste des administrateurs et modérateurs du bot')
        .addFields(
          {
            name: '👑 Administrateurs',
            value: '• <@244573404059926528> (Créateur)\n• <@123456789012345678> (Admin)'
          },
          {
            name: '🛡️ Modérateurs',
            value: '• <@987654321098765432>\n• <@567890123456789012>'
          }
        )
        .setFooter({ text: 'Pour rejoindre l\'équipe, contactez un administrateur' })
        .setTimestamp();

      // Envoyer la réponse (l'interaction est déjà différée par le gestionnaire)
      await interaction.editReply({ embeds: [embed] });
      
      // Journaliser l'action
      Logger.info('Commande list_staff exécutée', {
        userId: interaction.user.id,
        guildId: interaction.guild?.id
      });
    } catch (error) {
      Logger.error('Erreur lors de l\'exécution de la commande list_staff', {
        error: error.message,
        stack: error.stack
      });
      
      // L'interaction est déjà différée à ce stade
      try {
        await interaction.editReply({ content: 'Une erreur est survenue lors de l\'affichage de l\'équipe.' });
      } catch (editError) {
        Logger.error('Impossible de modifier la réponse', {
          error: editError.message
        });
      }
    }
  }
}; 