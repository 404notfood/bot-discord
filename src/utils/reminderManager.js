/**
 * Gestionnaire de rappels pour le bot Discord
 */

import { scheduleTask } from './scheduler.js';
import * as db from './db.js';
import * as Logger from './logger.js';

class ReminderManager {
  constructor(client) {
    this.client = client;
    this.tasks = new Map();
  }

  /**
   * Initialiser tous les rappels depuis la base de données
   */
  async initialize() {
    try {
      // Récupérer tous les rappels actifs de la base de données
      const [reminders] = await db.query(
        'SELECT * FROM reminders WHERE is_completed = 0'
      );

      Logger.info(`Initialisation de ${reminders.length} rappels...`);

      // Planifier chaque rappel
      let successCount = 0;
      for (const reminder of reminders) {
        const success = await this.scheduleReminder(reminder);
        if (success) successCount++;
      }

      Logger.info(`${successCount} rappels initialisés avec succès.`);
    } catch (error) {
      Logger.error('Erreur lors de l\'initialisation des rappels:', {
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Planifier un rappel
   * @param {Object} reminder Données du rappel
   */
  async scheduleReminder(reminder) {
    try {
      // Vérifier si nous avons une date future pour ce rappel
      if (!reminder.remind_at) {
        Logger.error('Date de rappel manquante', { reminderId: reminder.id });
        return false;
      }
      
      const reminderDate = new Date(reminder.remind_at);
      const now = new Date();
      
      // Si la date est déjà passée
      if (reminderDate <= now) {
        Logger.info('Rappel déjà passé, marquage comme complété', { 
          reminderId: reminder.id,
          date: reminder.remind_at
        });
        
        // Marquer comme complété
        await db.query(
          'UPDATE reminders SET is_completed = 1 WHERE id = ?',
          [reminder.id]
        );
        
        return false;
      }
      
      // Si ce rappel est déjà planifié, l'annuler d'abord
      if (this.tasks.has(reminder.id)) {
        clearTimeout(this.tasks.get(reminder.id));
        this.tasks.delete(reminder.id);
      }

      // Calculer le délai en millisecondes jusqu'à la date du rappel
      const timeUntilReminder = reminderDate.getTime() - now.getTime();
      
      // Pour les rappels ponctuels, utiliser setTimeout
      const timeoutId = setTimeout(() => {
        this.executeReminder(reminder.id);
      }, timeUntilReminder);

      // Stocker l'ID du timeout avec l'ID du rappel pour pouvoir l'annuler plus tard
      this.tasks.set(reminder.id, timeoutId);

      Logger.info(`Rappel planifié avec succès`, {
        reminderId: reminder.id,
        message: reminder.message.substring(0, 30),
        date: reminder.remind_at,
        channelId: reminder.channel_id,
        executeIn: Math.round(timeUntilReminder / (1000 * 60)) + ' minutes'
      });

      return true;
    } catch (error) {
      Logger.error('Erreur lors de la planification du rappel:', {
        error: error.message,
        stack: error.stack,
        reminderId: reminder.id
      });
      return false;
    }
  }

  /**
   * Générer une expression cron à partir des paramètres du rappel
   * @param {Object} reminder Données du rappel
   * @returns {string|null} Expression cron ou null si invalide
   */
  generateCronExpression(reminder) {
    // Cette méthode n'est plus utilisée car nous utilisons directement des dates
    // au lieu d'expressions cron pour les rappels ponctuels
    return null;
  }

  /**
   * Exécuter un rappel
   * @param {number} reminderId ID du rappel à exécuter
   */
  async executeReminder(reminderId) {
    try {
      // Récupérer les détails du rappel
      const [reminderRows] = await db.query(
        'SELECT * FROM reminders WHERE id = ?',
        [reminderId]
      );

      if (reminderRows.length === 0) {
        Logger.error('Rappel non trouvé lors de l\'exécution', { reminderId });
        return false;
      }

      const reminder = reminderRows[0];

      // Obtenir le canal où envoyer le message
      const channel = await this.client.channels.fetch(reminder.channel_id);
      
      if (!channel) {
        Logger.error('Canal non trouvé pour le rappel', { 
          reminderId,
          channelId: reminder.channel_id
        });
        return false;
      }

      // Construire le message
      let message = reminder.message;

      // Envoyer le message
      await channel.send(message);

      // Marquer le rappel comme complété
      await db.query(
        'UPDATE reminders SET is_completed = 1 WHERE id = ?',
        [reminderId]
      );

      Logger.info('Rappel exécuté avec succès', {
        reminderId,
        message: reminder.message.substring(0, 30),
        channelId: reminder.channel_id
      });

      return true;
    } catch (error) {
      Logger.error('Erreur lors de l\'exécution du rappel:', {
        error: error.message,
        stack: error.stack,
        reminderId
      });
      return false;
    }
  }

  /**
   * Mettre à jour un rappel
   * @param {Object} reminderData Données du rappel
   */
  async updateReminder(reminderData) {
    try {
      // Récupérer l'ID du rappel
      const reminderId = reminderData.reminder_id;
      
      // Vérifier si le rappel existe
      const [existingReminders] = await db.query(
        'SELECT id FROM reminders WHERE id = ?',
        [reminderId]
      );
      
      if (existingReminders.length === 0) {
        Logger.error('Tentative de mise à jour d\'un rappel inexistant', { reminderId });
        return false;
      }
      
      // Récupérer les données actuelles du rappel
      const [reminders] = await db.query(
        'SELECT * FROM reminders WHERE id = ?',
        [reminderId]
      );
      
      const reminder = reminders[0];
      
      // Replanifier le rappel
      const success = await this.scheduleReminder(reminder);
      
      if (success) {
        Logger.info('Rappel mis à jour avec succès', { reminderId });
      }
      
      return success;
    } catch (error) {
      Logger.error('Erreur lors de la mise à jour du rappel:', {
        error: error.message,
        stack: error.stack,
        reminderData
      });
      return false;
    }
  }

  /**
   * Supprimer un rappel
   * @param {number} reminderId ID du rappel à supprimer
   */
  async deleteReminder(reminderId) {
    try {
      // Si ce rappel est planifié, l'annuler
      if (this.tasks.has(reminderId)) {
        clearTimeout(this.tasks.get(reminderId));
        this.tasks.delete(reminderId);
      }
      
      Logger.info('Rappel supprimé avec succès', { reminderId });
      return true;
    } catch (error) {
      Logger.error('Erreur lors de la suppression du rappel:', {
        error: error.message,
        stack: error.stack,
        reminderId
      });
      return false;
    }
  }
}

export default ReminderManager; 