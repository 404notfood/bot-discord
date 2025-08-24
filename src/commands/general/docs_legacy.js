/**
 * @fileoverview Commande pour rechercher et afficher de la documentation technique
 */

import { SlashCommandBuilder } from 'discord.js';
// Utilise maintenant client.documentationCacheService et client.databaseManager
import { promises as fsPromises, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as Logger from '../../utils/logger.js';
import { paginateMessage } from '../../utils/pagination.js';

// Obtenir l'équivalent de __dirname pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Affiche toutes les catégories et langages disponibles
 * @param {Object} interaction - L'interaction Discord
 * @param {boolean} isPublic - Si les résultats doivent être affichés publiquement
 * @param {Object} user - L'utilisateur à qui envoyer les résultats (optionnel)
 * @returns {Promise<boolean>} - Succès de l'opération
 */
async function afficherToutesCategories(interaction, isPublic, user) {
    try {
        // Répondre immédiatement pour éviter le timeout
        await interaction.editReply({ content: "Récupération des langages disponibles en cours..." });
        
        // Vérifier la connexion à la base de données
        Logger.info('Vérification de la connexion à la base de données pour la commande docs', {
            userId: interaction.user.id
        });
        
        if (!db.isDatabaseEnabled()) {
            Logger.warn('Base de données désactivée, impossible d\'afficher les catégories', {
                userId: interaction.user.id
            });
            await interaction.editReply("La base de données n'est pas disponible actuellement. Veuillez réessayer plus tard ou contacter un administrateur.");
            return false;
        }
        
        // Récupérer les catégories et langages depuis la base de données
        try {
            Logger.info('Récupération des catégories de documentation', {
                userId: interaction.user.id
            });
            
            const [categories] = await db.query(
                'SELECT id, name, description, icon, sort_order FROM doc_categories WHERE is_active = 1 ORDER BY sort_order, name'
            );
            
            Logger.info(`${categories.length} catégories récupérées`, {
                userId: interaction.user.id,
                categoryCount: categories.length
            });
            
            if (categories.length === 0) {
                await interaction.editReply("Aucune catégorie disponible pour le moment. La table doc_categories semble vide.");
                return true;
            }
            
            // Récupérer tous les langages disponibles avec leur nombre de ressources
            Logger.info('Récupération des langages pour chaque catégorie', {
                userId: interaction.user.id
            });
            
            const [languages] = await db.query(
                'SELECT language, category_id, COUNT(*) as resource_count FROM doc_resources WHERE is_active = 1 GROUP BY language, category_id ORDER BY language'
            );
            
            Logger.info(`${languages.length} combinaisons langage/catégorie récupérées`, {
                userId: interaction.user.id,
                languageCount: languages.length
            });
            
            // Récupérer aussi le compte total des ressources par catégorie
            const [categoryStats] = await db.query(
                'SELECT category_id, COUNT(*) as total_resources FROM doc_resources WHERE is_active = 1 GROUP BY category_id'
            );
            
            const categoryResourceCounts = {};
            categoryStats.forEach(stat => {
                categoryResourceCounts[stat.category_id] = stat.total_resources;
            });
            
            // Organiser les langages par catégorie
            const categorizedLanguages = {};
            categories.forEach(cat => {
                categorizedLanguages[cat.id] = {
                    id: cat.id,
                    name: cat.name,
                    description: cat.description,
                    icon: cat.icon || '',
                    sort_order: cat.sort_order,
                    resource_count: categoryResourceCounts[cat.id] || 0,
                    languages: []
                };
            });
            
            languages.forEach(lang => {
                if (categorizedLanguages[lang.category_id]) {
                    categorizedLanguages[lang.category_id].languages.push({
                        name: lang.language,
                        count: lang.resource_count
                    });
                }
            });
            
            // Formater le résultat
            const formattedResults = [];
            
            // Trier les catégories par ordre
            const sortedCategories = Object.values(categorizedLanguages).sort((a, b) => a.sort_order - b.sort_order);
            
            sortedCategories.forEach(category => {
                const icon = category.icon || '';
                formattedResults.push(`${icon} **${category.name}** - ${category.description} (${category.resource_count} ressources)`);
                
                if (category.languages.length > 0) {
                    // Trier les langages par nombre de ressources décroissant
                    const sortedLanguages = category.languages.sort((a, b) => b.count - a.count);
                    
                    sortedLanguages.forEach(lang => {
                        formattedResults.push(`  • ${lang.name} (${lang.count} ressources)`);
                    });
                } else {
                    formattedResults.push("  • Aucun langage disponible");
                }
                formattedResults.push(""); // Ligne vide pour séparer les catégories
            });
            
            // Ajouter une information sur le nombre total de ressources
            let totalResources = 0;
            Object.values(categoryResourceCounts).forEach(count => {
                totalResources += count;
            });
            
            formattedResults.unshift(`📚 **Documentation disponible** - ${totalResources} ressources au total`);
            formattedResults.unshift("");
            
            // Ajouter des instructions d'utilisation
            formattedResults.push("**Comment utiliser cette commande:**");
            formattedResults.push("• `/docs langage:javascript` - Rechercher des ressources JavaScript");
            formattedResults.push("• `/docs langage:php recherche:framework` - Rechercher des frameworks PHP");
            formattedResults.push("• `/docs langage:sql public:true` - Afficher les résultats publiquement");
            formattedResults.push("• `/docs utilisateur:@user` - Envoyer les résultats à un autre utilisateur");
            
            // Utiliser le système de pagination pour afficher les résultats
            if (user && user.id !== interaction.user.id) {
                // Si un utilisateur spécifique est ciblé, envoyer les résultats à cet utilisateur
                try {
                    const dmMessage = await user.send("Préparation de la liste des langages disponibles...");
                    const fakeInteraction = {
                        editReply: async (options) => {
                            return await dmMessage.edit(options.content || options);
                        },
                        user: user,
                        channel: dmMessage.channel
                    };
                    
                    await paginateMessage(
                        fakeInteraction,
                        formattedResults,
                        {
                            headerText: "**Langages disponibles par catégorie** :",
                            itemsPerPage: 15,
                            ephemeral: false
                        }
                    );
                    
                    await interaction.editReply({ 
                        content: `La liste des langages disponibles a été envoyée en message privé à ${user.username}.`
                    });
                } catch (dmError) {
                    Logger.error('Impossible d\'envoyer un message privé:', {
                        error: dmError.message,
                        stack: dmError.stack,
                        userId: user.id
                    });
                    
                    await interaction.editReply({
                        content: `Impossible d'envoyer un message privé à ${user.username}. Ses paramètres de confidentialité bloquent peut-être les messages privés.`
                    });
                    
                    // Si l'envoi en DM a échoué, afficher dans le canal actuel
                    await paginateMessage(
                        interaction,
                        formattedResults,
                        {
                            headerText: "**Langages disponibles par catégorie** :",
                            itemsPerPage: 15,
                            ephemeral: !isPublic
                        }
                    );
                }
            } else {
                // Afficher dans le canal actuel
                await paginateMessage(
                    interaction,
                    formattedResults,
                    {
                        headerText: "**Documentation disponible par catégorie** :",
                        itemsPerPage: 15,
                        ephemeral: !isPublic
                    }
                );
            }
        } catch (dbError) {
            Logger.error('Erreur lors de la requête SQL pour les catégories:', {
                error: dbError.message,
                stack: dbError.stack,
                userId: interaction.user.id
            });
            
            await interaction.editReply({ 
                content: 'Une erreur est survenue lors de l\'accès aux tables de documentation. Message d\'erreur: ' + dbError.message
            });
            return false;
        }
        
        return true;
    } catch (error) {
        Logger.error('Erreur lors de l\'affichage des catégories:', {
            error: error.message,
            stack: error.stack,
            userId: interaction.user.id
        });
        
        await interaction.editReply({ 
            content: 'Une erreur est survenue lors de la récupération des langages disponibles. ' + error.message
        });
        return false;
    }
}

/**
 * Recherche dans la base de données et le cache
 * @param {string} language - Le langage à rechercher
 * @param {string} searchTerm - Le terme de recherche (optionnel)
 * @returns {Promise<Array>} - Les résultats de la recherche
 */
async function rechercherDocumentation(language, searchTerm) {
    const resultats = [];
    const cachePath = join(__dirname, '../../cache');
    
    try {
        Logger.info('Début de la recherche de documentation', {
            language,
            searchTerm,
            useCache: existsSync(cachePath)
        });
        
        // 1. Rechercher dans la base de données
        let query = '';
        let params = [];
        
        // Utiliser une correspondance plus précise
        if (language) {
            // Version améliorée avec une meilleure correspondance pour le langage
            query = `
                SELECT r.name, r.description, r.url, r.language, r.search_url, r.tutorial_url, c.name as category_name
                FROM doc_resources r
                LEFT JOIN doc_categories c ON r.category_id = c.id
                WHERE (r.language LIKE ? OR r.tags LIKE ? OR r.name LIKE ?) 
                AND r.is_active = 1
                LIMIT 50
            `;
            
            // Essayer d'abord une correspondance exacte, puis des correspondances partielles
            const langPattern = `%${language}%`;
            params = [language, langPattern, langPattern];
            
            if (searchTerm) {
                query = `
                    SELECT r.name, r.description, r.url, r.language, r.search_url, r.tutorial_url, c.name as category_name
                    FROM doc_resources r
                    LEFT JOIN doc_categories c ON r.category_id = c.id
                    WHERE (r.language LIKE ? OR r.tags LIKE ? OR r.name LIKE ?) 
                    AND (r.description LIKE ? OR r.name LIKE ? OR r.tags LIKE ?)
                    AND r.is_active = 1
                    LIMIT 50
                `;
                
                const searchPattern = `%${searchTerm}%`;
                params = [language, langPattern, langPattern, searchPattern, searchPattern, searchPattern];
            }
        } else {
            // Si aucun langage n'est spécifié, la fonction afficherToutesCategories sera utilisée
            return [];
        }
        
        // Exécuter la requête
        Logger.info('Exécution de la requête SQL pour la recherche de documentation', {
            sql: query,
            paramsCount: params.length
        });
        
        const [rows] = await db.query(query, params);
        
        Logger.info(`${rows ? rows.length : 0} résultats trouvés dans la base de données`, {
            language,
            resultCount: rows ? rows.length : 0
        });
        
        if (rows && rows.length > 0) {
            rows.forEach(row => {
                resultats.push({
                    name: row.name,
                    description: row.description,
                    url: row.url,
                    language: row.language,
                    search_url: row.search_url,
                    tutorial_url: row.tutorial_url,
                    category: row.category_name,
                    source: 'db'
                });
            });
        }
        
        // 2. Rechercher dans le cache si la base de données n'a pas donné assez de résultats
        // ou si aucun résultat n'a été trouvé
        if (resultats.length < 5 && existsSync(cachePath)) {
            Logger.info('Recherche dans le cache car pas assez de résultats en base de données', {
                cacheDir: cachePath,
                currentResultCount: resultats.length
            });
            
            // 2.1 D'abord chercher dans le dossier de cache docs (format 3 lignes)
            const docsCachePath = join(cachePath, 'docs');
            if (existsSync(docsCachePath)) {
                const cacheFiles = await fsPromises.readdir(docsCachePath);
                
                // Filtrer les fichiers pertinents
                const relevantFiles = cacheFiles.filter(file => {
                    const lowerFilename = file.toLowerCase();
                    return lowerFilename.includes(language.toLowerCase());
                });
                
                Logger.info(`${relevantFiles.length} fichiers de cache pertinents trouvés dans /docs`, {
                    language,
                    filesCount: relevantFiles.length
                });
                
                if (relevantFiles.length > 0) {
                    // Limiter à 30 fichiers pour éviter de surcharger
                    const filesToProcess = relevantFiles.slice(0, 30);
                    
                    // Lire les fichiers en parallèle
                    await Promise.all(filesToProcess.map(async (file) => {
                        try {
                            const filePath = join(docsCachePath, file);
                            const content = await fsPromises.readFile(filePath, 'utf8');
                            const lines = content.split('\n');
                            
                            // Extraire les informations du fichier
                            const name = file.replace('.txt', '');
                            const description = lines[0]?.replace('Description: ', '') || '';
                            const url = lines[1]?.replace('URL: ', '') || '';
                            const tags = lines[2]?.replace('Tags: ', '') || '';
                            
                            // Si un terme de recherche est spécifié, vérifier qu'il est présent
                            if (!searchTerm || 
                                description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                tags.toLowerCase().includes(searchTerm.toLowerCase())) {
                                
                                // Déterminer la catégorie à partir des tags ou du nom
                                let category = 'Autre';
                                if (tags.includes('frontend')) category = 'Frontend';
                                else if (tags.includes('backend')) category = 'Backend';
                                else if (tags.includes('database')) category = 'Database';
                                else if (tags.includes('devops')) category = 'DevOps';
                                else if (tags.includes('security')) category = 'Security';
                                else if (tags.includes('tool')) category = 'Tools';
                                
                                // S'assurer que description et URL sont propres
                                const cleanDescription = description.startsWith('Description:') 
                                    ? description.replace('Description:', '').trim() 
                                    : description;
                                    
                                const cleanUrl = url.startsWith('URL:') 
                                    ? url.replace('URL:', '').trim() 
                                    : url;
                                
                                resultats.push({
                                    name: name,
                                    description: cleanDescription,
                                    url: cleanUrl,
                                    language: language, // Utiliser le langage spécifié
                                    category: category,
                                    source: 'cache',
                                    file_path: filePath // Ajouter le chemin du fichier pour le débogage
                                });
                            }
                        } catch (error) {
                            Logger.error('Erreur lors de la lecture du fichier cache:', {
                                file,
                                error: error.message
                            });
                        }
                    }));
                }
            }
            
            // 2.2 Chercher dans les dossiers de catégories du cache
            const categoryFolders = ['Frontend', 'Backend', 'Database', 'DevOps', 'Tools', 'Security'];
            
            for (const category of categoryFolders) {
                const categoryPath = join(cachePath, category);
                
                if (existsSync(categoryPath)) {
                    try {
                        const categoryFiles = await fsPromises.readdir(categoryPath);
                        
                        // Filtrer les fichiers pertinents
                        const relevantFiles = categoryFiles.filter(file => {
                            if (!file.endsWith('.txt')) return false;
                            
                            const lowerFilename = file.toLowerCase();
                            const match = lowerFilename.includes(language.toLowerCase());
                            
                            // Log pour déboguer les fichiers filtrés
                            if (category === 'Backend') {
                                Logger.info(`Filtrage des fichiers Backend: ${file} - match: ${match}`, {
                                    file,
                                    language,
                                    match
                                });
                            }
                            
                            return match;
                        });
                        
                        Logger.info(`${relevantFiles.length} fichiers pertinents trouvés dans /${category}`, {
                            language,
                            category,
                            filesCount: relevantFiles.length
                        });
                        
                        if (relevantFiles.length > 0) {
                            // Limiter à 10 fichiers par catégorie
                            const filesToProcess = relevantFiles.slice(0, 10);
                            
                            // Lire les fichiers en parallèle
                            await Promise.all(filesToProcess.map(async (file) => {
                                try {
                                    const filePath = join(categoryPath, file);
                                    const content = await fsPromises.readFile(filePath, 'utf8');
                                    const lines = content.split('\n');
                                    
                                    // Format attendu: "Description: XXX" sur ligne 1, "URL: XXX" sur ligne 2
                                    const description = lines[0]?.trim() || '';
                                    const url = lines[1]?.trim() || '';
                                    
                                    if (description && url) {
                                        const name = file.replace('.txt', '');
                                        
                                        // Si un terme de recherche est spécifié, vérifier qu'il est présent
                                        if (!searchTerm || 
                                            description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                            name.toLowerCase().includes(searchTerm.toLowerCase())) {
                                            
                                            // Extraire proprement la description et l'URL en enlevant les préfixes
                                            const cleanDescription = description.startsWith('Description:') 
                                                ? description.replace('Description:', '').trim() 
                                                : description;
                                                
                                            const cleanUrl = url.startsWith('URL:') 
                                                ? url.replace('URL:', '').trim() 
                                                : url;
                                            
                                            resultats.push({
                                                name: name,
                                                description: cleanDescription,
                                                url: cleanUrl,
                                                language: language, // Utiliser le langage spécifié
                                                category: category,
                                                source: 'cache',
                                                file_path: filePath
                                            });
                                        }
                                    }
                                } catch (error) {
                                    Logger.error('Erreur lors de la lecture du fichier cache de catégorie:', {
                                        file,
                                        category,
                                        error: error.message
                                    });
                                }
                            }));
                        }
                    } catch (error) {
                        Logger.error('Erreur lors de la lecture du dossier de catégorie:', {
                            category,
                            error: error.message
                        });
                    }
                }
            }
            
            // 2.3 Chercher dans les fichiers directs du cache (format à 2 lignes)
            const cacheFiles = await fsPromises.readdir(cachePath);
            
            // Filtrer les fichiers pertinents
            const relevantFiles = cacheFiles.filter(file => {
                if (!file.endsWith('.txt')) return false;
                
                const lowerFilename = file.toLowerCase();
                return lowerFilename.includes(language.toLowerCase());
            });
            
            Logger.info(`${relevantFiles.length} fichiers pertinents trouvés directement dans /cache`, {
                language,
                filesCount: relevantFiles.length
            });
            
            if (relevantFiles.length > 0) {
                // Limiter à 30 fichiers pour éviter de surcharger
                const filesToProcess = relevantFiles.slice(0, 30);
                
                // Lire les fichiers en parallèle
                await Promise.all(filesToProcess.map(async (file) => {
                    try {
                        const filePath = join(cachePath, file);
                        const content = await fsPromises.readFile(filePath, 'utf8');
                        const lines = content.split('\n');
                        
                        // Format attendu: "Description: XXX" sur ligne 1, "URL: XXX" sur ligne 2
                        const description = lines[0]?.trim() || '';
                        const url = lines[1]?.trim() || '';
                        
                        if (description && url) {
                            // Extraire le nom et la catégorie du nom de fichier (format: Category_Name.txt)
                            const fileNameParts = file.replace('.txt', '').split('_');
                            const category = fileNameParts[0] || 'Autre';
                            const name = fileNameParts.slice(1).join('_') || file.replace('.txt', '');
                            
                            // Si un terme de recherche est spécifié, vérifier qu'il est présent
                            if (!searchTerm || 
                                description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                name.toLowerCase().includes(searchTerm.toLowerCase())) {
                                
                                // Extraire proprement la description et l'URL en enlevant les préfixes
                                const cleanDescription = description.startsWith('Description:') 
                                    ? description.replace('Description:', '').trim() 
                                    : description;
                                    
                                const cleanUrl = url.startsWith('URL:') 
                                    ? url.replace('URL:', '').trim() 
                                    : url;
                                
                                resultats.push({
                                    name: name,
                                    description: cleanDescription,
                                    url: cleanUrl,
                                    language: language, // Utiliser le langage spécifié dans la recherche
                                    category: category,
                                    source: 'cache',
                                    file_path: filePath // Ajouter le chemin du fichier pour le débogage
                                });
                            }
                        }
                    } catch (error) {
                        Logger.error('Erreur lors de la lecture du fichier cache:', {
                            file,
                            error: error.message
                        });
                    }
                }));
            }
        }
        
        // Supprimer les doublons basés sur l'URL
        const uniqueUrls = new Set();
        const uniqueResults = [];
        
        resultats.forEach(result => {
            if (!uniqueUrls.has(result.url)) {
                uniqueUrls.add(result.url);
                uniqueResults.push(result);
            }
        });
        
        Logger.info(`Recherche terminée, ${uniqueResults.length} résultats uniques trouvés`, {
            language,
            searchTerm,
            resultCount: uniqueResults.length
        });
        
        return uniqueResults;
    } catch (error) {
        Logger.error('Erreur lors de la recherche de documentation:', {
            error: error.message,
            stack: error.stack,
            language,
            searchTerm
        });
        return [];
    }
}

/**
 * Formater les résultats pour l'affichage
 * @param {Array} resultats - Les résultats de la recherche
 * @returns {Array} - Les résultats formatés
 */
function formaterResultats(resultats) {
    return resultats.map(r => {
        let result = `**${r.name}**`;
        
        if (r.category) {
            result += ` (${r.category}: ${r.language})`;
        } else {
            result += ` (${r.language})`;
        }
        
        result += `: ${r.description} [Lien](${r.url})`;
        
        // Ajouter les liens de recherche et tutoriels si disponibles
        const additionalLinks = [];
        if (r.search_url) {
            additionalLinks.push(`[Recherche](${r.search_url})`);
        }
        if (r.tutorial_url) {
            additionalLinks.push(`[Tutoriel](${r.tutorial_url})`);
        }
        
        if (additionalLinks.length > 0) {
            result += ` - ${additionalLinks.join(' | ')}`;
        }
        
        return result;
    });
}

export default {
    data: new SlashCommandBuilder()
        .setName('docs')
        .setDescription('Recherche de documentation technique.')
        .addStringOption(option =>
            option.setName('language')
                .setDescription('Le langage ou la technologie à rechercher (ex: php, javascript, etc).')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('recherche')
                .setDescription('Terme de recherche.')
                .setRequired(false))
        .addUserOption(option =>
            option.setName('utilisateur')
                .setDescription('Utilisateur à qui envoyer les résultats (optionnel).')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('public')
                .setDescription('Afficher les résultats dans le salon (par défaut: non).')
                .setRequired(false)),
    
    // Méthode principale d'exécution
    async execute(interaction) {
        try {
            Logger.info('Exécution de la commande /docs', {
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            // L'interaction est déjà différée par le gestionnaire de commandes dans interactionCreate.js
            // On n'a donc pas besoin de faire un deferReply() ici
            
            // Extraire les options
            const language = interaction.options.getString('language');
            const searchTerm = interaction.options.getString('recherche');
            const user = interaction.options.getUser('utilisateur');
            const isPublic = interaction.options.getBoolean('public') || false;
            
            Logger.info('Paramètres de recherche documentation', {
                language,
                searchTerm,
                targetUser: user?.id,
                isPublic,
                userId: interaction.user.id,
                options: JSON.stringify(interaction.options._hoistedOptions)
            });
            
            // Si aucun langage n'est spécifié, afficher toutes les catégories
            if (!language) {
                return await afficherToutesCategories(interaction, isPublic, user);
            }
            
            // Rechercher la documentation
            const resultats = await rechercherDocumentation(language, searchTerm);
            
            if (resultats.length === 0) {
                await interaction.editReply({
                    content: `Aucun résultat trouvé pour "${language}"${searchTerm ? ` avec le terme "${searchTerm}"` : ''}.

Essayez avec un autre langage ou vérifiez l'orthographe. Vous pouvez voir la liste des langages disponibles avec /docs sans paramètre.`
                });
                return true;
            }
            
            // Formater les résultats
            const formattedResults = formaterResultats(resultats);
            
            // Debug pour comprendre le problème de pagination
            Logger.info('Résultats formatés pour pagination', {
                resultsCount: formattedResults.length,
                firstResult: formattedResults[0] ? formattedResults[0].substring(0, 50) + '...' : 'Aucun',
                userId: interaction.user.id
            });
            
            const headerText = `**Résultats de documentation pour "${language}"**${searchTerm ? ` avec le terme "${searchTerm}"` : ''}`;
            
            // Afficher les résultats
            if (user && user.id !== interaction.user.id) {
                try {
                    const dmMessage = await user.send("Préparation des résultats de documentation...");
                    const fakeInteraction = {
                        editReply: async (options) => {
                            return await dmMessage.edit(options.content || options);
                        },
                        user: user,
                        channel: dmMessage.channel,
                        deferred: true,
                        replied: true
                    };
                    
                    await paginateMessage(
                        fakeInteraction,
                        formattedResults,
                        {
                            headerText: headerText,
                            itemsPerPage: 5,
                            ephemeral: false
                        }
                    );
                    
                    await interaction.editReply({ 
                        content: `Les résultats de documentation ont été envoyés en message privé à ${user.username}.`
                    });
                } catch (dmError) {
                    Logger.error('Impossible d\'envoyer un message privé:', {
                        error: dmError.message,
                        stack: dmError.stack,
                        userId: user.id
                    });
                    
                    await interaction.editReply({
                        content: `Impossible d'envoyer un message privé à ${user.username}. Ses paramètres de confidentialité bloquent peut-être les messages privés. Affichage des résultats ici...`
                    });
                    
                    // Si l'envoi en DM a échoué, afficher dans le canal actuel
                    try {
                        await paginateMessage(
                            interaction,
                            formattedResults,
                            {
                                headerText: headerText,
                                itemsPerPage: 5,
                                ephemeral: !isPublic
                            }
                        );
                    } catch (paginationError) {
                        Logger.error('Erreur lors de la pagination après échec DM:', {
                            error: paginationError.message,
                            stack: paginationError.stack,
                            userId: interaction.user.id
                        });
                        
                        // Afficher un message simple sans pagination si tout échoue
                        await interaction.editReply({
                            content: `**${headerText}**\n\nVoici les premiers résultats (sans pagination):\n\n${formattedResults.slice(0, 5).join('\n\n')}\n\n(${formattedResults.length} résultats au total)`
                        });
                    }
                }
            } else {
                // Afficher dans le canal actuel
                try {
                    Logger.info('Tentative d\'affichage avec pagination', {
                        userId: interaction.user.id,
                        resultCount: formattedResults.length,
                        itemsPerPage: 5
                    });
                    
                    await paginateMessage(
                        interaction,
                        formattedResults,
                        {
                            headerText: headerText,
                            itemsPerPage: 5,
                            ephemeral: !isPublic
                        }
                    );
                    
                    Logger.info('Pagination réussie', {
                        userId: interaction.user.id
                    });
                } catch (paginationError) {
                    Logger.error('Erreur lors de la pagination standard:', {
                        error: paginationError.message,
                        stack: paginationError.stack,
                        userId: interaction.user.id
                    });
                    
                    // Afficher un message simple sans pagination si tout échoue
                    await interaction.editReply({
                        content: `**${headerText}**\n\nVoici les premiers résultats (sans pagination):\n\n${formattedResults.slice(0, 5).join('\n\n')}\n\n(${formattedResults.length} résultats au total)`
                    });
                }
            }
            
            return true;
        } catch (error) {
            Logger.error('Erreur lors de l\'exécution de la commande docs:', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id
            });
            
            // Vérifier si l'interaction est déjà répondue pour éviter des erreurs
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: 'Une erreur est survenue lors de la recherche de documentation.',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: 'Une erreur est survenue lors de la recherche de documentation.'
                });
            }
            
            return false;
        }
    },
    
    // Alias pour assurer la compatibilité
    async run(interaction) {
        return await this.execute(interaction);
    }
}; 