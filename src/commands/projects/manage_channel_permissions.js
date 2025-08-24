/**
 * @file manage_channel_permissions.js
 * @description Commande pour gérer les permissions de canaux existants
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, PermissionsBitField, ChannelType } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('manage_permissions')
        .setDescription('Gérer les permissions d\'un canal')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Canal à modifier')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('action')
                .setDescription('Action à effectuer')
                .setRequired(true)
                .addChoices(
                    { name: 'Ajouter utilisateur', value: 'add_user' },
                    { name: 'Retirer utilisateur', value: 'remove_user' },
                    { name: 'Ajouter rôle', value: 'add_role' },
                    { name: 'Retirer rôle', value: 'remove_role' },
                    { name: 'Verrouiller canal', value: 'lock' },
                    { name: 'Déverrouiller canal', value: 'unlock' },
                    { name: 'Mode privé', value: 'private' },
                    { name: 'Mode public', value: 'public' },
                    { name: 'Voir permissions', value: 'view' }
                )
        )
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur concerné')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Rôle concerné')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('permissions')
                .setDescription('Permissions spécifiques')
                .setRequired(false)
                .addChoices(
                    { name: 'Lecture seule', value: 'read_only' },
                    { name: 'Écriture', value: 'write' },
                    { name: 'Modération', value: 'moderate' },
                    { name: 'Administration', value: 'admin' }
                )
        ),

    permissions: ['channels.manage'],
    category: 'projects',

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const channel = interaction.options.getChannel('channel');
            const action = interaction.options.getString('action');
            const user = interaction.options.getUser('user');
            const role = interaction.options.getRole('role');
            const permissionLevel = interaction.options.getString('permissions');

            // Vérifications de base
            if (!channel.permissionsFor(interaction.member).has(PermissionsBitField.Flags.ManageChannels)) {
                throw ErrorHandler.createError('PERMISSION_ERROR', 'Vous n\'avez pas les permissions pour modifier ce canal');
            }

            // Exécuter l'action
            let result;
            switch (action) {
                case 'add_user':
                    result = await this.addUserPermissions(channel, user, permissionLevel);
                    break;
                case 'remove_user':
                    result = await this.removeUserPermissions(channel, user);
                    break;
                case 'add_role':
                    result = await this.addRolePermissions(channel, role, permissionLevel);
                    break;
                case 'remove_role':
                    result = await this.removeRolePermissions(channel, role);
                    break;
                case 'lock':
                    result = await this.lockChannel(channel);
                    break;
                case 'unlock':
                    result = await this.unlockChannel(channel);
                    break;
                case 'private':
                    result = await this.makeChannelPrivate(channel);
                    break;
                case 'public':
                    result = await this.makeChannelPublic(channel);
                    break;
                case 'view':
                    result = await this.viewPermissions(channel);
                    break;
                default:
                    throw ErrorHandler.createError('VALIDATION_ERROR', 'Action non reconnue');
            }

            // Log de l'action
            Logger.info('Permission de canal modifiée', {
                channelId: channel.id,
                action,
                userId: user?.id,
                roleId: role?.id,
                executedBy: interaction.user.id
            });

            // Réponse
            const embed = this.createResultEmbed(action, channel, result);
            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'manage_permissions');
        }
    },

    /**
     * Ajouter des permissions utilisateur
     */
    async addUserPermissions(channel, user, permissionLevel) {
        if (!user) throw ErrorHandler.createError('VALIDATION_ERROR', 'Utilisateur requis');

        const permissions = this.getPermissionsByLevel(permissionLevel, channel.type);
        
        await channel.permissionOverwrites.edit(user.id, {
            allow: permissions.allow,
            deny: permissions.deny || []
        });

        return {
            success: true,
            message: `Permissions ${permissionLevel || 'standard'} ajoutées à ${user.tag}`,
            details: { user: user.tag, permissions: permissionLevel }
        };
    },

    /**
     * Retirer des permissions utilisateur
     */
    async removeUserPermissions(channel, user) {
        if (!user) throw ErrorHandler.createError('VALIDATION_ERROR', 'Utilisateur requis');

        await channel.permissionOverwrites.delete(user.id);

        return {
            success: true,
            message: `Permissions retirées pour ${user.tag}`,
            details: { user: user.tag }
        };
    },

    /**
     * Ajouter des permissions rôle
     */
    async addRolePermissions(channel, role, permissionLevel) {
        if (!role) throw ErrorHandler.createError('VALIDATION_ERROR', 'Rôle requis');

        const permissions = this.getPermissionsByLevel(permissionLevel, channel.type);
        
        await channel.permissionOverwrites.edit(role.id, {
            allow: permissions.allow,
            deny: permissions.deny || []
        });

        return {
            success: true,
            message: `Permissions ${permissionLevel || 'standard'} ajoutées au rôle ${role.name}`,
            details: { role: role.name, permissions: permissionLevel }
        };
    },

    /**
     * Retirer des permissions rôle
     */
    async removeRolePermissions(channel, role) {
        if (!role) throw ErrorHandler.createError('VALIDATION_ERROR', 'Rôle requis');

        await channel.permissionOverwrites.delete(role.id);

        return {
            success: true,
            message: `Permissions retirées pour le rôle ${role.name}`,
            details: { role: role.name }
        };
    },

    /**
     * Verrouiller le canal
     */
    async lockChannel(channel) {
        const everyoneRole = channel.guild.roles.everyone;
        
        if (channel.isVoiceBased()) {
            await channel.permissionOverwrites.edit(everyoneRole.id, {
                deny: [PermissionsBitField.Flags.Connect]
            });
        } else {
            await channel.permissionOverwrites.edit(everyoneRole.id, {
                deny: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions]
            });
        }

        return {
            success: true,
            message: `Canal ${channel.name} verrouillé`,
            details: { channelType: channel.type }
        };
    },

    /**
     * Déverrouiller le canal
     */
    async unlockChannel(channel) {
        const everyoneRole = channel.guild.roles.everyone;
        
        if (channel.isVoiceBased()) {
            await channel.permissionOverwrites.edit(everyoneRole.id, {
                allow: [PermissionsBitField.Flags.Connect]
            });
        } else {
            await channel.permissionOverwrites.edit(everyoneRole.id, {
                allow: [PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.AddReactions]
            });
        }

        return {
            success: true,
            message: `Canal ${channel.name} déverrouillé`,
            details: { channelType: channel.type }
        };
    },

    /**
     * Rendre le canal privé
     */
    async makeChannelPrivate(channel) {
        const everyoneRole = channel.guild.roles.everyone;
        
        await channel.permissionOverwrites.edit(everyoneRole.id, {
            deny: [PermissionsBitField.Flags.ViewChannel]
        });

        return {
            success: true,
            message: `Canal ${channel.name} rendu privé`,
            details: { visibility: 'private' }
        };
    },

    /**
     * Rendre le canal public
     */
    async makeChannelPublic(channel) {
        const everyoneRole = channel.guild.roles.everyone;
        
        await channel.permissionOverwrites.edit(everyoneRole.id, {
            allow: [PermissionsBitField.Flags.ViewChannel]
        });

        return {
            success: true,
            message: `Canal ${channel.name} rendu public`,
            details: { visibility: 'public' }
        };
    },

    /**
     * Voir les permissions actuelles
     */
    async viewPermissions(channel) {
        const permissions = [];
        
        channel.permissionOverwrites.cache.forEach((overwrite) => {
            const target = overwrite.type === 0 ? 
                channel.guild.roles.cache.get(overwrite.id) :
                channel.guild.members.cache.get(overwrite.id);
            
            if (target) {
                permissions.push({
                    name: target.name || target.user?.tag || target.displayName,
                    type: overwrite.type === 0 ? 'Rôle' : 'Utilisateur',
                    allow: overwrite.allow.toArray(),
                    deny: overwrite.deny.toArray()
                });
            }
        });

        return {
            success: true,
            message: `Permissions du canal ${channel.name}`,
            details: { permissions, count: permissions.length }
        };
    },

    /**
     * Obtenir les permissions par niveau
     */
    getPermissionsByLevel(level, channelType) {
        const isVoice = channelType === ChannelType.GuildVoice || channelType === ChannelType.GuildStageVoice;
        
        const permissionSets = {
            read_only: {
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    ...(isVoice ? [PermissionsBitField.Flags.Connect] : [])
                ],
                deny: [
                    PermissionsBitField.Flags.SendMessages,
                    ...(isVoice ? [PermissionsBitField.Flags.Speak] : [])
                ]
            },
            write: {
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.AddReactions,
                    ...(isVoice ? [
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak,
                        PermissionsBitField.Flags.UseVAD
                    ] : [])
                ]
            },
            moderate: {
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.PinMessages,
                    ...(isVoice ? [
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak,
                        PermissionsBitField.Flags.MuteMembers,
                        PermissionsBitField.Flags.MoveMembers
                    ] : [])
                ]
            },
            admin: {
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.ReadMessageHistory,
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.ManageChannels,
                    PermissionsBitField.Flags.PinMessages,
                    ...(isVoice ? [
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak,
                        PermissionsBitField.Flags.MuteMembers,
                        PermissionsBitField.Flags.DeafenMembers,
                        PermissionsBitField.Flags.MoveMembers
                    ] : [])
                ]
            }
        };

        return permissionSets[level] || permissionSets.write;
    },

    /**
     * Créer l'embed de résultat
     */
    createResultEmbed(action, channel, result) {
        const embed = new EmbedBuilder()
            .setTitle('⚙️ Gestion des permissions')
            .setColor(result.success ? '#2ecc71' : '#e74c3c')
            .setTimestamp();

        embed.setDescription(result.message);

        embed.addFields({
            name: '📺 Canal',
            value: `<#${channel.id}>`,
            inline: true
        });

        if (action === 'view' && result.details.permissions) {
            const permissionsText = result.details.permissions.slice(0, 10).map(perm => 
                `**${perm.name}** (${perm.type})\n` +
                `✅ ${perm.allow.slice(0, 3).join(', ')}\n` +
                `❌ ${perm.deny.slice(0, 3).join(', ')}`
            ).join('\n\n');

            embed.addFields({
                name: `👥 Permissions (${result.details.count})`,
                value: permissionsText || 'Aucune permission personnalisée',
                inline: false
            });
        }

        if (result.details.user) {
            embed.addFields({
                name: '👤 Utilisateur',
                value: result.details.user,
                inline: true
            });
        }

        if (result.details.role) {
            embed.addFields({
                name: '👑 Rôle',
                value: result.details.role,
                inline: true
            });
        }

        if (result.details.permissions && action !== 'view') {
            embed.addFields({
                name: '🔐 Niveau de permission',
                value: result.details.permissions,
                inline: true
            });
        }

        return embed;
    }
};