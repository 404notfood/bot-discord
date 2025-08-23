/**
 * @fileoverview Commande pour lister tous les projets existants
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';
import { AdminCommand } from '../../models/AdminCommand.js';

/**
 * Commande pour lister tous les projets existants
 */
class ListProjectsCommand extends AdminCommand {
    /**
     * Crée une nouvelle instance de ListProjectsCommand
     * @constructor
     */
    constructor() {
        // Créer l'objet de commande de manière plus simple
        const data = new SlashCommandBuilder()
            .setName('list_projects')
            .setDescription('Liste tous les projets existants.')
            .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);
        
        // Ajouter les options séparément
        data.addStringOption(option => 
            option.setName('statut')
                .setDescription('Filtrer les projets par statut')
                .setRequired(false)
                .addChoices(
                    { name: 'Planification', value: 'planning' },
                    { name: 'En cours', value: 'in_progress' },
                    { name: 'En pause', value: 'paused' },
                    { name: 'Terminé', value: 'completed' },
                    { name: 'Annulé', value: 'cancelled' }
                )
        );

        data.addStringOption(option => 
            option.setName('recherche')
                .setDescription('Rechercher un projet par nom')
                .setRequired(false)
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
        try {
            // Vérifier si l'utilisateur est modérateur ou administrateur
            if (!(await this.isModerator(interaction.user.id))) {
                return await interaction.editReply('Vous n\'avez pas les permissions nécessaires pour lister les projets.');
            }

            // Récupérer les paramètres
            const status = interaction.options.getString('statut');
            const search = interaction.options.getString('recherche');
            
            // Construire la requête SQL en fonction des filtres
            let query = 'SELECT p.*, COUNT(DISTINCT s.id) as subgroup_count, COUNT(DISTINCT sm.id) as member_count ' +
                         'FROM projects p ' +
                         'LEFT JOIN subgroups s ON p.id = s.project_id ' +
                         'LEFT JOIN subgroup_members sm ON s.id = sm.subgroup_id ';
            
            const queryParams = [];
            const conditions = [];
            
            if (status) {
                conditions.push('p.status = ?');
                queryParams.push(status);
            }
            
            if (search) {
                conditions.push('p.name LIKE ?');
                queryParams.push(`%${search}%`);
            }
            
            if (conditions.length > 0) {
                query += 'WHERE ' + conditions.join(' AND ') + ' ';
            }
            
            query += 'GROUP BY p.id ORDER BY p.created_at DESC';
            
            // Exécuter la requête
            const [projects] = await db.query(query, queryParams);
            
            if (projects.length === 0) {
                const noProjectsEmbed = new EmbedBuilder()
                    .setTitle('📋 Liste des Projets')
                    .setDescription('Aucun projet ne correspond aux critères de recherche.')
                    .setColor('#e74c3c')
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [noProjectsEmbed] });
            }
            
            // Créer un embed pour afficher les projets
            const embed = new EmbedBuilder()
                .setTitle('📋 Liste des Projets')
                .setDescription(`${projects.length} projet(s) trouvé(s)` + 
                               (status ? ` avec le statut: ${this.formatStatus(status)}` : '') +
                               (search ? ` contenant "${search}"` : ''))
                .setColor('#3498db')
                .setTimestamp();
            
            // Ajouter chaque projet à l'embed
            for (let i = 0; i < Math.min(projects.length, 10); i++) {
                const project = projects[i];
                
                // Rechercher les canaux associés au projet
                const [channels] = await db.query(
                    'SELECT channel_id FROM project_channels WHERE project_id = ? AND channel_type = \'general\' LIMIT 2',
                    [project.id]
                );
                
                let channelsText = 'Aucun canal associé';
                if (channels.length > 0) {
                    channelsText = channels.map(c => `<#${c.channel_id}>`).join(', ');
                }
                
                embed.addFields({
                    name: `${this.getStatusEmoji(project.status)} ${project.name}`,
                    value: `**Description**: ${project.description || 'Aucune description'}\n` +
                           `**Statut**: ${this.formatStatus(project.status)}\n` +
                           `**Sous-groupes**: ${project.subgroup_count || 0}\n` +
                           `**Membres**: ${project.member_count || 0}\n` +
                           `**Canaux**: ${channelsText}\n` +
                           `**Créé le**: ${new Date(project.created_at).toLocaleDateString('fr-FR')}`
                });
            }
            
            // Si plus de 10 projets, indiquer qu'il y en a d'autres
            if (projects.length > 10) {
                embed.setFooter({ text: `Et ${projects.length - 10} autre(s) projet(s). Utilisez des filtres pour affiner les résultats.` });
            } else {
                embed.setFooter({ text: `Demandé par ${interaction.user.tag}` });
            }
            
            // Répondre à l'interaction
            await interaction.editReply({ embeds: [embed] });
            
            // Journaliser l'action
            Logger.info(`Liste des projets consultée par ${interaction.user.tag}`, {
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                filters: { status, search },
                projectCount: projects.length
            });
        } catch (error) {
            Logger.error('Erreur lors de la récupération des projets', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Une erreur est survenue lors de la récupération des projets.');
        }
    }
    
    /**
     * Formatage du statut du projet pour l'affichage
     * @param {string} status - Statut du projet
     * @returns {string} - Statut formaté
     * @private
     */
    formatStatus(status) {
        switch (status) {
            case 'planning': return 'Planification';
            case 'in_progress': return 'En cours';
            case 'paused': return 'En pause';
            case 'completed': return 'Terminé';
            case 'cancelled': return 'Annulé';
            default: return status || 'Inconnu';
        }
    }
    
    /**
     * Retourne l'emoji correspondant au statut
     * @param {string} status - Statut du projet
     * @returns {string} - Emoji
     * @private
     */
    getStatusEmoji(status) {
        switch (status) {
            case 'planning': return '📝';
            case 'in_progress': return '🔄';
            case 'paused': return '⏸️';
            case 'completed': return '✅';
            case 'cancelled': return '❌';
            default: return '❓';
        }
    }
}

export default new ListProjectsCommand(); 