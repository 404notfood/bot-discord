/**
 * Gestionnaire des tâches planifiées pour le bot Discord
 */

import { scheduleTask } from '../utils/scheduler.js';
import config from '../config.js';
import * as Logger from '../utils/logger.js';
import * as db from '../utils/db.js';

/**
 * Classe pour gérer les tâches planifiées
 */
class ScheduledTasksManager {
  /**
   * Initialise le gestionnaire de tâches planifiées
   * @param {Client} client - Le client Discord
   */
  constructor(client) {
    this.client = client;
    this.tasks = [];
  }

  /**
   * Initialise toutes les tâches planifiées
   */
  init() {
    try {
      // Rappel hebdomadaire
      this.setupWeeklyReminder();
      
      // Rappel de projets à échéance
      this.setupProjectDueDateReminders();
      
      // Nettoyage de logs anciens
      this.setupLogCleanup();
      
      // Synchronisation externe (par exemple avec GitHub, Trello)
      this.setupExternalSyncTasks();
      
      Logger.info('Tâches planifiées initialisées', {
        tasksCount: this.tasks.length,
        tasks: this.tasks.map(task => task.name)
      });
    } catch (error) {
      Logger.error('Erreur lors de l\'initialisation des tâches planifiées', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Planifie une tâche et l'ajoute à la liste des tâches
   * @param {string} name - Nom de la tâche pour la journalisation
   * @param {string} cronPattern - Pattern cron pour la planification
   * @param {Function} taskFunction - Fonction à exécuter
   * @param {Object} options - Options supplémentaires
   * @returns {Object} Tâche planifiée
   */
  scheduleAndTrack(name, cronPattern, taskFunction, options = {}) {
    const task = scheduleTask(cronPattern, taskFunction, {
      description: name,
      timezone: "Europe/Paris",
      ...options
    });
    
    this.tasks.push({
      name,
      pattern: cronPattern,
      task
    });
    
    Logger.debug(`Tâche planifiée créée: ${name}`, {
      cronPattern,
      options
    });
    
    return task;
  }

  /**
   * Configure le rappel hebdomadaire de bienveillance
   */
  setupWeeklyReminder() {
    this.scheduleAndTrack(
      'Rappel hebdomadaire de bienveillance',
      '0 8 * * 1', // Tous les lundis à 8h
      () => this.sendWeeklyReminder(),
      { timezone: "Europe/Paris" }
    );
  }

  /**
   * Configure les rappels pour les échéances de projets
   */
  setupProjectDueDateReminders() {
    // Vérification quotidienne des projets à échéance imminente (3 jours avant)
    this.scheduleAndTrack(
      'Rappel des projets à échéance imminente',
      '0 9 * * *', // Tous les jours à 9h
      () => this.checkProjectDueDates(),
      { timezone: "Europe/Paris" }
    );
  }

  /**
   * Configure la tâche de nettoyage des anciens logs
   */
  setupLogCleanup() {
    // Nettoyage hebdomadaire des logs de plus de 30 jours
    this.scheduleAndTrack(
      'Nettoyage des logs anciens',
      '0 2 * * 0', // Tous les dimanches à 2h du matin
      () => this.cleanOldLogs(),
      { timezone: "Europe/Paris" }
    );
  }

  /**
   * Configure les tâches de synchronisation avec des services externes
   */
  setupExternalSyncTasks() {
    // Synchronisation avec GitHub toutes les heures
    this.scheduleAndTrack(
      'Synchronisation GitHub',
      '0 * * * *', // Toutes les heures
      () => this.syncGitHubProjects(),
      { timezone: "Europe/Paris" }
    );
    
    // Synchronisation avec Trello toutes les heures
    this.scheduleAndTrack(
      'Synchronisation Trello',
      '30 * * * *', // Toutes les heures à la minute 30
      () => this.syncTrelloProjects(),
      { timezone: "Europe/Paris" }
    );
  }

  /**
   * Envoie le message de rappel hebdomadaire
   */
  async sendWeeklyReminder() {
    try {
      const channel = this.client.channels.cache.get(config.logChannelId);
      if (!channel) {
        throw new Error(`Canal avec l'ID ${config.logChannelId} non trouvé`);
      }

      const reminderMessage = this.createReminderMessage();
      
      await channel.send(reminderMessage);
      
      Logger.info('Message de rappel hebdomadaire envoyé', {
        channelId: channel.id,
        guildId: channel.guild?.id,
        scheduledTime: new Date().toISOString()
      });
    } catch (error) {
      Logger.error('Erreur lors de l\'envoi du message de rappel hebdomadaire', {
        error: error.message,
        stack: error.stack,
        configLogChannelId: config.logChannelId
      });
    }
  }

  /**
   * Crée le contenu du message de rappel hebdomadaire
   * @returns {string} Contenu du message
   */
  createReminderMessage() {
    return `
Bonjour à toutes et à tous,

Merci de faire preuve de courtoisie et de bienveillance dans vos échanges. Ce qui se dit sur ce serveur reste sur ce serveur. Inutile de prêter attention à ceux qui cherchent à nuire : ne leur donnez pas d'importance, ignorez-les et restez au-dessus de ce genre de comportements.

Nous sommes ici pour nous entraider, pas pour créer des tensions ou des problèmes inutiles. Toute personne qui cherchera délibérément à envenimer la situation sera immédiatement exclue, sans autre avertissement.

🔔 Petit rappel important :
Nous ne sommes en aucun cas affiliés à Studi. Ce serveur est totalement indépendant et nous tenons à ce qu'il le reste !

Merci à toutes et à tous pour votre compréhension.
`;
  }

  /**
   * Vérifie les projets dont l'échéance approche
   */
  async checkProjectDueDates() {
    try {
      // Date actuelle et date dans 3 jours
      const currentDate = new Date();
      const threeDaysFromNow = new Date();
      threeDaysFromNow.setDate(currentDate.getDate() + 3);
      
      // Formatter les dates pour la requête SQL
      const formattedDate = threeDaysFromNow.toISOString().split('T')[0];
      
      // Récupérer les projets qui arrivent à échéance dans 3 jours
      const [projects] = await db.query(`
        SELECT p.id, p.name, p.description, p.due_date, c.id AS channel_id 
        FROM projects p
        LEFT JOIN project_channels c ON p.id = c.project_id
        WHERE p.due_date = ? AND p.status != 'completed'
      `, [formattedDate]);
      
      // Envoyer des notifications pour chaque projet
      for (const project of projects) {
        await this.sendProjectDueDateReminder(project);
      }
      
      Logger.info(`Vérification des échéances de projets terminée`, {
        projectsCount: projects.length,
        checkDate: formattedDate
      });
    } catch (error) {
      Logger.error('Erreur lors de la vérification des échéances de projets', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Envoie un rappel pour un projet dont l'échéance approche
   * @param {Object} project - Données du projet
   */
  async sendProjectDueDateReminder(project) {
    try {
      // Si le projet a un canal dédié, envoyer le message dans ce canal
      if (project.channel_id) {
        const channel = this.client.channels.cache.get(project.channel_id);
        
        if (channel) {
          await channel.send(`
⚠️ **RAPPEL D'ÉCHÉANCE** ⚠️

Le projet **${project.name}** arrive à échéance dans 3 jours (le ${project.due_date}).
Description: ${project.description}

Merci de vous assurer que toutes les tâches sont terminées à temps.
          `);
          
          Logger.info(`Rappel d'échéance envoyé pour le projet`, {
            projectId: project.id,
            projectName: project.name,
            dueDate: project.due_date,
            channelId: project.channel_id
          });
        }
      }
    } catch (error) {
      Logger.error('Erreur lors de l\'envoi du rappel d\'échéance', {
        error: error.message,
        stack: error.stack,
        projectId: project.id,
        projectName: project.name
      });
    }
  }

  /**
   * Nettoie les logs anciens de la base de données
   */
  async cleanOldLogs() {
    try {
      // Supprimer les logs de plus de 30 jours
      const [result] = await db.query(`
        DELETE FROM logs 
        WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)
      `);
      
      Logger.info('Nettoyage des logs anciens terminé', {
        deletedLogsCount: result.affectedRows
      });
    } catch (error) {
      Logger.error('Erreur lors du nettoyage des logs anciens', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Synchronise les projets avec GitHub
   */
  async syncGitHubProjects() {
    try {
      // Récupérer les intégrations GitHub actives
      const [integrations] = await db.query(`
        SELECT i.id, i.project_id, i.external_id, i.config, p.name AS project_name
        FROM integrations i
        JOIN projects p ON i.project_id = p.id
        WHERE i.type = 'github' AND i.is_active = 1
      `);
      
      Logger.info('Synchronisation GitHub démarrée', {
        integrationsCount: integrations.length
      });
      
      // Logique de synchronisation à implémenter
    } catch (error) {
      Logger.error('Erreur lors de la synchronisation GitHub', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Synchronise les projets avec Trello
   */
  async syncTrelloProjects() {
    try {
      // Récupérer les intégrations Trello actives
      const [integrations] = await db.query(`
        SELECT i.id, i.project_id, i.external_id, i.config, p.name AS project_name
        FROM integrations i
        JOIN projects p ON i.project_id = p.id
        WHERE i.type = 'trello' AND i.is_active = 1
      `);
      
      Logger.info('Synchronisation Trello démarrée', {
        integrationsCount: integrations.length
      });
      
      // Logique de synchronisation à implémenter
    } catch (error) {
      Logger.error('Erreur lors de la synchronisation Trello', {
        error: error.message,
        stack: error.stack
      });
    }
  }
}

/**
 * Événement pour l'initialisation des tâches planifiées
 */
class ScheduleTasksEvent {
  constructor() {
    this.name = 'clientReady';
    this.once = true;
  }

  /**
   * Exécute l'initialisation des tâches planifiées
   * @param {Client} client - Le client Discord
   */
  async execute(client) {
    const tasksManager = new ScheduledTasksManager(client);
    tasksManager.init();
    
    // Attacher le gestionnaire au client pour référence future
    client.tasksManager = tasksManager;
  }
}

export default new ScheduleTasksEvent(); 