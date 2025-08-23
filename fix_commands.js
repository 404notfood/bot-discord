import { promises as fs } from 'fs';
import { join } from 'path';

/**
 * Corrige la syntaxe des fichiers de commandes
 * @param {string} filePath Chemin du fichier à corriger
 */
async function fixCommandFile(filePath) {
    try {
        // Lire le contenu du fichier
        const content = await fs.readFile(filePath, 'utf8');
        
        // Regex pour trouver les déclarations d'options sur une seule ligne
        const regex = /(\.addStringOption|\.addIntegerOption|\.addBooleanOption|\.addUserOption|\.addChannelOption|\.addRoleOption|\.addMentionableOption|\.addNumberOption|\.addAttachmentOption)\(([^)]+)=>\s*([^.]+)\.setName\(([^)]+)\)(\.setDescription\([^)]+\))(\.setRequired\([^)]+\))([^,)]*)\),?/g;
        
        // Remplacer par une version formatée sur plusieurs lignes
        const fixedContent = content.replace(regex, (match, optionType, optionVar, objName, nameArg, descPart, reqPart, extraParts) => {
            // Construire la chaîne de remplacement correctement formatée
            return `${optionType}(${optionVar}=> 
            ${objName}.setName(${nameArg})
            ${descPart}
            ${reqPart}${extraParts}),`;
        });
        
        // Écrire le contenu corrigé
        if (content !== fixedContent) {
            await fs.writeFile(filePath, fixedContent, 'utf8');
            console.log(`Fichier corrigé: ${filePath}`);
            return true;
        } else {
            console.log(`Aucune modification nécessaire pour: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${filePath}:`, error);
        return false;
    }
}

/**
 * Parcourt récursivement un dossier pour trouver les fichiers de commandes
 * @param {string} dir Dossier à parcourir
 */
async function processDirectory(dir) {
    try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = join(dir, entry.name);
            
            if (entry.isDirectory()) {
                // Parcourir les sous-dossiers
                await processDirectory(fullPath);
            } else if (entry.name.endsWith('.js')) {
                // Traiter les fichiers JavaScript
                await fixCommandFile(fullPath);
            }
        }
    } catch (error) {
        console.error(`Erreur lors du parcours du dossier ${dir}:`, error);
    }
}

// Point d'entrée principal
async function main() {
    try {
        const commandsDirs = [
            'src/commands/studi',
            'src/commands/projects',
            'src/commands/admin'
        ];
        
        for (const dir of commandsDirs) {
            console.log(`Traitement du dossier: ${dir}`);
            await processDirectory(dir);
        }
        
        console.log('Traitement terminé.');
    } catch (error) {
        console.error('Erreur:', error);
    }
}

// Exécuter le script
main(); 