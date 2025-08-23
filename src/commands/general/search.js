/**
 * @fileoverview Commande pour effectuer une recherche sur YouTube
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

/**
 * Commande pour rechercher sur YouTube
 */
export default {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Recherche sur YouTube.')
        .addStringOption(option =>
            option.setName('recherche')
                .setDescription('Terme de recherche.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('type')
                .setDescription('Type de recherche.')
                .setRequired(false)
                .addChoices(
                    { name: 'Général', value: 'general' },
                    { name: 'Tutoriel', value: 'tutorial' }
                ))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Utilisateur associé à la recherche (optionnel).')
                .setRequired(false)),
    
    /**
     * Alias pour la compatibilité
     * @param {Object} interaction - L'interaction Discord
     * @returns {Promise<void>}
     */
    async run(interaction) {
        return await this.execute(interaction);
    },
    
    /**
     * Méthode d'exécution principale
     * @param {Object} interaction - L'interaction Discord
     * @returns {Promise<void>}
     */
    async execute(interaction) {
        try {
            const searchTerm = interaction.options.getString('recherche');
            const searchType = interaction.options.getString('type') || 'general';
            const mentionedUser = interaction.options.getUser('user');

            // Ajuster le terme de recherche si c'est un tutoriel
            let finalSearchTerm = searchTerm;
            if (searchType === 'tutorial') {
                finalSearchTerm = `${searchTerm} tutoriel français`;
            }

            let results = [];
            
            if (YOUTUBE_API_KEY) {
                // Utiliser l'API YouTube si la clé est disponible
                results = await this.searchYouTube(finalSearchTerm, 5);
            } else {
                // Utiliser les résultats simulés sinon
                Logger.warn('Clé API YouTube non trouvée, utilisation des résultats simulés', {
                    userId: interaction.user.id
                });
                results = await this.mockYouTubeSearch(finalSearchTerm, 5);
            }

            if (results.length === 0) {
                await interaction.editReply(`Aucun résultat trouvé pour "${searchTerm}"`);
                return;
            }

            // Créer un embed pour afficher les résultats
            const embed = new EmbedBuilder()
                .setTitle(`Résultats pour "${searchTerm}"`)
                .setDescription(`Recherche de ${searchType === 'tutorial' ? 'tutoriels' : 'vidéos'} sur YouTube`)
                .setColor('#FF0000') // Rouge YouTube
                .setTimestamp();

            // Ajouter chaque résultat comme un champ
            results.forEach((item, index) => {
                embed.addFields({
                    name: `${index + 1}. ${item.title}`,
                    value: `[Voir la vidéo](${item.url})${item.description ? `\n${item.description.substring(0, 100)}...` : ''}`
                });
            });

            // Ajouter un pied de page
            embed.setFooter({ 
                text: `Recherché par ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            });

            await interaction.editReply({ embeds: [embed] });
            
            Logger.info(`Recherche YouTube effectuée par ${interaction.user.tag}`, {
                userId: interaction.user.id,
                searchTerm,
                searchType,
                mentionedUser: mentionedUser?.id
            });
        } catch (error) {
            Logger.error('Erreur lors de la recherche:', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id
            });
            await interaction.editReply('Erreur lors de la recherche. Veuillez réessayer plus tard.');
        }
    },

    /**
     * Effectue une recherche avec l'API YouTube
     * @param {string} query - Terme de recherche
     * @param {number} maxResults - Nombre maximum de résultats
     * @returns {Promise<Array>} Résultats de l'API
     */
    async searchYouTube(query, maxResults) {
        try {
            const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&maxResults=${maxResults}&type=video&key=${YOUTUBE_API_KEY}`;
            
            const response = await fetch(url);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Erreur API YouTube: ${errorData.error?.message || 'Erreur inconnue'}`);
            }
            
            const data = await response.json();
            
            // Formater les résultats
            return data.items.map(item => ({
                title: item.snippet.title,
                description: item.snippet.description,
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                thumbnail: item.snippet.thumbnails.default.url
            }));
        } catch (error) {
            Logger.error('Erreur lors de l\'appel à l\'API YouTube:', {
                error: error.message,
                stack: error.stack
            });
            // En cas d'erreur, on retourne un tableau vide
            return [];
        }
    },

    /**
     * Simule une recherche YouTube (utilisé si pas de clé API)
     * @param {string} query - Terme de recherche
     * @param {number} maxResults - Nombre maximum de résultats
     * @returns {Promise<Array>} Résultats simulés
     */
    async mockYouTubeSearch(query, maxResults) {
        // Résultats simulés pour tester la commande
        // À remplacer par l'API YouTube une fois configurée
        const possibleResults = [
            {
                title: `Tutoriel sur ${query}`,
                description: "Cette vidéo présente les bases et concepts fondamentaux pour les débutants.",
                url: `https://www.youtube.com/watch?v=example1`,
                thumbnail: "https://i.ytimg.com/vi/example1/default.jpg"
            },
            {
                title: `Comment apprendre ${query} en 2023`,
                description: "Guide complet pour maîtriser cette technologie en quelques semaines.",
                url: `https://www.youtube.com/watch?v=example2`,
                thumbnail: "https://i.ytimg.com/vi/example2/default.jpg"
            },
            {
                title: `Les bases de ${query} pour débutants`,
                description: "Parfait pour ceux qui débutent et veulent apprendre rapidement.",
                url: `https://www.youtube.com/watch?v=example3`,
                thumbnail: "https://i.ytimg.com/vi/example3/default.jpg"
            },
            {
                title: `Masterclass ${query} - Niveau avancé`,
                description: "Pour les développeurs expérimentés qui veulent approfondir leurs connaissances.",
                url: `https://www.youtube.com/watch?v=example4`,
                thumbnail: "https://i.ytimg.com/vi/example4/default.jpg"
            },
            {
                title: `${query} expliqué simplement`,
                description: "Explication claire et concise des concepts les plus importants.",
                url: `https://www.youtube.com/watch?v=example5`,
                thumbnail: "https://i.ytimg.com/vi/example5/default.jpg"
            }
        ];

        // Simulation d'un délai de recherche
        await new Promise(resolve => setTimeout(resolve, 500));

        return possibleResults.slice(0, maxResults);
    }
}; 