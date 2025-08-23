/**
 * @file aide.js
 * @description Commande d'aide qui liste les commandes disponibles
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import * as Logger from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('aide')
    .setDescription('Affiche la liste des commandes disponibles.'),
    
  async execute(interaction) {
    try {
      // Créer un embed pour l'aide
      const embed = new EmbedBuilder()
        .setTitle('Aide - Commandes Disponibles')
        .setColor('#3498db')
        .setDescription('Voici la liste des commandes disponibles sur ce serveur. Utilisez `/` pour ouvrir le menu des commandes slash.')
        .addFields(
          {
            name: '📋 Commandes Générales',
            value: '`/aide` - Affiche cette aide\n' +
                  '`/ping` - Vérifier la latence du bot\n' +
                  '`/info` - Informations sur le bot\n' +
                  '`/search` - Recherche sur le web\n' +
                  '`/docs` - Documentation technique'
          }
        );

      // IDs des administrateurs du bot - ajouter ici les IDs des utilisateurs administrateurs
      const adminIDs = ['709042879145836564']; // Ajoutez votre ID ici
      
      // Vérifier si l'utilisateur est administrateur via ses permissions Discord ou son ID
      const hasAdminPermission = interaction.member?.permissions.has(PermissionFlagsBits.Administrator) || false;
      const isAdminByID = adminIDs.includes(interaction.user.id);
      const isAdmin = hasAdminPermission || isAdminByID;
      
      // Ajouter les commandes d'administration si l'utilisateur est admin
      if (isAdmin) {
        embed.addFields({
          name: '🔧 Commandes Administratives',
          value: '`/config` - Configuration générale\n' +
                '`/list_staff` - Liste des administrateurs et modérateurs\n' +
                '`/add_admin` - Ajouter un administrateur\n' +
                '`/remove_admin` - Retirer un administrateur\n' +
                '`/addmoderator` - Ajouter un modérateur\n' +
                '`/remove_mod` - Retirer un modérateur\n' +
                '`/stats` - Statistiques du bot'
        });
        
        embed.addFields({
          name: '🧑‍💻 Système Anti-Studi',
          value: '`/studi_config` - Configuration du système anti-Studi\n' +
                '`/studi_status` - État actuel du système anti-Studi\n' +
                '`/studi_ban_add` - Ajouter un utilisateur à la liste anti-Studi\n' +
                '`/studi_ban_remove` - Retirer un utilisateur de la liste anti-Studi\n' +
                '`/studi_ban_list` - Afficher la liste des utilisateurs bannis'
        });
        
        embed.addFields({
          name: '📊 Gestion de Projets',
          value: '`/create_project` - Créer un nouveau projet\n' +
                '`/list_projects` - Liste tous les projets\n' +
                '`/create_subgroup` - Créer un sous-groupe\n' +
                '`/add_to_subgroup` - Ajouter un membre au sous-groupe\n' +
                '`/remove_from_subgroup` - Retirer un membre du sous-groupe\n' +
                '`/list_subgroups` - Liste des sous-groupes\n' +
                '`/list_subgroup_members` - Liste des membres d\'un sous-groupe'
        });
      }
      
      embed.setFooter({ text: 'Utilisez /aide pour voir cette liste à tout moment' })
        .setTimestamp();
      
      // Envoyer la réponse (l'interaction est déjà différée par le gestionnaire)
      await interaction.editReply({ embeds: [embed] });
      
      // Journaliser l'action
      Logger.info('Commande aide exécutée', {
        userId: interaction.user.id,
        guildId: interaction.guild?.id || 'DM',
        isAdmin: isAdmin,
        isAdminByID: isAdminByID,
        hasAdminPermission: hasAdminPermission
      });
    } catch (error) {
      Logger.error('Erreur lors de l\'exécution de la commande aide', {
        error: error.message,
        stack: error.stack,
        userId: interaction.user.id
      });
      
      // L'interaction est déjà différée à ce stade
      try {
        await interaction.editReply({ content: 'Une erreur est survenue lors de l\'affichage de l\'aide.' });
      } catch (editError) {
        Logger.error('Impossible de modifier la réponse', {
          error: editError.message,
          userId: interaction.user.id
        });
      }
    }
  }
};