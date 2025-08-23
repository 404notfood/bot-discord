/**
 * Script de déploiement pour les commandes administratives
 */

import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import * as Logger from './utils/logger.js';

// Configuration pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialiser le logger
Logger.init({ logLevel: config.logLevel });

// Vérifier si les informations nécessaires sont disponibles
if (!config.token || !config.clientId) {
  Logger.error('Token Discord ou ID client manquant dans la configuration');
  process.exit(1);
}

// Créer un client REST
const rest = new REST({ version: '10' }).setToken(config.token);

async function main() {
  try {
    Logger.info('Déploiement des commandes administratives...');
    
    // Liste des commandes à déployer
    const commands = [];
    
    // Charger les commandes administratives
    const commandsPath = path.join(__dirname, 'commands', 'admin');
    
    // Vérifier si le répertoire existe
    if (!fs.existsSync(commandsPath)) {
      Logger.error(`Le répertoire des commandes admin n'existe pas: ${commandsPath}`);
      return;
    }
    
    // Lire les fichiers du répertoire
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    
    // Liste des commandes administratives spécifiques à déployer
    // Si cette liste est vide, toutes les commandes seront déployées
    const targetCommands = ['db_status.js', 'db_fix.js'];
    
    // Filtrer les fichiers si la liste cible n'est pas vide
    const filesToDeploy = targetCommands.length ? 
      commandFiles.filter(file => targetCommands.includes(file)) : 
      commandFiles;
    
    for (const file of filesToDeploy) {
      const filePath = path.join(commandsPath, file);
      
      try {
        const commandModule = await import(`file://${filePath}`);
        const command = commandModule.default;
        
        if (command.data && typeof command.data.toJSON === 'function') {
          commands.push(command.data.toJSON());
          Logger.info(`Commande admin ajoutée: ${command.data.name}`);
        } else {
          Logger.warn(`La commande ${file} n'a pas de propriété data valide`);
        }
      } catch (error) {
        Logger.error(`Erreur lors du chargement de la commande ${file}:`, { 
          error: error.message,
          stack: error.stack 
        });
      }
    }
    
    if (commands.length === 0) {
      Logger.warn('Aucune commande admin valide à déployer');
      return;
    }
    
    // Déployer les commandes
    if (config.guildId) {
      // Déployer pour un serveur spécifique (plus rapide pour les tests)
      Logger.info(`Déploiement de ${commands.length} commandes admin pour le serveur ${config.guildId}...`);
      
      const data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      
      Logger.info(`${data.length} commandes admin déployées pour le serveur`);
    } else {
      // Déployer globalement (peut prendre jusqu'à une heure)
      Logger.info(`Déploiement de ${commands.length} commandes admin globalement...`);
      
      const data = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      
      Logger.info(`${data.length} commandes admin déployées globalement`);
    }
  } catch (error) {
    Logger.error('Erreur lors du déploiement des commandes admin:', { 
      error: error.message, 
      stack: error.stack 
    });
  }
}

main(); 