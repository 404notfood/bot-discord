/**
 * Point d'entrée principal du bot Discord
 */

import { DiscordBot } from './DiscordBot.js';
import * as Logger from './utils/logger.js';

// Instancier et démarrer le bot
const bot = new DiscordBot();
bot.start();

// Gérer les signaux d'arrêt pour un arrêt propre
process.on('SIGINT', async () => {
  Logger.info('Signal d\'interruption reçu (Ctrl+C)');
  await bot.shutdown('SIGINT reçu');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  Logger.info('Signal de terminaison reçu');
  await bot.shutdown('SIGTERM reçu');  
  process.exit(0);
});

// Gérer les erreurs non capturées
process.on('uncaughtException', async (error) => {
  Logger.fatal('Exception non capturée:', { 
    error: error.message, 
    stack: error.stack 
  });
  await bot.shutdown('Exception non capturée');
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  Logger.fatal('Promesse rejetée non gérée:', { 
    reason: reason,
    promise: promise 
  });
  await bot.shutdown('Promesse rejetée non gérée');
  process.exit(1);
}); 