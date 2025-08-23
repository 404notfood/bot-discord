/**
 * @fileoverview Commande pour ajouter un membre à un sous-groupe
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, PermissionsBitField } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';

// Créer la commande
const command = new SlashCommandBuilder()
    .setName('add_to_subgroup')
    .setDescription('Ajoute un membre à un sous-groupe existant.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

// Ajouter les options
command.addUserOption(option => option
    .setName('membre')
    .setDescription('Membre à ajouter au sous-groupe')
    .setRequired(true)
);

command.addStringOption(option => option
    .setName('projet')
    .setDescription('Nom du projet parent')
    .setRequired(true)
);

command.addStringOption(option => option
    .setName('sous_groupe')
    .setDescription('Nom du sous-groupe')
    .setRequired(true)
);

command.addStringOption(option => option
    .setName('role')
    .setDescription('Rôle du membre dans le sous-groupe')
    .setRequired(false)
    .addChoices(
        { name: 'Membre', value: 'member' },
        { name: 'Développeur', value: 'developer' },
        { name: 'Designer', value: 'designer' },
        { name: 'Testeur', value: 'tester' }
    )
);

// Fonction pour vérifier si l'utilisateur est modérateur
async function isModerator(userId) {
    try {
        // Vérifier dans la table bot_moderators
        const [moderators] = await db.query(
            'SELECT user_id FROM bot_moderators WHERE user_id = ?',
            [userId]
        );
        
        if (moderators.length > 0) {
            return true;
        }
        
        // Vérifier aussi dans la table bot_admins
        const [admins] = await db.query(
            'SELECT user_id FROM bot_admins WHERE user_id = ?',
            [userId]
        );
        
        return admins.length > 0;
    } catch (error) {
        Logger.error('Erreur lors de la vérification des permissions', {
            error: error.message,
            userId
        });
        return false;
    }
}

// Fonction pour formater le rôle en titre
function formatRole(role) {
    switch (role) {
        case 'member':
            return 'Membre';
        case 'developer':
            return 'Développeur';
        case 'designer':
            return 'Designer';
        case 'tester':
            return 'Testeur';
        case 'leader':
            return 'Responsable';
        default:
            return 'Membre';
    }
}

export default {
    data: command,
    
    async execute(interaction) {
        try {
            // Vérifier si l'utilisateur est modérateur ou administrateur
            if (!(await isModerator(interaction.user.id))) {
                return await interaction.editReply('Vous n\'avez pas les permissions nécessaires pour gérer les sous-groupes.');
            }

            // Récupérer les paramètres
            const member = interaction.options.getUser('membre');
            const projectName = interaction.options.getString('projet');
            const subgroupName = interaction.options.getString('sous_groupe');
            const role = interaction.options.getString('role') || 'member';
            
            // Trouver le projet et le sous-groupe
            let projectId, subgroupId, textChannelId, voiceChannelId;
            try {
                // Récupérer le projet
                const [projects] = await db.query(
                    'SELECT id FROM projects WHERE name = ?',
                    [projectName]
                );
                
                if (projects.length === 0) {
                    return await interaction.editReply(`Aucun projet nommé "${projectName}" n'a été trouvé.`);
                }
                
                projectId = projects[0].id;
                
                // Récupérer le sous-groupe
                const [subgroups] = await db.query(
                    'SELECT id FROM subgroups WHERE project_id = ? AND name = ?',
                    [projectId, subgroupName]
                );
                
                if (subgroups.length === 0) {
                    return await interaction.editReply(`Aucun sous-groupe nommé "${subgroupName}" n'a été trouvé dans le projet "${projectName}".`);
                }
                
                subgroupId = subgroups[0].id;
                
                // Vérifier si le membre est déjà dans le sous-groupe
                const [existingMembers] = await db.query(
                    'SELECT * FROM subgroup_members WHERE subgroup_id = ? AND user_id = ?',
                    [subgroupId, member.id]
                );
                
                if (existingMembers.length > 0) {
                    return await interaction.editReply(`${member.username} est déjà membre du sous-groupe "${subgroupName}".`);
                }
                
                try {
                    // Récupérer les canaux du sous-groupe
                    const [channels] = await db.query(
                        'SELECT pc.channel_id, c.type FROM project_channels pc ' +
                        'JOIN channels c ON pc.channel_id = c.id ' +
                        'WHERE pc.project_id = ? AND pc.channel_type = \'subgroup\' ' +
                        'ORDER BY c.type',
                        [projectId]
                    );
                    
                    // Récupérer les IDs des canaux texte et vocal
                    for (const channel of channels) {
                        if (channel.type === 'GUILD_TEXT') {
                            textChannelId = channel.channel_id;
                        } else if (channel.type === 'GUILD_VOICE') {
                            voiceChannelId = channel.channel_id;
                        }
                    }
                } catch (channelError) {
                    Logger.error('Erreur lors de la récupération des canaux depuis la base de données', {
                        error: channelError.message,
                        stack: channelError.stack,
                        projectId
                    });
                    // On continue même en cas d'erreur, on essaiera de trouver les canaux par leur nom
                }
                
                // Si les canaux n'ont pas été trouvés dans la base de données, essayer de les trouver par nom
                if (!textChannelId || !voiceChannelId) {
                    const serverId = interaction.guild?.id || '1258751748538105877'; // ID du serveur
                    const guild = interaction.client.guilds.cache.get(serverId);
                    
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
                    
                    if (!textChannelId && !voiceChannelId) {
                        Logger.warn(`Aucun canal trouvé pour le sous-groupe "${subgroupName}"`, {
                            projectId,
                            subgroupId,
                            projectName,
                            subgroupName
                        });
                    }
                }
            } catch (dbError) {
                Logger.error('Erreur lors de la recherche du projet/sous-groupe', {
                    error: dbError.message,
                    stack: dbError.stack
                });
                return await interaction.editReply('Une erreur est survenue lors de la recherche du projet ou du sous-groupe.');
            }
            
            // Ajouter l'utilisateur au sous-groupe
            try {
                // Insérer le membre dans la base de données
                await db.query(
                    'INSERT INTO subgroup_members (subgroup_id, user_id, role) VALUES (?, ?, ?)',
                    [subgroupId, member.id, role]
                );
                
                // Mettre à jour les permissions des canaux
                const serverId = interaction.guild?.id || '1258751748538105877'; // ID du serveur
                const guild = interaction.client.guilds.cache.get(serverId);
                
                if (textChannelId) {
                    try {
                        const textChannel = await guild.channels.fetch(textChannelId);
                        if (textChannel) {
                            // Pour le salon texte (privé), donner accès au membre
                            await textChannel.permissionOverwrites.create(member.id, {
                                [PermissionsBitField.Flags.ViewChannel]: true,
                                [PermissionsBitField.Flags.SendMessages]: true,
                                [PermissionsBitField.Flags.ReadMessageHistory]: true
                            });
                            Logger.debug(`Permissions du canal texte mises à jour pour ${member.username}`, {
                                channelId: textChannelId,
                                userId: member.id
                            });
                        }
                    } catch (channelError) {
                        Logger.warn(`Impossible de mettre à jour les permissions du canal texte ${textChannelId}`, {
                            error: channelError.message,
                            userId: member.id
                        });
                    }
                }
                
                // Créer un embed pour informer du succès
                const embed = new EmbedBuilder()
                    .setTitle('✅ Membre ajouté au sous-groupe')
                    .setDescription(`${member} a été ajouté au sous-groupe "${subgroupName}" dans le projet "${projectName}".`)
                    .setColor('#2ecc71')
                    .addFields(
                        { name: 'Membre', value: `${member}`, inline: true },
                        { name: 'Rôle', value: formatRole(role), inline: true },
                        { name: 'Projet', value: projectName, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Ajouté par ${interaction.user.tag}` });
                
                // Répondre à l'interaction
                await interaction.editReply({ embeds: [embed] });
                
                // Journaliser l'action
                Logger.info(`Membre ajouté à un sous-groupe`, {
                    userId: interaction.user.id,
                    guildId: interaction.guild?.id,
                    memberId: member.id,
                    memberName: member.username,
                    projectId,
                    projectName,
                    subgroupId,
                    subgroupName,
                    role
                });
                
                // Envoyer une notification au canal du sous-groupe
                if (textChannelId) {
                    try {
                        const textChannel = await guild.channels.fetch(textChannelId);
                        if (textChannel) {
                            await textChannel.send({
                                content: `${member} a été ajouté au sous-groupe en tant que ${formatRole(role).toLowerCase()}.`,
                                allowedMentions: { users: [member.id] }
                            });
                        }
                    } catch (notifyError) {
                        Logger.warn(`Impossible d'envoyer une notification au canal du sous-groupe`, {
                            error: notifyError.message,
                            channelId: textChannelId
                        });
                    }
                }
            } catch (addError) {
                Logger.error('Erreur lors de l\'ajout du membre au sous-groupe', {
                    error: addError.message,
                    stack: addError.stack,
                    memberId: member.id,
                    subgroupId
                });
                
                await interaction.editReply('Une erreur est survenue lors de l\'ajout du membre au sous-groupe.');
            }
        } catch (error) {
            Logger.error('Erreur lors de l\'exécution de la commande', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Une erreur est survenue lors de l\'exécution de la commande.');
        }
    }
}; 