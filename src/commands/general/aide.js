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
          name: '📋 Commandes Administrateur',
          value: '`/ping` - Vérifier la latence du bot\n' +
                '`/info` - Informations sur le bot et le serveur\n' +
                '`/rappel` - Créer un rappel'
        });
        
        embed.addFields({
          name: '🛡️ Commandes de Modération',
          value: '`/ban_add` - Bannir un utilisateur\n' +
                '`/ban_remove` - Débannir un utilisateur'
        });
        
        embed.addFields({
          name: '🔧 Administration - Utilisateurs',
          value: '`/add_admin` - Ajouter un administrateur\n' +
                '`/remove_admin` - Retirer un administrateur\n' +
                '`/addmoderator` - Ajouter un modérateur\n' +
                '`/remove_mod` - Retirer un modérateur\n' +
                '`/list_staff` - Liste des administrateurs et modérateurs'
        });
        
        embed.addFields({
          name: '⚙️ Administration - Système',
          value: '`/config` - Configuration générale\n' +
                '`/start` - Démarrer des services du bot\n' +
                '`/stop` - Arrêter des services du bot\n' +
                '`/stats` - Statistiques du bot\n' +
                '`/test` - Tester toutes les fonctionnalités\n' +
                '`/monitoring` - Surveillance du système'
        });

        embed.addFields({
          name: '🗄️ Administration - Base de données',
          value: '`/db_status` - État de la base de données\n' +
                '`/db_fix` - Réparer la base de données\n' +
                '`/db_reset` - Réinitialiser la base de données\n' +
                '`/system_health` - Santé globale du système\n' +
                '`/diagnostics` - Diagnostics complets'
        });

        embed.addFields({
          name: '🧑‍💻 Système Anti-Studi',
          value: '`/studi_config` - Configuration du système anti-Studi\n' +
                '`/studi_status` - État actuel du système anti-Studi\n' +
                '`/studi_ban_add` - Ajouter à la liste anti-Studi\n' +
                '`/studi_ban_remove` - Retirer de la liste anti-Studi\n' +
                '`/studi_whitelist` - Gérer la whitelist Studi\n' +
                '`/studi_dashboard` - Dashboard du système anti-Studi\n' +
                '`/studi_db_init` - Initialiser la base de données Studi'
        });
        
        embed.addFields({
          name: '📊 Gestion de Projets',
          value: '`/create_project` - Créer un nouveau projet\n' +
                '`/list_projects` - Liste tous les projets\n' +
                '`/create_subgroup` - Créer un sous-groupe\n' +
                '`/add_to_subgroup` - Ajouter un membre au sous-groupe\n' +
                '`/remove_from_subgroup` - Retirer un membre du sous-groupe\n' +
                '`/list_subgroups` - Liste des sous-groupes\n' +
                '`/list_subgroup_members` - Membres d\'un sous-groupe'
        });

        embed.addFields({
          name: '🔐 Permissions et Canaux',
          value: '`/bot_permissions` - Gérer les permissions du bot\n' +
                '`/bot_roles` - Gérer les rôles du bot\n' +
                '`/create_private_channel` - Créer un canal privé\n' +
                '`/manage_channel_permissions` - Gérer les permissions de canal'
        });

        embed.addFields({
          name: '⏰ Planification et Services',
          value: '`/scheduler` - Gérer le planificateur de tâches'
        });
      }
      
      // Ajouter un récapitulatif pour les admins
      if (isAdmin) {
        embed.addFields({
          name: 'ℹ️ Informations',
          value: `Bot avec **42 commandes** au total\n• 3 commandes générales\n• 5 commandes administrateur\n• 34 commandes administratives\n\nUtilisez \`/test all\` pour vérifier toutes les fonctionnalités`,
          inline: false
        });
      } else {
        embed.addFields({
          name: 'ℹ️ Informations',
          value: 'Bot avec **3 commandes** accessibles aux membres\n• 3 commandes générales seulement',
          inline: false
        });
      }

      embed.setFooter({ text: 'Utilisez /aide pour voir cette liste à tout moment' })
        .setTimestamp();
      
      // Envoyer la réponse
      await interaction.reply({ embeds: [embed] });
      
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
      
      // Répondre avec l'erreur
      try {
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'Une erreur est survenue lors de l\'affichage de l\'aide.', ephemeral: true });
        } else {
          await interaction.reply({ content: 'Une erreur est survenue lors de l\'affichage de l\'aide.', ephemeral: true });
        }
      } catch (replyError) {
        Logger.error('Impossible de répondre à l\'interaction', {
          error: replyError.message,
          userId: interaction.user.id
        });
      }
    }
  }
};