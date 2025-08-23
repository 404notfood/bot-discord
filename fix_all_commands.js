/**
 * Ce script corrige la syntaxe des commandes Discord.js
 * en utilisant une approche plus sure avec déclaration séparée
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

// Liste des fichiers de commandes dans projects
const projectsDir = './src/commands/projects';
const projectsFiles = readdirSync(projectsDir).filter(file => file.endsWith('.js'));

// Expression régulière pour trouver la déclaration des commandes
const commandDeclarationRegex = /(export\s+default\s*{[\s\n]*)data:\s*new\s+SlashCommandBuilder\(\)([\s\S]*?)(?:,[\s\n]*execute|,[\s\n]*[\w]+:)/g;

// Expression régulière pour extraire le nom et la description
const nameDescRegex = /\.setName\(['"]([\w-]+)['"]\)[\s\n]*\.setDescription\(['"](.*?)['"](?:\))?/;

// Traiter chaque fichier
for (const file of projectsFiles) {
    const filePath = join(projectsDir, file);
    console.log(`Traitement de ${filePath}...`);

    try {
        // Lire le contenu du fichier
        let content = readFileSync(filePath, 'utf8');

        // Vérifier si le fichier utilise SlashCommandBuilder
        if (!content.includes('SlashCommandBuilder')) {
            console.log(`  Ignoré: ${file} n'utilise pas SlashCommandBuilder`);
            continue;
        }

        // Trouver la déclaration de commande
        let match = commandDeclarationRegex.exec(content);
        if (!match) {
            console.log(`  Pas de correspondance trouvée dans ${file}`);
            continue;
        }

        // Récupérer les parties de la commande
        const beforeCmd = match[1];
        const cmdBody = match[2];
        
        // Extraire le nom et la description
        const nameDescMatch = nameDescRegex.exec(cmdBody);
        if (!nameDescMatch) {
            console.log(`  Impossible d'extraire le nom et la description dans ${file}`);
            continue;
        }

        const cmdName = nameDescMatch[1];
        const cmdDesc = nameDescMatch[2];

        // Créer la nouvelle syntaxe de commande
        const newContent = content.replace(
            commandDeclarationRegex,
            (match, beforeExport, cmdPart) => {
                // Extraire les parties de configuration de l'option existante
                const optionsMatches = cmdPart.match(/\.add(\w+)Option\([^)]+\)/g) || [];
                
                // Créer les nouvelles déclarations d'options
                let optionsCode = '';
                for (const optionMatch of optionsMatches) {
                    const optType = optionMatch.match(/\.add(\w+)Option/)[1];
                    const optNameMatch = optionMatch.match(/\.setName\(['"]([^'"]+)['"]\)/);
                    const optName = optNameMatch ? optNameMatch[1] : 'unknown';
                    
                    // Autres attributs potentiels
                    const hasDescription = optionMatch.includes('.setDescription');
                    const isRequired = optionMatch.includes('.setRequired(true)');
                    const hasMinValue = optionMatch.includes('.setMinValue');
                    const hasMaxValue = optionMatch.includes('.setMaxValue');
                    
                    // Créer le nouveau code d'option
                    optionsCode += `\ncommand.add${optType}Option(option => option\n`;
                    optionsCode += `    .setName('${optName}')\n`;
                    
                    if (hasDescription) {
                        const descMatch = optionMatch.match(/\.setDescription\(['"]([^'"]+)['"]\)/);
                        if (descMatch) {
                            optionsCode += `    .setDescription('${descMatch[1]}')\n`;
                        }
                    }
                    
                    if (isRequired) {
                        optionsCode += `    .setRequired(true)\n`;
                    } else if (optionMatch.includes('.setRequired(')) {
                        optionsCode += `    .setRequired(false)\n`;
                    }
                    
                    if (hasMinValue) {
                        const minMatch = optionMatch.match(/\.setMinValue\(([^)]+)\)/);
                        if (minMatch) {
                            optionsCode += `    .setMinValue(${minMatch[1]})\n`;
                        }
                    }
                    
                    if (hasMaxValue) {
                        const maxMatch = optionMatch.match(/\.setMaxValue\(([^)]+)\)/);
                        if (maxMatch) {
                            optionsCode += `    .setMaxValue(${maxMatch[1]})\n`;
                        }
                    }
                    
                    optionsCode += `);\n`;
                }

                // Permissions
                const permissionsMatch = cmdPart.match(/\.setDefaultMemberPermissions\(([^)]+)\)/);
                const permissions = permissionsMatch ? permissionsMatch[1] : null;

                // Construire le nouveau code de commande
                let newCode = `const command = new SlashCommandBuilder()\n`;
                newCode += `    .setName('${cmdName}')\n`;
                newCode += `    .setDescription('${cmdDesc}')`;
                
                if (permissions) {
                    newCode += `\n    .setDefaultMemberPermissions(${permissions})`;
                }
                
                newCode += `;\n\n${optionsCode}${beforeExport}data: command,\n`;
                
                return newCode;
            }
        );

        // Écrire le fichier mis à jour
        writeFileSync(filePath, newContent, 'utf8');
        console.log(`  ✅ ${file} mis à jour avec succès`);
    } catch (error) {
        console.error(`  ❌ Erreur lors du traitement de ${file}:`, error);
    }
}

console.log('Tous les fichiers ont été traités.'); 