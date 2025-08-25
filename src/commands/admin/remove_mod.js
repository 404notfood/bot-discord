/**
 * @file remove_mod.js
 * @description Commande pour retirer un modérateur du bot
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
      .setName('remove_mod')
      .setDescription('Retirer un modérateur du bot.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption(option => 
          option.setName('user')
              .setDescription('Le modérateur à retirer')
              .setRequired(true)
      ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const targetUser = interaction.options.getUser('user');
      const databaseManager = interaction.client.databaseManager;
      
      if (!databaseManager || !databaseManager.isAvailable()) {
        return interaction.editReply({
          content: '❌ Base de données non disponible. Impossible de retirer des modérateurs.',
        });
      }
      
      // Vérifier si l'utilisateur est modérateur
      const existingMod = await databaseManager.query(
        'SELECT * FROM bot_moderators WHERE user_id = ?',
        [targetUser.id]
      );
      
      if (existingMod.length === 0) {
        return interaction.editReply({
          content: `⚠️ ${targetUser.username} n'est pas modérateur du bot.`,
        });
      }
      
      // Retirer le modérateur
      await databaseManager.query(
        'DELETE FROM bot_moderators WHERE user_id = ?',
        [targetUser.id]
      );
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Modérateur retiré')
        .setDescription(`${targetUser.username} a été retiré des modérateurs du bot.`)
        .setColor('#e74c3c')
        .addFields(
          { name: 'Utilisateur', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Retiré par', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      
      Logger.info(`Modérateur retiré: ${targetUser.username}`, {
        userId: targetUser.id,
        removedBy: interaction.user.id
      });
      
    } catch (error) {
      Logger.error('Erreur remove_mod:', {
        error: error.message,
        stack: error.stack,
        user: interaction.user.id
      });
      
      const content = 'Une erreur est survenue lors de la suppression du modérateur.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  }
};
