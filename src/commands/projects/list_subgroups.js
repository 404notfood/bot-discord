/**
 * @fileoverview Commande pour lister les sous-groupes d'un projet
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
// Utilise maintenant client.databaseManager
import * as Logger from '../../utils/logger.js';
import { AdminCommand } from '../../models/AdminCommand.js';

/**
 * Commande pour lister les sous-groupes d'un projet
 */
class ListSubgroupsCommand extends AdminCommand {
    /**
     * Crée une nouvelle instance de ListSubgroupsCommand
     * @constructor
     */
    constructor() {
        // Créer l'objet de commande de manière plus simple
        const data = new SlashCommandBuilder()
            .setName('list_subgroups')
            .setDescription('Liste tous les sous-groupes d\'un projet')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
        
        // Ajouter les options séparément
        data.addStringOption(option => 
            option.setName('projet')
                .setDescription('Nom du projet')
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
                return await interaction.editReply('Vous n\'avez pas les permissions nécessaires pour lister les sous-groupes.');
            }

            // Récupérer les paramètres
            const projectName = interaction.options.getString('projet');
            
            // Récupérer le projet
            const projects = await databaseManager.query(
                'SELECT * FROM projects WHERE name = ?',
                [projectName]
            );
            
            if (projects.length === 0) {
                return await interaction.editReply(`Aucun projet nommé "${projectName}" n'a été trouvé.`);
            }
            
            const project = projects[0];
            
            // Récupérer les sous-groupes du projet
            const subgroups = await databaseManager.query(
                'SELECT s.*, ' +
                '(SELECT COUNT(*) FROM subgroup_members sm WHERE sm.subgroup_id = s.id) as member_count, ' +
                'u.username as leader_username ' +
                'FROM subgroups s ' +
                'LEFT JOIN users u ON s.leader_id = u.id ' +
                'WHERE s.project_id = ? ' +
                'ORDER BY s.name',
                [project.id]
            );
            
            if (subgroups.length === 0) {
                const noSubgroupsEmbed = new EmbedBuilder()
                    .setTitle(`📋 Sous-groupes du projet "${projectName}"`)
                    .setDescription('Aucun sous-groupe n\'existe pour ce projet.')
                    .setColor('#e74c3c')
                    .addFields(
                        { name: 'Créer un sous-groupe', value: 'Utilisez la commande `/create_subgroup` pour créer un nouveau sous-groupe dans ce projet.' }
                    )
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [noSubgroupsEmbed] });
            }
            
            // Créer un embed pour afficher les sous-groupes
            const embed = new EmbedBuilder()
                .setTitle(`📋 Sous-groupes du projet "${projectName}"`)
                .setDescription(`${subgroups.length} sous-groupe(s) trouvé(s)`)
                .setColor('#3498db')
                .setTimestamp();
            
            // Ajouter chaque sous-groupe à l'embed
            for (const subgroup of subgroups) {
                // Rechercher les canaux associés au sous-groupe
                const channels = await databaseManager.query(
                    'SELECT pc.channel_id, pc.channel_type ' +
                    'FROM project_channels pc ' +
                    'WHERE pc.project_id = ? AND pc.channel_type = \'subgroup\'',
                    [project.id]
                );
                
                // Trouver les canaux du sous-groupe
                let textChannelId = null;
                let voiceChannelId = null;
                
                const serverId = '1258751748538105877'; // ID du serveur cible
                const guild = interaction.client.guilds.cache.get(serverId);
                
                if (guild) {
                    const allChannels = guild.channels.cache;
                    const textChannelName = `🔒-${subgroup.name.toLowerCase().replace(/\s+/g, '-')}`;
                    const voiceChannelName = `🔒 ${subgroup.name}`;
                    
                    for (const [id, channel] of allChannels) {
                        if (channel.name === textChannelName) {
                            textChannelId = id;
                        } else if (channel.name === voiceChannelName) {
                            voiceChannelId = id;
                        }
                    }
                }
                
                // Construire la liste des canaux
                const channelsList = [];
                if (textChannelId) channelsList.push(`<#${textChannelId}>`);
                if (voiceChannelId) channelsList.push(`<#${voiceChannelId}>`);
                
                const channelsText = channelsList.length > 0 ? channelsList.join(', ') : 'Aucun canal associé';
                
                embed.addFields({
                    name: `🔹 ${subgroup.name}`,
                    value: `**Description**: ${subgroup.description || 'Aucune description'}\n` +
                           `**Responsable**: ${subgroup.leader_id ? `<@${subgroup.leader_id}>` : 'Non assigné'}\n` +
                           `**Membres**: ${subgroup.member_count || 0}\n` +
                           `**Canaux**: ${channelsText}\n` +
                           `**Créé le**: ${new Date(subgroup.created_at).toLocaleDateString('fr-FR')}`
                });
            }
            
            embed.setFooter({ text: `Demandé par ${interaction.user.tag}` });
            
            // Répondre à l'interaction
            await interaction.editReply({ embeds: [embed] });
            
            // Journaliser l'action
            Logger.info(`Liste des sous-groupes du projet "${projectName}" consultée par ${interaction.user.tag}`, {
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                projectId: project.id,
                subgroupCount: subgroups.length
            });
        } catch (error) {
            Logger.error('Erreur lors de la récupération des sous-groupes', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Une erreur est survenue lors de la récupération des sous-groupes.');
        }
    }
}

export default new ListSubgroupsCommand(); 