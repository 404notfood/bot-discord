/**
 * Utilitaires de pagination pour les embeds Discord
 * @module pagination
 */

import { EmbedBuilder } from 'discord.js';
import * as Logger from './logger.js';

/**
 * Crée une pagination pour une liste d'embeds ou de chaînes de texte
 * @param {Object} interaction - L'interaction Discord
 * @param {Array} pages - Liste des embeds ou chaînes de texte à paginer
 * @param {Object} options - Options de pagination
 * @param {number} options.time - Temps en ms avant que les boutons ne soient désactivés (défaut: 60000ms)
 * @param {boolean} options.ephemeral - Si la réponse doit être éphémère (défaut: false)
 * @param {boolean} options.fastSkip - Si les boutons de saut rapide doivent être affichés (défaut: false)
 * @param {string} options.headerText - Texte d'en-tête à ajouter aux pages qui sont des chaînes de texte
 * @param {number} options.itemsPerPage - Nombre d'éléments par page pour les listes de chaînes
 */
export async function paginate(interaction, pages, options = {}) {
    if (!pages || !Array.isArray(pages) || pages.length === 0) {
        throw new Error('La liste des pages doit être un tableau non vide');
    }

    const time = options.time || 60000; // 1 minute par défaut
    const ephemeral = options.ephemeral || false;
    const fastSkip = options.fastSkip || false;
    
    // Convertir les pages en embeds si ce sont des chaînes de caractères
    const embeds = pages.map(page => {
        if (typeof page === 'string') {
            return new EmbedBuilder()
                .setDescription(page)
                .setColor('#3498db');
        } else if (typeof page === 'object' && !page.data) {
            // Si c'est un objet mais pas un embed, le transformer en embed
            return new EmbedBuilder()
                .setDescription(JSON.stringify(page))
                .setColor('#3498db');
        }
        return page;
    });
    
    // Si une seule page, pas besoin de pagination
    if (embeds.length === 1) {
        return await interaction.editReply({
            embeds: [embeds[0]]
        });
    }

    let currentPage = 0;
    
    // Créer les boutons de navigation
    const buttons = [
        {
            customId: 'previous',
            label: '◀️',
            style: 'PRIMARY',
            disabled: true
        },
        {
            customId: 'next',
            label: '▶️',
            style: 'PRIMARY',
            disabled: false
        }
    ];
    
    if (fastSkip) {
        buttons.unshift({
            customId: 'first',
            label: '⏪',
            style: 'PRIMARY',
            disabled: true
        });
        
        buttons.push({
            customId: 'last',
            label: '⏩',
            style: 'PRIMARY',
            disabled: false
        });
    }
    
    // Ajouter un bouton de fermeture
    buttons.push({
        customId: 'close',
        label: '❌',
        style: 'DANGER',
        disabled: false
    });
    
    // Créer l'action row avec les boutons
    const row = {
        type: 1, // ActionRow
        components: buttons.map(button => ({
            type: 2, // Button
            custom_id: button.customId,
            label: button.label,
            style: button.style === 'PRIMARY' ? 1 : 4, // 1 = PRIMARY, 4 = DANGER
            disabled: button.disabled
        }))
    };
    
    // Ajouter le numéro de page à l'embed
    embeds.forEach((embed, index) => {
        // S'assurer que l'embed a un objet footer
        if (!embed.data) {
            embed.data = {};
        }
        if (!embed.data.footer) {
            embed.data.footer = { text: '' };
        } else if (typeof embed.data.footer === 'string') {
            const footerText = embed.data.footer;
            embed.data.footer = { text: footerText };
        }
        
        // Ajouter le numéro de page au footer
        const currentFooter = embed.data.footer.text || '';
        embed.data.footer.text = `Page ${index + 1}/${embeds.length}${currentFooter ? ' • ' + currentFooter : ''}`;
    });
    
    try {
        // Envoyer le message initial ou mettre à jour le message existant
        const message = await interaction.editReply({
            embeds: [embeds[currentPage]],
            components: [row],
            fetchReply: true
        });
        
        // Créer le collecteur pour intercepter les interactions avec les boutons
        const filter = i => {
            return i.customId === 'previous' || 
                i.customId === 'next' || 
                i.customId === 'first' || 
                i.customId === 'last' || 
                i.customId === 'close';
        };
        
        const collector = message.createMessageComponentCollector({
            filter,
            time
        });
        
        // Gérer les interactions avec les boutons
        collector.on('collect', async i => {
            try {
                // Vérifier que c'est bien l'utilisateur qui a initié la commande
                if (i.user.id !== interaction.user.id) {
                    return await i.reply({
                        content: "Vous ne pouvez pas utiliser ces boutons.",
                        ephemeral: true
                    });
                }
                
                // Réinitialiser le temps
                collector.resetTimer();
                
                // Traiter l'action selon le bouton
                switch (i.customId) {
                    case 'previous':
                        currentPage--;
                        break;
                    case 'next':
                        currentPage++;
                        break;
                    case 'first':
                        currentPage = 0;
                        break;
                    case 'last':
                        currentPage = embeds.length - 1;
                        break;
                    case 'close':
                        collector.stop('closed');
                        try {
                            return await i.update({
                                embeds: [embeds[currentPage]],
                                components: []
                            });
                        } catch (updateError) {
                            // Ignorer les erreurs d'interaction expirée
                            if (updateError.code === 10062 || 
                                updateError.message?.includes('Unknown interaction') ||
                                updateError.message?.includes('already been acknowledged')) {
                                Logger.debug('Interaction expirée (normal)', {
                                    userId: i.user.id,
                                    buttonId: i.customId
                                });
                                return;
                            }
                            throw updateError;
                        }
                }
                
                // Mettre à jour l'état des boutons
                row.components.forEach(button => {
                    if (button.custom_id === 'previous' || button.custom_id === 'first') {
                        button.disabled = currentPage === 0;
                    }
                    if (button.custom_id === 'next' || button.custom_id === 'last') {
                        button.disabled = currentPage === embeds.length - 1;
                    }
                });
                
                // Mettre à jour le message avec de nouvelles tentatives en cas d'erreur
                try {
                    await i.update({
                        embeds: [embeds[currentPage]],
                        components: [row]
                    });
                } catch (updateError) {
                    // Essayer différentes approches pour gérer les interactions expirées
                    if (updateError.code === 10062 || 
                        updateError.message?.includes('Unknown interaction') ||
                        updateError.message?.includes('already been acknowledged')) {
                        
                        Logger.debug('Interaction expirée, tentative de mise à jour du message original', {
                            userId: i.user.id,
                            buttonId: i.customId
                        });
                        
                        try {
                            // Essayer de mettre à jour le message original
                            await message.edit({
                                embeds: [embeds[currentPage]],
                                components: [row]
                            });
                        } catch (messageError) {
                            Logger.debug('Impossible de mettre à jour le message', {
                                error: messageError.message
                            });
                            // À ce stade, on ne peut plus rien faire
                        }
                        
                        return;
                    }
                    throw updateError;
                }
            } catch (error) {
                Logger.error('Erreur générale lors de la gestion du bouton de pagination', {
                    error: error.message,
                    stack: error.stack,
                    buttonId: i.customId
                });
                
                // Même en cas d'erreur, on essaie quand même de répondre à l'utilisateur
                try {
                    await i.reply({
                        content: 'Une erreur est survenue lors du changement de page. Veuillez réessayer.',
                        ephemeral: true
                    });
                } catch (_) {
                    // Ignorer les erreurs ici, on a fait de notre mieux
                }
            }
        });
        
        // Quand le temps est écoulé, désactiver les boutons
        collector.on('end', async (_, reason) => {
            if (reason !== 'closed' && !ephemeral) {
                row.components.forEach(button => {
                    button.disabled = true;
                });
                
                try {
                    await message.edit({
                        embeds: [embeds[currentPage]],
                        components: [row]
                    });
                } catch (error) {
                    // Ignorer les erreurs si le message a été supprimé
                    Logger.debug('Erreur lors de la mise à jour du message après expiration des boutons', {
                        error: error.message
                    });
                }
            }
        });
        
        return message;
    } catch (error) {
        Logger.error('Erreur lors de la pagination', {
            error: error.message,
            stack: error.stack
        });
        
        // Fallback en cas d'erreur
        return await interaction.editReply({
            content: 'Une erreur est survenue lors de l\'affichage paginé.',
            embeds: []
        });
    }
}

/**
 * Transforme une liste de chaînes en pages paginées
 * @param {Array<string>} items - Liste des chaînes à paginer
 * @param {Object} options - Options de pagination
 * @param {number} options.itemsPerPage - Nombre d'éléments par page (défaut: 10)
 * @param {string} options.headerText - Texte d'en-tête à ajouter à chaque page
 * @returns {Array<string>} - Liste des contenus de pages
 */
export function createPagesFromItems(items, options = {}) {
    const itemsPerPage = options.itemsPerPage || 10;
    const headerText = options.headerText || '';
    
    const pages = [];
    // Limite de caractères pour les embeds Discord (max 4096, nous prenons 4000 par sécurité)
    const MAX_DESCRIPTION_LENGTH = 4000;
    
    // Ajouter une entrée de débogage
    Logger.info('Création de pages à partir des items', {
        itemCount: items.length,
        itemsPerPage,
        headerTextLength: headerText.length
    });
    
    // Convertir les items en chaînes si nécessaire
    const processedItems = items.map(item => {
        if (typeof item === 'string') {
            return item;
        } else if (item === null) {
            return 'null';
        } else if (item === undefined) {
            return 'undefined';
        } else if (typeof item === 'object') {
            try {
                return JSON.stringify(item);
            } catch (e) {
                return '[Objet non sérialisable]';
            }
        }
        return String(item);
    });
    
    // Si le headerText est spécifié, il sera ajouté à chaque page
    let currentPage = headerText ? headerText + '\n\n' : '';
    let currentLength = currentPage.length;
    
    for (const item of processedItems) {
        // Calculer la longueur avec le séparateur
        const itemWithSeparator = item + '\n\n';
        const itemLength = itemWithSeparator.length;
        
        // Si l'ajout de cet item dépasserait la limite, créer une nouvelle page
        if (currentLength + itemLength > MAX_DESCRIPTION_LENGTH || 
            (pages.length === 0 && currentLength + itemLength > MAX_DESCRIPTION_LENGTH)) {
            if (currentPage.trim().length > 0) {
                pages.push(currentPage.trim());
            }
            currentPage = headerText ? headerText + '\n\n' + itemWithSeparator : itemWithSeparator;
            currentLength = currentPage.length;
        } else {
            currentPage += itemWithSeparator;
            currentLength += itemLength;
        }
        
        // Si nous avons atteint le nombre d'éléments par page, créer une nouvelle page
        if (currentPage.split('\n\n').length - 1 >= itemsPerPage) {
            if (currentPage.trim().length > 0) {
                pages.push(currentPage.trim());
            }
            currentPage = headerText ? headerText + '\n\n' : '';
            currentLength = currentPage.length;
        }
    }
    
    // Ne pas oublier d'ajouter la dernière page si elle n'est pas vide
    if (currentPage.trim().length > 0) {
        pages.push(currentPage.trim());
    }
    
    // Log du résultat
    Logger.info('Pages créées', {
        pageCount: pages.length,
        pageSizes: pages.map(p => p.length)
    });
    
    return pages;
}

/**
 * Pagine un message de texte en utilisant des embeds
 * @param {Object} interaction - L'interaction Discord
 * @param {Array<string>} items - Éléments à afficher
 * @param {Object} options - Options de pagination
 * @param {number} options.itemsPerPage - Nombre d'éléments par page (défaut: 10)
 * @param {string} options.headerText - Texte d'en-tête à ajouter à chaque page
 * @param {boolean} options.ephemeral - Si les messages doivent être éphémères
 * @returns {Promise<void>}
 */
export async function paginateMessage(interaction, items, options = {}) {
    try {
        // Log pour déboguer
        Logger.info('Début de paginateMessage', {
            itemsCount: items.length,
            options: JSON.stringify({
                itemsPerPage: options.itemsPerPage || 10,
                ephemeral: options.ephemeral !== undefined ? options.ephemeral : true,
                headerTextLength: options.headerText ? options.headerText.length : 0
            }),
            userId: interaction.user?.id || 'inconnu'
        });
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            Logger.warn('paginateMessage: Liste d\'éléments invalide', {
                items: items ? typeof items : 'undefined',
                isArray: Array.isArray(items),
                length: items ? items.length : 0
            });
            await interaction.editReply('Aucun élément à afficher.');
            return;
        }
        
        const itemsPerPage = options.itemsPerPage || 10;
        const headerText = options.headerText || '';
        const ephemeral = options.ephemeral !== undefined ? options.ephemeral : true;
        
        // Créer les pages (contenu textuel)
        Logger.info('Création des pages pour pagination', {
            itemsCount: items.length,
            itemsPerPage,
            expectedPageCount: Math.ceil(items.length / itemsPerPage)
        });
        
        const pageTexts = createPagesFromItems(items, {
            itemsPerPage,
            headerText
        });
        
        Logger.info('Contenus de pages créés', {
            pageCount: pageTexts.length,
            firstPageLength: pageTexts[0] ? pageTexts[0].length : 0
        });
        
        // Si une seule page, pas besoin de pagination
        if (pageTexts.length === 1) {
            Logger.info('Une seule page, pas de pagination nécessaire');
            
            try {
                const embed = new EmbedBuilder()
                    .setDescription(pageTexts[0])
                    .setColor('#3498db');
                
                return await interaction.editReply({
                    embeds: [embed],
                    components: []
                });
            } catch (embedError) {
                Logger.error('Erreur lors de la création de l\'embed pour une seule page', {
                    error: embedError.message,
                    descriptionLength: pageTexts[0].length
                });
                
                // Fallback en texte simple si l'embed échoue (probablement trop grand)
                return await interaction.editReply({
                    content: pageTexts[0].substring(0, 1900) + (pageTexts[0].length > 1900 ? '...' : ''),
                    embeds: [],
                    components: []
                });
            }
        }
        
        // Convertir chaque page en embed
        const embeds = [];
        
        for (const pageText of pageTexts) {
            try {
                const embed = new EmbedBuilder()
                    .setDescription(pageText)
                    .setColor('#3498db');
                
                embeds.push(embed);
            } catch (embedError) {
                Logger.error('Erreur lors de la création d\'un embed', {
                    error: embedError.message,
                    textLength: pageText.length
                });
                
                // Créer un embed avec un message d'erreur à la place
                const errorEmbed = new EmbedBuilder()
                    .setDescription('Le contenu de cette page est trop long pour être affiché. Essayez de réduire le nombre d\'éléments par page.')
                    .setColor('#e74c3c');
                
                embeds.push(errorEmbed);
            }
        }
        
        Logger.info('Embeds créés pour pagination', {
            embedCount: embeds.length
        });
        
        // Utiliser la fonction de pagination
        try {
            Logger.info('Appel de la fonction paginate');
            
            await paginate(interaction, embeds, {
                time: 120000, // 2 minutes
                ephemeral: ephemeral,
                fastSkip: true
            });
            
            Logger.info('Pagination terminée avec succès');
        } catch (paginateError) {
            Logger.error('Erreur dans la fonction paginate', {
                error: paginateError.message,
                stack: paginateError.stack,
                userId: interaction.user?.id
            });
            
            // Tenter un fallback avec un simple message
            try {
                const fallbackContent = headerText ? 
                    `${headerText}\n\n${items.slice(0, 5).join('\n\n')}` : 
                    items.slice(0, 5).join('\n\n');
                
                const truncatedContent = fallbackContent.substring(0, 1900);
                
                await interaction.editReply({
                    content: truncatedContent + (items.length > 5 ? `\n\n... et ${items.length - 5} autres éléments` : ''),
                    embeds: [],
                    components: []
                });
                
                Logger.info('Fallback de pagination réussi');
            } catch (editError) {
                Logger.error('Erreur lors du fallback de pagination', {
                    error: editError.message,
                    userId: interaction.user?.id
                });
                
                // Dernier recours
                await interaction.editReply({
                    content: "Impossible d'afficher tous les résultats. Veuillez réessayer avec moins d'éléments.",
                    embeds: [],
                    components: []
                });
            }
        }
    } catch (error) {
        Logger.error('Erreur dans paginateMessage', {
            error: error.message,
            stack: error.stack,
            userId: interaction.user?.id
        });
        
        try {
            await interaction.editReply({
                content: "Une erreur est survenue lors de l'affichage des résultats.",
                embeds: [],
                components: []
            });
        } catch (replyError) {
            Logger.error('Impossible de répondre avec un message d\'erreur', {
                error: replyError.message
            });
        }
    }
}

// Exporter aussi comme exportation par défaut pour la compatibilité
export default {
    paginate,
    paginateMessage,
    createPagesFromItems
}; 