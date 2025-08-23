/**
 * Script de déploiement pour les commandes corrigées
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
    Logger.info('Déploiement des commandes corrigées...');
    
    // Liste des commandes à déployer
    const commands = [];
    
    // Chemin vers les commandes générales
    const commandsPath = path.join(__dirname, 'commands', 'general');
    
    // Liste des commandes spécifiques à déployer
    const targetCommands = ['docs.js', 'search.js'];
    
    // Charger uniquement les commandes ciblées
    for (const file of targetCommands) {
      const filePath = path.join(commandsPath, file);
      
      // Vérifier si le fichier existe
      if (!fs.existsSync(filePath)) {
        Logger.warn(`Fichier de commande non trouvé: ${filePath}`);
        continue;
      }
      
      try {
        const command = await import(`file://${filePath}`);
        
        if (command.default?.data) {
          commands.push(command.default.data.toJSON());
          Logger.info(`Commande ajoutée: ${command.default.data.name}`);
        } else {
          Logger.warn(`La commande ${file} n'a pas de propriété data valide`);
        }
      } catch (error) {
        Logger.error(`Erreur lors du chargement de la commande ${file}:`, { error: error.message });
      }
    }
    
    if (commands.length === 0) {
      Logger.warn('Aucune commande valide à déployer');
      return;
    }
    
    // Déployer les commandes
    if (config.guildId) {
      // Déployer pour un serveur spécifique (plus rapide pour les tests)
      Logger.info(`Déploiement de ${commands.length} commandes pour le serveur ${config.guildId}...`);
      
      const data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      
      Logger.info(`${data.length} commandes déployées pour le serveur`);
    } else {
      // Déployer globalement (peut prendre jusqu'à une heure)
      Logger.info(`Déploiement de ${commands.length} commandes globalement...`);
      
      const data = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      
      Logger.info(`${data.length} commandes déployées globalement`);
    }
  } catch (error) {
    Logger.error('Erreur lors du déploiement des commandes:', { error: error.message, stack: error.stack });
  }
}

main(); 