/**
 * Gestionnaire centralisé de la base de données
 */

import * as DatabaseUtils from '../utils/db.js';
import { initDatabase } from '../utils/dbInit.js';
import * as Logger from '../utils/logger.js';

export class DatabaseManager {
    /**
     * Initialise le gestionnaire de base de données
     */
    constructor() {
        this.isConnected = false;
        this.isInitialized = false;
        this.connectionPool = null;
        this.stats = {
            queries: 0,
            errors: 0,
            lastQuery: null,
            connectionTime: null
        };
    }

    /**
     * Initialise la connexion à la base de données
     * @returns {Promise<boolean>} True si initialisé avec succès
     */
    async initialize() {
        try {
            Logger.info('DatabaseManager: Initialisation en cours...');
            
            // Tenter l'initialisation de la base de données
            const dbInitialized = await initDatabase();
            
            if (dbInitialized) {
                // Vérifier la connexion
                const connection = await DatabaseUtils.connect();
                
                if (connection) {
                    this.connectionPool = connection;
                    this.isConnected = true;
                    this.isInitialized = true;
                    this.stats.connectionTime = new Date();
                    
                    Logger.info('DatabaseManager: Base de données initialisée et connectée');
                    
                    // Tester la connexion
                    await this.testConnection();
                    
                    return true;
                } else {
                    Logger.warn('DatabaseManager: Connexion échouée, mode limité activé');
                    return false;
                }
            } else {
                Logger.warn('DatabaseManager: Initialisation échouée, mode limité activé');
                return false;
            }
        } catch (error) {
            Logger.error('DatabaseManager: Erreur lors de l\'initialisation:', {
                error: error.message,
                stack: error.stack
            });
            
            this.isConnected = false;
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Teste la connexion à la base de données
     * @returns {Promise<boolean>}
     */
    async testConnection() {
        if (!this.isConnected) {
            return false;
        }

        try {
            const result = await this.query('SELECT 1 as test');
            Logger.debug('DatabaseManager: Test de connexion réussi');
            return Array.isArray(result) && result.length > 0;
        } catch (error) {
            Logger.error('DatabaseManager: Test de connexion échoué:', { 
                error: error.message 
            });
            this.isConnected = false;
            return false;
        }
    }

    /**
     * Exécute une requête SQL avec gestion d'erreurs et logging
     * @param {string} sql - Requête SQL
     * @param {Array} params - Paramètres de la requête
     * @returns {Promise<any>} Résultat de la requête
     */
    async query(sql, params = []) {
        if (!this.isConnected) {
            Logger.warn('DatabaseManager: Tentative de requête sans connexion');
            throw new Error('Database not connected');
        }

        const startTime = Date.now();
        
        try {
            this.stats.queries++;
            this.stats.lastQuery = new Date();
            
            // Exécuter la requête via le module db
            const result = await DatabaseUtils.executeQuery(sql, params);
            
            const duration = Date.now() - startTime;
            
            // Logger les requêtes lentes
            if (duration > 1000) { // Plus d'1 seconde
                Logger.warn('DatabaseManager: Requête lente détectée', {
                    duration,
                    sql: sql.substring(0, 100) + '...',
                    paramCount: params.length
                });
            }
            
            Logger.debug('DatabaseManager: Requête exécutée', {
                duration,
                resultCount: Array.isArray(result) ? result.length : 'N/A'
            });
            
            return result;
        } catch (error) {
            this.stats.errors++;
            
            Logger.error('DatabaseManager: Erreur lors de la requête:', {
                error: error.message,
                sql: sql.substring(0, 100) + '...',
                paramCount: params.length,
                duration: Date.now() - startTime
            });
            
            throw error;
        }
    }

    /**
     * Insère des données dans une table
     * @param {string} table - Nom de la table
     * @param {Object} data - Données à insérer
     * @returns {Promise<any>} Résultat de l'insertion
     */
    async insert(table, data) {
        try {
            return await DatabaseUtils.insertData(table, data);
        } catch (error) {
            Logger.error(`DatabaseManager: Erreur insertion dans ${table}:`, {
                error: error.message,
                data: Object.keys(data)
            });
            throw error;
        }
    }

    /**
     * Met à jour des données dans une table
     * @param {string} table - Nom de la table
     * @param {Object} data - Données à mettre à jour
     * @param {string|number} id - ID de l'enregistrement
     * @returns {Promise<any>} Résultat de la mise à jour
     */
    async update(table, data, id) {
        try {
            return await DatabaseUtils.updateData(table, data, id);
        } catch (error) {
            Logger.error(`DatabaseManager: Erreur mise à jour dans ${table}:`, {
                error: error.message,
                id,
                data: Object.keys(data)
            });
            throw error;
        }
    }

    /**
     * Supprime des données d'une table
     * @param {string} table - Nom de la table
     * @param {string|number} id - ID de l'enregistrement
     * @returns {Promise<any>} Résultat de la suppression
     */
    async delete(table, id) {
        try {
            return await DatabaseUtils.deleteData(table, id);
        } catch (error) {
            Logger.error(`DatabaseManager: Erreur suppression dans ${table}:`, {
                error: error.message,
                id
            });
            throw error;
        }
    }

    /**
     * Récupère des données d'une table avec conditions
     * @param {string} table - Nom de la table
     * @param {Object} conditions - Conditions WHERE
     * @param {Object} options - Options (ORDER BY, LIMIT, etc.)
     * @returns {Promise<Array>} Résultats
     */
    async select(table, conditions = {}, options = {}) {
        try {
            let sql = `SELECT * FROM ${table}`;
            const params = [];

            // Ajouter les conditions WHERE
            if (Object.keys(conditions).length > 0) {
                const whereClause = Object.keys(conditions)
                    .map(key => `${key} = ?`)
                    .join(' AND ');
                sql += ` WHERE ${whereClause}`;
                params.push(...Object.values(conditions));
            }

            // Ajouter ORDER BY
            if (options.orderBy) {
                sql += ` ORDER BY ${options.orderBy}`;
                if (options.order) {
                    sql += ` ${options.order}`;
                }
            }

            // Ajouter LIMIT
            if (options.limit) {
                sql += ` LIMIT ${options.limit}`;
                if (options.offset) {
                    sql += ` OFFSET ${options.offset}`;
                }
            }

            return await this.query(sql, params);
        } catch (error) {
            Logger.error(`DatabaseManager: Erreur sélection dans ${table}:`, {
                error: error.message,
                conditions,
                options
            });
            throw error;
        }
    }

    /**
     * Exécute une transaction
     * @param {Function} callback - Fonction à exécuter dans la transaction
     * @returns {Promise<any>} Résultat de la transaction
     */
    async transaction(callback) {
        if (!this.isConnected) {
            throw new Error('Database not connected');
        }

        const connection = await DatabaseUtils.connect();
        
        try {
            await connection.beginTransaction();
            
            const result = await callback(connection);
            
            await connection.commit();
            return result;
        } catch (error) {
            await connection.rollback();
            Logger.error('DatabaseManager: Erreur transaction:', { 
                error: error.message 
            });
            throw error;
        }
    }

    /**
     * Vérifie si une table existe
     * @param {string} tableName - Nom de la table
     * @returns {Promise<boolean>}
     */
    async tableExists(tableName) {
        try {
            const result = await this.query(
                'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?',
                [tableName]
            );
            return result.length > 0;
        } catch (error) {
            Logger.error(`DatabaseManager: Erreur vérification table ${tableName}:`, {
                error: error.message
            });
            return false;
        }
    }

    /**
     * Récupère la liste de toutes les tables
     * @returns {Promise<Array>}
     */
    async getTables() {
        try {
            const result = await this.query(
                'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()'
            );
            return result.map(row => row.TABLE_NAME);
        } catch (error) {
            Logger.error('DatabaseManager: Erreur récupération liste tables:', {
                error: error.message
            });
            return [];
        }
    }

    /**
     * Optimise les tables de la base de données
     * @returns {Promise<void>}
     */
    async optimize() {
        if (!this.isConnected) {
            return;
        }

        try {
            const tables = await this.getTables();
            
            for (const table of tables) {
                await this.query(`OPTIMIZE TABLE ${table}`);
            }
            
            Logger.info('DatabaseManager: Optimisation des tables terminée');
        } catch (error) {
            Logger.error('DatabaseManager: Erreur optimisation:', {
                error: error.message
            });
        }
    }

    /**
     * Récupère les statistiques de la base de données
     * @returns {Object}
     */
    getStats() {
        return {
            ...this.stats,
            isConnected: this.isConnected,
            isInitialized: this.isInitialized,
            uptime: this.stats.connectionTime ? 
                Date.now() - this.stats.connectionTime.getTime() : 0
        };
    }

    /**
     * Récupère l'état de santé de la base de données
     * @returns {Promise<Object>}
     */
    async getHealth() {
        const health = {
            status: 'unknown',
            connected: this.isConnected,
            initialized: this.isInitialized,
            responseTime: null,
            tableCount: 0,
            error: null
        };

        if (!this.isConnected) {
            health.status = 'disconnected';
            return health;
        }

        try {
            const startTime = Date.now();
            await this.testConnection();
            health.responseTime = Date.now() - startTime;
            
            health.tableCount = (await this.getTables()).length;
            health.status = 'healthy';
        } catch (error) {
            health.status = 'error';
            health.error = error.message;
        }

        return health;
    }

    /**
     * Ferme la connexion à la base de données
     */
    async close() {
        if (this.connectionPool) {
            try {
                await this.connectionPool.end();
                this.isConnected = false;
                this.connectionPool = null;
                Logger.info('DatabaseManager: Connexion fermée');
            } catch (error) {
                Logger.error('DatabaseManager: Erreur fermeture connexion:', {
                    error: error.message
                });
            }
        }
    }

    /**
     * Vérifie si la base de données est disponible
     * @returns {boolean}
     */
    isAvailable() {
        return this.isConnected && this.isInitialized;
    }
}