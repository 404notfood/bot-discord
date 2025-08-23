/**
 * Script pour corriger les fichiers de commandes utilisant une structure orientée objet
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Liste des fichiers à corriger
const filesDirectory = './src/commands/projects';
const filesToFix = readdirSync(filesDirectory).filter(file => file.endsWith('.js'));

// Traiter chaque fichier
for (const file of filesToFix) {
    const filePath = join(filesDirectory, file);
    console.log(`Traitement de ${filePath}...`);

    try {
        // Lire le contenu du fichier
        let content = readFileSync(filePath, 'utf8');

        // Vérifier si le fichier contient une classe et AdminCommand
        if (!content.includes('AdminCommand') || !content.includes('class ')) {
            console.log(`  Ignoré: ${file} n'utilise pas la structure OOP avec AdminCommand`);
            continue;
        }

        // Extraire le nom de la classe
        const classNameMatch = content.match(/class\s+(\w+)\s+extends\s+AdminCommand/);
        if (!classNameMatch) {
            console.log(`  Pas de classe héritant d'AdminCommand trouvée dans ${file}`);
            continue;
        }

        // Extraire les informations de la commande
        const commandDataMatch = content.match(/const\s+commandData\s*=\s*new\s+SlashCommandBuilder\(\)([\s\S]*?)super\(commandData\);/);
        if (!commandDataMatch) {
            console.log(`  Structure de commandData non trouvée dans ${file}`);
            continue;
        }

        const commandCode = commandDataMatch[1];

        // Extraire le nom et la description
        const nameMatch = commandCode.match(/\.setName\(['"]([^'"]+)['"]\)/);
        const descMatch = commandCode.match(/\.setDescription\(['"]([^'"]+)['"]\)/);
        
        if (!nameMatch || !descMatch) {
            console.log(`  Impossible d'extraire le nom ou la description dans ${file}`);
            continue;
        }

        const cmdName = nameMatch[1];
        const cmdDesc = descMatch[1];

        // Extraire les options
        const optionsMatches = commandCode.match(/\.add(\w+)Option\([^{]+\{[\s\S]*?\}\)/g);
        const options = [];

        if (optionsMatches) {
            for (const optMatch of optionsMatches) {
                const optTypeMatch = optMatch.match(/\.add(\w+)Option/);
                const optNameMatch = optMatch.match(/\.setName\(['"]([^'"]+)['"]\)/);
                const optDescMatch = optMatch.match(/\.setDescription\(['"]([^'"]+)['"]\)/);
                const optRequiredMatch = optMatch.match(/\.setRequired\(([^)]+)\)/);
                
                if (optTypeMatch && optNameMatch && optDescMatch) {
                    options.push({
                        type: optTypeMatch[1],
                        name: optNameMatch[1],
                        description: optDescMatch[1],
                        required: optRequiredMatch ? optRequiredMatch[1] === 'true' : false
                    });
                }
            }
        }

        // Extraire les permissions
        const permMatch = commandCode.match(/\.setDefaultMemberPermissions\(([^)]+)\)/);
        const permissions = permMatch ? permMatch[1] : null;

        // Créer la nouvelle version du code
        let newContent = content;

        // Remplacer la partie import/AdminCommand
        newContent = newContent.replace(/import \{ AdminCommand \} from [^;]+;/, '');

        // Remplacer la définition de classe par la construction de la commande
        const classDefinitionRegex = new RegExp(`class\\s+${classNameMatch[1]}\\s+extends\\s+AdminCommand[\\s\\S]*?constructor\\(\\)\\s*\\{[\\s\\S]*?super\\(commandData\\);[\\s\\S]*?\\}`, 'g');

        let commandConstruction = `// Créer la commande avec une syntaxe plus sûre
const command = new SlashCommandBuilder()
    .setName('${cmdName}')
    .setDescription('${cmdDesc}')`;

        if (permissions) {
            commandConstruction += `
    .setDefaultMemberPermissions(${permissions})`;
        }
        
        commandConstruction += `;

// Ajouter les options une par une`;

        for (const opt of options) {
            commandConstruction += `
command.add${opt.type}Option(option => option
    .setName('${opt.name}')
    .setDescription('${opt.description}')${opt.required ? `
    .setRequired(true)` : ''}
);`;
        }

        // Ajouter la fonction isModerator si elle est utilisée
        let isModerator = '';
        if (content.includes('this.isModerator')) {
            isModerator = `
// Fonction pour vérifier si l'utilisateur est modérateur
async function isModerator(userId) {
    try {
        // Vérifier dans la table bot_moderators
        const [moderators] = await db.query(
            'SELECT user_id FROM bot_moderators WHERE user_id = ?',
            [userId]
        );
        
        if (moderators.length > 0) {
            return true;
        }
        
        // Vérifier aussi dans la table bot_admins
        const [admins] = await db.query(
            'SELECT user_id FROM bot_admins WHERE user_id = ?',
            [userId]
        );
        
        return admins.length > 0;
    } catch (error) {
        Logger.error('Erreur lors de la vérification des permissions', {
            error: error.message,
            userId
        });
        return false;
    }
}`;
        }

        newContent = newContent.replace(classDefinitionRegex, commandConstruction + isModerator);

        // Remplacer les références this.isModerator par isModerator
        newContent = newContent.replace(/this\.isModerator/g, 'isModerator');

        // Remplacer l'exportation
        newContent = newContent.replace(/export default new \w+\(\);/, 'export default {\n    data: command,\n    \n    async execute(interaction) {');
        
        // Ajouter l'accolade fermante à la fin
        if (!newContent.endsWith('};')) {
            newContent = newContent.replace(/}$/, '};');
        }
        
        // Écrire le fichier mis à jour
        writeFileSync(filePath, newContent, 'utf8');
        console.log(`  ✅ ${file} mis à jour avec succès`);
    } catch (error) {
        console.error(`  ❌ Erreur lors du traitement de ${file}:`, error);
    }
}

console.log('Tous les fichiers ont été traités.'); 