/**
 * @fileoverview Commande pour retirer un membre d'un sous-groupe
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
// Utilise maintenant client.databaseManager
import * as Logger from '../../utils/logger.js';
import { AdminCommand } from '../../models/AdminCommand.js';

/**
 * Commande pour retirer un membre d'un sous-groupe
 */
class RemoveFromSubgroupCommand extends AdminCommand {
    /**
     * Crée une nouvelle instance de RemoveFromSubgroupCommand
     * @constructor
     */
    constructor() {
        // Créer l'objet de commande de manière plus simple
        const data = new SlashCommandBuilder()
            .setName('remove_from_subgroup')
            .setDescription('Retire un membre d\'un sous-groupe')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
        
        // Ajouter les options séparément
        data.addUserOption(option => 
            option.setName('membre')
                .setDescription('Membre à retirer du sous-groupe')
                .setRequired(true)
        );
        
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
                return await interaction.editReply('Vous n\'avez pas les permissions nécessaires pour gérer les sous-groupes.');
            }

            // Récupérer les paramètres
            const member = interaction.options.getUser('membre');
            const projectName = interaction.options.getString('projet');
            const subgroupName = interaction.options.getString('sous_groupe');
            
            // Trouver le projet et le sous-groupe
            let projectId, subgroupId, textChannelId, voiceChannelId;
            try {
                // Récupérer le projet
                const projects = await databaseManager.query(
                    'SELECT id FROM projects WHERE name = ?',
                    [projectName]
                );
                
                if (projects.length === 0) {
                    return await interaction.editReply(`Aucun projet nommé "${projectName}" n'a été trouvé.`);
                }
                
                projectId = projects[0].id;
                
                // Récupérer le sous-groupe
                const subgroups = await databaseManager.query(
                    'SELECT id FROM subgroups WHERE project_id = ? AND name = ?',
                    [projectId, subgroupName]
                );
                
                if (subgroups.length === 0) {
                    return await interaction.editReply(`Aucun sous-groupe nommé "${subgroupName}" n'a été trouvé dans le projet "${projectName}".`);
                }
                
                subgroupId = subgroups[0].id;
                
                // Vérifier si le membre est dans le sous-groupe
                const existingMembers = await databaseManager.query(
                    'SELECT * FROM subgroup_members WHERE subgroup_id = ? AND user_id = ?',
                    [subgroupId, member.id]
                );
                
                if (existingMembers.length === 0) {
                    return await interaction.editReply(`${member.username} n'est pas membre du sous-groupe "${subgroupName}".`);
                }
                
                // Vérifier si le membre est le responsable du sous-groupe
                const subgroupInfo = await databaseManager.query(
                    'SELECT leader_id FROM subgroups WHERE id = ?',
                    [subgroupId]
                );
                
                if (subgroupInfo.length > 0 && subgroupInfo[0].leader_id === member.id) {
                    return await interaction.editReply(`${member.username} est le responsable du sous-groupe "${subgroupName}" et ne peut pas être retiré. Veuillez d'abord transférer la responsabilité à un autre membre.`);
                }
                
                // Récupérer les canaux du sous-groupe
                const serverId = '1258751748538105877'; // ID du serveur cible
                const guild = interaction.client.guilds.cache.get(serverId);
                
                if (!guild) {
                    return await interaction.editReply('Serveur Discord cible non trouvé. Contactez un administrateur.');
                }
                
                // Trouver les canaux du sous-groupe par nom
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
                
                // Si les canaux n'ont pas été trouvés par nom, essayer de les trouver dans la base de données
                if (!textChannelId || !voiceChannelId) {
                    const channels = await databaseManager.query(
                        'SELECT channel_id, channel_type FROM project_channels ' +
                        'WHERE project_id = ? AND channel_type = \'subgroup\'',
                        [projectId]
                    );
                    
                    for (const channel of channels) {
                        try {
                            const discordChannel = await guild.channels.fetch(channel.channel_id);
                            if (discordChannel.parent && discordChannel.name.includes(subgroupName)) {
                                if (discordChannel.type === 0) { // TextChannel
                                    textChannelId = channel.channel_id;
                                } else if (discordChannel.type === 2) { // VoiceChannel
                                    voiceChannelId = channel.channel_id;
                                }
                            }
                        } catch (error) {
                            // Canal probablement supprimé
                            Logger.warn(`Canal introuvable: ${channel.channel_id}`, {
                                error: error.message
                            });
                        }
                    }
                }
                
            } catch (dbError) {
                Logger.error('Erreur lors de la recherche du projet/sous-groupe', {
                    error: dbError.message,
                    stack: dbError.stack
                });
                return await interaction.editReply('Une erreur est survenue lors de la recherche du projet ou du sous-groupe.');
            }
            
            // Retirer l'utilisateur du sous-groupe
            try {
                // Supprimer le membre de la base de données
                await databaseManager.query(
                    'DELETE FROM subgroup_members WHERE subgroup_id = ? AND user_id = ?',
                    [subgroupId, member.id]
                );
                
                // Mettre à jour les permissions des canaux
                const serverId = '1258751748538105877'; // ID du serveur cible
                const guild = interaction.client.guilds.cache.get(serverId);
                
                if (textChannelId) {
                    const textChannel = await guild.channels.fetch(textChannelId);
                    if (textChannel) {
                        const existingOverwrite = textChannel.permissionOverwrites.resolve(member.id);
                        if (existingOverwrite) {
                            await existingOverwrite.delete();
                        }
                    }
                }
                
                if (voiceChannelId) {
                    const voiceChannel = await guild.channels.fetch(voiceChannelId);
                    if (voiceChannel) {
                        const existingOverwrite = voiceChannel.permissionOverwrites.resolve(member.id);
                        if (existingOverwrite) {
                            await existingOverwrite.delete();
                        }
                    }
                }
                
                // Préparer l'embed de confirmation
                const embed = new EmbedBuilder()
                    .setTitle('✅ Membre retiré du sous-groupe')
                    .setDescription(`${member.username} a été retiré du sous-groupe "${subgroupName}" du projet "${projectName}".`)
                    .setColor('#e74c3c')
                    .addFields(
                        { name: 'Membre', value: `<@${member.id}>`, inline: true },
                        { name: 'Action par', value: `<@${interaction.user.id}>`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Retiré par ${interaction.user.tag}` });
                
                // Répondre à l'interaction
                await interaction.editReply({ embeds: [embed] });
                
                // Notification dans le salon texte si accessible
                if (textChannelId) {
                    const textChannel = await guild.channels.fetch(textChannelId);
                    if (textChannel) {
                        await textChannel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle('👋 Membre retiré')
                                    .setDescription(`<@${member.id}> a été retiré du sous-groupe "${subgroupName}".`)
                                    .setColor('#e74c3c')
                                    .addFields(
                                        { name: 'Retiré par', value: `<@${interaction.user.id}>`, inline: true }
                                    )
                            ]
                        });
                    }
                }
                
                // Journaliser l'action
                Logger.info(`Membre ${member.username} retiré du sous-groupe "${subgroupName}"`, {
                    userId: interaction.user.id,
                    guildId: guild.id,
                    projectId,
                    subgroupId,
                    memberId: member.id
                });
            } catch (error) {
                Logger.error('Erreur lors du retrait du membre du sous-groupe', {
                    error: error.message,
                    stack: error.stack
                });
                
                await interaction.editReply('Une erreur est survenue lors du retrait du membre du sous-groupe.');
            }
        } catch (error) {
            Logger.error('Erreur lors du retrait du membre du sous-groupe', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Une erreur est survenue lors du retrait du membre du sous-groupe.');
        }
    }
}

export default new RemoveFromSubgroupCommand(); 