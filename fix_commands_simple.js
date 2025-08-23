import { promises as fs } from 'fs';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

// Fichiers à corriger
const filesToFix = [
    './src/commands/studi/studi_ban_add.js',
    './src/commands/studi/studi_ban_remove.js',
    './src/commands/studi/studi_ban_list.js',
    './src/commands/studi/studi_config.js',
    './src/commands/studi/studi_offenders.js',
    './src/commands/studi/studi_status.js',
    './src/commands/projects/create_project.js',
    './src/commands/projects/create_subgroup.js',
    './src/commands/projects/list_projects.js',
    './src/commands/projects/list_subgroup_members.js',
    './src/commands/projects/list_subgroups.js',
    './src/commands/projects/remove_from_subgroup.js',
    './src/commands/admin/studi_db_init.js'
];

for (const file of filesToFix) {
    try {
        if (!existsSync(file)) {
            console.log(`Le fichier ${file} n'existe pas. Ignoré.`);
            continue;
        }

        let content = readFileSync(file, 'utf8');

        // Correction pour les options en une ligne
        content = content.replace(
            /\.add(\w+)Option\((\w+)\s*=>\s*\2\.setName\((['"][^'"]+['"]\))\.setDescription\((['"][^'"]+['"]\))\.setRequired\((\w+)\)/g,
            `.add$1Option($2 => 
            $2.setName($3)
            .setDescription($4)
            .setRequired($5))`
        );

        // Correction spécifique pour les options avec minValue/maxValue
        content = content.replace(
            /\.add(\w+)Option\((\w+)\s*=>\s*\2\.setName\((['"][^'"]+['"]\))\.setDescription\((['"][^'"]+['"]\))\.setRequired\((\w+)\)\.set(Min|Max)Value\(([^)]+)\)/g,
            `.add$1Option($2 => 
            $2.setName($3)
            .setDescription($4)
            .setRequired($5)
            .set$6Value($7))`
        );

        writeFileSync(file, content, 'utf8');
        console.log(`Fichier corrigé: ${file}`);
    } catch (error) {
        console.error(`Erreur lors du traitement du fichier ${file}:`, error);
    }
}

console.log('Traitement terminé.'); 