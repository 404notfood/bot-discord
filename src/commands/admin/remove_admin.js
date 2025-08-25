/**
 * @file remove_admin.js
 * @description Commande pour retirer un administrateur du bot
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
      .setName('remove_admin')
      .setDescription('Retirer un administrateur du bot.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption(option => 
          option.setName('user')
              .setDescription('L\'administrateur à retirer')
              .setRequired(true)
      ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const targetUser = interaction.options.getUser('user');
      const databaseManager = interaction.client.databaseManager;
      
      if (!databaseManager || !databaseManager.isAvailable()) {
        return interaction.editReply({
          content: '❌ Base de données non disponible. Impossible de retirer des administrateurs.',
        });
      }
      
      // Vérifier si l'utilisateur est admin
      const existingAdmin = await databaseManager.query(
        'SELECT * FROM bot_admins WHERE user_id = ?',
        [targetUser.id]
      );
      
      if (existingAdmin.length === 0) {
        return interaction.editReply({
          content: `⚠️ ${targetUser.username} n'est pas administrateur du bot.`,
        });
      }
      
      // Vérifier qu'on ne se retire pas soi-même (sécurité)
      if (targetUser.id === interaction.user.id) {
        return interaction.editReply({
          content: '⚠️ Vous ne pouvez pas vous retirer vous-même des administrateurs.',
        });
      }
      
      // Retirer l'administrateur
      await databaseManager.query(
        'DELETE FROM bot_admins WHERE user_id = ?',
        [targetUser.id]
      );
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Administrateur retiré')
        .setDescription(`${targetUser.username} a été retiré des administrateurs du bot.`)
        .setColor('#e74c3c')
        .addFields(
          { name: 'Utilisateur', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Retiré par', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      
      Logger.info(`Administrateur retiré: ${targetUser.username}`, {
        userId: targetUser.id,
        removedBy: interaction.user.id
      });
      
    } catch (error) {
      Logger.error('Erreur remove_admin:', {
        error: error.message,
        stack: error.stack,
        user: interaction.user.id
      });
      
      const content = 'Une erreur est survenue lors de la suppression de l\'administrateur.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  }
};
