/**
 * @fileoverview Classe de base pour les commandes d'administration
 */

import { BaseCommand } from './BaseCommand.js';
import * as db from '../utils/db.js';
import * as Logger from '../utils/logger.js';

/**
 * Classe de base pour les commandes d'administration
 * @class AdminCommand
 * @extends BaseCommand
 */
export class AdminCommand extends BaseCommand {
    /**
     * Constructeur de la commande administrative
     * @param {Object} options - Options de la commande
     */
    constructor(options = {}) {
        super(options);
        this.category = options.category || 'admin';
        this.adminOnly = options.adminOnly || true;
        this.modOnly = options.modOnly || false;
        // Liste des IDs d'administrateurs (hardcodés pour l'instant)
        this.adminIDs = ['709042879145836564']; // Ajoutez ici les IDs des administrateurs
        this.moderatorIDs = []; // Ajoutez ici les IDs des modérateurs
    }

    /**
     * Vérifie si l'utilisateur a les permissions nécessaires pour exécuter la commande
     * @param {Object} interaction - L'interaction Discord
     * @returns {boolean} - True si l'utilisateur a les permissions, false sinon
     */
    async hasPermission(interaction) {
        // Si la commande est admin-only, vérifier que l'utilisateur est admin
        if (this.adminOnly) {
            // Votre logique pour vérifier si l'utilisateur est admin
            const isAdmin = await this.isAdmin(interaction.user.id);
            if (!isAdmin) {
                return false;
            }
        }
        
        // Si la commande est mod-only, vérifier que l'utilisateur est modérateur
        if (this.modOnly && !this.adminOnly) {
            // Votre logique pour vérifier si l'utilisateur est modérateur
            const isMod = await this.isModerator(interaction.user.id);
            if (!isMod) {
                return false;
            }
        }
        
        return true;
    }

    /**
     * Vérifie si un utilisateur est administrateur du bot
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<boolean>} - Vrai si l'utilisateur est administrateur
     */
    async isAdmin(userId) {
        // Vérification simple basée sur la liste hardcodée
        if (this.adminIDs.includes(userId)) {
            return true;
        }
        
        // Si la base de données est disponible, vérifier aussi dans la base
        try {
            if (db.isDatabaseEnabled()) {
                await this.ensureAdminTableExists();
                const [rows] = await db.query('SELECT * FROM bot_admins WHERE user_id = ?', [userId]);
                return rows.length > 0;
            }
        } catch (error) {
            Logger.error('Erreur lors de la vérification du statut administrateur dans la base de données', {
                error: error.message,
                stack: error.stack,
                userId
            });
        }
        
        return false;
    }

    /**
     * Vérifie si un utilisateur est modérateur du bot
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<boolean>} - Vrai si l'utilisateur est modérateur
     */
    async isModerator(userId) {
        // Les administrateurs sont aussi modérateurs
        if (await this.isAdmin(userId)) {
            return true;
        }
        
        // Vérification simple basée sur la liste hardcodée
        if (this.moderatorIDs.includes(userId)) {
            return true;
        }
        
        // Si la base de données est disponible, vérifier aussi dans la base
        try {
            if (db.isDatabaseEnabled()) {
                await this.ensureModeratorTableExists();
                const [rows] = await db.query('SELECT * FROM bot_moderators WHERE user_id = ?', [userId]);
                return rows.length > 0;
            }
        } catch (error) {
            Logger.error('Erreur lors de la vérification du statut modérateur dans la base de données', {
                error: error.message,
                stack: error.stack,
                userId
            });
        }
        
        return false;
    }

    /**
     * Vérifie si les tables d'administration existent et les crée si nécessaire
     * @returns {Promise<void>}
     */
    async ensureAdminTableExists() {
        try {
            const [tables] = await db.query(
                "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bot_admins'"
            );
            
            if (tables.length === 0) {
                await db.query(`
                    CREATE TABLE bot_admins (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id VARCHAR(50) NOT NULL,
                        username VARCHAR(100) NOT NULL,
                        added_by VARCHAR(50) NOT NULL,
                        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE KEY unique_admin (user_id)
                    )
                `);
                
                Logger.info('Table bot_admins créée');
            }
        } catch (error) {
            Logger.error('Erreur lors de la vérification/création de la table bot_admins', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Vérifie si les tables de modération existent et les crée si nécessaire
     * @returns {Promise<void>}
     */
    async ensureModeratorTableExists() {
        try {
            const [tables] = await db.query(
                "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bot_moderators'"
            );
            
            if (tables.length === 0) {
                await db.query(`
                    CREATE TABLE bot_moderators (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id VARCHAR(50) NOT NULL,
                        username VARCHAR(100) NOT NULL,
                        added_by VARCHAR(50) NOT NULL,
                        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE KEY unique_moderator (user_id)
                    )
                `);
                
                Logger.info('Table bot_moderators créée');
            }
        } catch (error) {
            Logger.error('Erreur lors de la vérification/création de la table bot_moderators', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Ajoute un utilisateur comme administrateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {string} addedBy - ID de l'utilisateur qui ajoute
     * @returns {Promise<boolean>} - Succès de l'opération
     */
    async addAdmin(userId, username, addedBy = userId) {
        // Ajouter à la liste en mémoire
        if (!this.adminIDs.includes(userId)) {
            this.adminIDs.push(userId);
        }
        
        // Si la base de données est disponible, ajouter aussi dans la base
        try {
            if (db.isDatabaseEnabled()) {
                await this.ensureAdminTableExists();
                await db.query(
                    'INSERT INTO bot_admins (user_id, username, added_by) VALUES (?, ?, ?)',
                    [userId, username, addedBy]
                );
            }
            return true;
        } catch (error) {
            Logger.error('Erreur lors de l\'ajout d\'un administrateur', {
                error: error.message,
                stack: error.stack,
                userId,
                addedBy
            });
            return false;
        }
    }

    /**
     * Ajoute un utilisateur comme modérateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {string} addedBy - ID de l'utilisateur qui ajoute
     * @returns {Promise<boolean>} - Succès de l'opération
     */
    async addModerator(userId, username, addedBy) {
        // Ajouter à la liste en mémoire
        if (!this.moderatorIDs.includes(userId)) {
            this.moderatorIDs.push(userId);
        }
        
        // Si la base de données est disponible, ajouter aussi dans la base
        try {
            if (db.isDatabaseEnabled()) {
                await this.ensureModeratorTableExists();
                await db.query(
                    'INSERT INTO bot_moderators (user_id, username, added_by) VALUES (?, ?, ?)',
                    [userId, username, addedBy]
                );
            }
            return true;
        } catch (error) {
            Logger.error('Erreur lors de l\'ajout d\'un modérateur', {
                error: error.message,
                stack: error.stack,
                userId,
                addedBy
            });
            return false;
        }
    }

    /**
     * Retire un utilisateur des administrateurs
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<boolean>} - Succès de l'opération
     */
    async removeAdmin(userId) {
        // Retirer de la liste en mémoire
        const index = this.adminIDs.indexOf(userId);
        if (index !== -1) {
            this.adminIDs.splice(index, 1);
        }
        
        // Si la base de données est disponible, retirer aussi de la base
        try {
            if (db.isDatabaseEnabled()) {
                await this.ensureAdminTableExists();
                const [result] = await db.query('DELETE FROM bot_admins WHERE user_id = ?', [userId]);
                return result.affectedRows > 0;
            }
            return true;
        } catch (error) {
            Logger.error('Erreur lors du retrait d\'un administrateur', {
                error: error.message,
                stack: error.stack,
                userId
            });
            return false;
        }
    }

    /**
     * Retire un utilisateur des modérateurs
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<boolean>} - Succès de l'opération
     */
    async removeModerator(userId) {
        // Retirer de la liste en mémoire
        const index = this.moderatorIDs.indexOf(userId);
        if (index !== -1) {
            this.moderatorIDs.splice(index, 1);
        }
        
        // Si la base de données est disponible, retirer aussi de la base
        try {
            if (db.isDatabaseEnabled()) {
                await this.ensureModeratorTableExists();
                const [result] = await db.query('DELETE FROM bot_moderators WHERE user_id = ?', [userId]);
                return result.affectedRows > 0;
            }
            return true;
        } catch (error) {
            Logger.error('Erreur lors du retrait d\'un modérateur', {
                error: error.message,
                stack: error.stack,
                userId
            });
            return false;
        }
    }

    /**
     * Récupère la liste des administrateurs
     * @returns {Promise<Array>} - Liste des administrateurs
     */
    async getAdmins() {
        const hardcodedAdmins = this.adminIDs.map(id => ({ user_id: id, username: 'Admin' }));
        
        try {
            if (db.isDatabaseEnabled()) {
                await this.ensureAdminTableExists();
                const [rows] = await db.query('SELECT * FROM bot_admins');
                return [...hardcodedAdmins, ...rows];
            }
        } catch (error) {
            Logger.error('Erreur lors de la récupération des administrateurs', {
                error: error.message,
                stack: error.stack
            });
        }
        
        return hardcodedAdmins;
    }

    /**
     * Récupère la liste des modérateurs
     * @returns {Promise<Array>} - Liste des modérateurs
     */
    async getModerators() {
        const hardcodedMods = this.moderatorIDs.map(id => ({ user_id: id, username: 'Mod' }));
        
        try {
            if (db.isDatabaseEnabled()) {
                await this.ensureModeratorTableExists();
                const [rows] = await db.query('SELECT * FROM bot_moderators');
                return [...hardcodedMods, ...rows];
            }
        } catch (error) {
            Logger.error('Erreur lors de la récupération des modérateurs', {
                error: error.message,
                stack: error.stack
            });
        }
        
        return hardcodedMods;
    }

    /**
     * Obtient des statistiques sur l'utilisation du bot
     * @param {string} type - Type de statistiques (commandes, utilisateurs, ressources, activité)
     * @param {string} period - Période (today, week, month, all)
     * @returns {Promise<Array>} - Données statistiques
     */
    async getStats(type, period) {
        try {
            // Construire la requête SQL en fonction du type et de la période
            let sqlQuery = '';
            const params = [];
            
            // Définir la condition de date en fonction de la période
            let dateCondition = '';
            switch (period) {
                case 'today':
                    dateCondition = 'AND DATE(created_at) = CURDATE()';
                    break;
                case 'week':
                    dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 WEEK)';
                    break;
                case 'month':
                    dateCondition = 'AND created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH)';
                    break;
                default:
                    dateCondition = ''; // Toutes les périodes
            }
            
            // Construire la requête en fonction du type
            switch (type) {
                case 'commandes':
                    sqlQuery = `
                        SELECT command_name, COUNT(*) as count
                        FROM command_logs
                        WHERE 1=1 ${dateCondition}
                        GROUP BY command_name
                        ORDER BY count DESC
                        LIMIT 10
                    `;
                    break;
                case 'utilisateurs':
                    sqlQuery = `
                        SELECT user_id, COUNT(*) as count
                        FROM command_logs
                        WHERE 1=1 ${dateCondition}
                        GROUP BY user_id
                        ORDER BY count DESC
                        LIMIT 10
                    `;
                    break;
                case 'ressources':
                    sqlQuery = `
                        SELECT r.type, COUNT(*) as count
                        FROM resources r
                        WHERE 1=1 ${dateCondition}
                        GROUP BY r.type
                        ORDER BY count DESC
                        LIMIT 10
                    `;
                    break;
                case 'activité':
                    sqlQuery = `
                        SELECT DATE(created_at) as activity_date, COUNT(*) as count
                        FROM logs
                        WHERE level = 'info' ${dateCondition}
                        GROUP BY DATE(created_at)
                        ORDER BY activity_date DESC
                        LIMIT 10
                    `;
                    break;
                default:
                    return [];
            }
            
            // Exécuter la requête
            const [rows] = await db.query(sqlQuery);
            return rows;
        } catch (error) {
            Logger.error('Erreur lors de la récupération des statistiques', {
                error: error.message,
                stack: error.stack,
                type,
                period
            });
            return [];
        }
    }
}

export default AdminCommand; 