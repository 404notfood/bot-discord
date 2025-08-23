/**
 * Script pour générer des fichiers de cache à partir des ressources dans la base de données
 * Exécuter avec: node scripts/cache_generator.js
 */

import * as db from '../src/utils/db.js';
import * as Logger from '../src/utils/logger.js';
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Constantes
const CACHE_DIR = path.join(process.cwd(), 'src', 'cache');
const DOCS_PATH = path.join(CACHE_DIR, 'docs');
const CATEGORY_FOLDERS = {
    1: 'Frontend',
    2: 'Backend',
    3: 'Database',
    4: 'DevOps',
    5: 'Tools',
    6: 'Security'
};

/**
 * Fonction principale pour générer les fichiers de cache
 */
async function generateCache() {
    try {
        console.log("Démarrage de la génération des fichiers cache...");

        // Vérifier que le dossier cache existe
        if (!fs.existsSync(CACHE_DIR)) {
            await fsPromises.mkdir(CACHE_DIR, { recursive: true });
            console.log(`Dossier cache créé: ${CACHE_DIR}`);
        }

        // Créer le dossier docs s'il n'existe pas
        if (!fs.existsSync(DOCS_PATH)) {
            await fsPromises.mkdir(DOCS_PATH, { recursive: true });
            console.log(`Dossier docs créé: ${DOCS_PATH}`);
        }

        // S'assurer que tous les dossiers de catégorie existent
        for (const folder of Object.values(CATEGORY_FOLDERS)) {
            const folderPath = path.join(CACHE_DIR, folder);
            if (!fs.existsSync(folderPath)) {
                await fsPromises.mkdir(folderPath, { recursive: true });
                console.log(`Dossier créé: ${folder}`);
            }
        }

        // Récupérer toutes les ressources de la base de données
        const [resources] = await db.query(`
            SELECT r.id, r.name, r.description, r.url, r.language, r.category_id, 
                   r.tags, c.name as category_name
            FROM doc_resources r
            LEFT JOIN doc_categories c ON r.category_id = c.id
            WHERE r.is_active = 1
        `);

        console.log(`${resources.length} ressources trouvées dans la base de données.`);

        // Pour chaque ressource, créer un fichier de cache
        let createdCount = 0;
        let errorCount = 0;

        for (const resource of resources) {
            try {
                const categoryId = resource.category_id;
                const categoryFolder = CATEGORY_FOLDERS[categoryId] || 'Divers';
                const categoryPath = path.join(CACHE_DIR, categoryFolder);
                
                // S'assurer que le dossier existe
                if (!fs.existsSync(categoryPath)) {
                    await fsPromises.mkdir(categoryPath, { recursive: true });
                }
                
                // Normaliser le nom du fichier (remplacer les espaces, caractères spéciaux, etc.)
                const fileName = resource.name
                    .replace(/[^\w\s-]/g, '') // Supprimer les caractères spéciaux
                    .replace(/\s+/g, '_')     // Remplacer les espaces par des underscores
                    .toLowerCase() + '.txt';
                
                const filePath = path.join(categoryPath, fileName);
                
                // Construire le contenu du fichier
                const content = `${resource.description}\n${resource.url}`;
                
                // Écrire le fichier
                await fsPromises.writeFile(filePath, content, 'utf8');
                
                console.log(`Fichier créé: ${categoryFolder}/${fileName}`);
                createdCount++;
            } catch (error) {
                console.error(`Erreur lors de la création du fichier pour ${resource.name}:`, error);
                errorCount++;
            }
        }

        // Créer également des entrées dans le dossier docs avec un format plus détaillé
        // Pour chaque ressource, créer un fichier dans docs/
        for (const resource of resources) {
            try {
                // Normaliser le nom du fichier
                const fileName = resource.language.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') 
                    + '_' + resource.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') 
                    + '.txt';
                
                const filePath = path.join(DOCS_PATH, fileName);
                
                // Construire le contenu du fichier au format détaillé
                const content = `Description: ${resource.description}\nURL: ${resource.url}\nTags: ${resource.tags || resource.language.toLowerCase()}`;
                
                // Écrire le fichier
                await fsPromises.writeFile(filePath, content, 'utf8');
                
                console.log(`Fichier détaillé créé: docs/${fileName}`);
                createdCount++;
            } catch (error) {
                console.error(`Erreur lors de la création du fichier détaillé pour ${resource.name}:`, error);
                errorCount++;
            }
        }

        console.log(`\nGénération des fichiers cache terminée:
- ${createdCount} fichiers créés
- ${errorCount} erreurs`);

    } catch (error) {
        console.error("Erreur lors de la génération des fichiers cache:", error);
    } finally {
        // Fermer la connexion à la base de données
        db.end();
    }
}

// Exécuter la fonction principale
generateCache(); 