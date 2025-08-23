/**
 * Point d'entrée principal du bot Discord
 */

import { Client, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import * as Logger from './utils/logger.js';
import * as DatabaseUtils from './utils/db.js';
import { initDatabase } from './utils/dbInit.js';
import ReminderManager from './utils/reminderManager.js';
import ApiServer from './api/apiServer.js';

// Configuration pour les imports ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Classe principale du bot Discord
 */
class DiscordBot {
  /**
   * Initialise une nouvelle instance du bot
   */
  constructor() {
    // Créer le client avec les intents configurés
    this.client = new Client({
      intents: config.intents,
      partials: config.partials
    });
    
    // Collection pour stocker les commandes
    this.client.commands = new Collection();
    
    // Gestionnaire de rappels
    this.reminderManager = null;
    
    // Serveur API
    this.apiServer = null;
  }

  /**
   * Charge toutes les commandes depuis les répertoires de commandes
   */
  async loadCommands() {
    const commandsPath = path.join(__dirname, 'commands');
    const commandCategories = fs.readdirSync(commandsPath);
    
    // Parcourir chaque catégorie (dossier) de commandes
    for (const category of commandCategories) {
      const categoryPath = path.join(commandsPath, category);
      
      if (fs.statSync(categoryPath).isDirectory()) {
        await this.loadCommandsFromDirectory(categoryPath);
      }
    }
    
    Logger.info(`${this.client.commands.size} commandes chargées`);
  }

  /**
   * Charge les commandes depuis un répertoire spécifique
   * @param {string} directoryPath - Chemin du répertoire
   */
  async loadCommandsFromDirectory(directoryPath) {
    const commandFiles = fs.readdirSync(directoryPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      try {
        const filePath = path.join(directoryPath, file);
        const commandModule = await import(`file://${filePath}`);
        const command = commandModule.default;
        
        // Vérifier que la commande a les propriétés requises
        if ('data' in command && ('execute' in command || 'run' in command)) {
          // Si la commande a run mais pas execute, créer un alias execute -> run
          if (!('execute' in command) && 'run' in command) {
            command.execute = command.run;
          }
          // Si la commande a execute mais pas run, créer un alias run -> execute
          else if ('execute' in command && !('run' in command)) {
            command.run = command.execute;
          }
          
          this.client.commands.set(command.data.name, command);
          Logger.debug(`Commande chargée: ${command.data.name}`, { path: filePath });
        } else {
          Logger.warn(`La commande ${file} ne contient pas les propriétés "data" et ("execute" ou "run") requises.`);
        }
      } catch (error) {
        Logger.error(`Erreur lors du chargement de la commande ${file}:`, { error: error.message });
      }
    }
  }

  /**
   * Charge tous les gestionnaires d'événements
   */
  async loadEvents() {
    const eventsPath = path.join(__dirname, 'events');
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    
    for (const file of eventFiles) {
      try {
        const filePath = path.join(eventsPath, file);
        const eventModule = await import(`file://${filePath}`);
        const event = eventModule.default;
        
        if (event.once) {
          this.client.once(event.name, (...args) => event.execute(...args, this.client));
        } else {
          this.client.on(event.name, (...args) => event.execute(...args, this.client));
        }
        
        Logger.debug(`Événement chargé: ${event.name}`, { path: filePath });
      } catch (error) {
        Logger.error(`Erreur lors du chargement de l'événement ${file}:`, { error: error.message });
      }
    }
    
    Logger.info(`${eventFiles.length} événements chargés`);
  }

  /**
   * Initialise la connexion à la base de données
   */
  async initDatabase() {
    try {
      // Utiliser le nouvel utilitaire d'initialisation de base de données
      const dbInitialized = await initDatabase();
      
      if (dbInitialized) {
        Logger.info('Base de données initialisée et connectée avec succès');
      } else {
        // La fonction initDatabase gère déjà ses propres logs d'erreur
        Logger.warn('Fonctionnement en mode limité sans base de données complète');
      }
    } catch (error) {
      Logger.error('Erreur lors de l\'initialisation de la base de données:', { 
        error: error.message,
        stack: error.stack
      });
      Logger.warn('Le bot fonctionnera sans base de données. Certaines fonctionnalités seront limitées.');
    }
  }
  
  /**
   * Initialise le gestionnaire de rappels
   */
  async initReminderManager() {
    try {
      this.reminderManager = new ReminderManager(this.client);
      await this.reminderManager.initialize();
      Logger.info('Gestionnaire de rappels initialisé avec succès');
    } catch (error) {
      Logger.error('Erreur lors de l\'initialisation du gestionnaire de rappels:', { 
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  /**
   * Initialise le serveur API
   */
  async initApiServer() {
    try {
      this.apiServer = new ApiServer(this.client, this.reminderManager);
      this.apiServer.start();
    } catch (error) {
      Logger.error('Erreur lors de l\'initialisation du serveur API:', { 
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Démarre le bot Discord
   */
  async start() {
    try {
      // Initialiser le logger
      Logger.init({ logLevel: config.logLevel });
      Logger.info('Démarrage du bot...');
      
      // Connexion à la base de données
      await this.initDatabase();
      
      // Chargement des commandes et événements
      await this.loadCommands();
      await this.loadEvents();
      
      // Connexion à l'API Discord
      await this.client.login(config.token);
      
      // Une fois connecté, initialiser le gestionnaire de rappels et le serveur API
      this.client.once('ready', async () => {
        await this.initReminderManager();
        await this.initApiServer();
      });
    } catch (error) {
      Logger.fatal('Erreur critique lors du démarrage du bot:', { error: error.message });
      process.exit(1);
    }
  }
  
  /**
   * Arrête proprement le bot
   */
  async stop() {
    try {
      // Arrêter le serveur API s'il existe
      if (this.apiServer) {
        this.apiServer.stop();
      }
      
      // Déconnecter le client Discord
      if (this.client) {
        this.client.destroy();
      }
      
      Logger.info('Bot arrêté proprement');
    } catch (error) {
      Logger.error('Erreur lors de l\'arrêt du bot:', { error: error.message });
    }
  }
}

// Instancier et démarrer le bot
const bot = new DiscordBot();
bot.start();

// Gérer les signaux d'arrêt pour un arrêt propre
process.on('SIGINT', async () => {
  Logger.info('Signal d\'interruption reçu');
  await bot.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('Signal de terminaison reçu');
  await bot.stop();
  process.exit(0);
}); 