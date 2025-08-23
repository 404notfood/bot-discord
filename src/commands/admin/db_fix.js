/**
 * @fileoverview Commande pour réparer les tables de documentation
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration pour ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    data: new SlashCommandBuilder()
        .setName('db_fix')
        .setDescription('Diagnostique et répare les tables de documentation.')
        .addBooleanOption(option =>
            option.setName('repair')
                .setDescription('Réparer les problèmes détectés')
                .setRequired(false)),
    
    async execute(interaction) {
        try {
            // Vérifier si l'utilisateur est un admin du bot
            const isAdmin = await checkIfAdmin(interaction.user.id);
            
            if (!isAdmin) {
                await interaction.reply({
                    content: 'Vous devez être administrateur du bot pour utiliser cette commande.',
                    ephemeral: true
                });
                return;
            }
            
            await interaction.deferReply({ ephemeral: true });
            
            // Vérifier si l'option de réparation est activée
            const shouldRepair = interaction.options.getBoolean('repair') || false;
            
            // Vérifier la connexion à la base de données
            if (!db.isDatabaseEnabled()) {
                await interaction.editReply('❌ La base de données n\'est pas disponible. Impossible de continuer.');
                return;
            }
            
            // Créer un embed pour afficher les résultats
            const embed = new EmbedBuilder()
                .setTitle(shouldRepair ? 'Réparation des tables de documentation' : 'Diagnostic des tables de documentation')
                .setColor('#3498db')
                .setTimestamp();
            
            // 1. Vérifier l'existence des tables
            const [tables] = await db.query(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = ? AND table_name IN ('doc_categories', 'doc_resources')",
                [process.env.DB_NAME]
            );
            
            const existingTables = tables.map(t => t.TABLE_NAME || t.table_name);
            
            if (existingTables.length < 2) {
                embed.setDescription('❌ Certaines tables de documentation sont manquantes.');
                embed.addFields({ 
                    name: 'Tables trouvées', 
                    value: existingTables.join(', ') || 'Aucune' 
                });
                
                if (shouldRepair) {
                    // Créer les tables manquantes
                    await createMissingTables(existingTables);
                    embed.addFields({ 
                        name: '🔧 Réparation', 
                        value: 'Tentative de création des tables manquantes.' 
                    });
                }
            } else {
                embed.setDescription('✅ Les tables de documentation existent.');
                
                // 2. Vérifier le contenu des tables
                const [categoryCount] = await db.query('SELECT COUNT(*) as count FROM doc_categories');
                const [resourceCount] = await db.query('SELECT COUNT(*) as count FROM doc_resources');
                
                const catCount = categoryCount[0].count;
                const resCount = resourceCount[0].count;
                
                embed.addFields({ 
                    name: 'Contenu des tables', 
                    value: `doc_categories: ${catCount} enregistrements\ndoc_resources: ${resCount} enregistrements` 
                });
                
                if (catCount === 0 || resCount === 0) {
                    embed.addFields({ 
                        name: '⚠️ Problème détecté', 
                        value: 'Une ou plusieurs tables sont vides.' 
                    });
                    
                    if (shouldRepair) {
                        // Insérer des données d'exemple
                        const repairResult = await insertSampleData(catCount === 0, resCount === 0);
                        
                        embed.addFields({ 
                            name: '🔧 Réparation', 
                            value: repairResult
                        });
                    }
                }
                
                // 3. Vérifier les colonnes is_active
                const [docCategoriesStructure] = await db.query("SHOW COLUMNS FROM doc_categories LIKE 'is_active'");
                const [docResourcesStructure] = await db.query("SHOW COLUMNS FROM doc_resources LIKE 'is_active'");
                
                const catHasIsActive = docCategoriesStructure.length > 0;
                const resHasIsActive = docResourcesStructure.length > 0;
                
                if (!catHasIsActive || !resHasIsActive) {
                    embed.addFields({ 
                        name: '⚠️ Structure incorrecte', 
                        value: `Colonnes manquantes: ${!catHasIsActive ? 'is_active dans doc_categories' : ''} ${!resHasIsActive ? 'is_active dans doc_resources' : ''}`.trim()
                    });
                    
                    if (shouldRepair) {
                        const structureResult = await fixTableStructure(!catHasIsActive, !resHasIsActive);
                        
                        embed.addFields({ 
                            name: '🔧 Réparation de la structure', 
                            value: structureResult
                        });
                    }
                }
                
                // 4. Afficher un exemple des données
                if (catCount > 0 && resCount > 0) {
                    const [categories] = await db.query('SELECT id, name, description FROM doc_categories LIMIT 3');
                    const [resources] = await db.query('SELECT id, name, language, category_id FROM doc_resources LIMIT 3');
                    
                    let categoriesText = '';
                    categories.forEach(cat => {
                        categoriesText += `ID: ${cat.id}, Nom: ${cat.name}, Description: ${cat.description}\n`;
                    });
                    
                    let resourcesText = '';
                    resources.forEach(res => {
                        resourcesText += `ID: ${res.id}, Nom: ${res.name}, Langage: ${res.language}, Catégorie: ${res.category_id}\n`;
                    });
                    
                    embed.addFields(
                        { name: 'Exemple de catégories', value: categoriesText || 'Aucune donnée' },
                        { name: 'Exemple de ressources', value: resourcesText || 'Aucune donnée' }
                    );
                }
            }
            
            await interaction.editReply({ embeds: [embed] });
            
        } catch (error) {
            Logger.error('Erreur lors de l\'exécution de la commande db_fix:', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id
            });
            
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: `Une erreur est survenue: ${error.message}`,
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: `Une erreur est survenue: ${error.message}`
                });
            }
        }
    },
    
    // Alias pour assurer la compatibilité
    async run(interaction) {
        return await this.execute(interaction);
    }
};

/**
 * Vérifie si l'utilisateur est un administrateur du bot
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<boolean>} - True si l'utilisateur est admin
 */
async function checkIfAdmin(userId) {
    try {
        // Vérifier dans la base de données
        if (db.isDatabaseEnabled()) {
            const admin = await db.getOne('SELECT * FROM bot_admins WHERE user_id = ?', [userId]);
            if (admin) {
                return true;
            }
        }
        
        // Vérifier dans la configuration d'environnement (fallback)
        const adminIds = process.env.BOT_ADMIN_IDS ? process.env.BOT_ADMIN_IDS.split(',') : [];
        return adminIds.includes(userId);
    } catch (error) {
        Logger.error('Erreur lors de la vérification des droits d\'admin:', {
            error: error.message,
            userId
        });
        
        // En cas d'erreur, on autorise les admins de secours
        const fallbackAdminIds = process.env.FALLBACK_ADMIN_IDS ? process.env.FALLBACK_ADMIN_IDS.split(',') : [];
        return fallbackAdminIds.includes(userId);
    }
}

/**
 * Crée les tables manquantes
 * @param {Array} existingTables - Tables existantes
 * @returns {Promise<string>} - Résultat de l'opération
 */
async function createMissingTables(existingTables) {
    try {
        let result = '';
        
        // Créer doc_categories si nécessaire
        if (!existingTables.includes('doc_categories')) {
            await db.query(`
                CREATE TABLE doc_categories (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    description TEXT,
                    icon VARCHAR(50),
                    sort_order INT DEFAULT 0,
                    is_active TINYINT(1) DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
                )
            `);
            result += 'Table doc_categories créée. ';
        }
        
        // Créer doc_resources si nécessaire
        if (!existingTables.includes('doc_resources')) {
            await db.query(`
                CREATE TABLE doc_resources (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(200) NOT NULL,
                    description TEXT,
                    url TEXT NOT NULL,
                    language VARCHAR(100) NOT NULL,
                    category_id INT,
                    tags TEXT,
                    search_url TEXT,
                    tutorial_url TEXT,
                    popularity INT DEFAULT 0,
                    is_active TINYINT(1) DEFAULT 1,
                    added_by VARCHAR(50),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES doc_categories(id) ON DELETE SET NULL
                )
            `);
            result += 'Table doc_resources créée. ';
        }
        
        return result || 'Aucune table n\'a été créée.';
    } catch (error) {
        Logger.error('Erreur lors de la création des tables:', {
            error: error.message,
            stack: error.stack
        });
        
        return `Erreur lors de la création des tables: ${error.message}`;
    }
}

/**
 * Insère des données d'exemple dans les tables
 * @param {boolean} fillCategories - Remplir la table des catégories
 * @param {boolean} fillResources - Remplir la table des ressources
 * @returns {Promise<string>} - Résultat de l'opération
 */
async function insertSampleData(fillCategories, fillResources) {
    try {
        let result = '';
        
        // Insérer des catégories d'exemple
        if (fillCategories) {
            await db.query(`
                INSERT INTO doc_categories (name, description, icon, sort_order, is_active) VALUES
                (?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?),
                (?, ?, ?, ?, ?)
            `, [
                'Frontend', 'Technologies pour le développement frontend', '🌐', 1, 1,
                'Backend', 'Technologies pour le développement backend', '🖥️', 2, 1,
                'Database', 'Systèmes de gestion de bases de données', '💾', 3, 1,
                'DevOps', 'Outils et technologies DevOps', '🔧', 4, 1,
                'Mobile', 'Développement d\'applications mobiles', '📱', 5, 1,
                'Tools', 'Outils de développement', '🛠️', 6, 1
            ]);
            
            result += '6 catégories insérées. ';
        }
        
        // Insérer des ressources d'exemple si nécessaire et si les catégories existent
        if (fillResources) {
            // Vérifier que les catégories existent pour les clés étrangères
            const [categories] = await db.query('SELECT id FROM doc_categories');
            
            if (categories.length > 0) {
                // Catégorie Frontend (presumed id: 1)
                const frontendId = categories[0].id;
                // Catégorie Backend (presumed id: 2)
                const backendId = categories.length > 1 ? categories[1].id : frontendId;
                // Catégorie Database (presumed id: 3)
                const databaseId = categories.length > 2 ? categories[2].id : frontendId;
                
                await db.query(`
                    INSERT INTO doc_resources (name, description, url, language, category_id, tags, search_url, tutorial_url, is_active) VALUES
                    (?, ?, ?, ?, ?, ?, ?, ?, ?),
                    (?, ?, ?, ?, ?, ?, ?, ?, ?),
                    (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    'JavaScript', 'JavaScript - Langage de programmation pour le web', 'https://developer.mozilla.org/fr/docs/Web/JavaScript', 'Javascript', frontendId, 'javascript,langage,programmation', 'https://developer.mozilla.org/fr/search?q=', 'https://www.youtube.com/results?search_query=javascript+tutorial+français', 1,
                    'PHP', 'PHP - Langage de programmation pour le développement web', 'https://www.php.net/manual/fr/', 'php', backendId, 'langage,programmation,développement', 'https://www.php.net/manual/fr/function.', 'https://www.youtube.com/results?search_query=php+tutorial+français', 1,
                    'MySQL', 'MySQL - Système de gestion de base de données relationnelle', 'https://dev.mysql.com/doc/', 'Mysql', databaseId, 'mysql,système,gestion,base,données,relationnelle', 'https://dev.mysql.com/doc/search.html?q=', 'https://www.youtube.com/results?search_query=mysql+tutorial+français', 1
                ]);
                
                result += '3 ressources insérées.';
            } else {
                result += 'Impossible d\'insérer des ressources: aucune catégorie disponible.';
            }
        }
        
        return result || 'Aucune donnée n\'a été insérée.';
    } catch (error) {
        Logger.error('Erreur lors de l\'insertion des données d\'exemple:', {
            error: error.message,
            stack: error.stack
        });
        
        return `Erreur lors de l'insertion des données: ${error.message}`;
    }
}

/**
 * Corrige la structure des tables
 * @param {boolean} fixCategories - Corriger la table des catégories
 * @param {boolean} fixResources - Corriger la table des ressources
 * @returns {Promise<string>} - Résultat de l'opération
 */
async function fixTableStructure(fixCategories, fixResources) {
    try {
        let result = '';
        
        if (fixCategories) {
            await db.query('ALTER TABLE doc_categories ADD COLUMN is_active TINYINT(1) DEFAULT 1');
            result += 'Colonne is_active ajoutée à doc_categories. ';
        }
        
        if (fixResources) {
            await db.query('ALTER TABLE doc_resources ADD COLUMN is_active TINYINT(1) DEFAULT 1');
            result += 'Colonne is_active ajoutée à doc_resources. ';
        }
        
        return result || 'Aucune modification de structure n\'a été effectuée.';
    } catch (error) {
        Logger.error('Erreur lors de la correction de la structure des tables:', {
            error: error.message,
            stack: error.stack
        });
        
        return `Erreur lors de la correction de la structure: ${error.message}`;
    }
} 