/**
 * Serveur API pour gérer les rappels
 */

import express from 'express';
import cors from 'cors';
import * as Logger from '../utils/logger.js';

class ApiServer {
  constructor(client, reminderManager) {
    this.client = client;
    this.reminderManager = reminderManager;
    this.app = express();
    this.port = process.env.API_PORT || 3000;
    
    // Configurer les middlewares
    this.app.use(cors());
    this.app.use(express.json());
    
    // Middleware d'authentification
    this.app.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Authentification requise' 
        });
      }
      
      const token = authHeader.substring(7); // Enlever 'Bearer '
      
      // Vérifier que le token correspond au token du bot
      if (token !== process.env.DISCORD_BOT_TOKEN) {
        return res.status(403).json({ 
          success: false, 
          message: 'Token invalide' 
        });
      }
      
      next();
    });
    
    // Configurer les routes
    this.setupRoutes();
  }
  
  /**
   * Configurer les routes de l'API
   */
  setupRoutes() {
    // Route de test
    this.app.get('/api/status', (req, res) => {
      res.json({ 
        success: true, 
        message: 'API fonctionnelle',
        bot: this.client.user.tag,
        uptime: this.client.uptime
      });
    });
    
    // Route pour mettre à jour un rappel
    this.app.post('/api/update_reminder', async (req, res) => {
      try {
        const reminderData = req.body;
        
        if (!reminderData || !reminderData.reminder_id) {
          return res.status(400).json({ 
            success: false, 
            message: 'Données du rappel manquantes ou incomplètes'
          });
        }
        
        const success = await this.reminderManager.updateReminder(reminderData);
        
        if (success) {
          res.json({ 
            success: true, 
            message: 'Rappel mis à jour avec succès'
          });
        } else {
          res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la mise à jour du rappel'
          });
        }
      } catch (error) {
        Logger.error('Erreur API - update_reminder:', {
          error: error.message,
          stack: error.stack
        });
        
        res.status(500).json({ 
          success: false, 
          message: 'Erreur interne du serveur'
        });
      }
    });
    
    // Route pour supprimer un rappel
    this.app.post('/api/delete_reminder', async (req, res) => {
      try {
        const { reminder_id } = req.body;
        
        if (!reminder_id) {
          return res.status(400).json({ 
            success: false, 
            message: 'ID du rappel manquant'
          });
        }
        
        const success = await this.reminderManager.deleteReminder(reminder_id);
        
        if (success) {
          res.json({ 
            success: true, 
            message: 'Rappel supprimé avec succès'
          });
        } else {
          res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la suppression du rappel'
          });
        }
      } catch (error) {
        Logger.error('Erreur API - delete_reminder:', {
          error: error.message,
          stack: error.stack
        });
        
        res.status(500).json({ 
          success: false, 
          message: 'Erreur interne du serveur'
        });
      }
    });
    
    // Route pour exécuter un rappel immédiatement
    this.app.post('/api/send_reminder_now', async (req, res) => {
      try {
        const { reminder_id } = req.body;
        
        if (!reminder_id) {
          return res.status(400).json({ 
            success: false, 
            message: 'ID du rappel manquant'
          });
        }
        
        const success = await this.reminderManager.executeReminder(reminder_id);
        
        if (success) {
          res.json({ 
            success: true, 
            message: 'Rappel envoyé avec succès'
          });
        } else {
          res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de l\'envoi du rappel'
          });
        }
      } catch (error) {
        Logger.error('Erreur API - send_reminder_now:', {
          error: error.message,
          stack: error.stack
        });
        
        res.status(500).json({ 
          success: false, 
          message: 'Erreur interne du serveur'
        });
      }
    });
  }
  
  /**
   * Démarrer le serveur API
   */
  start() {
    this.server = this.app.listen(this.port, () => {
      Logger.info(`Serveur API démarré sur le port ${this.port}`);
    });
  }
  
  /**
   * Arrêter le serveur API
   */
  stop() {
    if (this.server) {
      this.server.close();
      Logger.info('Serveur API arrêté');
    }
  }
}

export default ApiServer; 