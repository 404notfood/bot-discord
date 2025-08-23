/**
 * Module de journalisation pour le bot Discord
 */

import chalk from 'chalk';

// Niveaux de log
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  FATAL: 4
};

// Configuration par défaut
let config = {
  logLevel: LOG_LEVELS.INFO,
  showTimestamp: true,
  logToConsole: true,
  logToFile: false,
  logFilePath: './logs/bot.log'
};

/**
 * Initialise le logger avec une configuration personnalisée
 * @param {Object} customConfig - Configuration personnalisée
 */
export function init(customConfig = {}) {
  // Convertir le niveau de log textuel en niveau numérique
  if (typeof customConfig.logLevel === 'string') {
    const level = customConfig.logLevel.toUpperCase();
    if (LOG_LEVELS[level] !== undefined) {
      customConfig.logLevel = LOG_LEVELS[level];
    }
  }
  
  config = { ...config, ...customConfig };
}

/**
 * Formatte un message de log
 * @param {string} level - Niveau de log
 * @param {string} message - Message à logger
 * @param {Object} data - Données additionnelles
 * @returns {string} Message formatté
 */
function formatLogMessage(level, message, data = {}) {
  const timestamp = config.showTimestamp ? `[${new Date().toISOString()}] ` : '';
  const formattedData = Object.keys(data).length > 0 ? ` ${JSON.stringify(data)}` : '';
  
  return `${timestamp}[${level}] ${message}${formattedData}`;
}

/**
 * Log un message de niveau debug
 * @param {string} message - Message à logger
 * @param {Object} data - Données additionnelles
 */
export function debug(message, data = {}) {
  if (config.logLevel <= LOG_LEVELS.DEBUG) {
    const formattedMessage = formatLogMessage('DEBUG', message, data);
    if (config.logToConsole) {
      console.log(chalk.blue(formattedMessage));
    }
  }
}

/**
 * Log un message de niveau info
 * @param {string} message - Message à logger
 * @param {Object} data - Données additionnelles
 */
export function info(message, data = {}) {
  if (config.logLevel <= LOG_LEVELS.INFO) {
    const formattedMessage = formatLogMessage('INFO', message, data);
    if (config.logToConsole) {
      console.log(chalk.green(formattedMessage));
    }
  }
}

/**
 * Log un message de niveau warn
 * @param {string} message - Message à logger
 * @param {Object} data - Données additionnelles
 */
export function warn(message, data = {}) {
  if (config.logLevel <= LOG_LEVELS.WARN) {
    const formattedMessage = formatLogMessage('WARN', message, data);
    if (config.logToConsole) {
      console.log(chalk.yellow(formattedMessage));
    }
  }
}

/**
 * Log un message de niveau error
 * @param {string} message - Message à logger
 * @param {Object} data - Données additionnelles
 */
export function error(message, data = {}) {
  if (config.logLevel <= LOG_LEVELS.ERROR) {
    const formattedMessage = formatLogMessage('ERROR', message, data);
    if (config.logToConsole) {
      console.log(chalk.red(formattedMessage));
    }
  }
}

/**
 * Log un message de niveau fatal
 * @param {string} message - Message à logger
 * @param {Object} data - Données additionnelles
 */
export function fatal(message, data = {}) {
  if (config.logLevel <= LOG_LEVELS.FATAL) {
    const formattedMessage = formatLogMessage('FATAL', message, data);
    if (config.logToConsole) {
      console.log(chalk.bgRed.white(formattedMessage));
    }
  }
}

export default {
  init,
  debug,
  info,
  warn,
  error,
  fatal,
  LOG_LEVELS
}; 