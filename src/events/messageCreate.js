/**
 * Gestionnaire d'événement messageCreate pour le système anti-Studi
 */

import { EmbedBuilder } from 'discord.js';
import studiService from '../utils/StudiService.js';
import * as Logger from '../utils/logger.js';

/**
 * Classe de gestion de l'événement messageCreate
 */
export class MessageCreateEvent {
    /**
     * Constructeur de l'événement
     */
    constructor() {
        this.name = 'messageCreate';
        this.once = false;
    }

    /**
     * Exécute la logique de l'événement
     * @param {Object} message - Le message Discord
     * @param {Object} client - Le client Discord
     */
    async execute(message, client) {
        // Ignorer les messages des bots (y compris ce bot)
        if (message.author.bot) return;
        
        // Vérifier si le système anti-Studi est activé
        if (!studiService.isEnabled()) return;
        
        // Vérifier si l'utilisateur est déjà banni
        if (studiService.isUserBanned(message.author.id)) {
            try {
                // Supprimer le message si c'est possible
                if (message.deletable) {
                    await message.delete();
                }
                
                // Enregistrer dans les logs
                Logger.info(`Message d'un utilisateur banni supprimé`, {
                    userId: message.author.id,
                    username: message.author.username,
                    channelId: message.channel.id,
                    messageId: message.id
                });
                
                return;
            } catch (error) {
                Logger.error(`Erreur lors de la suppression du message d'un utilisateur banni`, {
                    error: error.message,
                    userId: message.author.id,
                    messageId: message.id
                });
            }
        }
        
        // Vérifier si le message contient une référence à Studi
        if (studiService.containsStudiReference(message.content)) {
            try {
                // Incrémenter le compteur d'infractions
                studiService.incrementOffenseCount(message.author.id, message.author.username);
                
                // Supprimer le message si c'est possible
                if (message.deletable) {
                    await message.delete();
                    
                    // Envoyer un message de remplacement
                    const warningEmbed = new EmbedBuilder()
                        .setTitle('Message supprimé')
                        .setDescription(studiService.config.replacementMessage)
                        .setColor('#e74c3c')
                        .setFooter({ 
                            text: `Infractions: ${studiService.getOffenseCount(message.author.id)}` 
                        })
                        .setTimestamp();
                    
                    const sentMessage = await message.channel.send({ embeds: [warningEmbed] });
                    
                    // Auto-supprimer le message après 5 secondes
                    setTimeout(() => {
                        sentMessage.delete().catch(err => {
                            Logger.debug(`Erreur lors de la suppression du message d'avertissement`, {
                                error: err.message
                            });
                        });
                    }, 5000);
                }
                
                // Envoyer un avertissement à l'utilisateur en MP
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle('⚠️ Avertissement')
                        .setDescription(studiService.config.warningMessage)
                        .setColor('#f1c40f')
                        .addFields(
                            { 
                                name: 'Nombre d\'infractions', 
                                value: studiService.getOffenseCount(message.author.id).toString(), 
                                inline: true 
                            }
                        )
                        .setTimestamp();
                    
                    await message.author.send({ embeds: [dmEmbed] });
                } catch (error) {
                    // Utilisateur a peut-être bloqué les DMs, on ignore silencieusement
                    Logger.debug(`Impossible d'envoyer un DM à ${message.author.username}`, { 
                        error: error.message 
                    });
                }
                
                // Enregistrer dans les logs
                Logger.info(`Message contenant une référence à Studi supprimé`, {
                    userId: message.author.id,
                    username: message.author.username,
                    channelId: message.channel.id,
                    messageId: message.id,
                    offenseCount: studiService.getOffenseCount(message.author.id)
                });
            } catch (error) {
                Logger.error(`Erreur lors du traitement d'un message contenant une référence à Studi`, {
                    error: error.message,
                    stack: error.stack,
                    userId: message.author.id,
                    messageId: message.id
                });
            }
        }
    }
}

export default new MessageCreateEvent(); 