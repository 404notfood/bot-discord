/**
 * Service centralisé pour la gestion du système anti-Studi
 */

export class StudiService {
    /**
     * Crée une nouvelle instance du service anti-Studi
     */
    constructor() {
        // Liste des mots-clés liés à Studi à détecter
        this.keywords = ['studi', 'studi.fr', 'studifr', 'école studi'];
        
        // Map des utilisateurs bannis (userId => info)
        this.bannedUsers = new Map();
        
        // Map du nombre d'infractions par utilisateur (userId => count)
        this.offenders = new Map();
        
        // Configuration du système
        this.config = {
            enabled: true,
            warningMessage: "⚠️ Les références à Studi ne sont pas autorisées dans ce serveur.",
            replacementMessage: "❌ [Message contenant une référence à S**di supprimé]"
        };
    }

    /**
     * Vérifie si le système est activé
     * @returns {boolean} - True si le système est activé
     */
    isEnabled() {
        return this.config.enabled;
    }

    /**
     * Active ou désactive le système
     * @param {boolean} status - Nouvel état du système
     */
    setEnabled(status) {
        this.config.enabled = status;
    }

    /**
     * Définit le message d'avertissement
     * @param {string} message - Nouveau message d'avertissement
     */
    setWarningMessage(message) {
        this.config.warningMessage = message;
    }

    /**
     * Définit le message de remplacement
     * @param {string} message - Nouveau message de remplacement
     */
    setReplacementMessage(message) {
        this.config.replacementMessage = message;
    }

    /**
     * Vérifie si un message contient des références à Studi
     * @param {string} content - Contenu du message
     * @returns {boolean} - True si le message contient des références à Studi
     */
    containsStudiReference(content) {
        if (!content || typeof content !== 'string') return false;
        
        const lowerContent = content.toLowerCase();
        return this.keywords.some(keyword => lowerContent.includes(keyword.toLowerCase()));
    }

    /**
     * Ajoute un utilisateur à la liste des bannis
     * @param {Object} userInfo - Informations sur l'utilisateur
     * @returns {boolean} - True si l'utilisateur a été ajouté
     */
    addBannedUser(userInfo) {
        if (!userInfo || !userInfo.userId) return false;
        
        this.bannedUsers.set(userInfo.userId, {
            ...userInfo,
            bannedAt: new Date()
        });
        
        return true;
    }

    /**
     * Vérifie si un utilisateur est banni
     * @param {string} userId - ID de l'utilisateur
     * @returns {boolean} - True si l'utilisateur est banni
     */
    isUserBanned(userId) {
        return this.bannedUsers.has(userId);
    }

    /**
     * Retire un utilisateur de la liste des bannis
     * @param {string} userId - ID de l'utilisateur
     * @returns {boolean} - True si l'utilisateur a été retiré
     */
    removeBannedUser(userId) {
        return this.bannedUsers.delete(userId);
    }

    /**
     * Récupère la liste des utilisateurs bannis
     * @returns {Array} - Liste des utilisateurs bannis
     */
    getBannedUsers() {
        return Array.from(this.bannedUsers.values());
    }

    /**
     * Incrémente le compteur d'infractions pour un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @param {string} username - Nom d'utilisateur
     */
    incrementOffenseCount(userId, username) {
        const currentCount = this.offenders.get(userId) || { count: 0, username };
        currentCount.count += 1;
        currentCount.username = username; // Mettre à jour le nom en cas de changement
        currentCount.lastOffense = new Date();
        
        this.offenders.set(userId, currentCount);
    }

    /**
     * Récupère la liste des contrevenants
     * @returns {Array} - Liste des contrevenants avec leur nombre d'infractions
     */
    getOffenders() {
        return Array.from(this.offenders.entries()).map(([userId, data]) => ({
            userId,
            username: data.username,
            count: data.count,
            lastOffense: data.lastOffense
        }));
    }

    /**
     * Récupère le nombre d'infractions d'un utilisateur
     * @param {string} userId - ID de l'utilisateur
     * @returns {number} - Nombre d'infractions
     */
    getOffenseCount(userId) {
        const data = this.offenders.get(userId);
        return data ? data.count : 0;
    }
}

// Instance singleton du service
const studiService = new StudiService();

export default studiService; 