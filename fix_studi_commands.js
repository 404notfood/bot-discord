/**
 * Script pour corriger les fichiers de commandes studi
 */

import fs from 'fs';

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
        console.log(`✅ ${file} mis à jour avec succès`);
        
    } catch (error) {
        console.error(`❌ Erreur lors du traitement de ${file}:`, error);
    }
}

console.log('Traitement terminé.'); 