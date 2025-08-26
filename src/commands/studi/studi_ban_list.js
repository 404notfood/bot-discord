/**
 * @file studi_ban_list.js
 * @description Commande pour lister les utilisateurs bannis du système anti-Studi
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import * as Logger from '../../utils/logger.js';
import { ErrorHandler } from '../../utils/ErrorHandler.js';

export default {
    data: new SlashCommandBuilder()
        .setName('studi_ban_list')
        .setDescription('Affiche la liste des utilisateurs bannis du système anti-Studi')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addIntegerOption(option =>
            option
                .setName('page')
                .setDescription('Numéro de page (défaut: 1)')
                .setMinValue(1)
        )
        .addBooleanOption(option =>
            option
                .setName('show_expired')
                .setDescription('Afficher aussi les bans expirés')
        ),

    // Permissions requises pour cette commande
    permissions: ['studi.view_logs'],
    category: 'studi',

    async execute(interaction) {
        try {
            const page = interaction.options.getInteger('page') || 1;
            const showExpired = interaction.options.getBoolean('show_expired') || false;
            
            // Vérifier que le service de base de données est disponible
            if (!interaction.client.databaseManager || !interaction.client.databaseManager.isAvailable()) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('❌ Erreur')
                            .setDescription('La base de données n\'est pas disponible.')
                            .setColor('#e74c3c')
                            .setTimestamp()
                    ],
                    ephemeral: true
                });
            }

            // Construire la requête
            let whereClause = '1=1';
            let params = [];
            
            if (!showExpired) {
                whereClause += ' AND (expires_at IS NULL OR expires_at > NOW())';
            }

            // Compter le total
            const countResult = await interaction.client.databaseManager.query(
                `SELECT COUNT(*) as total FROM studi_banned_users WHERE ${whereClause}`,
                params
            );
            const total = countResult[0].total;

            if (total === 0) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('📋 Liste des utilisateurs bannis Studi')
                            .setDescription('Aucun utilisateur banni trouvé.')
                            .setColor('#2ecc71')
                            .setTimestamp()
                    ],
                    ephemeral: true
                });
            }

            // Pagination
            const perPage = 10;
            const totalPages = Math.ceil(total / perPage);
            const offset = (page - 1) * perPage;

            if (page > totalPages) {
                return await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle('❌ Page invalide')
                            .setDescription(`Page ${page} n'existe pas. Il y a ${totalPages} page(s) au total.`)
                            .setColor('#e74c3c')
                            .setTimestamp()
                    ],
                    ephemeral: true
                });
            }

            // Récupérer les utilisateurs bannis
            const bannedUsers = await interaction.client.databaseManager.query(
                `SELECT 
                    user_id, 
                    username, 
                    reason, 
                    banned_by, 
                    banned_at, 
                    expires_at,
                    is_active
                FROM studi_banned_users 
                WHERE ${whereClause}
                ORDER BY banned_at DESC 
                LIMIT ? OFFSET ?`,
                [...params, perPage, offset]
            );

            // Créer l'embed
            const embed = new EmbedBuilder()
                .setTitle('📋 Liste des utilisateurs bannis Studi')
                .setColor('#e74c3c')
                .setTimestamp()
                .setFooter({ 
                    text: `Page ${page}/${totalPages} • ${total} utilisateur(s) banni(s) au total` 
                });

            // Ajouter les utilisateurs à l'embed
            for (const user of bannedUsers) {
                const status = user.is_active ? '🟢 Actif' : '🔴 Inactif';
                const expiration = user.expires_at ? 
                    `<t:${Math.floor(new Date(user.expires_at).getTime() / 1000)}:R>` : 
                    'Permanent';
                
                embed.addFields({
                    name: `${user.username} (${status})`,
                    value: `**ID:** <@${user.user_id}>\n` +
                           `**Raison:** ${user.reason || 'Aucune raison spécifiée'}\n` +
                           `**Banni par:** <@${user.banned_by}>\n` +
                           `**Banni le:** <t:${Math.floor(new Date(user.banned_at).getTime() / 1000)}:F>\n` +
                           `**Expire:** ${expiration}`,
                    inline: false
                });
            }

            // Ajouter des informations sur la pagination
            if (totalPages > 1) {
                embed.addFields({
                    name: '📄 Navigation',
                    value: `Utilisez \`/studi_ban_list page:${page + 1}\` pour la page suivante\n` +
                           `Utilisez \`/studi_ban_list page:${page - 1}\` pour la page précédente`,
                    inline: false
                });
            }

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

            Logger.info('Commande studi_ban_list exécutée', {
                userId: interaction.user.id,
                guildId: interaction.guild?.id,
                page,
                totalResults: total
            });

        } catch (error) {
            Logger.error('Erreur lors de l\'exécution de studi_ban_list:', {
                error: error.message,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });

            await ErrorHandler.handleError(interaction, error, 'Impossible de récupérer la liste des utilisateurs bannis');
        }
    }
};
