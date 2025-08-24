/**
 * @file ban_add.js
 * @description Commande pour bannir un utilisateur du serveur Discord
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('ban_add')
        .setDescription('Bannir un utilisateur du serveur')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur à bannir')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('Raison du bannissement')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('delete_days')
                .setDescription('Nombre de jours de messages à supprimer (0-7)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(7)
        ),

    permissions: ['moderation.ban'],
    category: 'moderation',

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const targetUser = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'Aucune raison spécifiée';
            const deleteDays = interaction.options.getInteger('delete_days') || 0;
            const executor = interaction.user;

            // Vérifications de sécurité
            if (targetUser.id === executor.id) {
                throw ErrorHandler.createError('PERMISSION_ERROR', 'Vous ne pouvez pas vous bannir vous-même');
            }

            if (targetUser.id === interaction.client.user.id) {
                throw ErrorHandler.createError('PERMISSION_ERROR', 'Je ne peux pas me bannir moi-même');
            }

            // Vérifier si l'utilisateur est déjà banni
            try {
                const existingBan = await interaction.guild.bans.fetch(targetUser.id);
                if (existingBan) {
                    throw ErrorHandler.createError('VALIDATION_ERROR', `${targetUser.username} est déjà banni du serveur`);
                }
            } catch (error) {
                // L'utilisateur n'est pas banni, on peut continuer
                if (error.code !== 10026) { // Unknown Ban
                    throw error;
                }
            }

            // Vérifier si l'utilisateur est sur le serveur
            let member = null;
            try {
                member = await interaction.guild.members.fetch(targetUser.id);
                
                // Vérifier la hiérarchie des rôles
                const executorMember = interaction.member;
                if (member.roles.highest.position >= executorMember.roles.highest.position) {
                    throw ErrorHandler.createError('PERMISSION_ERROR', 'Vous ne pouvez pas bannir cet utilisateur (hiérarchie des rôles)');
                }

                // Vérifier si l'utilisateur est un administrateur
                if (member.permissions.has(PermissionFlagsBits.Administrator)) {
                    throw ErrorHandler.createError('PERMISSION_ERROR', 'Impossible de bannir un administrateur');
                }
            } catch (error) {
                if (error.code !== 10007) { // Unknown Member
                    throw error;
                }
                // L'utilisateur n'est pas sur le serveur, on peut quand même le bannir
            }

            // Envoyer un DM avant le bannissement
            try {
                const dmEmbed = new EmbedBuilder()
                    .setTitle('🚫 Vous avez été banni')
                    .setDescription(`Vous avez été banni du serveur **${interaction.guild.name}**.`)
                    .setColor('#e74c3c')
                    .addFields(
                        { name: 'Raison', value: reason, inline: true },
                        { name: 'Banni par', value: `${executor.username}`, inline: true }
                    )
                    .setTimestamp();

                await targetUser.send({ embeds: [dmEmbed] });
            } catch (dmError) {
                Logger.debug(`Impossible d'envoyer un DM à ${targetUser.username}`, {
                    error: dmError.message
                });
            }

            // Effectuer le bannissement
            await interaction.guild.members.ban(targetUser.id, {
                deleteMessageDays: deleteDays,
                reason: `${reason} (Par: ${executor.username})`
            });

            // Créer l'embed de confirmation
            const embed = new EmbedBuilder()
                .setTitle('✅ Utilisateur banni avec succès')
                .setColor('#e74c3c')
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .addFields(
                    { name: '👤 Utilisateur banni', value: `${targetUser} (${targetUser.username})`, inline: true },
                    { name: '🔨 Banni par', value: `${executor} (${executor.username})`, inline: true },
                    { name: '📝 Raison', value: reason, inline: false }
                )
                .setTimestamp()
                .setFooter({ text: `ID: ${targetUser.id}` });

            if (deleteDays > 0) {
                embed.addFields({
                    name: '🗑️ Messages supprimés',
                    value: `${deleteDays} jour(s) de messages`,
                    inline: true
                });
            }

            await interaction.editReply({ embeds: [embed] });

            // Log de l'action
            Logger.info('Utilisateur banni du serveur', {
                bannedUserId: targetUser.id,
                bannedUsername: targetUser.username,
                executorId: executor.id,
                guildId: interaction.guild.id,
                reason,
                deleteDays
            });

            // Enregistrer en base de données si disponible
            const databaseManager = interaction.client.databaseManager;
            if (databaseManager && databaseManager.isAvailable()) {
                try {
                    await databaseManager.query(
                        'INSERT INTO moderation_logs (action_type, target_user_id, executor_user_id, guild_id, reason, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
                        ['ban', targetUser.id, executor.id, interaction.guild.id, reason]
                    );
                } catch (dbError) {
                    Logger.warn('Erreur lors de l\'enregistrement du ban en BDD', {
                        error: dbError.message
                    });
                }
            }

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'ban_add');
        }
    }
};
