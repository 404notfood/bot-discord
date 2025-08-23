/**
 * Script pour organiser les fichiers de cache dans leurs dossiers de catégorie respectifs
 * Exécuter avec: node scripts/organize_cache.js
 */

import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

// Constantes
const CACHE_DIR = path.join(process.cwd(), 'src', 'cache');
const CATEGORY_FOLDERS = ['Frontend', 'Backend', 'Database', 'DevOps', 'Tools', 'Security'];

/**
 * Fonction principale pour organiser les fichiers
 */
async function organizeCache() {
    try {
        console.log("Démarrage de la réorganisation des fichiers cache...");

        // Vérifier que le dossier cache existe
        if (!fs.existsSync(CACHE_DIR)) {
            console.error(`Le dossier ${CACHE_DIR} n'existe pas.`);
            return;
        }

        // S'assurer que tous les dossiers de catégorie existent
        for (const folder of CATEGORY_FOLDERS) {
            const folderPath = path.join(CACHE_DIR, folder);
            if (!fs.existsSync(folderPath)) {
                await fsPromises.mkdir(folderPath, { recursive: true });
                console.log(`Dossier créé: ${folder}`);
            }
        }

        // Lire tous les fichiers du répertoire cache
        const files = await fsPromises.readdir(CACHE_DIR);

        // Filtrer pour ne garder que les fichiers .txt
        const txtFiles = files.filter(file => 
            file.endsWith('.txt') && 
            fs.statSync(path.join(CACHE_DIR, file)).isFile()
        );

        console.log(`${txtFiles.length} fichiers trouvés à réorganiser.`);

        // Pour chaque fichier, déterminer sa catégorie et le déplacer
        let movedCount = 0;
        let errorCount = 0;

        for (const file of txtFiles) {
            try {
                // Extraire la catégorie et le nom à partir du nom du fichier (format: Category_Name.txt)
                const fileNameParts = file.replace('.txt', '').split('_');
                const category = fileNameParts[0];
                
                // Vérifier si c'est une catégorie valide
                if (CATEGORY_FOLDERS.includes(category)) {
                    const targetFileName = fileNameParts.slice(1).join('_') + '.txt';
                    const sourcePath = path.join(CACHE_DIR, file);
                    const targetPath = path.join(CACHE_DIR, category, targetFileName);
                    
                    // Lire le contenu du fichier original
                    const content = await fsPromises.readFile(sourcePath, 'utf8');
                    
                    // Créer le nouveau fichier dans le dossier de catégorie
                    await fsPromises.writeFile(targetPath, content, 'utf8');
                    
                    // Supprimer le fichier original
                    await fsPromises.unlink(sourcePath);
                    
                    console.log(`Déplacé: ${file} -> ${category}/${targetFileName}`);
                    movedCount++;
                } else {
                    console.log(`Ignoré: ${file} (catégorie ${category} non reconnue)`);
                }
            } catch (error) {
                console.error(`Erreur lors du traitement du fichier ${file}:`, error);
                errorCount++;
            }
        }

        console.log(`\nRéorganisation terminée:
- ${movedCount} fichiers déplacés
- ${errorCount} erreurs
- ${txtFiles.length - movedCount - errorCount} fichiers ignorés`);

    } catch (error) {
        console.error("Erreur lors de la réorganisation des fichiers:", error);
    }
}

// Exécuter la fonction principale
organizeCache(); 