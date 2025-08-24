/**
 * @file scheduler.js
 * @description Commande pour gérer les tâches planifiées du scheduler
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';
import { 
    getActiveTasks, 
    getSchedulerStats, 
    getTaskInfo, 
    stopTask, 
    startTask, 
    executeTaskNow,
    PRIORITY,
    CRON_PATTERNS 
} from '../../utils/scheduler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('scheduler')
        .setDescription('Gestion des tâches planifiées du bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(subcommand =>
            subcommand
                .setName('list')
                .setDescription('Affiche la liste des tâches planifiées')
                .addStringOption(option =>
                    option.setName('filter')
                        .setDescription('Filtrer les tâches')
                        .setRequired(false)
                        .addChoices(
                            { name: 'Toutes', value: 'all' },
                            { name: 'En cours', value: 'running' },
                            { name: 'Arrêtées', value: 'stopped' },
                            { name: 'Priorité élevée', value: 'high_priority' }
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Affiche les statistiques du scheduler')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Affiche les détails d\'une tâche spécifique')
                .addStringOption(option =>
                    option.setName('task_id')
                        .setDescription('ID de la tâche')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('control')
                .setDescription('Contrôle une tâche (start/stop/execute)')
                .addStringOption(option =>
                    option.setName('task_id')
                        .setDescription('ID de la tâche')
                        .setRequired(true)
                )
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action à effectuer')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Démarrer', value: 'start' },
                            { name: 'Arrêter', value: 'stop' },
                            { name: 'Exécuter maintenant', value: 'execute' }
                        )
                )
        ),

    // Permissions requises
    permissions: ['scheduler.manage'],
    category: 'admin',

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            await interaction.deferReply({ ephemeral: true });

            switch (subcommand) {
                case 'list':
                    await this.handleListCommand(interaction);
                    break;
                case 'stats':
                    await this.handleStatsCommand(interaction);
                    break;
                case 'info':
                    await this.handleInfoCommand(interaction);
                    break;
                case 'control':
                    await this.handleControlCommand(interaction);
                    break;
                default:
                    await interaction.editReply('Sous-commande inconnue');
            }

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'scheduler');
        }
    },

    /**
     * Gère la commande list
     */
    async handleListCommand(interaction) {
        const filter = interaction.options.getString('filter') || 'all';
        
        let tasks = getActiveTasks();
        
        // Appliquer les filtres
        switch (filter) {
            case 'running':
                tasks = tasks.filter(task => task.isRunning);
                break;
            case 'stopped':
                tasks = tasks.filter(task => !task.isRunning);
                break;
            case 'high_priority':
                tasks = tasks.filter(task => task.priority >= PRIORITY.HIGH);
                break;
        }

        const embed = new EmbedBuilder()
            .setTitle('📅 Tâches Planifiées')
            .setColor('#3498db')
            .setTimestamp();

        if (tasks.length === 0) {
            embed.setDescription('Aucune tâche planifiée trouvée');
        } else {
            // Grouper par priorité
            const tasksByPriority = {
                [PRIORITY.CRITICAL]: [],
                [PRIORITY.HIGH]: [],
                [PRIORITY.NORMAL]: [],
                [PRIORITY.LOW]: []
            };

            tasks.forEach(task => {
                tasksByPriority[task.priority || PRIORITY.NORMAL].push(task);
            });

            // Afficher chaque groupe
            Object.entries(tasksByPriority).forEach(([priority, priorityTasks]) => {
                if (priorityTasks.length === 0) return;

                const priorityNames = {
                    [PRIORITY.CRITICAL]: '🔴 Critique',
                    [PRIORITY.HIGH]: '🟡 Élevée',
                    [PRIORITY.NORMAL]: '🟢 Normale',
                    [PRIORITY.LOW]: '⚪ Faible'
                };

                const tasksList = priorityTasks.map(task => {
                    const status = task.isRunning ? '🔄' : '⏸️';
                    const successRate = task.successRate ? ` (${task.successRate}%)` : '';
                    return `${status} \`${task.taskId}\` - ${task.description}${successRate}`;
                }).join('\n');

                embed.addFields({
                    name: priorityNames[priority],
                    value: tasksList.length > 1024 ? tasksList.substring(0, 1021) + '...' : tasksList,
                    inline: false
                });
            });
        }

        embed.setFooter({ 
            text: `${tasks.length} tâche(s) • Filtre: ${filter}` 
        });

        await interaction.editReply({ embeds: [embed] });
    },

    /**
     * Gère la commande stats
     */
    async handleStatsCommand(interaction) {
        const stats = getSchedulerStats();
        
        const embed = new EmbedBuilder()
            .setTitle('📊 Statistiques du Scheduler')
            .setColor('#2ecc71')
            .setTimestamp();

        embed.addFields(
            {
                name: '⚡ Performance',
                value: `Uptime: **${stats.uptimeFormatted}**\n` +
                       `Taux de succès: **${stats.successRate}%**\n` +
                       `Temps moyen: **${stats.averageExecutionTime}ms**`,
                inline: true
            },
            {
                name: '📋 Tâches',
                value: `Actives: **${stats.activeTasks}**\n` +
                       `En cours: **${stats.runningTasks}**\n` +
                       `Créées: **${stats.tasksCreated}**`,
                inline: true
            },
            {
                name: '📈 Exécutions',
                value: `Exécutées: **${stats.tasksExecuted}**\n` +
                       `Réussies: **${stats.tasksCompleted}**\n` +
                       `Échecs: **${stats.tasksFailed}**`,
                inline: true
            }
        );

        if (stats.lastError) {
            const errorTime = new Date(stats.lastError.timestamp).toLocaleString('fr-FR');
            embed.addFields({
                name: '❌ Dernière erreur',
                value: `Tâche: \`${stats.lastError.taskId}\`\n` +
                       `Erreur: ${stats.lastError.error}\n` +
                       `Date: ${errorTime}`,
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    /**
     * Gère la commande info
     */
    async handleInfoCommand(interaction) {
        const taskId = interaction.options.getString('task_id');
        const taskInfo = getTaskInfo(taskId);

        if (!taskInfo) {
            await interaction.editReply({
                content: `❌ Tâche \`${taskId}\` non trouvée`
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(`📋 Détails de la tâche: ${taskInfo.description}`)
            .setColor(taskInfo.isRunning ? '#f39c12' : '#95a5a6')
            .setTimestamp();

        const status = taskInfo.isRunning ? '🔄 En cours' : '⏸️ Arrêtée';
        const priorityNames = {
            [PRIORITY.CRITICAL]: '🔴 Critique',
            [PRIORITY.HIGH]: '🟡 Élevée',
            [PRIORITY.NORMAL]: '🟢 Normale',
            [PRIORITY.LOW]: '⚪ Faible'
        };

        embed.addFields(
            {
                name: 'ℹ️ Informations générales',
                value: `ID: \`${taskInfo.taskId}\`\n` +
                       `Statut: ${status}\n` +
                       `Priorité: ${priorityNames[taskInfo.priority] || 'Non définie'}\n` +
                       `Pattern: \`${taskInfo.pattern}\`\n` +
                       `Fuseau: ${taskInfo.timezone}`,
                inline: true
            },
            {
                name: '📊 Statistiques',
                value: `Exécutions: **${taskInfo.executions}**\n` +
                       `Échecs: **${taskInfo.failures}**\n` +
                       `Taux de succès: **${taskInfo.successRate}%**\n` +
                       `Temps moyen: **${taskInfo.averageExecutionTime}ms**\n` +
                       `Temps total: **${Math.round(taskInfo.totalTime / 1000)}s**`,
                inline: true
            },
            {
                name: '⏰ Planification',
                value: `Créée: <t:${Math.floor(taskInfo.createdAt.getTime() / 1000)}:R>\n` +
                       `Dernière exec: ${taskInfo.lastExecution ? 
                           `<t:${Math.floor(taskInfo.lastExecution.getTime() / 1000)}:R>` : 
                           'Jamais'}\n` +
                       `Prochaine exec: ${taskInfo.nextExecution ? 
                           `<t:${Math.floor(taskInfo.nextExecution.getTime() / 1000)}:R>` : 
                           'Non planifiée'}`,
                inline: false
            }
        );

        // Métadonnées si présentes
        if (Object.keys(taskInfo.metadata).length > 0) {
            const metadataStr = Object.entries(taskInfo.metadata)
                .map(([key, value]) => `${key}: ${value}`)
                .join('\n');
            
            embed.addFields({
                name: '🏷️ Métadonnées',
                value: metadataStr.length > 1024 ? metadataStr.substring(0, 1021) + '...' : metadataStr,
                inline: false
            });
        }

        await interaction.editReply({ embeds: [embed] });
    },

    /**
     * Gère la commande control
     */
    async handleControlCommand(interaction) {
        const taskId = interaction.options.getString('task_id');
        const action = interaction.options.getString('action');

        const taskInfo = getTaskInfo(taskId);
        if (!taskInfo) {
            await interaction.editReply({
                content: `❌ Tâche \`${taskId}\` non trouvée`
            });
            return;
        }

        let result = false;
        let message = '';

        switch (action) {
            case 'start':
                result = startTask(taskId);
                message = result ? 
                    `✅ Tâche \`${taskId}\` démarrée` : 
                    `❌ Impossible de démarrer la tâche \`${taskId}\``;
                break;

            case 'stop':
                result = stopTask(taskId);
                message = result ? 
                    `⏸️ Tâche \`${taskId}\` arrêtée` : 
                    `❌ Impossible d'arrêter la tâche \`${taskId}\``;
                break;

            case 'execute':
                result = await executeTaskNow(taskId);
                message = result ? 
                    `▶️ Tâche \`${taskId}\` exécutée` : 
                    `❌ Impossible d'exécuter la tâche \`${taskId}\``;
                break;

            default:
                message = `❌ Action \`${action}\` non reconnue`;
        }

        await interaction.editReply({
            content: message
        });

        // Log de l'action
        Logger.info(`Action scheduler effectuée par ${interaction.user.username}`, {
            userId: interaction.user.id,
            action,
            taskId,
            result
        });
    }
};