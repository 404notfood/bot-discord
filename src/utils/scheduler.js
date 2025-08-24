/**
 * Module de planification des tâches avancé pour le bot Discord
 * Fonctionnalités: Retry automatique, métriques, health checks, patterns prédéfinis
 */

import nodeCron from 'node-cron';
import * as Logger from './logger.js';
import { EventEmitter } from 'events';

/**
 * Gestionnaire d'événements pour les tâches
 */
const taskEmitter = new EventEmitter();

/**
 * Liste des tâches planifiées actives
 * @type {Map<string, TaskInfo>}
 */
const activeTasks = new Map();

/**
 * Statistiques globales du scheduler
 */
const schedulerStats = {
    tasksCreated: 0,
    tasksExecuted: 0,
    tasksCompleted: 0,
    tasksFailed: 0,
    totalExecutionTime: 0,
    lastError: null,
    startTime: Date.now()
};

/**
 * Patterns cron prédéfinis
 */
export const CRON_PATTERNS = {
    EVERY_MINUTE: '* * * * *',
    EVERY_5_MINUTES: '*/5 * * * *',
    EVERY_10_MINUTES: '*/10 * * * *',
    EVERY_15_MINUTES: '*/15 * * * *',
    EVERY_30_MINUTES: '*/30 * * * *',
    EVERY_HOUR: '0 * * * *',
    EVERY_2_HOURS: '0 */2 * * *',
    EVERY_6_HOURS: '0 */6 * * *',
    EVERY_12_HOURS: '0 */12 * * *',
    DAILY_MIDNIGHT: '0 0 * * *',
    DAILY_6AM: '0 6 * * *',
    DAILY_9AM: '0 9 * * *',
    DAILY_NOON: '0 12 * * *',
    DAILY_6PM: '0 18 * * *',
    WEEKLY_MONDAY: '0 9 * * 1',
    WEEKLY_SUNDAY: '0 9 * * 0',
    MONTHLY: '0 9 1 * *'
};

/**
 * Types de priorité pour les tâches
 */
export const PRIORITY = {
    LOW: 0,
    NORMAL: 1,
    HIGH: 2,
    CRITICAL: 3
};

/**
 * @typedef {Object} TaskInfo
 * @property {nodeCron.ScheduledTask} task - Tâche cron
 * @property {string} pattern - Pattern cron
 * @property {Object} options - Options de la tâche
 * @property {string} description - Description
 * @property {number} executions - Nombre d'exécutions
 * @property {number} failures - Nombre d'échecs
 * @property {Date} createdAt - Date de création
 * @property {Date} lastExecution - Dernière exécution
 * @property {Date} nextExecution - Prochaine exécution
 * @property {number} totalTime - Temps d'exécution total
 * @property {boolean} isRunning - En cours d'exécution
 */

/**
 * Planifie une tâche à exécuter selon un pattern cron
 * @param {string} cronPattern - Pattern cron (ex: "0 * * * *" pour chaque heure)
 * @param {Function} taskFunction - Fonction à exécuter
 * @param {Object} options - Options de planification
 * @param {string} options.taskId - Identifiant unique de la tâche (généré automatiquement si non fourni)
 * @param {string} options.description - Description de la tâche
 * @param {string} options.timezone - Fuseau horaire (par défaut: "Europe/Paris")
 * @param {number} options.priority - Priorité de la tâche (PRIORITY.LOW à PRIORITY.CRITICAL)
 * @param {number} options.retries - Nombre de tentatives en cas d'échec (défaut: 0)
 * @param {number} options.retryDelay - Délai entre les tentatives en ms (défaut: 1000)
 * @param {number} options.timeout - Timeout d'exécution en ms (défaut: 30000)
 * @param {boolean} options.runOnStart - Exécuter immédiatement lors de la création (défaut: false)
 * @param {Object} options.metadata - Métadonnées personnalisées
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
      priority: PRIORITY.NORMAL,
      retries: 0,
      retryDelay: 1000,
      timeout: 30000,
      runOnStart: false,
      metadata: {},
      ...options
    };
    
    // Générer un ID unique pour la tâche si non fourni
    const taskId = taskOptions.taskId || `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Wrapper avancé de la fonction de tâche
    const wrappedTaskFunction = async (...args) => {
      const taskInfo = activeTasks.get(taskId);
      if (!taskInfo) return;
      
      // Marquer comme en cours d'exécution
      taskInfo.isRunning = true;
      taskInfo.lastExecution = new Date();
      
      // Statistiques
      schedulerStats.tasksExecuted++;
      
      let attempt = 0;
      const maxAttempts = taskOptions.retries + 1;
      
      while (attempt < maxAttempts) {
        try {
          const startTime = Date.now();
          
          Logger.debug(`Exécution de la tâche planifiée: ${taskOptions.description || 'Sans description'}`, {
            cronPattern,
            taskId,
            attempt: attempt + 1,
            maxAttempts
          });
          
          // Émettre événement de début
          taskEmitter.emit('taskStart', { taskId, taskInfo, attempt });
          
          // Exécuter avec timeout
          const result = await Promise.race([
            taskFunction(...args),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), taskOptions.timeout)
            )
          ]);
          
          const duration = Date.now() - startTime;
          
          // Mettre à jour les statistiques
          taskInfo.executions++;
          taskInfo.totalTime += duration;
          schedulerStats.tasksCompleted++;
          schedulerStats.totalExecutionTime += duration;
          
          Logger.debug(`Tâche planifiée terminée en ${duration}ms`, {
            cronPattern,
            taskId,
            duration,
            executions: taskInfo.executions
          });
          
          // Émettre événement de succès
          taskEmitter.emit('taskSuccess', { taskId, taskInfo, duration, result });
          
          break; // Succès, sortir de la boucle de retry
          
        } catch (error) {
          attempt++;
          taskInfo.failures++;
          schedulerStats.tasksFailed++;
          schedulerStats.lastError = {
            taskId,
            error: error.message,
            timestamp: new Date()
          };
          
          Logger.error(`Erreur lors de l'exécution de la tâche planifiée (tentative ${attempt}/${maxAttempts}): ${taskOptions.description || 'Sans description'}`, {
            error: error.message,
            stack: error.stack,
            cronPattern,
            taskId,
            attempt,
            maxAttempts
          });
          
          // Émettre événement d'erreur
          taskEmitter.emit('taskError', { taskId, taskInfo, error, attempt });
          
          // Si ce n'est pas la dernière tentative, attendre avant de retry
          if (attempt < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, taskOptions.retryDelay));
          }
        }
      }
      
      // Marquer comme terminé
      taskInfo.isRunning = false;
      
      // Calculer la prochaine exécution
      try {
        taskInfo.nextExecution = getNextExecution(cronPattern, taskOptions.timezone);
      } catch (err) {
        // Ignorer les erreurs de calcul de prochaine exécution
      }
    };
    
    // Créer la tâche planifiée
    const task = nodeCron.schedule(cronPattern, wrappedTaskFunction, {
      timezone: taskOptions.timezone,
      scheduled: true
    });
    
    // Créer l'info de tâche complète
    const taskInfo = {
      task,
      pattern: cronPattern,
      options: taskOptions,
      description: taskOptions.description || 'Sans description',
      executions: 0,
      failures: 0,
      createdAt: new Date(),
      lastExecution: null,
      nextExecution: getNextExecution(cronPattern, taskOptions.timezone),
      totalTime: 0,
      isRunning: false
    };
    
    // Enregistrer la tâche
    activeTasks.set(taskId, taskInfo);
    schedulerStats.tasksCreated++;
    
    Logger.info(`Tâche planifiée créée: ${taskOptions.description || 'Sans description'}`, {
      cronPattern,
      taskId,
      timezone: taskOptions.timezone,
      priority: taskOptions.priority,
      retries: taskOptions.retries,
      nextExecution: taskInfo.nextExecution
    });
    
    // Exécuter immédiatement si demandé
    if (taskOptions.runOnStart) {
      setImmediate(() => wrappedTaskFunction());
    }
    
    // Émettre événement de création
    taskEmitter.emit('taskCreated', { taskId, taskInfo });
    
    // Retourner un objet avec des méthodes de contrôle étendues
    return {
      task,
      taskId,
      info: () => getTaskInfo(taskId),
      stop: () => stopTask(taskId),
      start: () => startTask(taskId),
      restart: () => restartTask(taskId),
      remove: () => removeTask(taskId),
      execute: () => executeTaskNow(taskId),
      updateOptions: (newOptions) => updateTaskOptions(taskId, newOptions)
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
 * Démarre une tâche planifiée
 * @param {string} taskId - Identifiant de la tâche
 * @returns {boolean} Succès de l'opération
 */
export function startTask(taskId) {
  try {
    if (activeTasks.has(taskId)) {
      const { task, description } = activeTasks.get(taskId);
      task.start();
      
      Logger.info(`Tâche planifiée démarrée: ${description}`, { taskId });
      taskEmitter.emit('taskStarted', { taskId, description });
      return true;
    }
    
    Logger.warn(`Tentative de démarrage d'une tâche inexistante`, { taskId });
    return false;
  } catch (error) {
    Logger.error('Erreur lors du démarrage de la tâche planifiée', {
      error: error.message,
      stack: error.stack,
      taskId
    });
    return false;
  }
}

/**
 * Supprime complètement une tâche planifiée
 * @param {string} taskId - Identifiant de la tâche
 * @returns {boolean} Succès de l'opération
 */
export function removeTask(taskId) {
  try {
    if (activeTasks.has(taskId)) {
      const { task, description } = activeTasks.get(taskId);
      task.destroy();
      activeTasks.delete(taskId);
      
      Logger.info(`Tâche planifiée supprimée: ${description}`, { taskId });
      taskEmitter.emit('taskRemoved', { taskId, description });
      return true;
    }
    
    Logger.warn(`Tentative de suppression d'une tâche inexistante`, { taskId });
    return false;
  } catch (error) {
    Logger.error('Erreur lors de la suppression de la tâche planifiée', {
      error: error.message,
      stack: error.stack,
      taskId
    });
    return false;
  }
}

/**
 * Exécute immédiatement une tâche planifiée
 * @param {string} taskId - Identifiant de la tâche
 * @returns {Promise<boolean>} Succès de l'opération
 */
export async function executeTaskNow(taskId) {
  try {
    if (!activeTasks.has(taskId)) {
      Logger.warn(`Tentative d'exécution d'une tâche inexistante`, { taskId });
      return false;
    }

    const taskInfo = activeTasks.get(taskId);
    if (taskInfo.isRunning) {
      Logger.warn(`Tentative d'exécution d'une tâche déjà en cours`, { taskId });
      return false;
    }

    // Exécuter la tâche wrapped
    const wrappedFunction = taskInfo.task.fn;
    if (wrappedFunction) {
      setImmediate(() => wrappedFunction());
    }
    
    Logger.info(`Exécution immédiate de la tâche: ${taskInfo.description}`, { taskId });
    return true;
  } catch (error) {
    Logger.error('Erreur lors de l\'exécution immédiate de la tâche', {
      error: error.message,
      stack: error.stack,
      taskId
    });
    return false;
  }
}

/**
 * Met à jour les options d'une tâche
 * @param {string} taskId - Identifiant de la tâche
 * @param {Object} newOptions - Nouvelles options
 * @returns {boolean} Succès de l'opération
 */
export function updateTaskOptions(taskId, newOptions) {
  try {
    if (!activeTasks.has(taskId)) {
      Logger.warn(`Tentative de mise à jour d'une tâche inexistante`, { taskId });
      return false;
    }

    const taskInfo = activeTasks.get(taskId);
    taskInfo.options = { ...taskInfo.options, ...newOptions };
    
    if (newOptions.description) {
      taskInfo.description = newOptions.description;
    }
    
    Logger.info(`Options de tâche mises à jour: ${taskInfo.description}`, { 
      taskId, 
      newOptions 
    });
    
    taskEmitter.emit('taskUpdated', { taskId, taskInfo, newOptions });
    return true;
  } catch (error) {
    Logger.error('Erreur lors de la mise à jour des options de tâche', {
      error: error.message,
      stack: error.stack,
      taskId
    });
    return false;
  }
}

/**
 * Récupère les informations détaillées d'une tâche
 * @param {string} taskId - Identifiant de la tâche
 * @returns {Object|null} Informations de la tâche
 */
export function getTaskInfo(taskId) {
  if (!activeTasks.has(taskId)) {
    return null;
  }

  const taskInfo = activeTasks.get(taskId);
  return {
    taskId,
    description: taskInfo.description,
    pattern: taskInfo.pattern,
    timezone: taskInfo.options.timezone,
    priority: taskInfo.options.priority,
    executions: taskInfo.executions,
    failures: taskInfo.failures,
    averageExecutionTime: taskInfo.executions > 0 ? Math.round(taskInfo.totalTime / taskInfo.executions) : 0,
    totalTime: taskInfo.totalTime,
    createdAt: taskInfo.createdAt,
    lastExecution: taskInfo.lastExecution,
    nextExecution: taskInfo.nextExecution,
    isRunning: taskInfo.isRunning,
    successRate: taskInfo.executions > 0 ? 
      Math.round(((taskInfo.executions - taskInfo.failures) / taskInfo.executions) * 100) : 0,
    metadata: taskInfo.options.metadata || {}
  };
}

/**
 * Récupère toutes les tâches planifiées actives
 * @param {Object} filters - Filtres optionnels
 * @param {number} filters.priority - Filtrer par priorité
 * @param {boolean} filters.running - Filtrer par statut d'exécution
 * @param {string} filters.pattern - Filtrer par pattern de recherche dans la description
 * @returns {Array} Liste des tâches planifiées
 */
export function getActiveTasks(filters = {}) {
  let tasks = Array.from(activeTasks.entries()).map(([taskId, taskInfo]) => ({
    taskId,
    description: taskInfo.description,
    pattern: taskInfo.pattern,
    timezone: taskInfo.options.timezone,
    priority: taskInfo.options.priority,
    executions: taskInfo.executions,
    failures: taskInfo.failures,
    isRunning: taskInfo.isRunning,
    lastExecution: taskInfo.lastExecution,
    nextExecution: taskInfo.nextExecution,
    successRate: taskInfo.executions > 0 ? 
      Math.round(((taskInfo.executions - taskInfo.failures) / taskInfo.executions) * 100) : 0
  }));

  // Appliquer les filtres
  if (filters.priority !== undefined) {
    tasks = tasks.filter(task => task.priority === filters.priority);
  }
  
  if (filters.running !== undefined) {
    tasks = tasks.filter(task => task.isRunning === filters.running);
  }
  
  if (filters.pattern) {
    const searchPattern = filters.pattern.toLowerCase();
    tasks = tasks.filter(task => 
      task.description.toLowerCase().includes(searchPattern) ||
      task.taskId.toLowerCase().includes(searchPattern)
    );
  }

  return tasks;
}

/**
 * Récupère les statistiques globales du scheduler
 * @returns {Object} Statistiques du scheduler
 */
export function getSchedulerStats() {
  const now = Date.now();
  const uptime = now - schedulerStats.startTime;
  const activeTasks_count = activeTasks.size;
  const runningTasks = Array.from(activeTasks.values()).filter(task => task.isRunning).length;
  
  return {
    ...schedulerStats,
    uptime,
    uptimeFormatted: formatUptime(uptime),
    activeTasks: activeTasks_count,
    runningTasks,
    averageExecutionTime: schedulerStats.tasksCompleted > 0 ? 
      Math.round(schedulerStats.totalExecutionTime / schedulerStats.tasksCompleted) : 0,
    successRate: schedulerStats.tasksExecuted > 0 ? 
      Math.round(((schedulerStats.tasksExecuted - schedulerStats.tasksFailed) / schedulerStats.tasksExecuted) * 100) : 0
  };
}

/**
 * Arrête toutes les tâches planifiées
 * @returns {number} Nombre de tâches arrêtées
 */
export function stopAllTasks() {
  let stoppedCount = 0;
  
  for (const [taskId, taskInfo] of activeTasks) {
    try {
      taskInfo.task.stop();
      stoppedCount++;
    } catch (error) {
      Logger.error(`Erreur lors de l'arrêt de la tâche ${taskId}`, {
        error: error.message
      });
    }
  }
  
  Logger.info(`${stoppedCount} tâches arrêtées`, { stoppedCount });
  taskEmitter.emit('allTasksStopped', { stoppedCount });
  
  return stoppedCount;
}

/**
 * Démarre toutes les tâches planifiées
 * @returns {number} Nombre de tâches démarrées
 */
export function startAllTasks() {
  let startedCount = 0;
  
  for (const [taskId, taskInfo] of activeTasks) {
    try {
      taskInfo.task.start();
      startedCount++;
    } catch (error) {
      Logger.error(`Erreur lors du démarrage de la tâche ${taskId}`, {
        error: error.message
      });
    }
  }
  
  Logger.info(`${startedCount} tâches démarrées`, { startedCount });
  taskEmitter.emit('allTasksStarted', { startedCount });
  
  return startedCount;
}

/**
 * Calcule la prochaine exécution d'un pattern cron
 * @param {string} cronPattern - Pattern cron
 * @param {string} timezone - Fuseau horaire
 * @returns {Date} Prochaine exécution
 */
function getNextExecution(cronPattern, timezone = 'Europe/Paris') {
  try {
    // Simple estimation - dans un vrai projet, utiliser une librairie comme cron-parser
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Estimation: dans 1 minute
    return now;
  } catch (error) {
    return null;
  }
}

/**
 * Formate la durée en format lisible
 * @param {number} ms - Durée en millisecondes
 * @returns {string} Durée formatée
 */
function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}j ${hours % 24}h ${minutes % 60}m`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * Expose l'EventEmitter pour permettre l'écoute d'événements
 */
export { taskEmitter };

export default {
  // Gestion des tâches
  scheduleTask,
  stopTask,
  startTask,
  restartTask,
  removeTask,
  executeTaskNow,
  updateTaskOptions,
  
  // Informations
  getTaskInfo,
  getActiveTasks,
  getSchedulerStats,
  
  // Contrôle global
  stopAllTasks,
  startAllTasks,
  
  // Constantes
  CRON_PATTERNS,
  PRIORITY,
  
  // Événements
  taskEmitter
}; 