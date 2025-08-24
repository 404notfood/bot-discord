/**
 * @fileoverview Commande pour créer un sous-groupe dans un projet existant
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, PermissionsBitField } from 'discord.js';
// Utilise maintenant client.databaseManager
import * as Logger from '../../utils/logger.js';
import { AdminCommand } from '../../models/AdminCommand.js';

/**
 * Commande pour créer un sous-groupe dans un projet existant
 */
class CreateSubgroupCommand extends AdminCommand {
    /**
     * Crée une nouvelle instance de CreateSubgroupCommand
     * @constructor
     */
    constructor() {
        // Créer l'objet de commande de manière plus simple
        const data = new SlashCommandBuilder()
            .setName('create_subgroup')
            .setDescription('Crée un sous-groupe dans un projet existant avec canaux Discord dédiés.')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);
        
        // Ajouter les options séparément
        data.addStringOption(option => 
            option.setName('nom')
                .setDescription('Nom du sous-groupe')
                .setRequired(true)
        );

        data.addStringOption(option => 
            option.setName('description')
                .setDescription('Description du sous-groupe')
                .setRequired(true)
        );

        data.addStringOption(option => 
            option.setName('projet')
                .setDescription('Nom du projet parent')
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
                return await interaction.editReply('Vous n\'avez pas les permissions nécessaires pour créer un sous-groupe.');
            }

            // Récupérer les paramètres
            const subgroupName = interaction.options.getString('nom');
            const description = interaction.options.getString('description');
            const projectName = interaction.options.getString('projet');
            const leader = interaction.options.getUser('responsable') || interaction.user;
            
            // Trouver le projet parent
            let projectId, categoryId;
            try {
                const projects = await databaseManager.query(
                    'SELECT p.id, pc.channel_id FROM projects p ' +
                    'LEFT JOIN project_channels pc ON p.id = pc.project_id ' +
                    'WHERE p.name = ? AND pc.channel_type = \'general\' ' +
                    'LIMIT 1',
                    [projectName]
                );
                
                if (projects.length === 0) {
                    return await interaction.editReply(`Aucun projet nommé "${projectName}" n'a été trouvé.`);
                }
                
                projectId = projects[0].id;
                
                // Vérifier si un sous-groupe avec ce nom existe déjà dans ce projet
                const existingSubgroups = await databaseManager.query(
                    'SELECT * FROM subgroups WHERE project_id = ? AND name = ?',
                    [projectId, subgroupName]
                );
                
                if (existingSubgroups.length > 0) {
                    return await interaction.editReply(`Un sous-groupe nommé "${subgroupName}" existe déjà dans ce projet.`);
                }
                
                // Récupérer la catégorie du projet
                const channels = await databaseManager.query(
                    'SELECT channel_id FROM project_channels WHERE project_id = ? AND channel_type = \'general\' LIMIT 1',
                    [projectId]
                );
                
                if (channels.length > 0) {
                    const channel = await interaction.client.channels.fetch(channels[0].channel_id);
                    categoryId = channel.parent.id;
                }
            } catch (dbError) {
                Logger.error('Erreur lors de la recherche du projet', {
                    error: dbError.message,
                    stack: dbError.stack
                });
                return await interaction.editReply('Une erreur est survenue lors de la recherche du projet.');
            }
            
            // Créer les canaux Discord pour le sous-groupe
            const serverId = '1258751748538105877'; // ID du serveur cible
            const guild = interaction.client.guilds.cache.get(serverId);
            
            if (!guild) {
                return await interaction.editReply('Serveur Discord cible non trouvé. Contactez un administrateur.');
            }

            // Créer le salon texte (privé)
            const textChannel = await guild.channels.create({
                name: `🔒-${subgroupName.toLowerCase().replace(/\s+/g, '-')}`,
                type: ChannelType.GuildText,
                parent: categoryId,
                topic: description,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        deny: [PermissionsBitField.Flags.ViewChannel],
                    },
                    {
                        id: leader.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.SendMessages,
                            PermissionsBitField.Flags.ReadMessageHistory
                        ],
                    }
                ]
            });
            
            // Créer le salon vocal (public)
            const voiceChannel = await guild.channels.create({
                name: `🔊 ${subgroupName}`,
                type: ChannelType.GuildVoice,
                parent: categoryId,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.Connect],
                    },
                    {
                        id: leader.id,
                        allow: [
                            PermissionsBitField.Flags.ViewChannel,
                            PermissionsBitField.Flags.Connect,
                            PermissionsBitField.Flags.Speak,
                            PermissionsBitField.Flags.MuteMembers,
                            PermissionsBitField.Flags.DeafenMembers,
                            PermissionsBitField.Flags.MoveMembers
                        ],
                    }
                ]
            });
            
            // Enregistrer le sous-groupe dans la base de données
            try {
                // Insérer le sous-groupe
                const subgroupResult = await databaseManager.query(
                    'INSERT INTO subgroups (project_id, name, description, leader_id) VALUES (?, ?, ?, ?)',
                    [
                        projectId,
                        subgroupName,
                        description,
                        leader.id
                    ]
                );
                
                const subgroupId = subgroupResult.insertId;
                
                // Enregistrer les canaux associés au sous-groupe
                await databaseManager.query(
                    'INSERT INTO project_channels (project_id, channel_id, channel_type) VALUES (?, ?, ?), (?, ?, ?)',
                    [
                        projectId, textChannel.id, 'subgroup',
                        projectId, voiceChannel.id, 'subgroup'
                    ]
                );
                
                // Ajouter le responsable comme membre du sous-groupe
                await databaseManager.query(
                    'INSERT INTO subgroup_members (subgroup_id, user_id, role) VALUES (?, ?, ?)',
                    [subgroupId, leader.id, 'leader']
                );
                
                // Préparer l'embed de confirmation
                const embed = new EmbedBuilder()
                    .setTitle('✅ Sous-groupe créé avec succès')
                    .setDescription(`Le sous-groupe "${subgroupName}" a été créé avec succès dans le projet "${projectName}".`)
                    .setColor('#2ecc71')
                    .addFields(
                        { name: 'Description', value: description, inline: false },
                        { name: 'Responsable', value: `<@${leader.id}>`, inline: true },
                        { name: 'Salon Texte', value: `<#${textChannel.id}>`, inline: true },
                        { name: 'Salon Vocal', value: `<#${voiceChannel.id}>`, inline: true }
                    )
                    .setTimestamp()
                    .setFooter({ text: `Créé par ${interaction.user.tag}` });
                
                // Répondre à l'interaction
                await interaction.editReply({ embeds: [embed] });
                
                // Envoyer un message d'introduction dans le salon de texte
                await textChannel.send({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Bienvenue dans le sous-groupe "${subgroupName}"`)
                            .setDescription(description)
                            .setColor('#3498db')
                            .addFields(
                                { name: 'Projet Parent', value: projectName, inline: true },
                                { name: 'Responsable', value: `<@${leader.id}>`, inline: true },
                                { name: 'Créé le', value: new Date().toLocaleDateString('fr-FR'), inline: true }
                            )
                            .setFooter({ text: 'Ce canal est privé pour les membres du sous-groupe' })
                    ]
                });
                
                // Journaliser l'action
                Logger.info(`Sous-groupe "${subgroupName}" créé dans le projet "${projectName}"`, {
                    userId: interaction.user.id,
                    guildId: guild.id,
                    projectId,
                    subgroupId,
                    leaderId: leader.id,
                    textChannelId: textChannel.id,
                    voiceChannelId: voiceChannel.id
                });
            } catch (dbError) {
                // En cas d'erreur, nettoyer les canaux créés
                try {
                    await textChannel.delete();
                    await voiceChannel.delete();
                } catch (cleanupError) {
                    Logger.error('Erreur lors du nettoyage des canaux après échec', {
                        error: cleanupError.message,
                        stack: cleanupError.stack
                    });
                }
                
                Logger.error('Erreur lors de l\'enregistrement du sous-groupe', {
                    error: dbError.message,
                    stack: dbError.stack
                });
                
                await interaction.editReply('Une erreur est survenue lors de la création du sous-groupe.');
            }
        } catch (error) {
            Logger.error('Erreur lors de la création du sous-groupe', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Une erreur est survenue lors de la création du sous-groupe.');
        }
    }
}

export default new CreateSubgroupCommand(); 