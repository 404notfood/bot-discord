/**
 * Service anti-Studi amélioré avec whitelist et escalade automatique
 */

import { EmbedBuilder, PermissionsBitField } from 'discord.js';
import * as Logger from '../utils/logger.js';

export class EnhancedStudiService {
    /**
     * Initialise le service anti-Studi amélioré
     * @param {DatabaseManager} databaseManager - Gestionnaire de base de données
     */
    constructor(databaseManager) {
        this.db = databaseManager;
        
        // Cache pour les configurations et whitelists
        this.configCache = new Map();
        this.whitelistCache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        
        // Configuration par défaut
        this.defaultConfig = {
            enabled: true,
            keywords: ['studi', 'studi.fr', 'studifr', 'école studi'],
            caseSensitive: false,
            escalationEnabled: true,
            warningThreshold: 1,
            timeoutThreshold: 3,
            kickThreshold: 2,
            timeoutDuration: 3600, // 1 heure
            resetPeriod: 604800,    // 1 semaine
            warningMessage: '⚠️ Les références à Studi ne sont pas autorisées dans ce serveur.',
            timeoutReason: 'Références répétées à Studi',
            kickReason: 'Violations répétées de la politique anti-Studi',
            banReason: 'Violations persistantes de la politique anti-Studi'
        };

        // Statistiques en temps réel
        this.dailyStats = {
            messagesDeleted: 0,
            warningsSent: 0,
            timeoutsApplied: 0,
            kicksExecuted: 0,
            bansExecuted: 0,
            whitelistBypasses: 0,
            uniqueOffenders: new Set()
        };

        this.resetDailyStatsAtMidnight();
    }

    /**
     * Initialise le service
     */
    async initialize() {
        try {
            Logger.info('EnhancedStudiService: Initialisation...');
            
            if (this.db.isAvailable()) {
                await this.createTables();
                Logger.info('EnhancedStudiService: Tables créées/vérifiées');
            }
            
            Logger.info('EnhancedStudiService: Initialisé avec succès');
            return true;
        } catch (error) {
            Logger.error('EnhancedStudiService: Erreur initialisation:', {
                error: error.message
            });
            return false;
        }
    }

    /**
     * Crée les tables nécessaires
     */
    async createTables() {
        try {
            const fs = await import('fs');
            const path = await import('path');
            const { fileURLToPath } = await import('url');
            
            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);
            const sqlPath = path.join(__dirname, '../database/studi_improvements.sql');
            
            if (fs.existsSync(sqlPath)) {
                const sqlContent = fs.readFileSync(sqlPath, 'utf8');
                const statements = sqlContent.split(';').filter(stmt => stmt.trim());
                
                for (const statement of statements) {
                    if (statement.trim()) {
                        // Ignorer les migrations problématiques
                        if (statement.includes('INSERT IGNORE INTO studi_offenders_enhanced') || 
                            statement.includes('UPDATE studi_offenders_enhanced')) {
                            Logger.info('EnhancedStudiService: Migration ignorée (déjà effectuée)');
                            continue;
                        }
                        
                        try {
                            await this.db.query(statement.trim());
                        } catch (error) {
                            // Ignorer les erreurs de tables déjà existantes
                            if (error.message.includes('already exists') || 
                                error.message.includes('Duplicate key')) {
                                Logger.info('EnhancedStudiService: Table déjà existante, ignorée');
                                continue;
                            }
                            throw error;
                        }
                    }
                }
            }
        } catch (error) {
            Logger.error('EnhancedStudiService: Erreur création tables:', {
                error: error.message
            });
        }
    }

    /**
     * Traite un message pour détecter les violations Studi
     * @param {Message} message - Message Discord
     * @returns {Promise<Object>} Résultat du traitement
     */
    async processMessage(message) {
        try {
            // Ignorer les bots
            if (message.author.bot) return { processed: false };

            const guildId = message.guild?.id;
            if (!guildId) return { processed: false };

            // Récupérer la configuration du serveur
            const config = await this.getGuildConfig(guildId);
            if (!config.enabled) {
                return { processed: false, reason: 'Service désactivé' };
            }

            // Vérifier la whitelist
            const isWhitelisted = await this.isUserWhitelisted(message.author.id);
            if (isWhitelisted) {
                await this.logAction(guildId, message.author.id, message.channel.id, 
                    message.id, 'whitelist_bypass', message.content.substring(0, 200));
                return { processed: false, reason: 'Utilisateur en whitelist' };
            }

            // Détecter les mots-clés
            const detectedKeywords = this.detectKeywords(message.content, config.keywords, config.caseSensitive);
            if (detectedKeywords.length === 0) {
                return { processed: false, reason: 'Aucun mot-clé détecté' };
            }

            // Traitement de la violation
            const result = await this.handleViolation(message, detectedKeywords, config);
            
            return {
                processed: true,
                action: result.action,
                escalationLevel: result.escalationLevel,
                detectedKeywords,
                ...result
            };

        } catch (error) {
            Logger.error('EnhancedStudiService: Erreur traitement message:', {
                error: error.message,
                messageId: message.id,
                userId: message.author.id
            });
            return { processed: false, error: error.message };
        }
    }

    /**
     * Gère une violation détectée
     * @param {Message} message - Message violant
     * @param {Array} detectedKeywords - Mots-clés détectés
     * @param {Object} config - Configuration du serveur
     * @returns {Promise<Object>}
     */
    async handleViolation(message, detectedKeywords, config) {
        const userId = message.author.id;
        const guildId = message.guild.id;
        
        // Supprimer le message immédiatement
        try {
            await message.delete();
            Logger.info('Message Studi supprimé', {
                userId,
                guildId,
                keywords: detectedKeywords
            });
        } catch (error) {
            Logger.warn('Impossible de supprimer le message:', {
                error: error.message,
                messageId: message.id
            });
        }

        // Récupérer ou créer l'offenseur
        let offender = await this.getOrCreateOffender(userId, message.author.username, guildId);
        
        // Déterminer l'action selon l'escalade
        const escalationAction = this.determineEscalationAction(offender, config);
        
        // Logger l'action
        await this.logAction(guildId, userId, message.channel.id, message.id, 
            'message_deleted', message.content.substring(0, 200), detectedKeywords);

        // Exécuter l'action d'escalade
        const actionResult = await this.executeEscalationAction(
            message, offender, escalationAction, config
        );

        // Mettre à jour les statistiques
        await this.updateStatistics(guildId, escalationAction.action);

        // Mettre à jour l'offenseur
        await this.updateOffender(offender, escalationAction.level);

        return {
            action: escalationAction.action,
            escalationLevel: escalationAction.level,
            offenseCount: offender.offense_count + 1,
            ...actionResult
        };
    }

    /**
     * Détermine l'action d'escalade appropriée
     * @param {Object} offender - Données de l'offenseur
     * @param {Object} config - Configuration du serveur
     * @returns {Object}
     */
    determineEscalationAction(offender, config) {
        if (!config.escalationEnabled) {
            return { action: 'warning', level: 'warning' };
        }

        const newOffenseCount = offender.offense_count + 1;
        
        // Vérifier si l'utilisateur est déjà banni
        if (offender.is_banned) {
            return { action: 'already_banned', level: 'ban' };
        }

        // Logique d'escalade
        if (newOffenseCount <= config.warningThreshold) {
            return { action: 'warning', level: 'warning' };
        } else if (newOffenseCount <= config.warningThreshold + config.timeoutThreshold) {
            return { action: 'timeout', level: 'timeout' };
        } else if (newOffenseCount <= config.warningThreshold + config.timeoutThreshold + config.kickThreshold) {
            return { action: 'kick', level: 'kick' };
        } else {
            return { action: 'ban', level: 'ban' };
        }
    }

    /**
     * Exécute l'action d'escalade
     * @param {Message} message - Message original
     * @param {Object} offender - Données de l'offenseur  
     * @param {Object} escalationAction - Action à exécuter
     * @param {Object} config - Configuration du serveur
     * @returns {Promise<Object>}
     */
    async executeEscalationAction(message, offender, escalationAction, config) {
        const member = message.member;
        const guild = message.guild;
        const userId = message.author.id;
        const guildId = guild.id;

        try {
            switch (escalationAction.action) {
                case 'warning':
                    await this.sendWarning(message.author, config.warningMessage);
                    await this.logAction(guildId, userId, message.channel.id, null, 'warning_sent');
                    return { success: true, message: 'Avertissement envoyé' };

                case 'timeout':
                    if (member && member.moderatable) {
                        await member.timeout(
                            config.timeoutDuration * 1000, 
                            config.timeoutReason
                        );
                        await this.sendTimeoutNotification(message.author, config.timeoutDuration);
                        await this.logAction(guildId, userId, message.channel.id, null, 'timeout_applied');
                        return { success: true, message: `Timeout appliqué (${config.timeoutDuration}s)` };
                    } else {
                        return { success: false, message: 'Impossible d\'appliquer timeout' };
                    }

                case 'kick':
                    if (member && member.kickable) {
                        await member.kick(config.kickReason);
                        await this.logAction(guildId, userId, message.channel.id, null, 'user_kicked');
                        return { success: true, message: 'Utilisateur expulsé' };
                    } else {
                        return { success: false, message: 'Impossible d\'expulser l\'utilisateur' };
                    }

                case 'ban':
                    if (member && member.bannable) {
                        await member.ban({ reason: config.banReason, deleteMessageSeconds: 86400 }); // Supprimer 24h de messages
                        await this.updateOffenderBanStatus(offender.id, userId);
                        await this.logAction(guildId, userId, message.channel.id, null, 'user_banned');
                        return { success: true, message: 'Utilisateur banni' };
                    } else {
                        return { success: false, message: 'Impossible de bannir l\'utilisateur' };
                    }

                case 'already_banned':
                    return { success: false, message: 'Utilisateur déjà banni' };

                default:
                    return { success: false, message: 'Action non reconnue' };
            }
        } catch (error) {
            Logger.error('EnhancedStudiService: Erreur exécution action:', {
                action: escalationAction.action,
                userId,
                error: error.message
            });
            return { success: false, message: `Erreur: ${error.message}` };
        }
    }

    /**
     * Détecte les mots-clés dans un texte
     * @param {string} content - Contenu à analyser
     * @param {Array} keywords - Mots-clés à détecter
     * @param {boolean} caseSensitive - Sensibilité à la casse
     * @returns {Array} Mots-clés détectés
     */
    detectKeywords(content, keywords, caseSensitive = false) {
        const text = caseSensitive ? content : content.toLowerCase();
        const detected = [];

        for (const keyword of keywords) {
            const searchKeyword = caseSensitive ? keyword : keyword.toLowerCase();
            if (text.includes(searchKeyword)) {
                detected.push(keyword);
            }
        }

        return detected;
    }

    /**
     * Vérifie si un utilisateur est en whitelist
     * @param {string} userId - ID de l'utilisateur
     * @returns {Promise<boolean>}
     */
    async isUserWhitelisted(userId) {
        try {
            // Vérifier le cache
            const cached = this.whitelistCache.get(userId);
            if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
                return cached.whitelisted;
            }

            if (!this.db.isAvailable()) {
                return false;
            }

            const whitelist = await this.db.select('studi_whitelist', {
                user_id: userId,
                is_active: true
            });

            let isWhitelisted = false;
            if (whitelist.length > 0) {
                const entry = whitelist[0];
                // Vérifier l'expiration
                if (!entry.expires_at || new Date() < new Date(entry.expires_at)) {
                    isWhitelisted = true;
                } else {
                    // Entrée expirée, la désactiver
                    await this.db.update('studi_whitelist', 
                        { is_active: false }, 
                        entry.id
                    );
                }
            }

            // Mettre en cache
            this.whitelistCache.set(userId, {
                whitelisted: isWhitelisted,
                timestamp: Date.now()
            });

            return isWhitelisted;
        } catch (error) {
            Logger.error('EnhancedStudiService: Erreur vérification whitelist:', {
                userId,
                error: error.message
            });
            return false;
        }
    }

    /**
     * Récupère ou crée un offenseur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} username - Nom d'utilisateur
     * @param {string} guildId - ID du serveur
     * @returns {Promise<Object>}
     */
    async getOrCreateOffender(userId, username, guildId) {
        try {
            if (!this.db.isAvailable()) {
                return { 
                    id: null, 
                    user_id: userId, 
                    offense_count: 0, 
                    escalation_level: 'warning',
                    is_banned: false 
                };
            }

            let offenders = await this.db.select('studi_offenders_enhanced', {
                user_id: userId,
                guild_id: guildId
            });

            if (offenders.length > 0) {
                return offenders[0];
            } else {
                // Créer un nouvel offenseur
                const result = await this.db.insert('studi_offenders_enhanced', {
                    user_id: userId,
                    username,
                    guild_id: guildId,
                    offense_count: 0,
                    escalation_level: 'warning',
                    is_banned: false
                });

                return {
                    id: result.insertId,
                    user_id: userId,
                    username,
                    guild_id: guildId,
                    offense_count: 0,
                    escalation_level: 'warning',
                    is_banned: false
                };
            }
        } catch (error) {
            Logger.error('EnhancedStudiService: Erreur récupération offenseur:', {
                error: error.message
            });
            return { 
                id: null, 
                user_id: userId, 
                offense_count: 0, 
                escalation_level: 'warning',
                is_banned: false 
            };
        }
    }

    /**
     * Met à jour les données d'un offenseur
     * @param {Object} offender - Données de l'offenseur
     * @param {string} escalationLevel - Nouveau niveau d'escalade
     */
    async updateOffender(offender, escalationLevel) {
        try {
            if (!this.db.isAvailable() || !offender.id) return;

            await this.db.update('studi_offenders_enhanced', {
                offense_count: offender.offense_count + 1,
                escalation_level: escalationLevel,
                total_messages_deleted: (offender.total_messages_deleted || 0) + 1,
                last_offense_at: new Date()
            }, offender.id);
        } catch (error) {
            Logger.error('EnhancedStudiService: Erreur mise à jour offenseur:', {
                error: error.message
            });
        }
    }

    /**
     * Met à jour le statut de ban d'un offenseur
     * @param {number} offenderId - ID de l'offenseur
     * @param {string} bannedBy - ID du bannisseur
     */
    async updateOffenderBanStatus(offenderId, bannedBy) {
        try {
            if (!this.db.isAvailable() || !offenderId) return;

            await this.db.update('studi_offenders_enhanced', {
                is_banned: true,
                banned_at: new Date(),
                banned_by: bannedBy
            }, offenderId);
        } catch (error) {
            Logger.error('EnhancedStudiService: Erreur mise à jour ban:', {
                error: error.message
            });
        }
    }

    /**
     * Logger une action de modération
     * @param {string} guildId - ID du serveur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} channelId - ID du canal
     * @param {string} messageId - ID du message
     * @param {string} actionType - Type d'action
     * @param {string} contentSnippet - Extrait du contenu
     * @param {Array} detectedKeywords - Mots-clés détectés
     */
    async logAction(guildId, userId, channelId, messageId, actionType, contentSnippet = null, detectedKeywords = []) {
        try {
            if (!this.db.isAvailable()) return;

            await this.db.insert('studi_moderation_logs', {
                user_id: userId,
                guild_id: guildId,
                channel_id: channelId,
                message_id: messageId,
                action_type: actionType,
                content_snippet: contentSnippet,
                detected_keywords: JSON.stringify(detectedKeywords),
                automated: true
            });
        } catch (error) {
            Logger.error('EnhancedStudiService: Erreur log action:', {
                error: error.message
            });
        }
    }

    /**
     * Met à jour les statistiques quotidiennes
     * @param {string} guildId - ID du serveur
     * @param {string} action - Action effectuée
     */
    async updateStatistics(guildId, action) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const statsKey = `${guildId}:${today}`;
            
            // Mettre à jour le cache en temps réel
            if (!this.dailyStats.has(statsKey)) {
                this.dailyStats.set(statsKey, {
                    messages_deleted: 0,
                    warnings_sent: 0,
                    timeouts_applied: 0,
                    kicks_executed: 0,
                    bans_executed: 0,
                    whitelist_bypasses: 0
                });
            }
            
            const stats = this.dailyStats.get(statsKey);
            
            switch (action) {
                case 'warning':
                    stats.messages_deleted++;
                    stats.warnings_sent++;
                    break;
                case 'timeout':
                    stats.messages_deleted++;
                    stats.timeouts_applied++;
                    break;
                case 'kick':
                    stats.messages_deleted++;
                    stats.kicks_executed++;
                    break;
                case 'ban':
                    stats.messages_deleted++;
                    stats.bans_executed++;
                    break;
                case 'whitelist_bypass':
                    stats.whitelist_bypasses++;
                    break;
            }

            // Mettre à jour en base de données si disponible
            if (this.db.isAvailable()) {
                const updateQuery = `
                    INSERT INTO studi_statistics (guild_id, date, messages_deleted, warnings_sent, timeouts_applied, kicks_executed, bans_executed, whitelist_bypasses)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    messages_deleted = messages_deleted + VALUES(messages_deleted),
                    warnings_sent = warnings_sent + VALUES(warnings_sent),
                    timeouts_applied = timeouts_applied + VALUES(timeouts_applied),
                    kicks_executed = kicks_executed + VALUES(kicks_executed),
                    bans_executed = bans_executed + VALUES(bans_executed),
                    whitelist_bypasses = whitelist_bypasses + VALUES(whitelist_bypasses)
                `;

                const increments = action === 'warning' ? [1, 1, 0, 0, 0, 0] :
                                action === 'timeout' ? [1, 0, 1, 0, 0, 0] :
                                action === 'kick' ? [1, 0, 0, 1, 0, 0] :
                                action === 'ban' ? [1, 0, 0, 0, 1, 0] :
                                action === 'whitelist_bypass' ? [0, 0, 0, 0, 0, 1] :
                                [0, 0, 0, 0, 0, 0];

                await this.db.query(updateQuery, [guildId, today, ...increments]);
            }
        } catch (error) {
            Logger.error('EnhancedStudiService: Erreur mise à jour statistiques:', {
                error: error.message
            });
        }
    }

    /**
     * Récupère la configuration d'un serveur
     * @param {string} guildId - ID du serveur
     * @returns {Promise<Object>}
     */
    async getGuildConfig(guildId) {
        try {
            // Vérifier le cache
            const cached = this.configCache.get(guildId);
            if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
                return cached.config;
            }

            if (!this.db.isAvailable()) {
                return this.defaultConfig;
            }

            const configs = await this.db.select('studi_guild_config', {
                guild_id: guildId
            });

            let config;
            if (configs.length > 0) {
                const dbConfig = configs[0];
                config = {
                    ...this.defaultConfig,
                    enabled: dbConfig.enabled,
                    keywords: JSON.parse(dbConfig.keywords || '[]'),
                    caseSensitive: dbConfig.case_sensitive,
                    escalationEnabled: dbConfig.escalation_enabled,
                    warningThreshold: dbConfig.warning_threshold,
                    timeoutThreshold: dbConfig.timeout_threshold,
                    kickThreshold: dbConfig.kick_threshold,
                    timeoutDuration: dbConfig.timeout_duration,
                    resetPeriod: dbConfig.reset_period,
                    warningMessage: dbConfig.warning_message,
                    timeoutReason: dbConfig.timeout_reason,
                    kickReason: dbConfig.kick_reason,
                    banReason: dbConfig.ban_reason
                };
            } else {
                // Créer la configuration par défaut
                await this.db.insert('studi_guild_config', {
                    guild_id: guildId,
                    keywords: JSON.stringify(this.defaultConfig.keywords)
                });
                config = this.defaultConfig;
            }

            // Mettre en cache
            this.configCache.set(guildId, {
                config,
                timestamp: Date.now()
            });

            return config;
        } catch (error) {
            Logger.error('EnhancedStudiService: Erreur récupération config:', {
                error: error.message
            });
            return this.defaultConfig;
        }
    }

    /**
     * Envoie un avertissement privé à un utilisateur
     * @param {User} user - Utilisateur
     * @param {string} message - Message d'avertissement
     */
    async sendWarning(user, message) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('⚠️ Avertissement')
                .setDescription(message)
                .setColor('#f1c40f')
                .setTimestamp()
                .setFooter({ 
                    text: 'Merci de respecter les règles du serveur' 
                });

            await user.send({ embeds: [embed] });
        } catch (error) {
            Logger.warn('Impossible d\'envoyer l\'avertissement privé:', {
                userId: user.id,
                error: error.message
            });
        }
    }

    /**
     * Envoie une notification de timeout
     * @param {User} user - Utilisateur
     * @param {number} duration - Durée en secondes
     */
    async sendTimeoutNotification(user, duration) {
        try {
            const embed = new EmbedBuilder()
                .setTitle('🔇 Timeout appliqué')
                .setDescription(`Vous avez été mis en timeout pour ${Math.round(duration / 60)} minutes en raison de violations répétées.`)
                .setColor('#e67e22')
                .setTimestamp()
                .setFooter({ 
                    text: 'Merci de respecter les règles du serveur' 
                });

            await user.send({ embeds: [embed] });
        } catch (error) {
            Logger.warn('Impossible d\'envoyer la notification de timeout:', {
                userId: user.id,
                error: error.message
            });
        }
    }

    /**
     * Réinitialise les statistiques quotidiennes à minuit
     */
    resetDailyStatsAtMidnight() {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        
        const msUntilMidnight = midnight.getTime() - now.getTime();
        
        setTimeout(() => {
            this.dailyStats.clear();
            Logger.info('EnhancedStudiService: Statistiques quotidiennes réinitialisées');
            
            // Programmer la prochaine réinitialisation (24h plus tard)
            setInterval(() => {
                this.dailyStats.clear();
                Logger.info('EnhancedStudiService: Statistiques quotidiennes réinitialisées');
            }, 24 * 60 * 60 * 1000);
            
        }, msUntilMidnight);
    }

    /**
     * Récupère les statistiques en temps réel
     * @param {string} guildId - ID du serveur
     * @returns {Object}
     */
    getRealTimeStats(guildId) {
        const today = new Date().toISOString().split('T')[0];
        const statsKey = `${guildId}:${today}`;
        
        return this.dailyStats.get(statsKey) || {
            messages_deleted: 0,
            warnings_sent: 0,
            timeouts_applied: 0,
            kicks_executed: 0,
            bans_executed: 0,
            whitelist_bypasses: 0
        };
    }

    /**
     * Nettoie le cache
     */
    clearCache() {
        this.configCache.clear();
        this.whitelistCache.clear();
        Logger.info('EnhancedStudiService: Cache nettoyé');
    }

    /**
     * Récupère les statistiques globales
     * @returns {Object}
     */
    getStats() {
        return {
            configCacheSize: this.configCache.size,
            whitelistCacheSize: this.whitelistCache.size,
            dailyStatsSize: this.dailyStats.size
        };
    }
}