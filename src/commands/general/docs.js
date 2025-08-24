/**
 * @fileoverview Nouvelle commande docs utilisant le DocumentationCacheService
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { paginateMessage } from '../../utils/pagination.js';

export default {
    data: new SlashCommandBuilder()
        .setName('docs')
        .setDescription('Rechercher dans la documentation technique')
        .addStringOption(option =>
            option.setName('terme')
                .setDescription('Terme de recherche ou langage')
                .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('langage')
                .setDescription('Filtrer par langage spécifique')
                .setRequired(false)
                .setAutocomplete(true)
        )
        .addBooleanOption(option =>
            option.setName('public')
                .setDescription('Afficher les résultats publiquement')
                .setRequired(false)
        ),

    /**
     * Autocomplete pour les langages
     */
    async autocomplete(interaction) {
        const focusedValue = interaction.options.getFocused();
        const cacheService = interaction.client.documentationCacheService;
        
        if (!cacheService) {
            return interaction.respond([]);
        }

        try {
            const languages = cacheService.getLanguages();
            const filtered = languages
                .filter(lang => lang.toLowerCase().includes(focusedValue.toLowerCase()))
                .slice(0, 25)
                .map(lang => ({ name: lang, value: lang }));

            await interaction.respond(filtered);
        } catch (error) {
            Logger.error('Erreur autocomplete docs:', { error: error.message });
            await interaction.respond([]);
        }
    },

    /**
     * Exécute la commande docs
     */
    async execute(interaction) {
        try {
            const terme = interaction.options.getString('terme');
            const langage = interaction.options.getString('langage');
            const isPublic = interaction.options.getBoolean('public') || false;

            // Vérifier les services
            const cacheService = interaction.client.documentationCacheService;
            const dbManager = interaction.client.databaseManager;

            if (!cacheService) {
                return interaction.reply({
                    content: '❌ Service de documentation non disponible',
                    ephemeral: true
                });
            }

            await interaction.deferReply({ ephemeral: !isPublic });

            // Si aucun paramètre, afficher les langages disponibles
            if (!terme && !langage) {
                return this.showAvailableLanguages(interaction, cacheService);
            }

            // Rechercher des ressources
            let resources = [];
            
            if (langage) {
                resources = cacheService.getResourcesByLanguage(langage);
            } else if (terme) {
                resources = cacheService.searchResources(terme);
            }

            if (resources.length === 0) {
                return interaction.editReply({
                    content: `Aucune ressource trouvée pour ${langage || terme}`
                });
            }

            // Formatter et paginer les résultats
            await this.displayResults(interaction, resources, langage || terme);

        } catch (error) {
            Logger.error('Erreur commande docs:', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id
            });

            const content = 'Une erreur est survenue lors de la recherche.';
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content, ephemeral: true });
            } else {
                await interaction.editReply({ content });
            }
        }
    },

    /**
     * Affiche les langages disponibles
     */
    async showAvailableLanguages(interaction, cacheService) {
        const languages = cacheService.getLanguages();
        
        if (languages.length === 0) {
            return interaction.editReply({
                content: 'Aucun langage disponible dans le cache.'
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('📚 Langages de programmation disponibles')
            .setDescription('Utilisez `/docs langage:nom_du_langage` pour voir les ressources')
            .setColor('#3498db')
            .setTimestamp();

        // Grouper les langages par colonnes
        const chunkedLanguages = this.chunkArray(languages, Math.ceil(languages.length / 3));
        
        chunkedLanguages.forEach((chunk, index) => {
            embed.addFields({
                name: `Colonne ${index + 1}`,
                value: chunk.map(lang => `• ${lang}`).join('\n') || 'Aucun',
                inline: true
            });
        });

        embed.setFooter({ 
            text: `${languages.length} langages disponibles` 
        });

        await interaction.editReply({ embeds: [embed] });
    },

    /**
     * Affiche les résultats de recherche
     */
    async displayResults(interaction, resources, searchTerm) {
        const pages = this.createPages(resources, searchTerm);

        if (pages.length === 1) {
            await interaction.editReply({ embeds: [pages[0]] });
        } else {
            // Utiliser la pagination
            try {
                await paginateMessage(interaction, pages, {
                    timeout: 300000, // 5 minutes
                    editReply: true
                });
            } catch (paginationError) {
                Logger.warn('Erreur pagination, affichage simple:', {
                    error: paginationError.message
                });
                
                // Affichage simple sans pagination
                await interaction.editReply({ 
                    embeds: [pages[0]],
                    content: `Page 1/${pages.length} (pagination non disponible)`
                });
            }
        }
    },

    /**
     * Crée les pages pour la pagination
     */
    createPages(resources, searchTerm) {
        const pages = [];
        const itemsPerPage = 5;
        
        for (let i = 0; i < resources.length; i += itemsPerPage) {
            const pageResources = resources.slice(i, i + itemsPerPage);
            const pageNumber = Math.floor(i / itemsPerPage) + 1;
            const totalPages = Math.ceil(resources.length / itemsPerPage);
            
            const embed = new EmbedBuilder()
                .setTitle(`📖 Documentation - ${searchTerm}`)
                .setColor('#2ecc71')
                .setTimestamp()
                .setFooter({ 
                    text: `Page ${pageNumber}/${totalPages} • ${resources.length} résultats`
                });

            pageResources.forEach(resource => {
                let description = resource.description || 'Aucune description';
                if (description.length > 100) {
                    description = description.substring(0, 97) + '...';
                }

                const links = [];
                if (resource.url) links.push(`[📄 Documentation](${resource.url})`);
                if (resource.search_url) links.push(`[🔍 Recherche](${resource.search_url})`);
                if (resource.tutorial_url) links.push(`[🎥 Tutoriels](${resource.tutorial_url})`);

                embed.addFields({
                    name: `${resource.name} ${resource.language ? `(${resource.language})` : ''}`,
                    value: `${description}\n${links.join(' • ')}`,
                    inline: false
                });
            });

            pages.push(embed);
        }

        return pages;
    },

    /**
     * Divise un tableau en chunks
     */
    chunkArray(array, size) {
        const chunks = [];
        for (let i = 0; i < array.length; i += size) {
            chunks.push(array.slice(i, i + size));
        }
        return chunks;
    },

    // Alias pour compatibilité
    async run(interaction) {
        return await this.execute(interaction);
    }
};