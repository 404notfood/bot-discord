/**
 * Commande pour afficher le statut du système anti-Studi
 */

import { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import * as StudiService from '../../services/EnhancedStudiService.js';
import * as Logger from '../../utils/logger.js';

const data = new SlashCommandBuilder()
    .setName('studi_status')
    .setDescription('Afficher le statut du système anti-Studi');

async function execute(interaction) {
    try {
        // Vérifier les permissions
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return await interaction.reply({
                content: '❌ Vous n\'avez pas les permissions pour utiliser cette commande.',
                ephemeral: true
            });
        }

        const status = StudiService.getStatus();
        const stats = StudiService.getStats();

        const embed = new EmbedBuilder()
            .setTitle('🛡️ Statut du Système Anti-Studi')
            .setColor(status.active ? 0x00ff00 : 0xff0000)
            .addFields(
                {
                    name: '📊 Statut',
                    value: status.active ? '✅ Actif' : '❌ Inactif',
                    inline: true
                },
                {
                    name: '👥 Utilisateurs surveillés',
                    value: stats.monitored.toString(),
                    inline: true
                },
                {
                    name: '🚫 Actions de modération',
                    value: stats.moderationActions.toString(),
                    inline: true
                },
                {
                    name: '⏰ Dernière vérification',
                    value: status.lastCheck ? `<t:${Math.floor(status.lastCheck.getTime() / 1000)}:R>` : 'Jamais',
                    inline: false
                }
            )
            .setTimestamp()
            .setFooter({ text: 'Système Anti-Studi v4.2.a' });

        await interaction.reply({ embeds: [embed] });

        Logger.info('Commande studi_status exécutée', {
            user: interaction.user.username,
            guild: interaction.guild.name
        });

    } catch (error) {
        Logger.error('Erreur dans studi_status:', {
            error: error.message,
            user: interaction.user.username,
            guild: interaction.guild?.name
        });

        await interaction.reply({
            content: '❌ Une erreur est survenue lors de l\'exécution de la commande.',
            ephemeral: true
        });
    }
}

export default {
    data,
    execute
};