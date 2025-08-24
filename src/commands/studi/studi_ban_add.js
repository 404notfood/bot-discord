import { PermissionFlagsBits, EmbedBuilder, InteractionResponseFlags } from "discord.js";
import { BaseCommand } from "../../models/BaseCommand.js";
// Import supprimé - utilisera client.studiService
import * as Logger from "../../utils/logger.js";

class StudiBanAddCommand extends BaseCommand {
    constructor() {
        super({
            name: "studi_ban_add",
            description: "Ajouter un utilisateur à la liste de bannissement Studi",
            defaultMemberPermissions: PermissionFlagsBits.ModerateMembers,
            options: [
                {
                    name: "user",
                    description: "Utilisateur à bannir",
                    type: 6,
                    required: true
                },
                {
                    name: "reason",
                    description: "Raison du bannissement",
                    type: 3,
                    required: true
                }
            ]
        });
    }

    async execute(interaction) {
        const targetUser = interaction.options.getUser("user");
        const reason = interaction.options.getString("reason");
        
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

            const isAlreadyBanned = await studiService.isUserBanned(targetUser.id, interaction.guild.id);
            if (isAlreadyBanned) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("⚠️ Utilisateur déjà banni")
                            .setDescription(`${targetUser.username} est déjà dans la liste des utilisateurs bannis Studi.`)
                            .setColor("#f1c40f")
                            .setTimestamp()
                    ],
                    flags: [InteractionResponseFlags.Ephemeral]
                });
            }
            
            await studiService.banUser(
                targetUser.id,
                targetUser.username,
                interaction.guild.id,
                interaction.user.id,
                reason
            );
            
            const embed = new EmbedBuilder()
                .setTitle("✅ Utilisateur banni")
                .setDescription(`${targetUser.username} a été ajouté à la liste des utilisateurs bannis Studi.`)
                .setColor("#2ecc71")
                .addFields(
                    { name: "Utilisateur", value: `<@${targetUser.id}>`, inline: true },
                    { name: "Raison", value: reason, inline: true },
                    { name: "Banni par", value: `<@${interaction.user.id}>`, inline: true }
                )
                .setTimestamp();
                
            await interaction.reply({ embeds: [embed] });
            
            Logger.info(`Utilisateur ajouté à la liste de bannissement Studi: ${targetUser.username}`, {
                userId: targetUser.id,
                reason: reason,
                bannedBy: interaction.user.id
            });
            
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle("🚫 Vous avez été banni du système Studi")
                    .setDescription("Vous avez été ajouté à la liste des utilisateurs bannis Studi. Vos messages contenant des références à Studi seront automatiquement supprimés.")
                    .setColor("#e74c3c")
                    .addFields(
                        { name: "Raison", value: reason, inline: true },
                        { name: "Banni par", value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp();
                    
                await targetUser.send({ embeds: [dmEmbed] });
            } catch (error) {
                Logger.debug(`Impossible d'envoyer un DM à ${targetUser.username}`, { error: error.message });
            }
        } catch (error) {
            Logger.error("Erreur lors de l'ajout à la liste des bannis Studi", { 
                error: error.message, 
                stack: error.stack 
            });
            
            if (!interaction.replied && !interaction.deferred) {
                try {
                    await interaction.reply({
                        embeds: [
                            new EmbedBuilder()
                                .setTitle("❌ Erreur")
                                .setDescription("Une erreur est survenue lors de l'ajout à la liste des bannis Studi")
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

export default new StudiBanAddCommand(); 