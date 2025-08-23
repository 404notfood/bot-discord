/**
 * Commande pour initialiser les tables du système anti-studi
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as db from '../../utils/db.js';
import * as Logger from '../../utils/logger.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Obtenir le chemin du fichier SQL
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const sqlFilePath = join(__dirname, '../../db/studi_tables.sql');

const command = new SlashCommandBuilder()
    .setName('studi_db_init')
    .setDescription('Initialiser les tables du système anti-studi.')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export default {
    data: command,
    
    async execute(interaction) {
        try {
            await interaction.editReply('Initialisation des tables du système anti-studi...');
            
            // Lire le fichier SQL
            let sqlContent;
            try {
                sqlContent = await fs.readFile(sqlFilePath, 'utf8');
            } catch (error) {
                Logger.error('Erreur lors de la lecture du fichier SQL', {
                    error: error.message,
                    file: sqlFilePath
                });
                
                await interaction.editReply('Erreur: Fichier SQL non trouvé. Contactez l\'administrateur.');
                return;
            }
            
            // Séparer les requêtes SQL
            const queries = sqlContent
                .split(';')
                .map(query => query.trim())
                .filter(query => query.length > 0);
            
            // Exécuter chaque requête
            let results = [];
            for (const query of queries) {
                try {
                    await db.query(query);
                    results.push(`✅ Requête exécutée avec succès: ${query.substring(0, 50)}...`);
                } catch (error) {
                    results.push(`❌ Erreur pour la requête: ${query.substring(0, 50)}... - ${error.message}`);
                    Logger.error('Erreur lors de l\'exécution d\'une requête SQL', {
                        error: error.message,
                        query: query.substring(0, 200)
                    });
                }
            }
            
            // Vérifier l'existence des tables
            const [tables] = await db.query(
                `SELECT TABLE_NAME FROM information_schema.TABLES 
                WHERE TABLE_SCHEMA = DATABASE() 
                AND TABLE_NAME IN ('studi_config', 'studi_banned_users', 'studi_offenders')`
            );
            
            const existingTables = tables.map(row => row.TABLE_NAME);
            
            const message = `
Initialisation des tables terminée.

Tables existantes: ${existingTables.join(', ') || 'Aucune'}

Résultats détaillés:
${results.join('\n')}
            `;
            
            await interaction.editReply(message);
            
            Logger.info('Initialisation des tables du système anti-studi', {
                userId: interaction.user.id,
                guildId: interaction.guild.id,
                tables: existingTables
            });
        } catch (error) {
            Logger.error('Erreur lors de l\'initialisation des tables', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            
            await interaction.editReply('Une erreur est survenue lors de l\'initialisation des tables.');
        }
    }
}; 