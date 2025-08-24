/**
 * Gestionnaire centralisé des commandes Discord
 */

import { Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import * as Logger from '../utils/logger.js';

export class CommandManager {
    /**
     * Initialise le gestionnaire de commandes
     * @param {Client} client - Client Discord
     */
    constructor(client) {
        this.client = client;
        this.commands = new Collection();
        this.categories = new Map();
        this.cooldowns = new Collection();
    }

    /**
     * Charge toutes les commandes depuis le répertoire commands
     * @param {string} commandsPath - Chemin vers le dossier des commandes
     */
    async loadCommands(commandsPath) {
        try {
            const commandCategories = fs.readdirSync(commandsPath);
            let totalCommands = 0;

            for (const category of commandCategories) {
                const categoryPath = path.join(commandsPath, category);
                
                if (fs.statSync(categoryPath).isDirectory()) {
                    const categoryCommands = await this.loadCommandsFromCategory(categoryPath, category);
                    totalCommands += categoryCommands;
                }
            }

            // Ajouter les commandes au client pour compatibilité
            this.client.commands = this.commands;

            Logger.info(`CommandManager: ${totalCommands} commandes chargées dans ${this.categories.size} catégories`);
            return totalCommands;
        } catch (error) {
            Logger.error('Erreur lors du chargement des commandes:', { error: error.message });
            throw error;
        }
    }

    /**
     * Charge les commandes d'une catégorie spécifique
     * @param {string} categoryPath - Chemin de la catégorie
     * @param {string} categoryName - Nom de la catégorie
     * @returns {number} Nombre de commandes chargées
     */
    async loadCommandsFromCategory(categoryPath, categoryName) {
        const commandFiles = fs.readdirSync(categoryPath).filter(file => file.endsWith('.js'));
        let loadedCommands = 0;
        const categoryCommands = [];

        for (const file of commandFiles) {
            try {
                const filePath = path.join(categoryPath, file);
                const commandModule = await import(`file://${filePath}`);
                const command = commandModule.default;

                if (this.validateCommand(command, file)) {
                    // Normaliser les méthodes execute/run
                    this.normalizeCommandMethods(command);
                    
                    // Ajouter métadonnées
                    command.category = categoryName;
                    command.filePath = filePath;
                    
                    // Stocker la commande
                    this.commands.set(command.data.name, command);
                    categoryCommands.push(command.data.name);
                    loadedCommands++;

                    Logger.debug(`Commande chargée: ${command.data.name}`, { 
                        category: categoryName,
                        file 
                    });
                } else {
                    Logger.warn(`Commande invalide: ${file}`, { category: categoryName });
                }
            } catch (error) {
                Logger.error(`Erreur lors du chargement de ${file}:`, { 
                    error: error.message,
                    category: categoryName 
                });
            }
        }

        // Stocker les commandes de la catégorie
        if (categoryCommands.length > 0) {
            this.categories.set(categoryName, categoryCommands);
        }

        return loadedCommands;
    }

    /**
     * Valide qu'une commande a le format requis
     * @param {Object} command - Objet commande
     * @param {string} fileName - Nom du fichier
     * @returns {boolean}
     */
    validateCommand(command, fileName) {
        if (!command) {
            Logger.warn(`Commande ${fileName}: export par défaut manquant`);
            return false;
        }

        if (!command.data) {
            Logger.warn(`Commande ${fileName}: propriété 'data' manquante`);
            return false;
        }

        if (!command.execute && !command.run) {
            Logger.warn(`Commande ${fileName}: méthode 'execute' ou 'run' manquante`);
            return false;
        }

        if (typeof command.data.name !== 'string') {
            Logger.warn(`Commande ${fileName}: nom de commande invalide`);
            return false;
        }

        return true;
    }

    /**
     * Normalise les méthodes execute/run pour compatibilité
     * @param {Object} command - Objet commande
     */
    normalizeCommandMethods(command) {
        // Si seulement run existe, créer execute
        if (command.run && !command.execute) {
            command.execute = command.run;
        }
        // Si seulement execute existe, créer run
        else if (command.execute && !command.run) {
            command.run = command.execute;
        }
    }

    /**
     * Exécute une commande avec gestion des erreurs et cooldowns
     * @param {Interaction} interaction - Interaction Discord
     */
    async executeCommand(interaction) {
        const command = this.commands.get(interaction.commandName);
        
        if (!command) {
            Logger.warn(`Commande inconnue: ${interaction.commandName}`);
            return;
        }

        // Vérifier le cooldown
        if (this.isOnCooldown(interaction.user.id, command.data.name)) {
            const timeLeft = this.getCooldownTimeLeft(interaction.user.id, command.data.name);
            await this.sendCooldownMessage(interaction, timeLeft);
            return;
        }

        try {
            // Logger l'exécution
            Logger.info(`Exécution commande: ${command.data.name}`, {
                userId: interaction.user.id,
                guildId: interaction.guild?.id,
                channelId: interaction.channelId,
                category: command.category
            });

            // Exécuter la commande
            await command.execute(interaction);

            // Appliquer le cooldown
            this.applyCooldown(interaction.user.id, command.data.name, command.cooldown || 3000);

        } catch (error) {
            Logger.error(`Erreur lors de l'exécution de ${command.data.name}:`, {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });

            await this.handleCommandError(interaction, error);
        }
    }

    /**
     * Vérifie si un utilisateur est en cooldown pour une commande
     * @param {string} userId - ID de l'utilisateur
     * @param {string} commandName - Nom de la commande
     * @returns {boolean}
     */
    isOnCooldown(userId, commandName) {
        const key = `${userId}-${commandName}`;
        const cooldownEnd = this.cooldowns.get(key);
        return cooldownEnd && Date.now() < cooldownEnd;
    }

    /**
     * Récupère le temps restant de cooldown
     * @param {string} userId - ID de l'utilisateur
     * @param {string} commandName - Nom de la commande
     * @returns {number} Temps en millisecondes
     */
    getCooldownTimeLeft(userId, commandName) {
        const key = `${userId}-${commandName}`;
        const cooldownEnd = this.cooldowns.get(key);
        return cooldownEnd ? Math.max(0, cooldownEnd - Date.now()) : 0;
    }

    /**
     * Applique un cooldown à un utilisateur pour une commande
     * @param {string} userId - ID de l'utilisateur
     * @param {string} commandName - Nom de la commande
     * @param {number} duration - Durée en millisecondes
     */
    applyCooldown(userId, commandName, duration) {
        const key = `${userId}-${commandName}`;
        const cooldownEnd = Date.now() + duration;
        this.cooldowns.set(key, cooldownEnd);

        // Nettoyer automatiquement après expiration
        setTimeout(() => {
            this.cooldowns.delete(key);
        }, duration);
    }

    /**
     * Envoie un message de cooldown à l'utilisateur
     * @param {Interaction} interaction - Interaction Discord
     * @param {number} timeLeft - Temps restant en ms
     */
    async sendCooldownMessage(interaction, timeLeft) {
        const seconds = Math.ceil(timeLeft / 1000);
        const message = `⏱️ Vous devez attendre encore ${seconds} seconde(s) avant de réutiliser cette commande.`;
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: message, ephemeral: true });
            } else {
                await interaction.reply({ content: message, ephemeral: true });
            }
        } catch (error) {
            Logger.error('Erreur envoi message cooldown:', { error: error.message });
        }
    }

    /**
     * Gère les erreurs d'exécution de commande
     * @param {Interaction} interaction - Interaction Discord
     * @param {Error} error - Erreur survenue
     */
    async handleCommandError(interaction, error) {
        const errorMessage = "❌ Une erreur est survenue lors de l'exécution de cette commande.";
        
        try {
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: errorMessage, ephemeral: true });
            } else {
                await interaction.reply({ content: errorMessage, ephemeral: true });
            }
        } catch (replyError) {
            Logger.error('Erreur envoi message d\'erreur:', { error: replyError.message });
        }
    }

    /**
     * Récupère une commande par son nom
     * @param {string} commandName - Nom de la commande
     * @returns {Object|null}
     */
    getCommand(commandName) {
        return this.commands.get(commandName);
    }

    /**
     * Récupère toutes les commandes d'une catégorie
     * @param {string} categoryName - Nom de la catégorie
     * @returns {Array}
     */
    getCommandsByCategory(categoryName) {
        const commandNames = this.categories.get(categoryName) || [];
        return commandNames.map(name => this.commands.get(name)).filter(Boolean);
    }

    /**
     * Récupère toutes les catégories
     * @returns {Array}
     */
    getCategories() {
        return Array.from(this.categories.keys());
    }

    /**
     * Statistiques du gestionnaire
     * @returns {Object}
     */
    getStats() {
        return {
            totalCommands: this.commands.size,
            categories: this.categories.size,
            activeCooldowns: this.cooldowns.size
        };
    }
}