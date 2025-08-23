/**
 * Script pour corriger les erreurs dans les fichiers de commandes
 */

import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as Logger from './utils/logger.js';

// Obtenir le répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Liste des dossiers à vérifier
const commandDirs = [
    join(__dirname, 'commands', 'studi'),
    join(__dirname, 'commands', 'general'),
    join(__dirname, 'commands', 'admin'),
    join(__dirname, 'commands', 'utility')
];

// Fonction pour corriger un fichier
async function fixCommandFile(filePath) {
    try {
        // Lire le contenu du fichier
        let content = await fs.readFile(filePath, 'utf8');
        let originalContent = content;
        let fileFixed = false;
        
        // 1. Corriger les virgules à la fin des méthodes execute dans les fichiers export default
        if (content.includes('export default {')) {
            // Enlever les virgules après la méthode execute
            content = content.replace(/},(\s*)\};/g, '}\n$1};');
            
            if (content !== originalContent) {
                Logger.info(`Virgule corrigée après execute dans ${filePath}`);
                fileFixed = true;
            }
        }
        
        // 2. Corriger les constructeurs des classes StudiCommand
        if (content.includes('class') && content.includes('extends StudiCommand') && content.includes('super(commandData,')) {
            // Remplacer la ligne super incorrecte par une version correcte
            content = content.replace(
                /super\(commandData,\s*\{\s*guildOnly:\s*true\s*\}\);/g,
                `super({
      name: commandData.name,
      description: commandData.description,
      options: commandData.options,
      defaultMemberPermissions: commandData.default_member_permissions,
      guildOnly: true,
      category: 'studi'
    });`
            );
            
            if (content !== originalContent) {
                Logger.info(`Constructeur corrigé dans ${filePath}`);
                fileFixed = true;
            }
        }
        
        // Si des modifications ont été apportées, écrire le nouveau contenu
        if (fileFixed) {
            await fs.writeFile(filePath, content, 'utf8');
            return true;
        }
        
        return false;
    } catch (error) {
        Logger.error(`Erreur lors de la correction du fichier ${filePath}:`, {
            error: error.message,
            stack: error.stack
        });
        return false;
    }
}

// Fonction principale
async function main() {
    Logger.info('Démarrage de la correction des commandes...');
    
    let totalFixed = 0;
    
    for (const dir of commandDirs) {
        try {
            // Vérifier si le répertoire existe
            try {
                await fs.access(dir);
            } catch (accessError) {
                Logger.info(`Le répertoire ${dir} n'existe pas, on passe au suivant.`);
                continue;
            }
            
            // Lister les fichiers du répertoire
            const files = await fs.readdir(dir);
            
            // Filtrer pour ne garder que les fichiers JavaScript
            const jsFiles = files.filter(file => file.endsWith('.js'));
            
            Logger.info(`Traitement de ${jsFiles.length} fichiers dans ${dir}`);
            
            // Traiter chaque fichier
            for (const file of jsFiles) {
                const filePath = join(dir, file);
                const fixed = await fixCommandFile(filePath);
                
                if (fixed) {
                    totalFixed++;
                }
            }
        } catch (error) {
            Logger.error(`Erreur lors du traitement du répertoire ${dir}:`, {
                error: error.message,
                stack: error.stack
            });
        }
    }
    
    Logger.info(`Correction terminée. ${totalFixed} fichiers ont été corrigés.`);
}

// Exécuter le script
main().catch(error => {
    Logger.error('Erreur dans le script principal:', {
        error: error.message,
        stack: error.stack
    });
}); 