/**
 * Script pour convertir les anciennes commandes vers le nouveau format BaseCommand
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration pour les imports ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Fonction principale
 */
async function main() {
    const commandsPath = path.join(__dirname, 'src', 'commands');
    const commandCategories = fs.readdirSync(commandsPath);
    
    console.log('Début de la conversion des commandes...');
    
    // Parcourir chaque catégorie (dossier) de commandes
    for (const category of commandCategories) {
        const categoryPath = path.join(commandsPath, category);
        
        if (fs.statSync(categoryPath).isDirectory()) {
            await processDirectory(categoryPath);
        }
    }
    
    console.log('Conversion terminée!');
}

/**
 * Traite un répertoire de commandes
 * @param {string} directoryPath - Chemin du répertoire
 */
async function processDirectory(directoryPath) {
    const commandFiles = fs.readdirSync(directoryPath).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
        const filePath = path.join(directoryPath, file);
        
        // Lire le contenu du fichier
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Vérifier si le fichier utilise déjà BaseCommand
        if (content.includes('import { BaseCommand }') && content.includes('extends BaseCommand')) {
            console.log(`✅ ${file} utilise déjà BaseCommand, ignoré.`);
            continue;
        }
        
        // Convertir le contenu
        const newContent = convertCommandFile(content, file);
        
        // Écrire le nouveau contenu
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`🔄 ${file} converti.`);
    }
}

/**
 * Convertit le contenu d'un fichier de commande
 * @param {string} content - Contenu du fichier
 * @param {string} fileName - Nom du fichier
 * @returns {string} - Nouveau contenu
 */
function convertCommandFile(content, fileName) {
    // Extraire le nom de la commande
    const commandNameMatch = content.match(/setName\(['"]([^'"]+)['"]\)/);
    const commandName = commandNameMatch ? commandNameMatch[1] : fileName.replace('.js', '');
    
    // Extraire la description
    const descriptionMatch = content.match(/setDescription\(['"]([^'"]+)['"]\)/);
    const description = descriptionMatch ? descriptionMatch[1] : 'Description de la commande';
    
    // Extraire les permissions par défaut
    const permissionsMatch = content.match(/setDefaultMemberPermissions\(([^)]+)\)/);
    const permissions = permissionsMatch ? permissionsMatch[1] : null;
    
    // Extraire les options
    const options = extractOptions(content);
    
    // Extraire le code d'exécution
    const executeBlock = extractExecuteBlock(content);
    
    // Construire le nouveau contenu
    return `/**
 * ${description}
 */

import { ${permissions ? 'PermissionFlagsBits, ' : ''}EmbedBuilder } from 'discord.js';
import { BaseCommand } from '../../models/BaseCommand.js';
import * as Logger from '../../utils/logger.js';

/**
 * Commande ${commandName}
 */
export class ${capitalize(commandName)}Command extends BaseCommand {
    /**
     * Crée une nouvelle instance de ${capitalize(commandName)}Command
     */
    constructor() {
        super({
            name: '${commandName}',
            description: '${description}',
            ${permissions ? `defaultMemberPermissions: ${permissions},` : ''}
            options: [
                ${options}
            ]
        });
    }

    ${executeBlock}
}

export default new ${capitalize(commandName)}Command();`;
}

/**
 * Extrait les options de commande
 * @param {string} content - Contenu du fichier
 * @returns {string} - Options formatées
 */
function extractOptions(content) {
    const optionsRegex = /addUserOption|addStringOption|addIntegerOption|addBooleanOption|addChannelOption|addRoleOption|addMentionableOption|addNumberOption|addAttachmentOption/g;
    const matches = content.matchAll(optionsRegex);
    
    const options = [];
    
    for (const match of matches) {
        const startIdx = content.indexOf(match[0], match.index);
        let depth = 0;
        let endIdx = startIdx;
        
        // Trouver la fin de l'option
        for (let i = startIdx; i < content.length; i++) {
            if (content[i] === '(') depth++;
            if (content[i] === ')') {
                depth--;
                if (depth === 0) {
                    endIdx = i + 1;
                    break;
                }
            }
        }
        
        const optionBlock = content.substring(startIdx, endIdx);
        
        // Extraire les infos de l'option
        const nameMatch = optionBlock.match(/setName\(['"]([^'"]+)['"]\)/);
        const descMatch = optionBlock.match(/setDescription\(['"]([^'"]+)['"]\)/);
        const requiredMatch = optionBlock.match(/setRequired\(([^)]+)\)/);
        
        const optionType = getOptionType(match[0]);
        
        options.push(`{
                    name: '${nameMatch ? nameMatch[1] : 'option'}',
                    description: '${descMatch ? descMatch[1] : 'Description de l\'option'}',
                    type: ${optionType},
                    required: ${requiredMatch ? requiredMatch[1] : false}
                }`);
    }
    
    return options.join(',\n                ');
}

/**
 * Obtient le type d'option
 * @param {string} optionMethod - Méthode d'option
 * @returns {number} - Type d'option
 */
function getOptionType(optionMethod) {
    const typeMap = {
        'addStringOption': 3,
        'addIntegerOption': 4,
        'addBooleanOption': 5,
        'addUserOption': 6,
        'addChannelOption': 7,
        'addRoleOption': 8,
        'addMentionableOption': 9,
        'addNumberOption': 10,
        'addAttachmentOption': 11
    };
    
    for (const type in typeMap) {
        if (optionMethod.includes(type)) {
            return typeMap[type];
        }
    }
    
    return 3; // String par défaut
}

/**
 * Extrait le bloc execute
 * @param {string} content - Contenu du fichier
 * @returns {string} - Bloc execute
 */
function extractExecuteBlock(content) {
    const executeStart = content.indexOf('async execute(interaction)');
    if (executeStart === -1) return `async execute(interaction) {\n        await interaction.reply('Commande non implémentée');\n    }`;
    
    let depth = 0;
    let executeEnd = executeStart;
    let foundStart = false;
    
    // Trouver la fin du bloc execute
    for (let i = executeStart; i < content.length; i++) {
        if (content[i] === '{') {
            depth++;
            foundStart = true;
        }
        if (content[i] === '}') {
            depth--;
            if (foundStart && depth === 0) {
                executeEnd = i + 1;
                break;
            }
        }
    }
    
    // Extraire et nettoyer le bloc
    let executeBlock = content.substring(executeStart, executeEnd);
    
    // Remplacer interaction.editReply par interaction.reply
    executeBlock = executeBlock.replace(/interaction\.editReply/g, 'interaction.reply');
    
    return executeBlock;
}

/**
 * Met en majuscule la première lettre
 * @param {string} str - Chaîne
 * @returns {string} - Chaîne avec première lettre en majuscule
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// Exécuter le script
main().catch(error => {
    console.error('Erreur:', error);
    process.exit(1);
}); 