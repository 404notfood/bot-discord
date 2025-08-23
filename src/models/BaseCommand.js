/**
 * Classe de base pour toutes les commandes du bot
 */
export class BaseCommand {
    /**
     * Constructeur de la commande
     * @param {Object} options - Options de la commande
     */
    constructor(options = {}) {
        this.name = options.name || '';
        this.description = options.description || '';
        this.options = options.options || [];
        this.defaultPermission = options.defaultPermission;
        this.defaultMemberPermissions = options.defaultMemberPermissions;
        this.type = options.type || 1; // SlashCommandBuilder.CommandType.CHAT_INPUT
        this.category = options.category || 'general';

        // Créer la propriété data attendue par le système de déploiement
        this.data = {
            name: this.name,
            description: this.description,
            options: this.options,
            default_permission: this.defaultPermission,
            default_member_permissions: this.defaultMemberPermissions,
            type: this.type,
            toJSON: () => this.toJSON()
        };
        
        // Ajouter un alias de la méthode execute pour la compatibilité avec run
        this.run = this.execute;
    }

    /**
     * Méthode d'exécution de la commande (à implémenter dans les classes filles)
     * @param {Object} interaction - L'interaction Discord
     */
    async execute(interaction) {
        throw new Error('La méthode execute() doit être implémentée par les classes filles');
    }

    /**
     * Méthode de validation des permissions (à surcharger si nécessaire)
     * @param {Object} interaction - L'interaction Discord
     * @returns {boolean} - True si l'utilisateur a les permissions, false sinon
     */
    async hasPermission(interaction) {
        return true;
    }

    /**
     * Convertit la commande en format JSON pour l'enregistrement Discord
     * @returns {Object} - La représentation JSON de la commande
     */
    toJSON() {
        return {
            name: this.name,
            description: this.description,
            options: this.options,
            default_permission: this.defaultPermission,
            default_member_permissions: this.defaultMemberPermissions ? 
                this.defaultMemberPermissions.toString() : undefined,
            type: this.type
        };
    }
}

// Exporter également comme exportation par défaut pour la compatibilité
export default BaseCommand; 