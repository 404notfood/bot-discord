/**
 * @fileoverview Commande pour créer un nouveau projet
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ChannelType, PermissionsBitField } from 'discord.js';
// Utilise maintenant client.databaseManager
import * as Logger from '../../utils/logger.js';

// Créer la commande avec une syntaxe plus sûre
const command = new SlashCommandBuilder()
    .setName('create_project')
    .setDescription('Crée un nouveau projet avec canaux Discord dédiés.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels);

// Ajouter les options une par une
command.addStringOption(option => option
    .setName('nom')
    .setDescription('Nom du projet')
    .setRequired(true)
);

command.addStringOption(option => option
    .setName('description')
    .setDescription('Description du projet')
    .setRequired(true)
);

command.addStringOption(option => option
    .setName('date_debut')
    .setDescription('Date de début (YYYY-MM-DD)')
    .setRequired(false)
);

command.addStringOption(option => option
    .setName('date_fin')
    .setDescription('Date de fin (YYYY-MM-DD)')
    .setRequired(false)
);

// Fonction pour vérifier si l'utilisateur est modérateur
async function isModerator(userId, databaseManager) {
    try {
        // Vérifier dans la table bot_moderators
        const moderators = await databaseManager.query(
            'SELECT user_id FROM bot_moderators WHERE user_id = ?',
            [userId]
        );
        
        if (moderators.length > 0) {
            return true;
        }
        
        // Vérifier aussi dans la table bot_admins
        const admins = await databaseManager.query(
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

// Exporter le module
export default {
    data: command,
    
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
            if (!(await isModerator(interaction.user.id))) {
                return await interaction.editReply('Vous n\'avez pas les permissions nécessaires pour créer un projet.');
            }

            // Récupérer les paramètres
            const projectName = interaction.options.getString('nom');
            const description = interaction.options.getString('description');
            const startDate = interaction.options.getString('date_debut');
            const endDate = interaction.options.getString('date_fin');
            
            // Créer les canaux Discord pour le projet
            const serverId = '1258751748538105877'; // ID du serveur cible (vous pouvez le rendre configurable)
            const guild = interaction.client.guilds.cache.get(serverId);
            
            if (!guild) {
                return await interaction.editReply('Serveur Discord cible non trouvé. Contactez un administrateur.');
            }
            
            // Vérifier s'il existe déjà un projet avec ce nom
            try {
                const existingProjects = await databaseManager.query(
                    'SELECT * FROM projects WHERE name = ?',
                    [projectName]
                );
                
                if (existingProjects.length > 0) {
                    return await interaction.editReply(`Un projet nommé "${projectName}" existe déjà.`);
                }
            } catch (dbError) {
                Logger.error('Erreur lors de la vérification des projets existants', {
                    error: dbError.message,
                    stack: dbError.stack
                });
            }

            // Créer la catégorie pour le projet
            const category = await guild.channels.create({
                name: `📂 ${projectName}`,
                type: ChannelType.GuildCategory,
                permissionOverwrites: [
                    {
                        id: guild.roles.everyone.id,
                        allow: [PermissionsBitField.Flags.ViewChannel],
                    }
                ]
            });
            
            // Créer le salon texte
            const textChannel = await guild.channels.create({
                name: `📝-${projectName.toLowerCase().replace(/\s+/g, '-')}`,
                type: ChannelType.GuildText,
                parent: category.id,
                topic: description
            });
            
            // Créer le salon vocal
            const voiceChannel = await guild.channels.create({
                name: `🔊 ${projectName}`,
                type: ChannelType.GuildVoice,
                parent: category.id
            });
            
            // Enregistrer le projet dans la base de données
            try {
                const result = await databaseManager.query(
                    'INSERT INTO projects (name, description, owner_id, start_date, due_date) VALUES (?, ?, ?, ?, ?)',
                    [
                        projectName,
                        description,
                        interaction.user.id,
                        startDate || null,
                        endDate || null
                    ]
                );
                
                const projectId = result.insertId;
                
                // Enregistrer les canaux associés au projet
                await databaseManager.query(
                    'INSERT INTO project_channels (project_id, channel_id, channel_type) VALUES (?, ?, ?), (?, ?, ?)',
                    [
                        projectId, textChannel.id, 'general',
                        projectId, voiceChannel.id, 'general'
                    ]
                );
                
                // Préparer l'embed de confirmation
                const embed = new EmbedBuilder()
                    .setTitle('✅ Projet créé avec succès')
                    .setDescription(`Le projet "${projectName}" a été créé avec succès.`)
                    .setColor('#2ecc71')
                    .addFields(
                        { name: 'Description', value: description, inline: false },
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
                            .setTitle(`Bienvenue dans le projet "${projectName}"`)
                            .setDescription(description)
                            .setColor('#3498db')
                            .addFields(
                                { name: 'Chef de Projet', value: `<@${interaction.user.id}>`, inline: true },
                                { name: 'Créé le', value: new Date().toLocaleDateString('fr-FR'), inline: true }
                            )
                            .setFooter({ text: 'Utilisez ce canal pour discuter du projet' })
                    ]
                });
                
                // Journaliser l'action
                Logger.info(`Projet "${projectName}" créé`, {
                    userId: interaction.user.id,
                    guildId: guild.id,
                    projectId,
                    textChannelId: textChannel.id,
                    voiceChannelId: voiceChannel.id
                });
            } catch (dbError) {
                // En cas d'erreur, nettoyer les canaux créés
                try {
                    await textChannel.delete();
                    await voiceChannel.delete();
                    await category.delete();
                } catch (cleanupError) {
                    Logger.error('Erreur lors du nettoyage des canaux après échec', {
                        error: cleanupError.message,
                        stack: cleanupError.stack
                    });
                }
                
                Logger.error('Erreur lors de l\'enregistrement du projet', {
                    error: dbError.message,
                    stack: dbError.stack
                });
                
                await interaction.editReply('Une erreur est survenue lors de la création du projet.');
            }
        } catch (error) {
            Logger.error('Erreur lors de la création du projet', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Une erreur est survenue lors de la création du projet.');
        }
    }
}; 