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

// Tables requises pour le fonctionnement du bot
const requiredTables = {
  // Table des administrateurs
  bot_admins: `
    CREATE TABLE IF NOT EXISTS bot_admins (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      username VARCHAR(100) NOT NULL,
      added_by VARCHAR(50) NOT NULL,
      added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
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
      added_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
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
      created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
    )
  `,
  
  // Table des logs de commandes
  command_logs: `
    CREATE TABLE IF NOT EXISTS command_logs (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      command_name VARCHAR(100) NOT NULL,
      user_id VARCHAR(50) NOT NULL,
      guild_id VARCHAR(50),
      channel_id VARCHAR(50) NOT NULL,
      options JSON,
      success TINYINT(1) NOT NULL DEFAULT 1,
      error_message TEXT DEFAULT NULL,
      execution_time INT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_command_name (command_name),
      INDEX idx_user_id (user_id),
      INDEX idx_created_at (created_at)
    )
  `,
  
  // Table des projets (DOIT être créée AVANT project_channels et integrations)
  projects: `
    CREATE TABLE IF NOT EXISTS projects (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      owner_id VARCHAR(50) NOT NULL,
      status ENUM('planning', 'in_progress', 'paused', 'completed', 'cancelled') DEFAULT 'planning',
      created_at TIMESTAMP NULL,
      updated_at TIMESTAMP NULL,
      start_date DATE,
      due_date DATE,
      INDEX idx_owner_id (owner_id),
      INDEX idx_status (status)
    )
  `,
  
  // Table des canaux de projets (référence projects)
  project_channels: `
    CREATE TABLE IF NOT EXISTS project_channels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id BIGINT UNSIGNED NOT NULL,
      channel_id VARCHAR(50) NOT NULL,
      channel_type ENUM('general', 'task', 'voice', 'docs', 'other') DEFAULT 'general',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_project_channel (project_id, channel_id)
    )
  `,
  
  // Table des intégrations (référence projects)
  integrations: `
    CREATE TABLE IF NOT EXISTS integrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id BIGINT UNSIGNED NOT NULL,
      type ENUM('github', 'trello', 'notion', 'figma', 'other') NOT NULL,
      external_id VARCHAR(100) NOT NULL,
      config JSON,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_project_integration (project_id, type)
    )
  `,
  
  // Table des rappels
  reminders: `
    CREATE TABLE IF NOT EXISTS reminders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      guild_id VARCHAR(50) DEFAULT NULL,
      channel_id VARCHAR(50) NOT NULL,
      message TEXT NOT NULL,
      reminder_time TIMESTAMP NOT NULL,
      is_completed TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_id (user_id),
      INDEX idx_reminder_time (reminder_time),
      INDEX idx_is_completed (is_completed)
    )
  `,
  
  // Table des infractions Studi
  studi_offenders: `
    CREATE TABLE IF NOT EXISTS studi_offenders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      guild_id VARCHAR(50) NOT NULL,
      offense_count INT NOT NULL DEFAULT 1,
      last_offense_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      first_offense_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      total_messages_deleted INT NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_guild (user_id, guild_id),
      INDEX idx_user_id (user_id),
      INDEX idx_guild_id (guild_id)
    )
  `,
  
  // Table de configuration Studi par serveur
  studi_guild_config: `
    CREATE TABLE IF NOT EXISTS studi_guild_config (
      id INT AUTO_INCREMENT PRIMARY KEY,
      guild_id VARCHAR(50) NOT NULL,
      is_enabled TINYINT(1) NOT NULL DEFAULT 1,
      max_offenses INT NOT NULL DEFAULT 3,
      ban_duration_hours INT NOT NULL DEFAULT 24,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_guild_id (guild_id)
    )
  `,
  
  // Table de whitelist Studi
  studi_whitelist: `
    CREATE TABLE IF NOT EXISTS studi_whitelist (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(50) NOT NULL,
      username VARCHAR(100) NOT NULL,
      added_by VARCHAR(50) NOT NULL,
      reason TEXT DEFAULT NULL,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_id (user_id),
      INDEX idx_user_id (user_id),
      INDEX idx_is_active (is_active)
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
    
         // Vérifier quelles tables existent déjà
     const existingTables = await db.query("SHOW TABLES");
     const existingTableNames = existingTables.map(row => {
       const values = Object.values(row);
       return values[0] ? values[0].toString() : null;
     }).filter(name => name !== null);
     
     Logger.info('Tables existantes:', existingTableNames);
     
     // Créer seulement les tables qui n'existent pas encore
     const tablesToCreate = [
       { name: 'bot_admins', required: false },
       { name: 'bot_moderators', required: false },
       { name: 'logs', required: false },
       { name: 'command_logs', required: false },
       { name: 'projects', required: false },
       { name: 'project_channels', required: true },
       { name: 'integrations', required: true },
       { name: 'reminders', required: true },
       { name: 'studi_offenders', required: true },
       { name: 'studi_guild_config', required: true },
       { name: 'studi_whitelist', required: true }
     ];
     
     for (const tableInfo of tablesToCreate) {
       const tableName = tableInfo.name;
       const isRequired = tableInfo.required;
       
       // Vérifier si la table existe vraiment
       const tableExists = existingTableNames.some(table => 
         table && table.toLowerCase() === tableName.toLowerCase()
       );
       
       if (tableExists) {
         Logger.info(`Table ${tableName} existe déjà, ignorée`);
         continue;
       }
       
       if (requiredTables[tableName]) {
         Logger.info(`Création de la table ${tableName}...`);
         try {
           await db.query(requiredTables[tableName]);
           Logger.info(`Table ${tableName} créée avec succès`);
         } catch (error) {
           if (isRequired) {
             Logger.error(`Erreur lors de la création de la table ${tableName}:`, {
               error: error.message
             });
             return false;
           } else {
             Logger.warn(`Impossible de créer la table ${tableName} (non critique):`, {
               error: error.message
             });
           }
         }
       }
     }
    
    // Les tables sont déjà créées par la boucle ci-dessus, pas besoin de les recréer
    
    Logger.info('Toutes les tables nécessaires ont été vérifiées/créées avec succès');
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
    
    // 4. Créer un administrateur par défaut si aucun n'existe
    await createDefaultAdmin();
    
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

/**
 * Crée un administrateur par défaut si aucun n'existe
 */
async function createDefaultAdmin() {
  try {
    // Vérifier s'il y a déjà des administrateurs
    const existingAdmins = await db.query("SELECT COUNT(*) as count FROM bot_admins");
    const adminCount = existingAdmins[0].count;
    
         if (adminCount === 0) {
       Logger.info('Aucun administrateur trouvé, création d\'un admin par défaut...');
       
       try {
         // Créer un administrateur par défaut
         await db.query(`
           INSERT INTO bot_admins (user_id, username, added_by, added_at) 
           VALUES (?, ?, ?, NOW())
         `, ['709042879145836564', 'hansel_bwa', 'SYSTEM']);
         
         // Ajouter le rôle admin
         await db.query(`
           INSERT INTO bot_roles (user_id, role_type, granted_by, granted_at, is_active) 
           VALUES (?, ?, ?, NOW(), 1)
         `, ['709042879145836564', 'admin', 'SYSTEM']);
         
         Logger.info('Administrateur par défaut créé avec succès');
       } catch (error) {
         Logger.warn('Impossible de créer l\'administrateur par défaut:', {
           error: error.message
         });
       }
     } else {
       Logger.info(`${adminCount} administrateur(s) existant(s), aucun admin par défaut créé`);
     }
  } catch (error) {
    Logger.warn('Impossible de créer l\'administrateur par défaut:', {
      error: error.message
    });
  }
}

export default {
  initDatabase,
  testConnection,
  ensureDatabase,
  createTables
}; 