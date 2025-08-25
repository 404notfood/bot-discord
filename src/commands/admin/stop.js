/**
 * @file stop.js
 * @description Commande pour arrêter des services du bot
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
      .setName('stop')
      .setDescription('Arrêter des services du bot.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
          option.setName('service')
              .setDescription('Le service à arrêter')
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
          content: '❌ Base de données non disponible. Impossible d\'arrêter les services.',
        });
      }

      let stoppedServices = [];
      let failedServices = [];

      switch (service) {
        case 'monitoring':
          if (await stopMonitoringService(interaction.client)) {
            stoppedServices.push('Monitoring');
          } else {
            failedServices.push('Monitoring');
          }
          break;

        case 'scheduler':
          if (await stopSchedulerService(interaction.client)) {
            stoppedServices.push('Scheduler');
          } else {
            failedServices.push('Scheduler');
          }
          break;

        case 'database_sync':
          if (await stopDatabaseSyncService(interaction.client)) {
            stoppedServices.push('Database Sync');
          } else {
            failedServices.push('Database Sync');
          }
          break;

        case 'anti_studi':
          if (await stopAntiStudiService(interaction.client)) {
            stoppedServices.push('Anti-Studi');
          } else {
            failedServices.push('Anti-Studi');
          }
          break;

        case 'auto_moderation':
          if (await stopAutoModerationService(interaction.client)) {
            stoppedServices.push('Auto Moderation');
          } else {
            failedServices.push('Auto Moderation');
          }
          break;

        case 'all':
          const services = [
            { name: 'Monitoring', fn: stopMonitoringService },
            { name: 'Scheduler', fn: stopSchedulerService },
            { name: 'Database Sync', fn: stopDatabaseSyncService },
            { name: 'Anti-Studi', fn: stopAntiStudiService },
            { name: 'Auto Moderation', fn: stopAutoModerationService }
          ];

          for (const svc of services) {
            if (await svc.fn(interaction.client)) {
              stoppedServices.push(svc.name);
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
          'service_stop',
          interaction.user.id,
          JSON.stringify({ 
            requested: service,
            stopped: stoppedServices,
            failed: failedServices 
          })
        ]
      );

      const embed = new EmbedBuilder()
        .setTitle('🛑 Services du Bot')
        .setColor(stoppedServices.length > 0 ? '#e67e22' : '#e74c3c')
        .setTimestamp();

      if (stoppedServices.length > 0) {
        embed.addFields({
          name: '✅ Services arrêtés',
          value: stoppedServices.join('\n'),
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
      
      Logger.info(`Services arrêtés par ${interaction.user.username}`, {
        userId: interaction.user.id,
        service,
        stopped: stoppedServices,
        failed: failedServices
      });
      
    } catch (error) {
      Logger.error('Erreur commande stop:', {
        error: error.message,
        stack: error.stack,
        user: interaction.user.id
      });
      
      const content = 'Une erreur est survenue lors de l\'arrêt des services.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  }
};

/**
 * Arrêter le service de monitoring
 */
async function stopMonitoringService(client) {
  try {
    if (client.monitoringService) {
      client.monitoringService.active = false;
      if (client.monitoringService.interval) {
        clearInterval(client.monitoringService.interval);
      }
    }
    return true;
  } catch (error) {
    Logger.error('Erreur arrêt monitoring:', { error: error.message });
    return false;
  }
}

/**
 * Arrêter le service de planification
 */
async function stopSchedulerService(client) {
  try {
    if (client.schedulerService) {
      client.schedulerService.active = false;
      // Arrêter toutes les tâches planifiées
      if (client.schedulerService.tasks) {
        for (const [taskId, task] of client.schedulerService.tasks) {
          if (task.interval) {
            clearInterval(task.interval);
          }
          if (task.timeout) {
            clearTimeout(task.timeout);
          }
        }
        client.schedulerService.tasks.clear();
      }
    }
    return true;
  } catch (error) {
    Logger.error('Erreur arrêt scheduler:', { error: error.message });
    return false;
  }
}

/**
 * Arrêter la synchronisation base de données
 */
async function stopDatabaseSyncService(client) {
  try {
    if (client.databaseSyncService) {
      client.databaseSyncService.active = false;
      if (client.databaseSyncService.interval) {
        clearInterval(client.databaseSyncService.interval);
      }
    }
    return true;
  } catch (error) {
    Logger.error('Erreur arrêt database sync:', { error: error.message });
    return false;
  }
}

/**
 * Arrêter le service Anti-Studi
 */
async function stopAntiStudiService(client) {
  try {
    if (client.antiStudiService) {
      client.antiStudiService.active = false;
    }
    return true;
  } catch (error) {
    Logger.error('Erreur arrêt anti-studi:', { error: error.message });
    return false;
  }
}

/**
 * Arrêter la modération automatique
 */
async function stopAutoModerationService(client) {
  try {
    if (client.autoModerationService) {
      client.autoModerationService.active = false;
    }
    return true;
  } catch (error) {
    Logger.error('Erreur arrêt auto moderation:', { error: error.message });
    return false;
  }
}

/**
 * Obtenir le statut de tous les services
 */
export function getServicesStatus(client) {
  return {
    monitoring: {
      active: client.monitoringService?.active || false,
      startedAt: client.monitoringService?.startedAt || null
    },
    scheduler: {
      active: client.schedulerService?.active || false,
      startedAt: client.schedulerService?.startedAt || null,
      taskCount: client.schedulerService?.tasks?.size || 0
    },
    databaseSync: {
      active: client.databaseSyncService?.active || false,
      startedAt: client.databaseSyncService?.startedAt || null
    },
    antiStudi: {
      active: client.antiStudiService?.active || false,
      startedAt: client.antiStudiService?.startedAt || null
    },
    autoModeration: {
      active: client.autoModerationService?.active || false,
      startedAt: client.autoModerationService?.startedAt || null
    }
  };
}