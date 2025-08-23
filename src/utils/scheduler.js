/**
 * Module de planification des tâches pour le bot Discord
 */

import nodeCron from 'node-cron';
import * as Logger from './logger.js';

/**
 * Liste des tâches planifiées actives
 * @type {Map<string, { task: nodeCron.ScheduledTask, pattern: string, options: Object, description: string }>}
 */
const activeTasks = new Map();

/**
 * Planifie une tâche à exécuter selon un pattern cron
 * @param {string} cronPattern - Pattern cron (ex: "0 * * * *" pour chaque heure)
 * @param {Function} taskFunction - Fonction à exécuter
 * @param {Object} options - Options de planification
 * @param {string} options.taskId - Identifiant unique de la tâche (généré automatiquement si non fourni)
 * @param {string} options.description - Description de la tâche
 * @param {string} options.timezone - Fuseau horaire (par défaut: "Europe/Paris")
 * @returns {Object} Tâche planifiée avec méthodes de contrôle
 */
export function scheduleTask(cronPattern, taskFunction, options = {}) {
  try {
    // Vérifier la validité du pattern cron
    if (!nodeCron.validate(cronPattern)) {
      throw new Error(`Pattern cron invalide: ${cronPattern}`);
    }
    
    // Configurer les options avec des valeurs par défaut
    const taskOptions = {
      timezone: "Europe/Paris",
      ...options
    };
    
    // Wrapper la fonction de tâche pour ajouter des logs
    const wrappedTaskFunction = async (...args) => {
      try {
        const startTime = Date.now();
        Logger.debug(`Exécution de la tâche planifiée: ${taskOptions.description || 'Sans description'}`, {
          cronPattern,
          taskId: taskOptions.taskId
        });
        
        // Exécuter la tâche
        await taskFunction(...args);
        
        const duration = Date.now() - startTime;
        Logger.debug(`Tâche planifiée terminée en ${duration}ms`, {
          cronPattern,
          taskId: taskOptions.taskId
        });
      } catch (error) {
        Logger.error(`Erreur lors de l'exécution de la tâche planifiée: ${taskOptions.description || 'Sans description'}`, {
          error: error.message,
          stack: error.stack,
          cronPattern,
          taskId: taskOptions.taskId
        });
      }
    };
    
    // Créer la tâche planifiée
    const task = nodeCron.schedule(cronPattern, wrappedTaskFunction, {
      timezone: taskOptions.timezone,
      scheduled: true
    });
    
    // Générer un ID unique pour la tâche si non fourni
    const taskId = taskOptions.taskId || `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Enregistrer la tâche dans la liste des tâches actives
    activeTasks.set(taskId, {
      task,
      pattern: cronPattern,
      options: taskOptions,
      description: taskOptions.description || 'Sans description'
    });
    
    Logger.info(`Tâche planifiée créée: ${taskOptions.description || 'Sans description'}`, {
      cronPattern,
      taskId,
      timezone: taskOptions.timezone
    });
    
    // Retourner un objet avec des méthodes de contrôle
    return {
      task,
      taskId,
      stop: () => stopTask(taskId),
      restart: () => restartTask(taskId)
    };
  } catch (error) {
    Logger.error('Erreur lors de la planification de la tâche', {
      error: error.message,
      stack: error.stack,
      cronPattern
    });
    throw error;
  }
}

/**
 * Arrête une tâche planifiée
 * @param {string} taskId - Identifiant de la tâche
 * @returns {boolean} Succès de l'opération
 */
export function stopTask(taskId) {
  try {
    if (activeTasks.has(taskId)) {
      const { task, description } = activeTasks.get(taskId);
      task.stop();
      
      Logger.info(`Tâche planifiée arrêtée: ${description}`, { taskId });
      return true;
    }
    
    Logger.warn(`Tentative d'arrêt d'une tâche inexistante`, { taskId });
    return false;
  } catch (error) {
    Logger.error('Erreur lors de l\'arrêt de la tâche planifiée', {
      error: error.message,
      stack: error.stack,
      taskId
    });
    return false;
  }
}

/**
 * Redémarre une tâche planifiée
 * @param {string} taskId - Identifiant de la tâche
 * @returns {boolean} Succès de l'opération
 */
export function restartTask(taskId) {
  try {
    if (activeTasks.has(taskId)) {
      const { task, description } = activeTasks.get(taskId);
      task.start();
      
      Logger.info(`Tâche planifiée redémarrée: ${description}`, { taskId });
      return true;
    }
    
    Logger.warn(`Tentative de redémarrage d'une tâche inexistante`, { taskId });
    return false;
  } catch (error) {
    Logger.error('Erreur lors du redémarrage de la tâche planifiée', {
      error: error.message,
      stack: error.stack,
      taskId
    });
    return false;
  }
}

/**
 * Récupère toutes les tâches planifiées actives
 * @returns {Array} Liste des tâches planifiées
 */
export function getActiveTasks() {
  return Array.from(activeTasks.entries()).map(([taskId, taskInfo]) => ({
    taskId,
    description: taskInfo.description,
    pattern: taskInfo.pattern,
    timezone: taskInfo.options.timezone
  }));
}

export default {
  scheduleTask,
  stopTask,
  restartTask,
  getActiveTasks
}; 