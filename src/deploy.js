#!/usr/bin/env node
/**
 * Script unifié de déploiement des commandes Discord
 * Usage: 
 *   node deploy.js [options]
 * 
 * Options:
 *   --global, -g        Déployer globalement (défaut: serveur)
 *   --admin, -a         Déployer uniquement les commandes admin
 *   --database, -d      Déployer uniquement les commandes database
 *   --category <name>   Déployer uniquement une catégorie spécifique
 *   --help, -h          Afficher l'aide
 */

import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './config.js';
import * as Logger from './utils/logger.js';

// Configuration ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialiser le logger
Logger.init({ logLevel: config.logLevel });

/**
 * Affiche l'aide
 */
function showHelp() {
  console.log(`
Usage: node deploy.js [options]

Options:
  --global, -g          Déployer globalement (défaut: serveur)
  --admin, -a           Déployer uniquement les commandes admin
  --database, -d        Déployer uniquement les commandes database
  --category <name>     Déployer uniquement une catégorie spécifique
  --help, -h            Afficher cette aide

Exemples:
  node deploy.js                    # Déploie toutes les commandes sur le serveur
  node deploy.js --global           # Déploie toutes les commandes globalement
  node deploy.js --admin            # Déploie uniquement les commandes admin
  node deploy.js --category general # Déploie uniquement la catégorie 'general'
  `);
}

/**
 * Parse les arguments de ligne de commande
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    global: false,
    category: null,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--global':
      case '-g':
        options.global = true;
        break;
      case '--admin':
      case '-a':
        options.category = 'admin';
        break;
      case '--database':
      case '-d':
        options.category = 'database';
        break;
      case '--category':
        options.category = args[++i];
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      default:
        Logger.warn(`Option inconnue: ${arg}`);
    }
  }

  return options;
}

/**
 * Charge les commandes depuis une catégorie
 */
async function loadCommandsFromCategory(categoryPath, categoryName) {
  const commands = [];
  
  if (!fs.existsSync(categoryPath) || !fs.statSync(categoryPath).isDirectory()) {
    Logger.warn(`Catégorie '${categoryName}' introuvable ou n'est pas un dossier`);
    return commands;
  }

  const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    try {
      const filePath = path.join(categoryPath, file);
      const commandModule = await import(`file://${filePath}`);
      const command = commandModule.default;
      
      if (command && command.data && typeof command.data.toJSON === 'function') {
        commands.push(command.data.toJSON());
        Logger.debug(`Commande chargée: ${command.data.name}`, { 
          category: categoryName, 
          file 
        });
      } else {
        Logger.warn(`Commande invalide dans ${file}: format incorrect`);
      }
    } catch (error) {
      Logger.error(`Erreur lors du chargement de ${file}:`, { 
        error: error.message,
        category: categoryName 
      });
    }
  }

  return commands;
}

/**
 * Charge toutes les commandes selon les options
 */
async function loadCommands(options) {
  const commands = [];
  const commandsPath = path.join(__dirname, 'commands');
  
  if (!fs.existsSync(commandsPath)) {
    Logger.error('Dossier commands introuvable');
    return commands;
  }

  if (options.category) {
    // Charger une catégorie spécifique
    const categoryPath = path.join(commandsPath, options.category);
    const categoryCommands = await loadCommandsFromCategory(categoryPath, options.category);
    commands.push(...categoryCommands);
    
    Logger.info(`Chargé ${categoryCommands.length} commandes de la catégorie '${options.category}'`);
  } else {
    // Charger toutes les catégories
    const categories = fs.readdirSync(commandsPath);
    
    for (const category of categories) {
      const categoryPath = path.join(commandsPath, category);
      const categoryCommands = await loadCommandsFromCategory(categoryPath, category);
      commands.push(...categoryCommands);
    }
    
    Logger.info(`Chargé ${commands.length} commandes au total`);
  }

  return commands;
}

/**
 * Déploie les commandes sur Discord
 */
async function deployCommands(commands, options) {
  if (!config.token || !config.clientId) {
    Logger.error('Configuration manquante: BOT_TOKEN ou CLIENT_ID');
    process.exit(1);
  }

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    const scope = options.global ? 'globalement' : 'sur le serveur';
    const categoryInfo = options.category ? ` (catégorie: ${options.category})` : '';
    
    Logger.info(`Déploiement de ${commands.length} commandes ${scope}${categoryInfo}...`);

    let route;
    if (options.global) {
      route = Routes.applicationCommands(config.clientId);
    } else {
      if (!config.guildId) {
        Logger.error('GUILD_ID manquant pour le déploiement sur serveur');
        process.exit(1);
      }
      route = Routes.applicationGuildCommands(config.clientId, config.guildId);
    }

    const data = await rest.put(route, { body: commands });
    
    Logger.info(`✅ ${data.length} commandes déployées avec succès ${scope}`);
    
    if (!options.global) {
      Logger.info('💡 Les commandes sont immédiatement disponibles sur le serveur');
    } else {
      Logger.info('⏳ Les commandes globales peuvent prendre jusqu\'à 1 heure pour se propager');
    }

  } catch (error) {
    Logger.error('Erreur lors du déploiement:', { 
      error: error.message,
      status: error.status,
      method: error.method,
      url: error.url 
    });
    process.exit(1);
  }
}

/**
 * Fonction principale
 */
async function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    return;
  }

  try {
    const commands = await loadCommands(options);
    
    if (commands.length === 0) {
      Logger.warn('Aucune commande à déployer');
      return;
    }

    await deployCommands(commands, options);
    
  } catch (error) {
    Logger.error('Erreur fatale:', { error: error.message });
    process.exit(1);
  }
}

// Exécuter si ce script est appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { loadCommands, deployCommands };