/**
 * @fileoverview Fonctions utilitaires pour le bot
 */

/**
 * Fonction utilitaire pour formater une date en chaîne lisible.
 * @param {Date} date - La date à formater.
 * @returns {string} - La date formatée.
 */
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('fr-FR', options);
}

/**
 * Fonction utilitaire pour extraire l'ID d'un utilisateur à partir d'une mention.
 * @param {string} mention - La mention de l'utilisateur (format : <@123456789012345678>).
 * @returns {string|null} - L'ID de l'utilisateur ou null si le format est incorrect.
 */
function extractUserIdFromMention(mention) {
    const match = mention.match(/^<@!?(\d+)>$/);
    return match ? match[1] : null;
}

/**
 * Fonction utilitaire pour vérifier si une chaîne est une URL valide.
 * @param {string} url - La chaîne à vérifier.
 * @returns {boolean} - Vrai si la chaîne est une URL valide, faux sinon.
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch (_) {
        return false;
    }
}

/**
 * Génère une chaîne aléatoire de la longueur spécifiée.
 * @param {number} length - Longueur de la chaîne à générer.
 * @returns {string} - Chaîne aléatoire.
 */
function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Tronque une chaîne si elle dépasse la longueur maximale.
 * @param {string} str - Chaîne à tronquer.
 * @param {number} maxLength - Longueur maximale.
 * @returns {string} - Chaîne tronquée.
 */
function truncateString(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

/**
 * Attendre un certain temps.
 * @param {number} ms - Temps d'attente en millisecondes.
 * @returns {Promise<void>} Promise résolue après le délai.
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Formate un nombre d'octets en une chaîne lisible.
 * @param {number} bytes - Nombre d'octets.
 * @returns {string} - Chaîne formatée.
 */
function formatBytes(bytes) {
    if (bytes === 0) return '0 Octets';
    
    const k = 1024;
    const sizes = ['Octets', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export {
    formatDate,
    extractUserIdFromMention,
    isValidUrl,
    generateRandomString,
    truncateString,
    sleep,
    formatBytes
}; 