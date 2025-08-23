/**
 * Script pour ajouter la méthode run() comme alias à execute() dans toutes les commandes
 * Ce script parcourt tous les fichiers de commande et ajoute la ligne this.run = this.execute
 * Usage: node scripts/add_run_method.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtenir l'équivalent de __dirname pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Chemin vers le dossier des commandes
const commandsPath = path.join(__dirname, '..', 'src', 'commands');

// Compteurs pour les statistiques
let filesProcessed = 0;
let filesModified = 0;
let errors = 0;

/**
 * Vérifie si un fichier de commande contient déjà la méthode run
 * @param {string} content - Contenu du fichier
 * @returns {boolean} - True si le fichier contient déjà la méthode run
 */
function hasRunMethod(content) {
  return content.includes('this.run = this.execute') || 
         content.includes('run(') || 
         content.includes('run =');
}

/**
 * Ajoute la méthode run à une commande
 * @param {string} filePath - Chemin du fichier
 */
function addRunMethod(filePath) {
  try {
    console.log(`Traitement du fichier: ${filePath}`);
    filesProcessed++;
    
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Vérifier si le fichier a déjà la méthode run
    if (hasRunMethod(content)) {
      console.log(`  ✓ Le fichier a déjà la méthode run`);
      return;
    }
    
    // Identifier où ajouter le code
    let newContent;
    
    // Cas 1: classe avec constructor
    if (content.includes('constructor(')) {
      // Ajouter après la fin du constructeur
      newContent = content.replace(
        /constructor\([^{]*\{[^}]*\}/s,
        (match) => match + '\n\n    // Ajouter un alias de la méthode execute pour la compatibilité avec run\n    this.run = this.execute;'
      );
    } 
    // Cas 2: fonction ou objet sans constructor explicite
    else if (content.includes('execute')) {
      // Ajouter juste avant la méthode execute
      newContent = content.replace(
        /(async\s+)?execute(\s*)\(/,
        '// Alias de execute pour la compatibilité\nrun(...args) {\n    return this.execute(...args);\n  }\n\n  $1execute$2('
      );
    } 
    // Cas 3: si aucun des cas précédents ne correspond
    else {
      console.log(`  ⚠ Structure non reconnue, impossible d'ajouter la méthode run`);
      errors++;
      return;
    }
    
    // Écrire le nouveau contenu dans le fichier
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`  ✓ Méthode run ajoutée avec succès`);
    filesModified++;
  } catch (error) {
    console.error(`  ✗ Erreur lors du traitement de ${filePath}:`, error.message);
    errors++;
  }
}

/**
 * Parcourt récursivement un dossier pour traiter tous les fichiers JS
 * @param {string} dirPath - Chemin du dossier
 */
function processDirectory(dirPath) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    
    if (fs.statSync(itemPath).isDirectory()) {
      // Récursion pour les sous-dossiers
      processDirectory(itemPath);
    } else if (item.endsWith('.js')) {
      // Traiter les fichiers JavaScript
      addRunMethod(itemPath);
    }
  }
}

console.log('Démarrage du script pour ajouter la méthode run à toutes les commandes...');
processDirectory(commandsPath);

console.log('\nRésumé:');
console.log(`- Fichiers traités: ${filesProcessed}`);
console.log(`- Fichiers modifiés: ${filesModified}`);
console.log(`- Erreurs: ${errors}`);
console.log('Terminé!'); 