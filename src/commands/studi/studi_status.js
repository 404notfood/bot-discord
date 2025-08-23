import { PermissionFlagsBits, EmbedBuilder, InteractionResponseFlags } from "discord.js";
import { BaseCommand } from "../../models/BaseCommand.js";
import studiService from "../../utils/StudiService.js";
import * as Logger from "../../utils/logger.js";

class StudiStatusCommand extends BaseCommand {
    constructor() {
        super({
            name: "studi_status",
            description: "Vérifier l'état actuel du système anti-Studi",
            defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
            options: []
        });
    }

    async execute(interaction) {
        try {
            const enabled = studiService.isEnabled();
            const bannedUsersCount = studiService.getBannedUsers().length;
            const offendersCount = studiService.getOffenders().length;
            const totalOffenses = studiService.getOffenders().reduce((sum, offender) => sum + offender.count, 0);
            
            // Créer un embed avec les statistiques
            const embed = new EmbedBuilder()
                .setTitle("📊 État du système anti-Studi")
                .setDescription(`Le système est actuellement **${enabled ? "activé" : "désactivé"}**.`)
                .setColor(enabled ? "#2ecc71" : "#e74c3c")
                .addFields(
                    { 
                        name: "Utilisateurs bannis", 
                        value: bannedUsersCount.toString(), 
                        inline: true 
                    },
                    { 
                        name: "Contrevenants", 
                        value: offendersCount.toString(), 
                        inline: true 
                    },
                    { 
                        name: "Total des infractions", 
                        value: totalOffenses.toString(), 
                        inline: true 
                    }
                )
                .setTimestamp();
            
            // Envoyer la réponse
            return interaction.reply({ embeds: [embed] });
        } catch (error) {
            Logger.error("Erreur lors de la vérification de l'état du système anti-Studi", { 
                error: error.message, 
                stack: error.stack 
            });
            
            // Vérifier si l'interaction a déjà reçu une réponse
            if (!interaction.replied && !interaction.deferred) {
                try {
                    return interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("❌ Erreur")
                                .setDescription("Une erreur est survenue lors de la vérification de l'état du système")
                                .setColor("#e74c3c")
                                .setTimestamp()
                        ],
                        flags: [InteractionResponseFlags.Ephemeral]
                    });
                } catch (replyError) {
                    Logger.error("Erreur lors de la réponse à l'interaction", {
                        error: replyError.message
                    });
                }
            }
        }
    }
}

export default new StudiStatusCommand(); 