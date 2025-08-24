/**
 * Gestionnaire centralisé des permissions du bot
 */

import * as Logger from '../utils/logger.js';

export class PermissionManager {
    /**
     * Initialise le gestionnaire de permissions
     * @param {DatabaseManager} databaseManager - Instance du gestionnaire de base de données
     */
    constructor(databaseManager) {
        this.db = databaseManager;
        this.cache = new Map(); // Cache des permissions utilisateur
        this.roleCache = new Map(); // Cache des rôles utilisateur
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes en millisecondes

        // Permissions spéciales hardcodées pour sécurité
        this.superAdmins = new Set(); // IDs des super admins
        this.systemPermissions = new Set([
            'bot.admin',
            'system.restart',
            'system.shutdown',
            'users.manage_permissions'
        ]);
    }

    /**
     * Initialise le gestionnaire de permissions
     */
    async initialize() {
        try {
            Logger.info('PermissionManager: Initialisation...');

            // Créer les tables si la base de données est disponible
            if (this.db.isAvailable()) {
                await this.createTables();
                await this.loadSuperAdmins();
            } else {
                Logger.warn('PermissionManager: Base de données non disponible, mode dégradé');
            }

            Logger.info('PermissionManager: Initialisé avec succès');
            return true;
        } catch (error) {
            Logger.error('PermissionManager: Erreur lors de l\'initialisation:', {
                error: error.message
            });
            return false;
        }
    }

    /**
     * Crée les tables de permissions
     */
    async createTables() {
        try {
            // Lire et exécuter le script de permissions
            const fs = await import('fs');
            const path = await import('path');
            const { fileURLToPath } = await import('url');
            
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const sqlPath = path.join(__dirname, '../database/permissions.sql');
            
            if (fs.existsSync(sqlPath)) {
                const sqlContent = fs.readFileSync(sqlPath, 'utf8');
                const statements = sqlContent.split(';').filter(stmt => stmt.trim());
                
                for (const statement of statements) {
                    if (statement.trim()) {
                        await this.db.query(statement.trim());
                    }
                }
                
                Logger.info('PermissionManager: Tables de permissions créées/mises à jour');
            }
        } catch (error) {
            Logger.error('PermissionManager: Erreur création tables:', {
                error: error.message
            });
        }
    }

    /**
     * Charge la liste des super administrateurs depuis la base de données
     */
    async loadSuperAdmins() {
        try {
            // Charger tous les utilisateurs avec le rôle admin
            const admins = await this.db.select('bot_roles', {
                role_type: 'admin',
                is_active: true
            });
            
            this.superAdmins.clear();
            for (const admin of admins) {
                this.superAdmins.add(admin.user_id);
            }
            
            Logger.info(`PermissionManager: ${this.superAdmins.size} super admins chargés`);
        } catch (error) {
            Logger.error('PermissionManager: Erreur chargement super admins:', {
                error: error.message
            });
        }
    }

    /**
     * Vérifie si un utilisateur a une permission spécifique
     * @param {string} userId - ID de l'utilisateur Discord
     * @param {string} permission - Nom de la permission
     * @returns {Promise<boolean>}
     */
    async hasPermission(userId, permission) {
        try {
            // Les super admins ont toutes les permissions
            if (this.superAdmins.has(userId)) {
                return true;
            }

            // Vérifier le cache d'abord
            const cacheKey = `${userId}:${permission}`;
            const cached = this.getCachedPermission(cacheKey);
            if (cached !== null) {
                return cached;
            }

            // Si pas de base de données, refuser sauf super admins
            if (!this.db.isAvailable()) {
                this.setCachedPermission(cacheKey, false);
                return false;
            }

            // Vérifier les permissions spéciales d'utilisateur (overrides)
            const userPermission = await this.db.select('user_permissions', {
                user_id: userId,
                permission_name: permission
            });

            if (userPermission.length > 0) {
                const perm = userPermission[0];
                
                // Vérifier l'expiration
                if (perm.expires_at && new Date() > new Date(perm.expires_at)) {
                    // Permission expirée, la supprimer
                    await this.revokeUserPermission(userId, permission, 'SYSTEM');
                } else {
                    const hasAccess = perm.is_granted;
                    this.setCachedPermission(cacheKey, hasAccess);
                    return hasAccess;
                }
            }

            // Vérifier les permissions de rôle
            const userRoles = await this.getUserRoles(userId);
            
            for (const roleType of userRoles) {
                const roleHasPermission = await this.roleHasPermission(roleType, permission);
                if (roleHasPermission) {
                    this.setCachedPermission(cacheKey, true);
                    return true;
                }
            }

            // Aucune permission trouvée
            this.setCachedPermission(cacheKey, false);
            return false;

        } catch (error) {
            Logger.error('PermissionManager: Erreur vérification permission:', {
                userId,
                permission,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Vérifie si un rôle a une permission spécifique
     * @param {string} roleType - Type de rôle (admin, moderator, helper)
     * @param {string} permission - Nom de la permission
     * @returns {Promise<boolean>}
     */
    async roleHasPermission(roleType, permission) {
        try {
            const rolePermissions = await this.db.select('role_permissions', {
                role_type: roleType,
                permission_name: permission
            });
            
            return rolePermissions.length > 0;
        } catch (error) {
            Logger.error('PermissionManager: Erreur vérification permission rôle:', {
                roleType,
                permission,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Récupère les rôles d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Array<string>>}
     */
    async getUserRoles(userId) {
        try {
            // Vérifier le cache
            const cached = this.roleCache.get(userId);
            if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
                return cached.roles;
            }

            if (!this.db.isAvailable()) {
                return [];
            }

            const roles = await this.db.select('bot_roles', {
                user_id: userId,
                is_active: true
            });

            const roleTypes = roles
                .filter(role => !role.expires_at || new Date() < new Date(role.expires_at))
                .map(role => role.role_type);

            // Mettre en cache
            this.roleCache.set(userId, {
                roles: roleTypes,
                timestamp: Date.now()
            });

            return roleTypes;
        } catch (error) {
            Logger.error('PermissionManager: Erreur récupération rôles:', {
                userId,
                error: error.message
            });
            return [];
        }
    }

    /**
     * Accorde un rôle à un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} roleType - Type de rôle
     * @param {string} grantedBy - ID de celui qui accorde le rôle
     * @param {Date} expiresAt - Date d'expiration (optionnel)
     * @returns {Promise<boolean>}
     */
    async grantRole(userId, roleType, grantedBy, expiresAt = null) {
        try {
            if (!this.db.isAvailable()) {
                Logger.warn('PermissionManager: Base de données non disponible');
                return false;
            }

            // Vérifier que le rôle est valide
            const validRoles = ['admin', 'moderator', 'helper'];
            if (!validRoles.includes(roleType)) {
                throw new Error(`Type de rôle invalide: ${roleType}`);
            }

            // Insérer ou mettre à jour le rôle
            await this.db.query(
                `INSERT INTO bot_roles (user_id, role_type, granted_by, expires_at, is_active)
                 VALUES (?, ?, ?, ?, true)
                 ON DUPLICATE KEY UPDATE
                 granted_by = VALUES(granted_by),
                 expires_at = VALUES(expires_at),
                 is_active = true,
                 granted_at = CURRENT_TIMESTAMP`,
                [userId, roleType, grantedBy, expiresAt]
            );

            // Mettre à jour les super admins si nécessaire
            if (roleType === 'admin') {
                this.superAdmins.add(userId);
            }

            // Invalider les caches
            this.invalidateUserCache(userId);

            // Logger l'action
            await this.logPermissionAction('grant_role', grantedBy, userId, null, roleType);

            Logger.info(`PermissionManager: Rôle ${roleType} accordé à ${userId}`, {
                grantedBy,
                expiresAt
            });

            return true;
        } catch (error) {
            Logger.error('PermissionManager: Erreur accord rôle:', {
                userId,
                roleType,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Révoque un rôle d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} roleType - Type de rôle
     * @param {string} revokedBy - ID de celui qui révoque le rôle
     * @returns {Promise<boolean>}
     */
    async revokeRole(userId, roleType, revokedBy) {
        try {
            if (!this.db.isAvailable()) {
                Logger.warn('PermissionManager: Base de données non disponible');
                return false;
            }

            // Désactiver le rôle
            await this.db.query(
                'UPDATE bot_roles SET is_active = false WHERE user_id = ? AND role_type = ?',
                [userId, roleType]
            );

            // Mettre à jour les super admins si nécessaire
            if (roleType === 'admin') {
                this.superAdmins.delete(userId);
            }

            // Invalider les caches
            this.invalidateUserCache(userId);

            // Logger l'action
            await this.logPermissionAction('revoke_role', revokedBy, userId, null, roleType);

            Logger.info(`PermissionManager: Rôle ${roleType} révoqué pour ${userId}`, {
                revokedBy
            });

            return true;
        } catch (error) {
            Logger.error('PermissionManager: Erreur révocation rôle:', {
                userId,
                roleType,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Accorde une permission spécifique à un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} permission - Nom de la permission
     * @param {string} grantedBy - ID de celui qui accorde
     * @param {Date} expiresAt - Date d'expiration (optionnel)
     * @param {string} reason - Raison (optionnel)
     * @returns {Promise<boolean>}
     */
    async grantUserPermission(userId, permission, grantedBy, expiresAt = null, reason = null) {
        try {
            if (!this.db.isAvailable()) {
                return false;
            }

            await this.db.query(
                `INSERT INTO user_permissions (user_id, permission_name, is_granted, granted_by, expires_at, reason)
                 VALUES (?, ?, true, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 is_granted = true,
                 granted_by = VALUES(granted_by),
                 expires_at = VALUES(expires_at),
                 reason = VALUES(reason),
                 granted_at = CURRENT_TIMESTAMP`,
                [userId, permission, grantedBy, expiresAt, reason]
            );

            this.invalidateUserCache(userId);
            await this.logPermissionAction('grant_permission', grantedBy, userId, permission);

            return true;
        } catch (error) {
            Logger.error('PermissionManager: Erreur accord permission utilisateur:', {
                error: error.message
            });
            return false;
        }
    }

    /**
     * Révoque une permission spécifique d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} permission - Nom de la permission
     * @param {string} revokedBy - ID de celui qui révoque
     * @returns {Promise<boolean>}
     */
    async revokeUserPermission(userId, permission, revokedBy) {
        try {
            if (!this.db.isAvailable()) {
                return false;
            }

            await this.db.delete('user_permissions', {
                user_id: userId,
                permission_name: permission
            });

            this.invalidateUserCache(userId);
            await this.logPermissionAction('revoke_permission', revokedBy, userId, permission);

            return true;
        } catch (error) {
            Logger.error('PermissionManager: Erreur révocation permission utilisateur:', {
                error: error.message
            });
            return false;
        }
    }

    /**
     * Récupère les informations complètes d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<Object>}
     */
    async getUserInfo(userId) {
        try {
            const roles = await this.getUserRoles(userId);
            const permissions = new Set();

            // Récupérer toutes les permissions via les rôles
            for (const roleType of roles) {
                const rolePermissions = await this.db.select('role_permissions', {
                    role_type: roleType
                });
                rolePermissions.forEach(perm => permissions.add(perm.permission_name));
            }

            // Récupérer les permissions spéciales d'utilisateur
            const userPermissions = await this.db.select('user_permissions', {
                user_id: userId
            });

            for (const perm of userPermissions) {
                if (perm.is_granted) {
                    permissions.add(perm.permission_name);
                } else {
                    permissions.delete(perm.permission_name);
                }
            }

            return {
                userId,
                roles,
                permissions: Array.from(permissions),
                isSuperAdmin: this.superAdmins.has(userId),
                hasAnyRole: roles.length > 0
            };
        } catch (error) {
            Logger.error('PermissionManager: Erreur récupération info utilisateur:', {
                error: error.message
            });
            return {
                userId,
                roles: [],
                permissions: [],
                isSuperAdmin: false,
                hasAnyRole: false
            };
        }
    }

    /**
     * Logger une action de permission
     * @param {string} actionType - Type d'action
     * @param {string} executorId - ID de l'exécuteur
     * @param {string} targetId - ID de la cible
     * @param {string} permission - Permission concernée
     * @param {string} roleType - Rôle concerné
     */
    async logPermissionAction(actionType, executorId, targetId, permission = null, roleType = null) {
        try {
            if (!this.db.isAvailable()) return;

            await this.db.insert('permission_logs', {
                action_type: actionType,
                executor_id: executorId,
                target_id: targetId,
                permission_name: permission,
                role_type: roleType,
                executed_at: new Date()
            });
        } catch (error) {
            Logger.error('PermissionManager: Erreur log permission:', {
                error: error.message
            });
        }
    }

    /**
     * Récupère une permission depuis le cache
     * @param {string} cacheKey - Clé de cache
     * @returns {boolean|null}
     */
    getCachedPermission(cacheKey) {
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
            return cached.value;
        }
        return null;
    }

    /**
     * Met en cache une permission
     * @param {string} cacheKey - Clé de cache
     * @param {boolean} value - Valeur de la permission
     */
    setCachedPermission(cacheKey, value) {
        this.cache.set(cacheKey, {
            value,
            timestamp: Date.now()
        });
    }

    /**
     * Invalide le cache d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     */
    invalidateUserCache(userId) {
        // Invalider cache permissions
        for (const [key] of this.cache.entries()) {
            if (key.startsWith(`${userId}:`)) {
                this.cache.delete(key);
            }
        }
        
        // Invalider cache rôles
        this.roleCache.delete(userId);
    }

    /**
     * Nettoie le cache
     */
    clearCache() {
        this.cache.clear();
        this.roleCache.clear();
        Logger.info('PermissionManager: Cache nettoyé');
    }

    /**
     * Récupère les statistiques
     * @returns {Object}
     */
    getStats() {
        return {
            superAdmins: this.superAdmins.size,
            cachedPermissions: this.cache.size,
            cachedRoles: this.roleCache.size,
            systemPermissions: this.systemPermissions.size
        };
    }
}