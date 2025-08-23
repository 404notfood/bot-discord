/**
 * Script de déploiement des commandes slash
 * Exécuter ce script pour enregistrer les commandes auprès de l'API Discord
 */

import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import * as Logger from './utils/logger.js';

// Configuration pour les imports ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Logger.init({ logLevel: config.logLevel });

/**
 * Fonction principale pour déployer les commandes
 * @param {boolean} isGlobal - Si les commandes doivent être déployées globalement
 */
async function deployCommands(isGlobal = false) {
  try {
    // Initialisation
    Logger.info(`Déploiement des commandes ${isGlobal ? 'globales' : 'pour le serveur'} en cours...`);
    
    const commands = [];
    const commandsPath = path.join(__dirname, 'commands');
    const commandCategories = fs.readdirSync(commandsPath);
    
    // Récupérer toutes les commandes dans le dossier commands
    for (const category of commandCategories) {
      const categoryPath = path.join(commandsPath, category);
      
      if (fs.statSync(categoryPath).isDirectory()) {
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
        
        for (const file of commandFiles) {
          try {
            const filePath = path.join(categoryPath, file);
            const command = await import(`file://${filePath}`);
            
            if ('default' in command && 'data' in command.default && command.default.data.toJSON) {
              commands.push(command.default.data.toJSON());
              Logger.debug(`Commande ajoutée: ${command.default.data.name}`, { path: filePath });
            } else {
              Logger.warn(`La commande ${file} n'a pas le format attendu.`);
            }
          } catch (error) {
            Logger.error(`Erreur lors du chargement de la commande ${file}:`, { error: error.message });
          }
        }
      }
    }
    
    if (commands.length === 0) {
      Logger.warn('Aucune commande à déployer.');
      return;
    }
    
    // Initialiser le client REST
    const rest = new REST({ version: '10' }).setToken(config.token);
    
    // Déployer les commandes
    if (isGlobal) {
      // Commandes globales
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands },
      );
      Logger.info(`${commands.length} commandes globales déployées avec succès.`);
    } else {
      // Commandes spécifiques à un serveur
      if (!config.guildId) {
        Logger.error('GUILD_ID n\'est pas défini dans le fichier .env. Impossible de déployer les commandes de guilde.');
        return;
      }
      
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands },
      );
      Logger.info(`${commands.length} commandes déployées avec succès sur le serveur ${config.guildId}.`);
    }
  } catch (error) {
    Logger.error('Erreur lors du déploiement des commandes:', { error: error.message });
  }
}

// Déterminer si le déploiement doit être global ou spécifique à un serveur
const isGlobal = process.argv.includes('--global');

// Exécuter le déploiement
deployCommands(isGlobal); 