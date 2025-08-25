/**
 * @file add_admin.js
 * @description Commande pour ajouter un administrateur au bot
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
      .setName('add_admin')
      .setDescription('Ajouter un administrateur au bot.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption(option => 
          option.setName('user')
              .setDescription('L\'utilisateur à ajouter comme administrateur')
              .setRequired(true)
      ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const targetUser = interaction.options.getUser('user');
      const databaseManager = interaction.client.databaseManager;
      
      if (!databaseManager || !databaseManager.isAvailable()) {
        return interaction.editReply({
          content: '❌ Base de données non disponible. Impossible d\'ajouter des administrateurs.',
        });
      }
      
      // Vérifier si l'utilisateur est déjà admin
      const existingAdmin = await databaseManager.query(
        'SELECT * FROM bot_admins WHERE user_id = ?',
        [targetUser.id]
      );
      
      if (existingAdmin.length > 0) {
        return interaction.editReply({
          content: `⚠️ ${targetUser.username} est déjà administrateur du bot.`,
        });
      }
      
      // Ajouter l'administrateur
      await databaseManager.query(
        'INSERT INTO bot_admins (user_id, username, added_by) VALUES (?, ?, ?)',
        [targetUser.id, targetUser.username, interaction.user.id]
      );
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Administrateur ajouté')
        .setDescription(`${targetUser.username} a été ajouté comme administrateur du bot.`)
        .setColor('#2ecc71')
        .addFields(
          { name: 'Utilisateur', value: `<@${targetUser.id}>`, inline: true },
          { name: 'Ajouté par', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();
      
      await interaction.editReply({ embeds: [embed] });
      
      Logger.info(`Administrateur ajouté: ${targetUser.username}`, {
        userId: targetUser.id,
        addedBy: interaction.user.id
      });
      
    } catch (error) {
      Logger.error('Erreur add_admin:', {
        error: error.message,
        stack: error.stack,
        user: interaction.user.id
      });
      
      const content = 'Une erreur est survenue lors de l\'ajout de l\'administrateur.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  }
};
