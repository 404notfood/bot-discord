/**
 * @file ban_remove.js
 * @description Commande pour débannir un utilisateur du serveur Discord
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ban_remove')
        .setDescription('Débannir un utilisateur du serveur')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('ID de l\'utilisateur à débannir')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison du débannissement')
                .setRequired(false)
        ),

    permissions: ['moderation.unban'],
    category: 'moderation',

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const userId = interaction.options.getString('user_id');
            const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée';
            const executor = interaction.user;

            // Valider l'ID utilisateur
            if (!/^\d{17,19}$/.test(userId)) {
                throw ErrorHandler.createError('VALIDATION_ERROR', 'ID utilisateur invalide');
            }

            // Vérifier si l'utilisateur est banni
            let banInfo;
            try {
                banInfo = await interaction.guild.bans.fetch(userId);
            } catch (error) {
                if (error.code === 10026) { // Unknown Ban
                    throw ErrorHandler.createError('VALIDATION_ERROR', 'Cet utilisateur n\'est pas banni');
                }
                throw error;
            }

            // Récupérer les informations de l'utilisateur
            const bannedUser = banInfo.user;

            // Effectuer le débannissement
            await interaction.guild.members.unban(userId, `${reason} (Par: ${executor.username})`);

            // Créer l'embed de confirmation
            const embed = new EmbedBuilder()
                .setTitle('✅ Utilisateur débanni avec succès')
                .setColor('#2ecc71')
                .setThumbnail(bannedUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Utilisateur débanni', value: `${bannedUser} (${bannedUser.username})`, inline: true },
                    { name: '🔓 Débanni par', value: `${executor} (${executor.username})`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${bannedUser.id}` });

            // Ajouter la raison originale du ban si disponible
            if (banInfo.reason) {
                embed.addFields({
                    name: '📜 Raison originale du ban',
                    value: banInfo.reason,
                    inline: false
                });
            }

            await interaction.editReply({ embeds: [embed] });

            // Envoyer un DM à l'utilisateur débanni
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('✅ Vous avez été débanni')
                    .setDescription(`Vous avez été débanni du serveur **${interaction.guild.name}**.`)
                    .setColor('#2ecc71')
                    .addFields(
                        { name: 'Raison du débannissement', value: reason, inline: true },
                        { name: 'Débanni par', value: `${executor.username}`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: 'Vous pouvez maintenant rejoindre le serveur' });

                await bannedUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                Logger.debug(`Impossible d'envoyer un DM à ${bannedUser.username}`, {
                    error: dmError.message
                });
            }

            // Log de l'action
            Logger.info('Utilisateur débanni du serveur', {
                unbannedUserId: bannedUser.id,
                unbannedUsername: bannedUser.username,
                executorId: executor.id,
                guildId: interaction.guild.id,
                reason
            });

            // Enregistrer en base de données si disponible
            const databaseManager = interaction.client.databaseManager;
            if (databaseManager && databaseManager.isAvailable()) {
                try {
                    await databaseManager.query(
                        'INSERT INTO moderation_logs (action_type, target_user_id, executor_user_id, guild_id, reason, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                        ['unban', bannedUser.id, executor.id, interaction.guild.id, reason]
                    );
                } catch (dbError) {
                    Logger.warn('Erreur lors de l\'enregistrement du déban en BDD', {
                        error: dbError.message
                    });
                }
            }

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'ban_remove');
        }
    }
};
