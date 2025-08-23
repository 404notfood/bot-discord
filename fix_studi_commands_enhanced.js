/**
 * Script amélioré pour corriger les fichiers de commandes studi
 */

import fs from 'fs';
import path from 'path';

// Liste des fichiers à corriger
const files = [
    './src/commands/studi/studi_ban_add.js',
    './src/commands/studi/studi_ban_remove.js',
    './src/commands/studi/studi_ban_list.js',
    './src/commands/studi/studi_config.js',
    './src/commands/studi/studi_offenders.js',
    './src/commands/studi/studi_status.js'
];

// Traiter chaque fichier
for (const file of files) {
    try {
        console.log(`Traitement de ${file}...`);
        
        // Lire le contenu du fichier
        let content = fs.readFileSync(file, 'utf8');
        
        // Vérifier si le fichier utilise const command = ... ou data: command
        if (content.includes('const command = new SlashCommandBuilder()') && content.includes('data: command')) {
            // Remplacer par const data = ... et data,
            content = content.replace('const command = new SlashCommandBuilder()', '// Créer l\'objet de commande de manière très simple\nconst data = new SlashCommandBuilder()');
            content = content.replace(/command\.addStringOption\(option => option/g, '// Ajouter l\'option séparément\ndata.addStringOption(option => \n    option');
            content = content.replace(/command\.addBooleanOption\(option => option/g, '// Ajouter l\'option séparément\ndata.addBooleanOption(option => \n    option');
            content = content.replace(/command\.addIntegerOption\(option => option/g, '// Ajouter l\'option séparément\ndata.addIntegerOption(option => \n    option');
            content = content.replace(/command\.addUserOption\(option => option/g, '// Ajouter l\'option séparément\ndata.addUserOption(option => \n    option');
            content = content.replace(/command\.addChannelOption\(option => option/g, '// Ajouter l\'option séparément\ndata.addChannelOption(option => \n    option');
            content = content.replace(/command\.addRoleOption\(option => option/g, '// Ajouter l\'option séparément\ndata.addRoleOption(option => \n    option');
            content = content.replace(/command\.addAttachmentOption\(option => option/g, '// Ajouter l\'option séparément\ndata.addAttachmentOption(option => \n    option');
            content = content.replace(/command\.addMentionableOption\(option => option/g, '// Ajouter l\'option séparément\ndata.addMentionableOption(option => \n    option');
            content = content.replace(/command\.addNumberOption\(option => option/g, '// Ajouter l\'option séparément\ndata.addNumberOption(option => \n    option');
            content = content.replace('data: command,', 'data,');
            
            // Écrire le contenu mis à jour
            fs.writeFileSync(file, content, 'utf8');
            console.log(`✅ ${file} mis à jour avec succès (option => option)`);
        } 
        // Si le fichier utilise la syntaxe data: new SlashCommandBuilder()
        else if (content.includes('data: new SlashCommandBuilder()')) {
            // Extraire et séparer la définition de la commande
            let newContent = content.replace(
                /data: new SlashCommandBuilder\(\)([^,]*),/s,
                (match, options) => {
                    let dataDef = '// Créer l\'objet de commande de manière très simple\nconst data = new SlashCommandBuilder()';
                    
                    // Extraire les options et les formater correctement
                    const nameMatch = options.match(/\.setName\('([^']+)'\)/);
                    const descMatch = options.match(/\.setDescription\('([^']+)'\)/);
                    const permMatch = options.match(/\.setDefaultMemberPermissions\(([^)]+)\)/);
                    
                    if (nameMatch) {
                        dataDef += `\n    .setName('${nameMatch[1]}')`;
                    }
                    
                    if (descMatch) {
                        dataDef += `\n    .setDescription('${descMatch[1]}')`;
                    }
                    
                    if (permMatch) {
                        dataDef += `\n    .setDefaultMemberPermissions(${permMatch[1]})`;
                    }
                    
                    dataDef += ';\n\n';
                    
                    // Ajouter les options si elles existent
                    const optionsMatches = [...options.matchAll(/\.addStringOption\(option =>[\s\S]*?option\.setName\('([^']+)'[\s\S]*?\.setDescription\('([^']+)'[\s\S]*?\.setRequired\(([^\)]+)\)([^,]*)/gs)];
                    
                    for (const optMatch of optionsMatches) {
                        const name = optMatch[1];
                        const description = optMatch[2];
                        const required = optMatch[3];
                        const additional = optMatch[4] || '';
                        
                        dataDef += `// Ajouter l'option séparément\ndata.addStringOption(option => \n    option.setName('${name}')\n        .setDescription('${description}')\n        .setRequired(${required})${additional}\n);\n\n`;
                    }
                    
                    return dataDef + 'export default {\n    data,';
                }
            );
            
            // Écrire le contenu mis à jour
            fs.writeFileSync(file, newContent, 'utf8');
            console.log(`✅ ${file} mis à jour avec succès (data: new SlashCommandBuilder)`);
        }
        // Si le script détecte une autre syntaxe, simplement réécrire le fichier complet
        else {
            console.log(`ℹ️ ${file} utilise une syntaxe différente, réécriture complète...`);
            
            // Remplacer les commandes par des versions plus simples
            if (file.includes('studi_ban_add.js')) {
                content = `/**
 * Commande pour ajouter un utilisateur à la liste de bannissement automatique
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';

// Créer l'objet de commande de manière très simple
const data = new SlashCommandBuilder()
    .setName('studi_ban_add')
    .setDescription('Ajouter un utilisateur à la liste de bannissement automatique.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// Ajouter l'option séparément
data.addStringOption(option => 
    option.setName('user_id')
        .setDescription('L\\'ID de l\\'utilisateur à ajouter.')
        .setRequired(true)
);

export default {
    data,
    
    async execute(interaction) {
        try {
            const userId = interaction.options.getString('user_id');

            // Vérifier si la table existe
            const [tables] = await db.query(
                "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studi_banned_users'"
            );
            
            if (tables.length === 0) {
                // La table n'existe pas, on la crée
                await db.query(\`
                    CREATE TABLE studi_banned_users (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id VARCHAR(50) NOT NULL,
                        reason TEXT,
                        banned_by VARCHAR(50) NOT NULL,
                        banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE KEY unique_user_id (user_id)
                    )
                \`);
                
                Logger.info('Table studi_banned_users créée');
            }

            // Ajouter l'utilisateur
            await db.query(
                'INSERT INTO studi_banned_users (user_id, banned_by) VALUES (?, ?) ON DUPLICATE KEY UPDATE banned_by = ?, banned_at = NOW()',
                [userId, interaction.user.id, interaction.user.id]
            );
            
            await interaction.editReply(\`L'utilisateur avec l'ID \${userId} a été ajouté à la liste de bannissement automatique.\`);
            
            Logger.info(\`Utilisateur ajouté à la liste de bannissement par \${interaction.user.tag}\`, {
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                bannedUserId: userId
            });
        } catch (error) {
            Logger.error('Erreur lors de l\\'ajout de l\\'utilisateur à la liste de bannissement', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Erreur lors de l\\'ajout de l\\'utilisateur à la liste de bannissement.');
        }
    }
};`;
            } else if (file.includes('studi_ban_remove.js')) {
                content = `/**
 * Commande pour retirer un utilisateur de la liste de bannissement automatique
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';

// Créer l'objet de commande de manière très simple
const data = new SlashCommandBuilder()
    .setName('studi_ban_remove')
    .setDescription('Retirer un utilisateur de la liste de bannissement automatique.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// Ajouter l'option séparément
data.addStringOption(option => 
    option.setName('user_id')
        .setDescription('L\\'ID de l\\'utilisateur à retirer.')
        .setRequired(true)
);

export default {
    data,
    
    async execute(interaction) {
        try {
            const userId = interaction.options.getString('user_id');

            // Vérifier si la table existe
            const [tables] = await db.query(
                "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studi_banned_users'"
            );
            
            if (tables.length === 0) {
                await interaction.editReply('Aucun utilisateur dans la liste de bannissement automatique.');
                return;
            }
            
            // Vérifier si l'utilisateur est dans la liste
            const [userExists] = await db.query(
                'SELECT user_id FROM studi_banned_users WHERE user_id = ?',
                [userId]
            );
            
            if (userExists.length === 0) {
                await interaction.editReply(\`L'utilisateur avec l'ID \${userId} n'est pas dans la liste de bannissement.\`);
                return;
            }
            
            // Supprimer l'utilisateur
            await db.query('DELETE FROM studi_banned_users WHERE user_id = ?', [userId]);
            
            await interaction.editReply(\`L'utilisateur avec l'ID \${userId} a été retiré de la liste de bannissement automatique.\`);
            
            Logger.info(\`Utilisateur retiré de la liste de bannissement par \${interaction.user.tag}\`, {
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                removedUserId: userId
            });
        } catch (error) {
            Logger.error('Erreur lors du retrait de l\\'utilisateur de la liste de bannissement', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Erreur lors du retrait de l\\'utilisateur de la liste de bannissement.');
        }
    }
};`;
            } else if (file.includes('studi_ban_list.js')) {
                content = `/**
 * Commande pour afficher la liste des utilisateurs bannis
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';

// Créer l'objet de commande de manière très simple
const data = new SlashCommandBuilder()
    .setName('studi_ban_list')
    .setDescription('Afficher la liste des utilisateurs à bannir automatiquement.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export default {
    data,
    
    async execute(interaction) {
        try {
            // Vérifier si la table existe
            const [tables] = await db.query(
                "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studi_banned_users'"
            );
            
            if (tables.length === 0) {
                await interaction.editReply('Aucun utilisateur dans la liste de bannissement automatique.');
                return;
            }
            
            const [rows] = await db.query(
                'SELECT user_id, banned_by, banned_at FROM studi_banned_users ORDER BY banned_at DESC'
            );
            
            if (rows.length === 0) {
                await interaction.editReply('Aucun utilisateur dans la liste de bannissement automatique.');
                return;
            }
            
            // Créer un embed pour afficher la liste
            const embed = new EmbedBuilder()
                .setTitle('Liste des utilisateurs bannis automatiquement')
                .setColor('#ff0000')
                .setDescription(\`\${rows.length} utilisateur(s) dans la liste de bannissement automatique\`)
                .setTimestamp();
            
            // Ajouter chaque utilisateur à l'embed
            for (const user of rows) {
                embed.addFields({
                    name: \`ID: \${user.user_id}\`,
                    value: \`Ajouté par: <@\${user.banned_by}> le \${new Date(user.banned_at).toLocaleDateString('fr-FR')}\`
                });
            }
            
            await interaction.editReply({ embeds: [embed] });
            
            Logger.info(\`Liste des utilisateurs bannis consultée par \${interaction.user.tag}\`, {
                userId: interaction.user.id,
                guildId: interaction.guild.id
            });
        } catch (error) {
            Logger.error('Erreur lors de la récupération de la liste de bannissement', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Erreur lors de la récupération de la liste de bannissement.');
        }
    }
};`;
            } else if (file.includes('studi_config.js')) {
                content = `/**
 * Commande pour configurer le système anti-studi
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';

// Créer l'objet de commande de manière très simple
const data = new SlashCommandBuilder()
    .setName('studi_config')
    .setDescription('Configurer le système anti-Studi.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

// Ajouter les options séparément
data.addBooleanOption(option => 
    option.setName('enable')
        .setDescription('Activer ou désactiver le système anti-Studi')
        .setRequired(true)
);

data.addIntegerOption(option => 
    option.setName('max_offenses')
        .setDescription('Nombre maximal d\\'infractions avant sanction')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(10)
);

export default {
    data,
    
    async execute(interaction) {
        try {
            const isEnabled = interaction.options.getBoolean('enable');
            const maxOffenses = interaction.options.getInteger('max_offenses') ?? 3;

            // Vérifier si la table existe
            const [tables] = await db.query(
                "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studi_config'"
            );
            
            if (tables.length === 0) {
                // La table n'existe pas, on la crée
                await db.query(\`
                    CREATE TABLE studi_config (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        is_enabled BOOLEAN DEFAULT FALSE,
                        max_offenses INT DEFAULT 3,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
                    )
                \`);
                
                // Insérer une configuration par défaut
                await db.query(
                    'INSERT INTO studi_config (is_enabled, max_offenses) VALUES (?, ?)',
                    [isEnabled, maxOffenses]
                );
                
                Logger.info('Table studi_config créée avec configuration initiale');
            } else {
                // La table existe, on met à jour la configuration
                const [configExists] = await db.query('SELECT id FROM studi_config LIMIT 1');
                
                if (configExists.length > 0) {
                    await db.query(
                        'UPDATE studi_config SET is_enabled = ?, max_offenses = ?, updated_at = NOW() WHERE id = 1',
                        [isEnabled, maxOffenses]
                    );
                } else {
                    await db.query(
                        'INSERT INTO studi_config (is_enabled, max_offenses) VALUES (?, ?)',
                        [isEnabled, maxOffenses]
                    );
                }
            }

            // Créer un embed pour afficher la nouvelle configuration
            const embed = new EmbedBuilder()
                .setTitle('Configuration du système anti-Studi')
                .setColor(isEnabled ? '#00ff00' : '#ff0000')
                .addFields(
                    {
                        name: 'Statut',
                        value: isEnabled ? '**Activé**' : '**Désactivé**',
                        inline: true
                    },
                    {
                        name: 'Infractions maximales',
                        value: \`\${maxOffenses}\`,
                        inline: true
                    }
                )
                .setFooter({ text: 'Mis à jour par ' + interaction.user.tag })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            
            // Journaliser l'action
            Logger.info(\`Configuration anti-studi mise à jour par \${interaction.user.tag}\`, {
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                isEnabled,
                maxOffenses
            });
        } catch (error) {
            Logger.error('Erreur pour la commande studi_config', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Une erreur est survenue lors de la configuration.');
        }
    }
};`;
            }
            
            // Écrire le contenu mis à jour
            fs.writeFileSync(file, content, 'utf8');
            console.log(`✅ ${file} mis à jour avec succès (réécriture complète)`);
        }
        
    } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${file}:`, error);
    }
}

console.log('Traitement terminé.'); 