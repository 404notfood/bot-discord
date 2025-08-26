/**
 * @file list_members.js
 * @description Commande pour lister les membres du serveur
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('list_members')
        .setDescription('Affiche la liste des membres du serveur')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addIntegerOption(option =>
            option
                .setName('page')
                .setDescription('Numéro de page (défaut: 1)')
                .setMinValue(1)
        )
        .addStringOption(option =>
            option
                .setName('filter')
                .setDescription('Filtrer les membres')
                .addChoices(
                    { name: 'Tous les membres', value: 'all' },
                    { name: 'En ligne', value: 'online' },
                    { name: 'Hors ligne', value: 'offline' },
                    { name: 'Bots', value: 'bots' },
                    { name: 'Humains', value: 'humans' }
                )
        ),

    // Permissions requises pour cette commande
    permissions: ['users.view_info'],
    category: 'admin',

    async execute(interaction) {
        try {
            const page = interaction.options.getInteger('page') || 1;
            const filter = interaction.options.getString('filter') || 'all';
            
            // Récupérer tous les membres du serveur
            const members = await interaction.guild.members.fetch();
            let filteredMembers = [];

            // Appliquer le filtre
            switch (filter) {
                case 'online':
                    filteredMembers = members.filter(member => 
                        member.presence?.status === 'online' || 
                        member.presence?.status === 'idle' || 
                        member.presence?.status === 'dnd'
                    );
                    break;
                case 'offline':
                    filteredMembers = members.filter(member => 
                        member.presence?.status === 'offline' || !member.presence
                    );
                    break;
                case 'bots':
                    filteredMembers = members.filter(member => member.user.bot);
                    break;
                case 'humans':
                    filteredMembers = members.filter(member => !member.user.bot);
                    break;
                default:
                    filteredMembers = members;
            }

            const total = filteredMembers.size;

            if (total === 0) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('👥 Liste des membres')
                            .setDescription(`Aucun membre trouvé avec le filtre "${filter}".`)
                            .setColor('#2ecc71')
                            .setTimestamp()
                    ],
                    ephemeral: true
                });
            }

            // Pagination
            const perPage = 15;
            const totalPages = Math.ceil(total / perPage);
            const startIndex = (page - 1) * perPage;
            const endIndex = startIndex + perPage;

            if (page > totalPages) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('❌ Page invalide')
                            .setDescription(`Page ${page} n'existe pas. Il y a ${totalPages} page(s) au total.`)
                            .setColor('#e74c3c')
                            .setTimestamp()
                    ],
                    ephemeral: true
                });
            }

            // Récupérer les membres de la page actuelle
            const pageMembers = Array.from(filteredMembers.values()).slice(startIndex, endIndex);

            // Créer l'embed
            const embed = new EmbedBuilder()
                .setTitle(`👥 Liste des membres - ${interaction.guild.name}`)
                .setColor('#3498db')
                .setTimestamp()
                .setFooter({ 
                    text: `Page ${page}/${totalPages} • ${total} membre(s) au total • Filtre: ${filter}` 
                });

            // Ajouter les membres à l'embed
            for (const member of pageMembers) {
                const status = member.presence?.status || 'offline';
                const statusEmoji = {
                    'online': '🟢',
                    'idle': '🟡',
                    'dnd': '🔴',
                    'offline': '⚫'
                }[status] || '⚫';

                const roles = member.roles.cache
                    .filter(role => role.name !== '@everyone')
                    .map(role => role.name)
                    .slice(0, 3)
                    .join(', ');

                const joinedAt = member.joinedAt ? 
                    `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 
                    'Inconnu';

                embed.addFields({
                    name: `${statusEmoji} ${member.user.username}${member.user.bot ? ' 🤖' : ''}`,
                    value: `**ID:** <@${member.user.id}>\n` +
                           `**Rôles:** ${roles || 'Aucun rôle'}\n` +
                           `**A rejoint:** ${joinedAt}`,
                    inline: true
                });
            }

            // Ajouter des statistiques
            const onlineCount = members.filter(m => 
                m.presence?.status === 'online' || 
                m.presence?.status === 'idle' || 
                m.presence?.status === 'dnd'
            ).size;
            const botCount = members.filter(m => m.user.bot).size;
            const humanCount = total - botCount;

            embed.addFields({
                name: '📊 Statistiques',
                value: `**Total:** ${total}\n` +
                       `**En ligne:** ${onlineCount}\n` +
                       `**Humains:** ${humanCount}\n` +
                       `**Bots:** ${botCount}`,
                inline: false
            });

            // Ajouter des informations sur la pagination
            if (totalPages > 1) {
                embed.addFields({
                    name: '📄 Navigation',
                    value: `Utilisez \`/list_members page:${page + 1}\` pour la page suivante\n` +
                           `Utilisez \`/list_members page:${page - 1}\` pour la page précédente`,
                    inline: false
                });
            }

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

            Logger.info('Commande list_members exécutée', {
                userId: interaction.user.id,
                guildId: interaction.guild?.id,
                page,
                filter,
                totalResults: total
            });

        } catch (error) {
            Logger.error('Erreur lors de l\'exécution de list_members:', {
                error: error.message,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });

            await ErrorHandler.handleError(interaction, error, 'Impossible de récupérer la liste des membres');
        }
    }
};
