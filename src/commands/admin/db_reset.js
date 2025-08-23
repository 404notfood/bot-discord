/**
 * @file db_reset.js
 * @description Commande pour réinitialiser et initialiser la base de données
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { AdminCommand } from '../../models/AdminCommand.js';
import * as Logger from '../../utils/logger.js';
import { initDatabase } from '../../utils/dbInit.js';

class DbResetCommand extends AdminCommand {
  constructor() {
    super({
      name: 'db_reset',
      description: 'Réinitialise et initialise la base de données',
      category: 'admin',
      adminOnly: true // Uniquement accessible aux administrateurs
    });

    this.data = new SlashCommandBuilder()
      .setName('db_reset')
      .setDescription('Réinitialise et initialise la base de données');
  }

  async execute(interaction) {
    try {
      // Avertir que l'opération est en cours
      await interaction.editReply('🔄 Tentative de connexion et initialisation de la base de données...');

      // Lancer l'initialisation
      const success = await initDatabase();

      if (success) {
        const embed = new EmbedBuilder()
          .setTitle('✅ Base de données initialisée')
          .setDescription('La connexion à la base de données a été établie et les tables ont été créées ou vérifiées.')
          .setColor(0x2ecc71) // Vert
          .addFields(
            { name: 'État', value: 'Connecté' },
            { name: 'Tables', value: 'Toutes les tables requises sont disponibles' }
          )
          .setFooter({ text: 'Base de données prête à l\'emploi' })
          .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
        
        Logger.info('Commande db_reset exécutée avec succès', {
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        });
      } else {
        const embed = new EmbedBuilder()
          .setTitle('❌ Échec de l\'initialisation')
          .setDescription('Impossible d\'initialiser la base de données. Vérifiez les logs pour plus d\'informations.')
          .setColor(0xe74c3c) // Rouge
          .addFields(
            { name: 'État', value: 'Déconnecté' },
            { name: 'Mode', value: 'Fonctionnement limité' },
            { name: 'Solution', value: 'Vérifiez vos informations de connexion dans le fichier .env et assurez-vous que MySQL est en cours d\'exécution.' }
          )
          .setFooter({ text: 'Consultez les logs pour plus de détails' })
          .setTimestamp();

        await interaction.editReply({ content: null, embeds: [embed] });
        
        Logger.warn('Échec de la commande db_reset', {
          userId: interaction.user.id,
          guildId: interaction.guild?.id
        });
      }
    } catch (error) {
      Logger.error('Erreur lors de l\'exécution de la commande db_reset', {
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id
      });
      
      await interaction.editReply({ 
        content: '❌ Une erreur est survenue lors de la réinitialisation de la base de données.'
      });
    }
  }
}

export default new DbResetCommand(); 