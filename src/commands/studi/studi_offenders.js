/**
 * Commande pour afficher la liste des contrevenants Studi
 */

import { PermissionFlagsBits, EmbedBuilder, InteractionResponseFlags } from 'discord.js';
import { BaseCommand } from '../../models/BaseCommand.js';
import studiService from '../../utils/StudiService.js';
import * as Logger from '../../utils/logger.js';

/**
 * Commande studi_offenders
 */
export class StudiOffendersCommand extends BaseCommand {
    /**
     * Crée une nouvelle instance de StudiOffendersCommand
     */
    constructor() {
        super({
            name: 'studi_offenders',
            description: 'Afficher la liste des contrevenants avec leur nombre d\'infractions',
            defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
            options: []
        });
    }

    /**
     * Exécute la commande
     * @param {Object} interaction - L'interaction Discord
     */
    async execute(interaction) {
        try {
            // Récupérer la liste des contrevenants
            const offenders = studiService.getOffenders();
            
            if (offenders.length === 0) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('📋 Liste des contrevenants')
                            .setDescription('Aucune infraction n\'a été enregistrée.')
                            .setColor('#3498db')
                            .setTimestamp()
                    ]
                });
            }
            
            // Trier les contrevenants par nombre d'infractions (ordre décroissant)
            offenders.sort((a, b) => b.count - a.count);
            
            // Créer un embed avec la liste des contrevenants
            const embed = new EmbedBuilder()
                .setTitle('📋 Liste des contrevenants')
                .setDescription(`${offenders.length} utilisateur(s) ont enfreint les règles anti-Studi`)
                .setColor('#e74c3c')
                .setTimestamp();
            
            // Ajouter les contrevenants à l'embed (limiter à 10 maximum pour ne pas dépasser la limite d'embed)
            const maxToShow = Math.min(offenders.length, 10);
            for (let i = 0; i < maxToShow; i++) {
                const offender = offenders[i];
                const lastOffenseDate = offender.lastOffense ? new Date(offender.lastOffense).toLocaleString() : 'Date inconnue';
                
                embed.addFields({
                    name: `${i + 1}. ${offender.username} (${offender.userId})`,
                    value: `**Infractions:** ${offender.count}\n**Dernière infraction:** ${lastOffenseDate}`
                });
            }
            
            // Ajouter un message si la liste est tronquée
            if (offenders.length > 10) {
                embed.setFooter({ 
                    text: `Et ${offenders.length - 10} autres utilisateurs...`
                });
            }
            
            await interaction.reply({ embeds: [embed] });
            
            // Enregistrer dans les logs
            Logger.info(`Liste des contrevenants Studi consultée`, {
                userId: interaction.user.id,
                username: interaction.user.username,
                offendersCount: offenders.length
            });
            
        } catch (error) {
            Logger.error('Erreur lors de la récupération de la liste des contrevenants:', { 
                error: error.message, 
                stack: error.stack 
            });
            
            // Vérifier si l'interaction a déjà reçu une réponse
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle('❌ Erreur')
                                .setDescription('Une erreur est survenue lors de la récupération de la liste des contrevenants.')
                                .setColor('#e74c3c')
                                .setTimestamp()
                        ],
                        flags: [InteractionResponseFlags.Ephemeral]
                    });
                } catch (replyError) {
                    Logger.error('Erreur lors de la réponse à l\'interaction:', {
                        error: replyError.message
                    });
                }
            }
        }
    }
}

export default new StudiOffendersCommand(); 