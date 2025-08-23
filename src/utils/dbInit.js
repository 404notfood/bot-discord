/**
 * Utilitaire d'initialisation de la base de données
 * Ce script vérifie la connexion à la base de données et crée les tables nécessaires
 */

import mysql from 'mysql2/promise';
import 'dotenv/config';
import config from '../config.js';
import * as Logger from './logger.js';
import * as db from './db.js';

// Afficher les informations de configuration pour le débogage
function logDatabaseConfig() {
  const dbConfig = {
    hasConfig: !!config.database,
    host: config.database?.host || 'non défini',
    user: config.database?.user || 'non défini',
    database: config.database?.database || 'non défini',
    hasPassword: config.database?.password ? 'défini' : 'non défini',
    fromEnv: {
      DB_HOST: process.env.DB_HOST || 'non défini',
      DB_USER: process.env.DB_USER || 'non défini',
      DB_NAME: process.env.DB_NAME || 'non défini',
      hasDbPassword: process.env.DB_PASSWORD ? 'défini' : 'non défini'
    }
  };
  
  Logger.info('Configuration de la base de données', dbConfig);
}

// Définition des tables requises
const requiredTables = {
  // Table des administrateurs
  bot_admins: `
    CREATE TABLE IF NOT EXISTS bot_admins (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      username VARCHAR(100) NOT NULL,
      added_by VARCHAR(50) NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_admin (user_id)
    )
  `,
  
  // Table des modérateurs
  bot_moderators: `
    CREATE TABLE IF NOT EXISTS bot_moderators (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      username VARCHAR(100) NOT NULL,
      added_by VARCHAR(50) NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_moderator (user_id)
    )
  `,
  
  // Table des logs
  logs: `
    CREATE TABLE IF NOT EXISTS logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      level VARCHAR(20) NOT NULL,
      message TEXT NOT NULL,
      metadata JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  // Table des logs de commandes
  command_logs: `
    CREATE TABLE IF NOT EXISTS command_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      command_name VARCHAR(100) NOT NULL,
      user_id VARCHAR(50) NOT NULL,
      guild_id VARCHAR(50),
      channel_id VARCHAR(50) NOT NULL,
      options JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_command_name (command_name),
      INDEX idx_user_id (user_id),
      INDEX idx_created_at (created_at)
    )
  `,
  
  // Table des projets
  projects: `
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      owner_id VARCHAR(50) NOT NULL,
      status ENUM('planning', 'active', 'paused', 'completed', 'cancelled') DEFAULT 'planning',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      start_date DATE,
      due_date DATE,
      completion_date DATE,
      metadata JSON,
      INDEX idx_owner_id (owner_id),
      INDEX idx_status (status)
    )
  `,
  
  // Table des canaux de projets
  project_channels: `
    CREATE TABLE IF NOT EXISTS project_channels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      channel_id VARCHAR(50) NOT NULL,
      channel_type ENUM('general', 'task', 'voice', 'docs', 'other') DEFAULT 'general',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE KEY unique_project_channel (project_id, channel_id)
    )
  `,
  
  // Table des intégrations
  integrations: `
    CREATE TABLE IF NOT EXISTS integrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      type ENUM('github', 'trello', 'notion', 'figma', 'other') NOT NULL,
      external_id VARCHAR(100) NOT NULL,
      config JSON,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      UNIQUE KEY unique_project_integration (project_id, type)
    )
  `
};

/**
 * Teste la connexion à la base de données
 * @returns {Promise<boolean>} Succès ou échec de la connexion
 */
async function testConnection() {
  try {
    // Vérifier que la configuration de la base de données existe
    if (!config.database || !config.database.host || !config.database.user) {
      Logger.error('Configuration de la base de données incomplète ou manquante', {
        hasDbConfig: !!config.database,
        host: config.database?.host || 'manquant',
        user: config.database?.user || 'manquant',
        database: config.database?.database || 'manquant'
      });
      return false;
    }
    
    Logger.info('Test de connexion à la base de données...');
    
    // Créer une connexion temporaire pour tester
    const connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password
    });
    
    Logger.info('Connexion à MySQL réussie');
    
    // Fermer la connexion de test
    await connection.end();
    return true;
  } catch (error) {
    Logger.error('Échec de la connexion à MySQL', {
      error: error.message,
      stack: error.stack,
      host: config.database?.host,
      user: config.database?.user
    });
    return false;
  }
}

/**
 * Vérifie si la base de données existe, la crée si nécessaire
 * @returns {Promise<boolean>} Succès ou échec de l'opération
 */
async function ensureDatabase() {
  try {
    // Vérifier que la configuration de la base de données existe
    if (!config.database || !config.database.host || !config.database.user || !config.database.database) {
      Logger.error('Configuration de la base de données incomplète ou manquante');
      return false;
    }
    
    // Créer une connexion sans spécifier la base de données
    const connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password
    });
    
    Logger.info(`Vérification de l'existence de la base de données ${config.database.database}...`);
    
    // Tenter de créer la base de données si elle n'existe pas
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database.database}\``);
    
    Logger.info(`La base de données ${config.database.database} est disponible`);
    
    // Fermer la connexion
    await connection.end();
    return true;
  } catch (error) {
    Logger.error(`Échec de la création de la base de données ${config.database?.database || 'inconnue'}`, {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

/**
 * Crée les tables nécessaires dans la base de données
 * @returns {Promise<boolean>} Succès ou échec de l'opération
 */
async function createTables() {
  try {
    // Se connecter à la base de données
    await db.connect();
    
    // Créer chaque table nécessaire
    for (const [tableName, createStatement] of Object.entries(requiredTables)) {
      Logger.info(`Vérification/création de la table ${tableName}...`);
      await db.query(createStatement);
    }
    
    Logger.info('Toutes les tables ont été vérifiées/créées avec succès');
    return true;
  } catch (error) {
    Logger.error('Erreur lors de la création des tables', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

/**
 * Initialisation complète de la base de données
 * @returns {Promise<boolean>} Succès ou échec de l'initialisation
 */
export async function initDatabase() {
  try {
    Logger.info('Démarrage de l\'initialisation de la base de données...');
    
    // Afficher la configuration pour le débogage
    logDatabaseConfig();
    
    // 1. Tester la connexion à MySQL
    const canConnect = await testConnection();
    if (!canConnect) {
      Logger.error('Impossible de se connecter à MySQL. Fonctionnement en mode limité.');
      return false;
    }
    
    // 2. S'assurer que la base de données existe
    const dbExists = await ensureDatabase();
    if (!dbExists) {
      Logger.error('Impossible de créer ou d\'utiliser la base de données. Fonctionnement en mode limité.');
      return false;
    }
    
    // 3. Créer les tables nécessaires
    const tablesCreated = await createTables();
    if (!tablesCreated) {
      Logger.error('Impossible de créer les tables nécessaires. Fonctionnement en mode limité.');
      return false;
    }
    
    Logger.info('Initialisation de la base de données terminée avec succès');
    return true;
  } catch (error) {
    Logger.error('Erreur lors de l\'initialisation de la base de données', {
      error: error.message,
      stack: error.stack
    });
    return false;
  }
}

export default {
  initDatabase,
  testConnection,
  ensureDatabase,
  createTables
}; 