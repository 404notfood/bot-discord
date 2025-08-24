/**
 * @fileoverview Commande pour lister les membres d'un sous-groupe
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
// Utilise maintenant client.databaseManager
import * as Logger from '../../utils/logger.js';
import { AdminCommand } from '../../models/AdminCommand.js';

/**
 * Commande pour lister les membres d'un sous-groupe
 */
class ListSubgroupMembersCommand extends AdminCommand {
    /**
     * Crée une nouvelle instance de ListSubgroupMembersCommand
     * @constructor
     */
    constructor() {
        // Créer l'objet de commande de manière plus simple
        const data = new SlashCommandBuilder()
            .setName('list_subgroup_members')
            .setDescription('Liste tous les membres d\'un sous-groupe.')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
        
        // Ajouter les options séparément
        data.addStringOption(option => 
            option.setName('projet')
                .setDescription('Nom du projet parent')
                .setRequired(true)
        );

        data.addStringOption(option => 
            option.setName('sous_groupe')
                .setDescription('Nom du sous-groupe')
                .setRequired(true)
        );
        
        super(data);
        
        // Ajouter un alias run pour la compatibilité
        this.run = this.execute;
    }

    /**
     * Exécute la commande
     * @param {Object} interaction - L'interaction Discord
     */
    async execute(interaction) {
        const databaseManager = interaction.client.databaseManager;
        if (!databaseManager?.isAvailable()) {
            return interaction.reply({
                content: '❌ Base de données non disponible',
                ephemeral: true
            });
        }

        try {
            // Vérifier si l'utilisateur est modérateur ou administrateur
            if (!(await this.isModerator(interaction.user.id))) {
                return await interaction.editReply('Vous n\'avez pas les permissions nécessaires pour lister les membres d\'un sous-groupe.');
            }

            // Récupérer les paramètres
            const projectName = interaction.options.getString('projet');
            const subgroupName = interaction.options.getString('sous_groupe');
            
            // Récupérer le projet
            const projects = await databaseManager.query(
                'SELECT * FROM projects WHERE name = ?',
                [projectName]
            );
            
            if (projects.length === 0) {
                return await interaction.editReply(`Aucun projet nommé "${projectName}" n'a été trouvé.`);
            }
            
            const project = projects[0];
            
            // Récupérer le sous-groupe
            const subgroups = await databaseManager.query(
                'SELECT * FROM subgroups WHERE project_id = ? AND name = ?',
                [project.id, subgroupName]
            );
            
            if (subgroups.length === 0) {
                return await interaction.editReply(`Aucun sous-groupe nommé "${subgroupName}" n'a été trouvé dans le projet "${projectName}".`);
            }
            
            const subgroup = subgroups[0];
            
            // Récupérer les membres du sous-groupe
            const members = await databaseManager.query(
                'SELECT sm.*, u.username ' +
                'FROM subgroup_members sm ' +
                'LEFT JOIN users u ON sm.user_id = u.id ' +
                'WHERE sm.subgroup_id = ? ' +
                'ORDER BY sm.role, sm.joined_at',
                [subgroup.id]
            );
            
            if (members.length === 0) {
                const noMembersEmbed = new EmbedBuilder()
                    .setTitle(`👥 Membres du sous-groupe "${subgroupName}"`)
                    .setDescription(`Le sous-groupe "${subgroupName}" du projet "${projectName}" ne contient aucun membre.`)
                    .setColor('#e74c3c')
                    .addFields(
                        { name: 'Ajouter un membre', value: 'Utilisez la commande `/add_to_subgroup` pour ajouter un membre à ce sous-groupe.' }
                    )
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [noMembersEmbed] });
            }
            
            // Récupérer les informations sur les canaux du sous-groupe
            let textChannelId = null;
            let voiceChannelId = null;
            
            const serverId = '1258751748538105877'; // ID du serveur cible
            const guild = interaction.client.guilds.cache.get(serverId);
            
            if (guild) {
                const allChannels = guild.channels.cache;
                const textChannelName = `🔒-${subgroupName.toLowerCase().replace(/\s+/g, '-')}`;
                const voiceChannelName = `🔒 ${subgroupName}`;
                
                for (const [id, channel] of allChannels) {
                    if (channel.name === textChannelName) {
                        textChannelId = id;
                    } else if (channel.name === voiceChannelName) {
                        voiceChannelId = id;
                    }
                }
            }
            
            // Créer un embed pour afficher les membres
            const embed = new EmbedBuilder()
                .setTitle(`👥 Membres du sous-groupe "${subgroupName}"`)
                .setDescription(`${members.length} membre(s) dans le sous-groupe "${subgroupName}" du projet "${projectName}"`)
                .setColor('#3498db')
                .setTimestamp();
            
            // Ajouter les liens vers les canaux s'ils existent
            const channelLinks = [];
            if (textChannelId) channelLinks.push(`Salon texte: <#${textChannelId}>`);
            if (voiceChannelId) channelLinks.push(`Salon vocal: <#${voiceChannelId}>`);
            
            if (channelLinks.length > 0) {
                embed.addFields({ name: 'Canaux du sous-groupe', value: channelLinks.join('\n') });
            }
            
            // Grouper les membres par rôle
            const membersByRole = {
                leader: [],
                developer: [],
                designer: [],
                tester: [],
                member: []
            };
            
            for (const member of members) {
                const role = member.role || 'member';
                if (!membersByRole[role]) membersByRole[role] = [];
                membersByRole[role].push(member);
            }
            
            // Ajouter les membres à l'embed par rôle
            if (membersByRole.leader.length > 0) {
                const leadersList = membersByRole.leader.map(m => 
                    `<@${m.user_id}>${m.username ? ` (${m.username})` : ''} - Depuis le ${new Date(m.joined_at).toLocaleDateString('fr-FR')}`
                ).join('\n');
                
                embed.addFields({ name: '👑 Chef de groupe', value: leadersList });
            }
            
            if (membersByRole.developer.length > 0) {
                const developersList = membersByRole.developer.map(m => 
                    `<@${m.user_id}>${m.username ? ` (${m.username})` : ''} - Depuis le ${new Date(m.joined_at).toLocaleDateString('fr-FR')}`
                ).join('\n');
                
                embed.addFields({ name: '💻 Développeurs', value: developersList });
            }
            
            if (membersByRole.designer.length > 0) {
                const designersList = membersByRole.designer.map(m => 
                    `<@${m.user_id}>${m.username ? ` (${m.username})` : ''} - Depuis le ${new Date(m.joined_at).toLocaleDateString('fr-FR')}`
                ).join('\n');
                
                embed.addFields({ name: '🎨 Designers', value: designersList });
            }
            
            if (membersByRole.tester.length > 0) {
                const testersList = membersByRole.tester.map(m => 
                    `<@${m.user_id}>${m.username ? ` (${m.username})` : ''} - Depuis le ${new Date(m.joined_at).toLocaleDateString('fr-FR')}`
                ).join('\n');
                
                embed.addFields({ name: '🔍 Testeurs', value: testersList });
            }
            
            if (membersByRole.member.length > 0) {
                const membersList = membersByRole.member.map(m => 
                    `<@${m.user_id}>${m.username ? ` (${m.username})` : ''} - Depuis le ${new Date(m.joined_at).toLocaleDateString('fr-FR')}`
                ).join('\n');
                
                embed.addFields({ name: '👤 Membres', value: membersList });
            }
            
            embed.setFooter({ text: `Demandé par ${interaction.user.tag}` });
            
            // Répondre à l'interaction
            await interaction.editReply({ embeds: [embed] });
            
            // Journaliser l'action
            Logger.info(`Liste des membres du sous-groupe "${subgroupName}" consultée par ${interaction.user.tag}`, {
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                projectId: project.id,
                subgroupId: subgroup.id,
                memberCount: members.length
            });
        } catch (error) {
            Logger.error('Erreur lors de la récupération des membres du sous-groupe', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Une erreur est survenue lors de la récupération des membres du sous-groupe.');
        }
    }
}

export default new ListSubgroupMembersCommand(); 