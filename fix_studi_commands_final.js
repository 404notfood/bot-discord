/**
 * Script final pour corriger les fichiers de commandes studi
 * Réécrit complètement tous les fichiers avec une syntaxe garantie de fonctionner
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

// Réécrire chaque fichier
for (const file of files) {
    try {
        console.log(`Traitement de ${file}...`);
        
        let content = '';
        
        if (file.includes('studi_ban_add.js')) {
            content = `/**
 * Commande pour ajouter un utilisateur à la liste de bannissement automatique
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';

// Créer l'objet de commande
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

// Créer l'objet de commande
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

// Créer l'objet de commande
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

// Créer l'objet de commande
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
        } else if (file.includes('studi_offenders.js')) {
            content = `/**
 * Commande pour afficher la liste des contrevenants qui ont posté des liens Studi
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';

// Créer l'objet de commande
const data = new SlashCommandBuilder()
    .setName('studi_offenders')
    .setDescription('Afficher la liste des contrevenants qui ont posté des liens Studi.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export default {
    data,
    
    async execute(interaction) {
        try {
            // Vérifier si la table existe
            const [tables] = await db.query(
                "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studi_offenders'"
            );
            
            if (tables.length === 0) {
                // La table n'existe pas, on la crée
                await db.query(\`
                    CREATE TABLE studi_offenders (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        user_id VARCHAR(50) NOT NULL,
                        offense_count INT DEFAULT 1,
                        last_offense_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        UNIQUE KEY unique_user_id (user_id)
                    )
                \`);
                
                Logger.info('Table studi_offenders créée');
                await interaction.editReply('Aucun contrevenant trouvé.');
                return;
            }
            
            const [rows] = await db.query(
                'SELECT user_id, offense_count, last_offense_at FROM studi_offenders ORDER BY offense_count DESC'
            );

            if (rows.length > 0) {
                const embed = new EmbedBuilder()
                    .setTitle('Liste des contrevenants Studi')
                    .setColor('#FF9900')
                    .setDescription('Utilisateurs qui ont tenté de poster des liens Studi :')
                    .setTimestamp();
                
                // Ajouter la liste des contrevenants
                let offenderList = '';
                rows.forEach((row, index) => {
                    const date = new Date(row.last_offense_at).toLocaleDateString();
                    offenderList += \`**\${index + 1}.** <@\${row.user_id}> - Infractions: **\${row.offense_count}** | Dernière infraction: \${date}\n\`;
                });
                
                embed.addFields({ name: 'Contrevenants', value: offenderList });
                
                await interaction.editReply({ embeds: [embed] });
                
                Logger.info(\`Liste des contrevenants consultée par \${interaction.user.tag}\`, {
                    userId: interaction.user.id,
                    guildId: interaction.guild.id,
                    offenderCount: rows.length
                });
            } else {
                await interaction.editReply('Aucun contrevenant trouvé.');
            }
        } catch (error) {
            Logger.error('Erreur lors de la récupération de la liste des contrevenants', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Erreur lors de la récupération de la liste des contrevenants.');
        }
    }
};`;
        } else if (file.includes('studi_status.js')) {
            content = `/**
 * Commande pour vérifier le statut du système anti-studi
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';

// Créer l'objet de commande
const data = new SlashCommandBuilder()
    .setName('studi_status')
    .setDescription('Vérifier le statut du système anti-studi.');

export default {
    data,
    
    async execute(interaction) {
        try {
            // Vérifier si la table existe
            const [tables] = await db.query(
                "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studi_config'"
            );
            
            let config = {
                is_enabled: false,
                max_offenses: 3
            };
            
            if (tables.length > 0) {
                // Récupérer la configuration
                const [rows] = await db.query('SELECT is_enabled, max_offenses FROM studi_config LIMIT 1');
                
                if (rows.length > 0) {
                    config = rows[0];
                }
            }
            
            // Compter les utilisateurs bannis
            let bannedCount = 0;
            try {
                const [bannedTables] = await db.query(
                    "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'studi_banned_users'"
                );
                
                if (bannedTables.length > 0) {
                    const [countResult] = await db.query('SELECT COUNT(*) as count FROM studi_banned_users');
                    bannedCount = countResult[0].count;
                }
            } catch (err) {
                Logger.warn('Erreur lors de la récupération du nombre d\\'utilisateurs bannis', {
                    error: err.message
                });
            }
            
            // Créer un embed pour afficher le statut
            const embed = new EmbedBuilder()
                .setTitle('Statut du système anti-studi')
                .setColor(config.is_enabled ? '#00ff00' : '#ff0000')
                .addFields(
                    {
                        name: 'Statut',
                        value: config.is_enabled ? '**Activé**' : '**Désactivé**',
                        inline: true
                    },
                    {
                        name: 'Infractions maximales',
                        value: \`\${config.max_offenses}\`,
                        inline: true
                    },
                    {
                        name: 'Utilisateurs bannis',
                        value: \`\${bannedCount}\`,
                        inline: true
                    }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
            // Vérifier si l'interaction est dans un serveur avant de logger les détails du serveur
            const guildId = interaction.guild?.id || 'DM';
            
            Logger.info(\`Statut anti-studi consulté par \${interaction.user.tag}\`, {
                userId: interaction.user.id,
                guildId,
                status: config.is_enabled,
                max_offenses: config.max_offenses
            });
        } catch (error) {
            Logger.error('Erreur pour la commande studi_status', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id || 'DM'
            });
            
            await interaction.editReply({
                content: 'Une erreur est survenue lors de la vérification du statut.'
            });
        }
    }
};`;
        }
        
        // Écrire le contenu mis à jour, en remplaçant complètement le fichier
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ ${file} réécrit avec succès`);
        
    } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${file}:`, error);
    }
}

console.log('Traitement terminé.'); 