/**
 * @file create_private_channel.js
 * @description Commande moderne pour créer des canaux privés avec permissions avancées
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, PermissionsBitField } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('create_private_channel')
        .setDescription('Crée un canal privé avec permissions personnalisées')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addStringOption(option =>
            option.setName('name')
                .setDescription('Nom du canal')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de canal')
                .setRequired(true)
                .addChoices(
                    { name: '💬 Canal Texte', value: 'text' },
                    { name: '🔊 Canal Vocal', value: 'voice' },
                    { name: '📺 Canal Stage', value: 'stage' },
                    { name: '🧵 Forum', value: 'forum' }
                )
        )
        .addChannelOption(option =>
            option.setName('category')
                .setDescription('Catégorie parente')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Description/Topic du canal')
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('user1')
                .setDescription('Utilisateur à ajouter au canal privé')
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('user2')
                .setDescription('Deuxième utilisateur à ajouter')
                .setRequired(false)
        )
        .addUserOption(option =>
            option.setName('user3')
                .setDescription('Troisième utilisateur à ajouter')
                .setRequired(false)
        )
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('Rôle à autoriser dans le canal')
                .setRequired(false)
        )
        .addBooleanOption(option =>
            option.setName('temporary')
                .setDescription('Canal temporaire (supprimé après 24h)')
                .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('user_limit')
                .setDescription('Limite d\'utilisateurs pour les canaux vocaux (0 = illimité)')
                .setRequired(false)
                .setMinValue(0)
                .setMaxValue(99)
        )
        .addIntegerOption(option =>
            option.setName('bitrate')
                .setDescription('Qualité audio (kbps) pour les canaux vocaux')
                .setRequired(false)
                .setMinValue(8)
                .setMaxValue(384)
        ),

    permissions: ['channels.manage'],
    category: 'projects',

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            // Récupérer les options
            const channelName = interaction.options.getString('name');
            const channelType = interaction.options.getString('type');
            const category = interaction.options.getChannel('category');
            const description = interaction.options.getString('description');
            const isTemporary = interaction.options.getBoolean('temporary') || false;
            const userLimit = interaction.options.getInteger('user_limit') || 0;
            const bitrate = interaction.options.getInteger('bitrate');
            
            const role = interaction.options.getRole('role');
            const users = [
                interaction.options.getUser('user1'),
                interaction.options.getUser('user2'),
                interaction.options.getUser('user3')
            ].filter(Boolean);

            // Validation du nom de canal
            const sanitizedName = this.sanitizeChannelName(channelName);
            if (!sanitizedName) {
                throw ErrorHandler.createError('VALIDATION_ERROR', 'Nom de canal invalide');
            }

            // Vérifier les permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                throw ErrorHandler.createError('PERMISSION_ERROR', 'Permissions insuffisantes');
            }

            // Vérifier si la catégorie est valide
            if (category && category.type !== ChannelType.GuildCategory) {
                throw ErrorHandler.createError('VALIDATION_ERROR', 'Le canal sélectionné n\'est pas une catégorie');
            }

            // Construire les permissions
            const permissionOverwrites = this.buildPermissions(
                interaction.guild,
                interaction.user,
                users,
                role
            );

            // Créer le canal selon le type
            const channel = await this.createChannelByType(
                interaction.guild,
                channelType,
                sanitizedName,
                {
                    category: category?.id,
                    description,
                    permissionOverwrites,
                    userLimit: channelType === 'voice' ? userLimit : undefined,
                    bitrate: (channelType === 'voice' || channelType === 'stage') ? bitrate : undefined
                }
            );

            // Planifier la suppression si temporaire
            if (isTemporary) {
                await this.scheduleChannelDeletion(channel.id, 24 * 60 * 60 * 1000); // 24h
            }

            // Log de l'action
            Logger.info('Canal privé créé', {
                channelId: channel.id,
                channelName: channel.name,
                type: channelType,
                createdBy: interaction.user.id,
                temporary: isTemporary,
                usersCount: users.length,
                hasRole: !!role
            });

            // Créer la réponse
            const embed = this.createSuccessEmbed(channel, {
                type: channelType,
                users,
                role,
                isTemporary,
                creator: interaction.user
            });

            await interaction.editReply({ embeds: [embed] });

            // Envoyer un message d'accueil dans le canal
            if (channel.isTextBased()) {
                await this.sendWelcomeMessage(channel, interaction.user, users, role);
            }

        } catch (error) {
            await ErrorHandler.handleInteractionError(error, interaction, 'create_private_channel');
        }
    },

    /**
     * Nettoie le nom du canal
     */
    sanitizeChannelName(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\-_]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 100);
    },

    /**
     * Construit les permissions du canal
     */
    buildPermissions(guild, creator, users, role) {
        const permissions = [
            {
                id: guild.roles.everyone.id,
                deny: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.Connect
                ]
            },
            {
                id: creator.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.ManageChannels,
                    PermissionsBitField.Flags.ManageMessages,
                    PermissionsBitField.Flags.Connect,
                    PermissionsBitField.Flags.Speak,
                    PermissionsBitField.Flags.Stream
                ]
            }
        ];

        // Ajouter les utilisateurs
        users.forEach(user => {
            permissions.push({
                id: user.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.Connect,
                    PermissionsBitField.Flags.Speak,
                    PermissionsBitField.Flags.UseVAD
                ]
            });
        });

        // Ajouter le rôle si spécifié
        if (role) {
            permissions.push({
                id: role.id,
                allow: [
                    PermissionsBitField.Flags.ViewChannel,
                    PermissionsBitField.Flags.SendMessages,
                    PermissionsBitField.Flags.Connect,
                    PermissionsBitField.Flags.Speak
                ]
            });
        }

        return permissions;
    },

    /**
     * Crée le canal selon le type
     */
    async createChannelByType(guild, type, name, options) {
        const baseConfig = {
            name: name,
            parent: options.category,
            permissionOverwrites: options.permissionOverwrites
        };

        switch (type) {
            case 'text':
                return guild.channels.create({
                    ...baseConfig,
                    type: ChannelType.GuildText,
                    topic: options.description
                });

            case 'voice':
                return guild.channels.create({
                    ...baseConfig,
                    type: ChannelType.GuildVoice,
                    userLimit: options.userLimit,
                    bitrate: options.bitrate ? options.bitrate * 1000 : undefined
                });

            case 'stage':
                return guild.channels.create({
                    ...baseConfig,
                    type: ChannelType.GuildStageVoice,
                    bitrate: options.bitrate ? options.bitrate * 1000 : undefined
                });

            case 'forum':
                return guild.channels.create({
                    ...baseConfig,
                    type: ChannelType.GuildForum,
                    topic: options.description,
                    defaultAutoArchiveDuration: 1440 // 24h
                });

            default:
                throw new Error(`Type de canal non supporté: ${type}`);
        }
    },

    /**
     * Planifie la suppression du canal
     */
    async scheduleChannelDeletion(channelId, delay) {
        // Utiliser le scheduler du bot
        const { scheduleTask, CRON_PATTERNS } = await import('../../utils/scheduler.js');
        
        // Calculer la date de suppression
        const deleteAt = new Date(Date.now() + delay);
        const cronPattern = `${deleteAt.getMinutes()} ${deleteAt.getHours()} ${deleteAt.getDate()} ${deleteAt.getMonth() + 1} *`;

        scheduleTask(cronPattern, async () => {
            try {
                const channel = await this.client.channels.fetch(channelId);
                if (channel) {
                    await channel.delete('Canal temporaire expiré');
                    Logger.info('Canal temporaire supprimé', { channelId });
                }
            } catch (error) {
                Logger.error('Erreur suppression canal temporaire', {
                    error: error.message,
                    channelId
                });
            }
        }, {
            description: `Suppression canal temporaire ${channelId}`,
            taskId: `temp_channel_${channelId}`
        });
    },

    /**
     * Crée l'embed de succès
     */
    createSuccessEmbed(channel, options) {
        const embed = new EmbedBuilder()
            .setTitle('✅ Canal privé créé avec succès')
            .setColor('#2ecc71')
            .setTimestamp()
            .setFooter({ text: `Créé par ${options.creator.tag}` });

        // Description principale
        const typeEmojis = {
            text: '💬',
            voice: '🔊',
            stage: '📺',
            forum: '🧵'
        };

        embed.setDescription(`${typeEmojis[options.type]} **${channel.name}** a été créé`);

        // Informations du canal
        embed.addFields({
            name: 'Canal',
            value: `<#${channel.id}>`,
            inline: true
        });

        if (channel.parent) {
            embed.addFields({
                name: 'Catégorie',
                value: channel.parent.name,
                inline: true
            });
        }

        // Utilisateurs autorisés
        if (options.users.length > 0) {
            embed.addFields({
                name: `👥 Utilisateurs autorisés (${options.users.length})`,
                value: options.users.map(user => `<@${user.id}>`).join('\n'),
                inline: true
            });
        }

        // Rôle autorisé
        if (options.role) {
            embed.addFields({
                name: '👑 Rôle autorisé',
                value: `<@&${options.role.id}>`,
                inline: true
            });
        }

        // Canal temporaire
        if (options.isTemporary) {
            embed.addFields({
                name: '⏰ Canal temporaire',
                value: 'Ce canal sera supprimé dans 24h',
                inline: false
            });
        }

        // Limites vocales
        if (options.type === 'voice' && channel.userLimit > 0) {
            embed.addFields({
                name: '🔢 Limite d\'utilisateurs',
                value: channel.userLimit.toString(),
                inline: true
            });
        }

        return embed;
    },

    /**
     * Envoie un message d'accueil dans le canal
     */
    async sendWelcomeMessage(channel, creator, users, role) {
        const embed = new EmbedBuilder()
            .setTitle('🎉 Bienvenue dans ce canal privé !')
            .setColor('#3498db')
            .setDescription('Ce canal a été créé pour vous permettre de collaborer en privé.')
            .addFields({
                name: '👤 Créé par',
                value: `<@${creator.id}>`,
                inline: true
            })
            .setTimestamp();

        if (users.length > 0) {
            embed.addFields({
                name: '👥 Participants',
                value: users.map(user => `<@${user.id}>`).join(' '),
                inline: false
            });
        }

        if (role) {
            embed.addFields({
                name: '👑 Rôle autorisé',
                value: `<@&${role.id}>`,
                inline: true
            });
        }

        embed.addFields({
            name: '💡 Conseils',
            value: '• Utilisez `/invite` pour ajouter d\'autres personnes\n' +
                   '• Le créateur peut modifier les permissions\n' +
                   '• Respectez les règles du serveur',
            inline: false
        });

        await channel.send({ embeds: [embed] });
    }
};