/**
 * @file start.js
 * @description Commande pour démarrer des services du bot
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
      .setName('start')
      .setDescription('Démarrer des services du bot.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
          option.setName('service')
              .setDescription('Le service à démarrer')
              .setRequired(true)
              .addChoices(
                  { name: 'Monitoring', value: 'monitoring' },
                  { name: 'Scheduler', value: 'scheduler' },
                  { name: 'Database Sync', value: 'database_sync' },
                  { name: 'Anti-Studi', value: 'anti_studi' },
                  { name: 'Auto Moderation', value: 'auto_moderation' },
                  { name: 'All Services', value: 'all' }
              )
      ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const service = interaction.options.getString('service');
      const databaseManager = interaction.client.databaseManager;
      
      if (!databaseManager || !databaseManager.isAvailable()) {
        return interaction.editReply({
          content: '❌ Base de données non disponible. Impossible de démarrer les services.',
        });
      }

      let startedServices = [];
      let failedServices = [];

      switch (service) {
        case 'monitoring':
          if (await startMonitoringService(interaction.client)) {
            startedServices.push('Monitoring');
          } else {
            failedServices.push('Monitoring');
          }
          break;

        case 'scheduler':
          if (await startSchedulerService(interaction.client)) {
            startedServices.push('Scheduler');
          } else {
            failedServices.push('Scheduler');
          }
          break;

        case 'database_sync':
          if (await startDatabaseSyncService(interaction.client)) {
            startedServices.push('Database Sync');
          } else {
            failedServices.push('Database Sync');
          }
          break;

        case 'anti_studi':
          if (await startAntiStudiService(interaction.client)) {
            startedServices.push('Anti-Studi');
          } else {
            failedServices.push('Anti-Studi');
          }
          break;

        case 'auto_moderation':
          if (await startAutoModerationService(interaction.client)) {
            startedServices.push('Auto Moderation');
          } else {
            failedServices.push('Auto Moderation');
          }
          break;

        case 'all':
          const services = [
            { name: 'Monitoring', fn: startMonitoringService },
            { name: 'Scheduler', fn: startSchedulerService },
            { name: 'Database Sync', fn: startDatabaseSyncService },
            { name: 'Anti-Studi', fn: startAntiStudiService },
            { name: 'Auto Moderation', fn: startAutoModerationService }
          ];

          for (const svc of services) {
            if (await svc.fn(interaction.client)) {
              startedServices.push(svc.name);
            } else {
              failedServices.push(svc.name);
            }
          }
          break;
      }

      // Enregistrer l'état des services dans la DB
      await databaseManager.query(
        'INSERT INTO bot_logs (action, user_id, details, created_at) VALUES (?, ?, ?, NOW())',
        [
          'service_start',
          interaction.user.id,
          JSON.stringify({ 
            requested: service,
            started: startedServices,
            failed: failedServices 
          })
        ]
      );

      const embed = new EmbedBuilder()
        .setTitle('🚀 Services du Bot')
        .setColor(startedServices.length > 0 ? '#2ecc71' : '#e74c3c')
        .setTimestamp();

      if (startedServices.length > 0) {
        embed.addFields({
          name: '✅ Services démarrés',
          value: startedServices.join('\n'),
          inline: false
        });
      }

      if (failedServices.length > 0) {
        embed.addFields({
          name: '❌ Services échoués',
          value: failedServices.join('\n'),
          inline: false
        });
      }

      embed.addFields({
        name: 'Demandé par',
        value: `<@${interaction.user.id}>`,
        inline: true
      });

      await interaction.editReply({ embeds: [embed] });
      
      Logger.info(`Services démarrés par ${interaction.user.username}`, {
        userId: interaction.user.id,
        service,
        started: startedServices,
        failed: failedServices
      });
      
    } catch (error) {
      Logger.error('Erreur commande start:', {
        error: error.message,
        stack: error.stack,
        user: interaction.user.id
      });
      
      const content = 'Une erreur est survenue lors du démarrage des services.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  }
};

/**
 * Démarrer le service de monitoring
 */
async function startMonitoringService(client) {
  try {
    if (!client.monitoringService) {
      client.monitoringService = {
        active: true,
        startedAt: new Date(),
        interval: setInterval(() => {
          // Monitoring logic ici
          Logger.debug('Monitoring service running...');
        }, 60000) // Toutes les minutes
      };
    } else {
      client.monitoringService.active = true;
    }
    return true;
  } catch (error) {
    Logger.error('Erreur démarrage monitoring:', { error: error.message });
    return false;
  }
}

/**
 * Démarrer le service de planification
 */
async function startSchedulerService(client) {
  try {
    if (!client.schedulerService) {
      client.schedulerService = {
        active: true,
        startedAt: new Date(),
        tasks: new Map()
      };
    } else {
      client.schedulerService.active = true;
    }
    return true;
  } catch (error) {
    Logger.error('Erreur démarrage scheduler:', { error: error.message });
    return false;
  }
}

/**
 * Démarrer la synchronisation base de données
 */
async function startDatabaseSyncService(client) {
  try {
    if (!client.databaseSyncService) {
      client.databaseSyncService = {
        active: true,
        startedAt: new Date(),
        interval: setInterval(async () => {
          // Synchroniser les utilisateurs du site avec le bot
          await syncSiteUsersWithBot(client);
        }, 300000) // Toutes les 5 minutes
      };
    } else {
      client.databaseSyncService.active = true;
    }
    return true;
  } catch (error) {
    Logger.error('Erreur démarrage database sync:', { error: error.message });
    return false;
  }
}

/**
 * Démarrer le service Anti-Studi
 */
async function startAntiStudiService(client) {
  try {
    if (!client.antiStudiService) {
      client.antiStudiService = {
        active: true,
        startedAt: new Date()
      };
    } else {
      client.antiStudiService.active = true;
    }
    return true;
  } catch (error) {
    Logger.error('Erreur démarrage anti-studi:', { error: error.message });
    return false;
  }
}

/**
 * Démarrer la modération automatique
 */
async function startAutoModerationService(client) {
  try {
    if (!client.autoModerationService) {
      client.autoModerationService = {
        active: true,
        startedAt: new Date()
      };
    } else {
      client.autoModerationService.active = true;
    }
    return true;
  } catch (error) {
    Logger.error('Erreur démarrage auto moderation:', { error: error.message });
    return false;
  }
}

/**
 * Synchroniser les utilisateurs du site avec le bot
 */
async function syncSiteUsersWithBot(client) {
  try {
    const databaseManager = client.databaseManager;
    if (!databaseManager || !databaseManager.isAvailable()) {
      return;
    }

    // Récupérer tous les membres du dashboard Laravel
    const dashboardMembers = await databaseManager.query(
      'SELECT discord_id, username, role, is_active FROM dashboard_members WHERE is_active = 1'
    );

    // Synchroniser avec la table bot_admins et bot_moderators
    for (const member of dashboardMembers) {
      if (member.discord_id) {
        if (member.role === 'admin') {
          // Ajouter aux admins si pas déjà présent
          const existingAdmin = await databaseManager.query(
            'SELECT id FROM bot_admins WHERE user_id = ?',
            [member.discord_id]
          );
          
          if (existingAdmin.length === 0) {
            await databaseManager.query(
              'INSERT INTO bot_admins (user_id, username, added_by) VALUES (?, ?, ?)',
              [member.discord_id, member.username, 'system']
            );
          }
        } else if (member.role === 'moderator') {
          // Ajouter aux modérateurs si pas déjà présent
          const existingMod = await databaseManager.query(
            'SELECT id FROM bot_moderators WHERE user_id = ?',
            [member.discord_id]
          );
          
          if (existingMod.length === 0) {
            await databaseManager.query(
              'INSERT INTO bot_moderators (user_id, username, added_by) VALUES (?, ?, ?)',
              [member.discord_id, member.username, 'system']
            );
          }
        }
      }
    }

    Logger.debug('Synchronisation site-bot terminée');
  } catch (error) {
    Logger.error('Erreur synchronisation site-bot:', { error: error.message });
  }
}