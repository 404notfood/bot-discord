/**
 * Module de gestion de la base de données pour le bot Discord
 */

import mysql from 'mysql2/promise';
import config from '../config.js';
import * as Logger from './logger.js';

// Pool de connexions à la base de données
let pool = null;
let databaseDisabled = false;

/**
 * Initialise la connexion à la base de données
 * @returns {Promise<mysql.Pool|null>} Pool de connexions ou null si la base de données est désactivée
 */
export async function connect() {
  try {
    // Si la connexion à la base de données a déjà été tentée et a échoué
    if (databaseDisabled) {
      Logger.warn('La base de données est désactivée, fonctionnement en mode limité');
      return null;
    }

    // Si le pool existe déjà, le retourner
    if (pool) {
      return pool;
    }
    
    // Vérifier si la configuration de la base de données existe
    if (!config.database || !config.database.host) {
      Logger.warn('Configuration de base de données non définie, fonctionnement en mode limité');
      databaseDisabled = true;
      return null;
    }
    
    // Log de debug pour vérifier les informations de connexion
    Logger.info('Tentative de connexion à la base de données', {
      host: config.database.host,
      user: config.database.user,
      database: config.database.database
    });
    
    pool = mysql.createPool({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });
    
    // Vérifier la connexion
    await pool.query('SELECT 1');
    Logger.info('Connexion à la base de données établie avec succès');
    
    return pool;
  } catch (error) {
    Logger.error('Erreur lors de la connexion à la base de données', {
      error: error.message,
      stack: error.stack
    });
    databaseDisabled = true;
    return null;
  }
}

/**
 * Vérifie si la base de données est activée
 * @returns {boolean} - True si la base de données est activée
 */
export function isDatabaseEnabled() {
  return !databaseDisabled;
}

/**
 * Exécute une requête SQL
 * @param {string} sql - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @returns {Promise<Array>} Résultats de la requête
 */
export async function query(sql, params = []) {
  try {
    const connection = await connect();
    
    if (!connection) {
      throw new Error('Base de données non disponible');
    }
    
    // Ajouter un log pour les requêtes importantes (comme celles liées à la documentation)
    if (sql.includes('doc_resources') || sql.includes('doc_categories')) {
      Logger.info('Exécution d\'une requête sur les tables de documentation', {
        sql: sql.substring(0, 150) + (sql.length > 150 ? '...' : ''),
        paramsCount: params.length
      });
    }
    
    return await connection.query(sql, params);
  } catch (error) {
    Logger.error('Erreur lors de l\'exécution de la requête SQL', {
      error: error.message,
      stack: error.stack,
      sql,
      params
    });
    throw error;
  }
}

/**
 * Vérifie l'existence et l'état des tables de documentation
 * @returns {Promise<Object>} Résultat du diagnostic
 */
export async function checkDocTables() {
  try {
    const connection = await connect();
    
    if (!connection) {
      return { success: false, error: 'Base de données non disponible' };
    }
    
    // Vérifier si les tables existent
    const [tables] = await connection.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name IN ('doc_categories', 'doc_resources')",
      [config.database.database]
    );
    
    const existingTables = tables.map(t => t.table_name || t.TABLE_NAME);
    
    // Compter les enregistrements dans chaque table
    const counts = {};
    
    for (const table of existingTables) {
      const [rows] = await connection.query(`SELECT COUNT(*) as count FROM ${table}`);
      counts[table] = rows[0].count;
    }
    
    // Vérifier un échantillon de données
    let sampleData = {};
    
    if (existingTables.includes('doc_categories')) {
      const [categories] = await connection.query('SELECT id, name FROM doc_categories LIMIT 3');
      sampleData.categories = categories;
    }
    
    if (existingTables.includes('doc_resources')) {
      const [resources] = await connection.query('SELECT id, name, language, category_id FROM doc_resources LIMIT 3');
      sampleData.resources = resources;
    }
    
    return {
      success: true,
      existingTables,
      counts,
      sampleData
    };
  } catch (error) {
    Logger.error('Erreur lors du diagnostic des tables de documentation', {
      error: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Récupère un seul enregistrement
 * @param {string} sql - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @returns {Promise<Object|null>} Enregistrement ou null si aucun résultat
 */
export async function getOne(sql, params = []) {
  try {
    const [rows] = await query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    Logger.error('Erreur lors de la récupération d\'un enregistrement', {
      error: error.message,
      stack: error.stack,
      sql,
      params
    });
    throw error;
  }
}

/**
 * Insère un enregistrement dans une table
 * @param {string} table - Nom de la table
 * @param {Object} data - Données à insérer
 * @returns {Promise<Object>} Résultat de l'insertion
 */
export async function insert(table, data) {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
    
    const [result] = await query(sql, values);
    return result;
  } catch (error) {
    Logger.error('Erreur lors de l\'insertion d\'un enregistrement', {
      error: error.message,
      stack: error.stack,
      table,
      data
    });
    throw error;
  }
}

/**
 * Met à jour un enregistrement dans une table
 * @param {string} table - Nom de la table
 * @param {Object} data - Données à mettre à jour
 * @param {string} whereClause - Clause WHERE
 * @param {Array} whereParams - Paramètres de la clause WHERE
 * @returns {Promise<Object>} Résultat de la mise à jour
 */
export async function update(table, data, whereClause, whereParams = []) {
  try {
    const keys = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;
    
    const [result] = await query(sql, [...values, ...whereParams]);
    return result;
  } catch (error) {
    Logger.error('Erreur lors de la mise à jour d\'un enregistrement', {
      error: error.message,
      stack: error.stack,
      table,
      data,
      whereClause
    });
    throw error;
  }
}

/**
 * Supprime des enregistrements d'une table
 * @param {string} table - Nom de la table
 * @param {string} whereClause - Clause WHERE
 * @param {Array} whereParams - Paramètres de la clause WHERE
 * @returns {Promise<Object>} Résultat de la suppression
 */
export async function remove(table, whereClause, whereParams = []) {
  try {
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;
    
    const [result] = await query(sql, whereParams);
    return result;
  } catch (error) {
    Logger.error('Erreur lors de la suppression d\'enregistrements', {
      error: error.message,
      stack: error.stack,
      table,
      whereClause
    });
    throw error;
  }
}

export default {
  connect,
  query,
  getOne,
  insert,
  update,
  remove,
  isDatabaseEnabled,
  checkDocTables
}; 