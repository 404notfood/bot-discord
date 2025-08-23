/**
 * Configuration du bot Discord
 */

import { GatewayIntentBits, Partials } from 'discord.js';
import 'dotenv/config';
import * as Logger from './utils/logger.js';

// Vérifier si les variables d'environnement essentielles sont définies
const missingEnvVars = [];
['BOT_TOKEN', 'CLIENT_ID'].forEach(varName => {
  if (!process.env[varName]) {
    missingEnvVars.push(varName);
  }
});

// Avertir si des variables d'environnement essentielles sont manquantes
if (missingEnvVars.length > 0) {
  console.warn(`⚠️ Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`);
  console.warn('Vérifiez votre fichier .env ou les variables d\'environnement du système');
}

// Vérifier les variables de la base de données
const dbConfigMissing = !process.env.DB_HOST || !process.env.DB_USER || !process.env.DB_NAME;
if (dbConfigMissing) {
  console.warn('⚠️ Configuration de base de données incomplète. Le bot fonctionnera en mode limité.');
}

/**
 * Configuration du bot
 * @type {Object}
 */
export default {
  /**
   * Token Discord du bot
   * @type {string}
   */
  token: process.env.BOT_TOKEN || process.env.TOKEN,
  
  /**
   * ID de l'application Discord
   * @type {string}
   */
  clientId: process.env.CLIENT_ID,
  
  /**
   * ID du serveur Discord pour les commandes (optionnel, pour les commandes de guilde)
   * @type {string}
   */
  guildId: process.env.GUILD_ID,
  
  /**
   * Intents Discord (permissions de lecture des événements)
   * @type {Array}
   */
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  
  /**
   * Partials Discord (objets partiels à récupérer)
   * @type {Array}
   */
  partials: [
    Partials.Message,
    Partials.Channel,
    Partials.GuildMember,
    Partials.User,
    Partials.Reaction
  ],
  
  /**
   * Niveau de journalisation
   * @type {string}
   */
  logLevel: process.env.LOG_LEVEL || 'INFO',
  
  /**
   * Couleurs pour les embeds Discord
   * @type {Object}
   */
  colors: {
    primary: '#3498db',
    success: '#2ecc71',
    warning: '#f1c40f',
    error: '#e74c3c',
    info: '#1abc9c'
  },
  
  /**
   * Configuration de la base de données
   * Ces valeurs peuvent être remplacées par des variables d'environnement
   * @type {Object}
   */
  database: process.env.DB_HOST ? {
    host: process.env.DB_HOST,
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || ''
  } : null
}; 