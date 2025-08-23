/**
 * Script pour ajouter la méthode run() comme alias de execute() aux commandes qui n'en ont pas
 * À exécuter avec: node add_run/add_run_method.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir l'équivalent de __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fonction principale pour traiter toutes les commandes
 */
async function processCommands() {
  try {
    const basePath = path.join(path.resolve(__dirname, '..'), 'src', 'commands');
    const categories = await fs.promises.readdir(basePath);
    let modified = 0;
    
    console.log("Recherche des commandes sans méthode run()...");
    console.log(`Dossier de base: ${basePath}`);
    
    for (const category of categories) {
      const categoryPath = path.join(basePath, category);
      
      // Vérifier que c'est un dossier
      const stats = await fs.promises.stat(categoryPath);
      if (!stats.isDirectory()) continue;
      
      console.log(`Analyse du dossier: ${category}`);
      const files = await fs.promises.readdir(categoryPath);
      
      for (const file of files) {
        if (!file.endsWith('.js')) continue;
        
        const filePath = path.join(categoryPath, file);
        let content = await fs.promises.readFile(filePath, 'utf8');
        
        // Vérifier si le fichier a la méthode execute mais pas run
        if (content.includes('async execute(interaction)') && !content.includes('async run(interaction)')) {
          console.log(`Ajout de la méthode run() à ${category}/${file}`);
          
          // Trouver où insérer la méthode run()
          const lines = content.split('\n');
          let startExecuteIndex = -1;
          let endExecuteIndex = -1;
          let braceCount = 0;
          let inExecuteMethod = false;
          
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('async execute(interaction)')) {
              startExecuteIndex = i;
              inExecuteMethod = true;
              braceCount = 0;
              // Compter l'accolade ouvrante dans la ligne avec execute
              if (line.includes('{')) braceCount++;
              continue;
            }
            
            if (inExecuteMethod) {
              // Compter les accolades
              const openBraces = (line.match(/{/g) || []).length;
              const closeBraces = (line.match(/}/g) || []).length;
              braceCount += openBraces - closeBraces;
              
              // Quand braceCount = 0, on a trouvé la fin de la méthode execute
              if (braceCount === 0) {
                endExecuteIndex = i;
                break;
              }
            }
          }
          
          if (endExecuteIndex !== -1) {
            // Préparer la méthode run() à insérer
            const runMethod = [
              '',
              '    /**',
              '     * Alias pour execute, pour assurer la compatibilité avec les deux méthodes',
              '     * @param {Object} interaction - L\'interaction Discord',
              '     */',
              '    async run(interaction) {',
              '        return this.execute(interaction);',
              '    }',
              ''
            ].join('\n');
            
            // Insérer la méthode run() après execute()
            lines.splice(endExecuteIndex + 1, 0, runMethod);
            content = lines.join('\n');
            
            // Écrire le contenu modifié dans le fichier
            await fs.promises.writeFile(filePath, content, 'utf8');
            modified++;
          } else {
            console.log(`  ⚠️ Impossible de trouver la fin de la méthode execute() dans ${file}`);
          }
        }
      }
    }
    
    console.log(`\n✅ Terminé: ${modified} fichiers de commandes ont été modifiés.`);
  } catch (error) {
    console.error('⛔ Erreur lors du traitement des commandes:', error);
    console.error(error.stack);
  }
}

// Exécuter la fonction principale
processCommands(); 