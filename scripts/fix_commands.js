/**
 * Script pour corriger les erreurs de syntaxe dans les commandes
 * Usage: node scripts/fix_commands.js
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
let filesFixed = 0;
let errors = 0;

// Template pour normaliser les commandes selon la documentation Discord.js
const standardCommandTemplate = `/**
 * @file {filename}
 * @description {description}
 */

import { SlashCommandBuilder } from 'discord.js';
{imports}

export default {
  data: {commandData},
  
  async execute(interaction) {
    {executeBody}
  }
};
`;

/**
 * Corrige un fichier de commande
 * @param {string} filePath - Chemin du fichier
 */
function fixCommandFile(filePath) {
  try {
    console.log(`Traitement du fichier: ${filePath}`);
    filesProcessed++;
    
    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, 'utf8');
    const filename = path.basename(filePath);
    
    // Si le fichier semble déjà être au format standard
    if (content.includes('export default {') && 
        content.includes('data:') && 
        content.includes('async execute(interaction)')) {
      console.log(`  ✓ Fichier déjà au format standard`);
      return;
    }
    
    // Extraire les éléments clés
    let description = extractDescription(content);
    let imports = extractImports(content);
    let commandData = extractCommandData(content);
    let executeBody = extractExecuteBody(content);
    
    // Si on n'a pas pu extraire tous les éléments nécessaires
    if (!commandData || !executeBody) {
      console.log(`  ⚠️ Impossible d'extraire les données nécessaires`);
      return;
    }
    
    // Créer le nouveau contenu du fichier
    const newContent = standardCommandTemplate
      .replace('{filename}', filename)
      .replace('{description}', description)
      .replace('{imports}', imports)
      .replace('{commandData}', commandData)
      .replace('{executeBody}', executeBody);
    
    // Écrire le nouveau contenu
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`  ✓ Fichier normalisé avec succès`);
    filesFixed++;
  } catch (error) {
    console.error(`  ✗ Erreur lors du traitement de ${filePath}:`, error.message);
    errors++;
  }
}

/**
 * Extrait la description de la commande
 * @param {string} content - Contenu du fichier
 * @returns {string} Description extraite
 */
function extractDescription(content) {
  // Rechercher dans les commentaires
  const descriptionMatch = content.match(/@fileoverview\s+(.*?)(?:\n|\*\/)/s) || 
                           content.match(/\/\*\*\s*\n\s*\*\s*(.*?)(?:\n|\*\/)/s) ||
                           content.match(/\/\/\s*(.*?)\n/);
  
  return descriptionMatch ? descriptionMatch[1].trim() : 'Commande Discord';
}

/**
 * Extrait les imports nécessaires
 * @param {string} content - Contenu du fichier
 * @returns {string} Imports extraits
 */
function extractImports(content) {
  // Extraire tous les imports
  const importLines = [];
  const importRegex = /import\s+.*?from\s+['"].*?['"]/g;
  const matches = content.match(importRegex) || [];
  
  // Ajouter les imports importants
  if (content.includes('EmbedBuilder') && !matches.some(m => m.includes('EmbedBuilder'))) {
    importLines.push("import { EmbedBuilder } from 'discord.js';");
  }
  
  if (content.includes('Logger') && !matches.some(m => m.includes('Logger'))) {
    importLines.push("import * as Logger from '../../utils/logger.js';");
  }
  
  // Ajouter les imports trouvés, sans les doublons
  matches.forEach(match => {
    if (!importLines.includes(match) && !match.includes('BaseCommand') && !match.includes('SlashCommandBuilder')) {
      importLines.push(match);
    }
  });
  
  return importLines.join('\n');
}

/**
 * Extrait les données de la commande
 * @param {string} content - Contenu du fichier
 * @returns {string} Données de commande extraites
 */
function extractCommandData(content) {
  // Option 1: SlashCommandBuilder directement utilisé
  const builderMatch = content.match(/new SlashCommandBuilder\(\)([\s\S]*?)(?:,|\);)/);
  if (builderMatch) {
    return `new SlashCommandBuilder()${builderMatch[1]}`;
  }
  
  // Option 2: Données dans un objet
  const dataMatch = content.match(/data:\s*{([\s\S]*?)},/);
  if (dataMatch) {
    return `{${dataMatch[1]}}`;
  }
  
  // Option 3: Super avec données
  const superMatch = content.match(/super\(\s*{([\s\S]*?)}\s*\)/s);
  if (superMatch) {
    const data = superMatch[1];
    if (data.includes('name:')) {
      return `new SlashCommandBuilder()
      .setName(${extractValue(data, 'name')})
      .setDescription(${extractValue(data, 'description')})`;
    }
  }
  
  // Option 4: Définition en variable
  const varMatch = content.match(/const\s+commandData\s*=\s*new SlashCommandBuilder\(\)([\s\S]*?);/s);
  if (varMatch) {
    return `new SlashCommandBuilder()${varMatch[1]}`;
  }
  
  // Pas trouvé
  return null;
}

/**
 * Extrait la valeur d'une propriété dans un objet
 * @param {string} data - Données de l'objet
 * @param {string} prop - Propriété à extraire
 * @returns {string} Valeur extraite
 */
function extractValue(data, prop) {
  const match = data.match(new RegExp(`${prop}:\\s*([^,}]+)`));
  return match ? match[1].trim() : `"non défini"`;
}

/**
 * Extrait le corps de la méthode execute
 * @param {string} content - Contenu du fichier
 * @returns {string} Corps de execute extrait
 */
function extractExecuteBody(content) {
  // Rechercher la méthode execute ou run
  const executeMatch = content.match(/async\s+execute\s*\(\s*interaction\s*\)\s*{([\s\S]*?)\n\s*}(?!\s*\))/s) || 
                        content.match(/execute\s*\(\s*interaction\s*\)\s*{([\s\S]*?)\n\s*}(?!\s*\))/s) ||
                        content.match(/async\s+run\s*\(\s*interaction\s*\)\s*{([\s\S]*?)\n\s*}(?!\s*\))/s) ||
                        content.match(/run\s*\(\s*interaction\s*\)\s*{([\s\S]*?)\n\s*}(?!\s*\))/s);
  
  if (executeMatch) {
    return executeMatch[1];
  }
  
  // Si pas trouvé, créer un corps simple
  return `
    try {
      await interaction.editReply('Commande exécutée avec succès!');
    } catch (error) {
      console.error(error);
      await interaction.editReply('Une erreur est survenue lors de l\'exécution de cette commande.');
    }
  `;
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
      fixCommandFile(itemPath);
    }
  }
}

console.log('Démarrage du script pour normaliser les commandes selon la documentation Discord.js...');
processDirectory(commandsPath);

console.log('\nRésumé:');
console.log(`- Fichiers traités: ${filesProcessed}`);
console.log(`- Fichiers normalisés: ${filesFixed}`);
console.log(`- Erreurs: ${errors}`);
console.log('Terminé!'); 