import { PermissionFlagsBits, EmbedBuilder, InteractionResponseFlags } from "discord.js";
import { BaseCommand } from "../../models/BaseCommand.js";
// Import supprimé - utilisera client.studiService
import * as Logger from "../../utils/logger.js";

class StudiBanRemoveCommand extends BaseCommand {
    constructor() {
        super({
            name: "studi_ban_remove",
            description: "Retirer un utilisateur de la liste de bannissement Studi",
            defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
            options: [
                {
                    name: "user",
                    description: "Utilisateur à retirer de la liste",
                    type: 6,
                    required: true
                }
            ]
        });
    }

    async execute(interaction) {
        const targetUser = interaction.options.getUser("user");
        
        try {
            const studiService = interaction.client.studiService;
            if (!studiService) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("❌ Erreur")
                            .setDescription("Service anti-Studi non disponible.")
                            .setColor("#e74c3c")
                            .setTimestamp()
                    ],
                    flags: [InteractionResponseFlags.Ephemeral]
                });
            }

            const isBanned = await studiService.isUserBanned(targetUser.id, interaction.guild.id);
            if (!isBanned) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("⚠️ Utilisateur non banni")
                            .setDescription(`${targetUser.username} n'est pas dans la liste des utilisateurs bannis Studi.`)
                            .setColor("#f1c40f")
                            .setTimestamp()
                    ],
                    flags: [InteractionResponseFlags.Ephemeral]
                });
            }
            
            await studiService.unbanUser(targetUser.id, interaction.guild.id);
            
            const embed = new EmbedBuilder()
                .setTitle("✅ Utilisateur retiré")
                .setDescription(`${targetUser.username} a été retiré de la liste des utilisateurs bannis Studi.`)
                .setColor("#2ecc71")
                .addFields(
                    { name: "Utilisateur", value: `<@${targetUser.id}>`, inline: true },
                    { name: "Retiré par", value: `<@${interaction.user.id}>`, inline: true }
                )
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
            
            Logger.info(`Utilisateur retiré de la liste de bannissement Studi: ${targetUser.username}`, {
                userId: targetUser.id,
                removedBy: interaction.user.id
            });
            
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle("🔓 Retrait de la liste de bannissement")
                    .setDescription("Vous avez été retiré de la liste des utilisateurs bannis Studi.")
                    .setColor("#2ecc71")
                    .addFields(
                        { name: "Retiré par", value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp();
                    
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                Logger.debug(`Impossible d'envoyer un DM à ${targetUser.username}`, { error: error.message });
            }
        } catch (error) {
            Logger.error("Erreur lors du retrait de la liste des bannis Studi", { 
                error: error.message, 
                stack: error.stack 
            });
            
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("❌ Erreur")
                                .setDescription("Une erreur est survenue lors du retrait de la liste des bannis Studi")
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

export default new StudiBanRemoveCommand(); 