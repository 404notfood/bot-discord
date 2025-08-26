/**
 * @file tuto.js
 * @description Commande pour afficher des tutoriels
 */

import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';

export default {
    data: new SlashCommandBuilder()
        .setName('tuto')
        .setDescription('Affiche des tutoriels et guides d\'utilisation')
        .addStringOption(option =>
            option
                .setName('sujet')
                .setDescription('Sujet du tutoriel')
                .addChoices(
                    { name: 'Commandes de base', value: 'base' },
                    { name: 'Gestion des projets', value: 'projects' },
                    { name: 'Système anti-Studi', value: 'studi' },
                    { name: 'Permissions', value: 'permissions' },
                    { name: 'Modération', value: 'moderation' }
                )
        ),

    category: 'general',

    async execute(interaction) {
        try {
            const sujet = interaction.options.getString('sujet') || 'base';

            const embed = new EmbedBuilder()
                .setTitle('📚 Tutoriels et Guides')
                .setColor('#3498db')
                .setTimestamp();

            switch (sujet) {
                case 'base':
                    embed.setDescription('**Commandes de base du bot**')
                        .addFields(
                            { 
                                name: '🔍 Recherche et aide', 
                                value: '`/aide` - Affiche toutes les commandes disponibles\n' +
                                       '`/docs` - Recherche dans la documentation\n' +
                                       '`/tuto` - Affiche ce guide de tutoriels' 
                            },
                            { 
                                name: '📊 Informations', 
                                value: '`/stats` - Statistiques du serveur\n' +
                                       '`/ping` - Latence du bot\n' +
                                       '`/userinfo` - Informations sur un utilisateur' 
                            }
                        );
                    break;

                case 'projects':
                    embed.setDescription('**Gestion des projets**')
                        .addFields(
                            { 
                                name: '📋 Création et gestion', 
                                value: '`/create_project` - Créer un nouveau projet\n' +
                                       '`/list_projects` - Voir tous les projets\n' +
                                       '`/project_info` - Détails d\'un projet' 
                            },
                            { 
                                name: '👥 Sous-groupes', 
                                value: '`/create_subgroup` - Créer un sous-groupe\n' +
                                       '`/add_to_subgroup` - Ajouter un membre\n' +
                                       '`/list_subgroups` - Voir les sous-groupes' 
                            },
                            { 
                                name: '🔗 Intégrations', 
                                value: '`/add_integration` - Ajouter GitHub/Trello\n' +
                                       '`/list_integrations` - Voir les intégrations' 
                            }
                        );
                    break;

                case 'studi':
                    embed.setDescription('**Système anti-Studi**')
                        .addFields(
                            { 
                                name: '⚙️ Configuration', 
                                value: '`/studi_config` - Configurer le système\n' +
                                       '`/studi_status` - État du système\n' +
                                       '`/studi_dashboard` - Dashboard complet' 
                            },
                            { 
                                name: '🛡️ Gestion des bans', 
                                value: '`/studi_ban_add` - Bannir un utilisateur\n' +
                                       '`/studi_ban_remove` - Débannir un utilisateur\n' +
                                       '`/studi_ban_list` - Liste des bannis' 
                            },
                            { 
                                name: '✅ Whitelist', 
                                value: '`/studi_whitelist` - Gérer les exemptions\n' +
                                       '`/studi_whitelist add` - Ajouter à la whitelist\n' +
                                       '`/studi_whitelist remove` - Retirer de la whitelist' 
                            }
                        );
                    break;

                case 'permissions':
                    embed.setDescription('**Gestion des permissions**')
                        .addFields(
                            { 
                                name: '👑 Administrateurs', 
                                value: '`/add_admin` - Ajouter un administrateur\n' +
                                       '`/remove_admin` - Retirer un administrateur\n' +
                                       '`/list_staff` - Voir l\'équipe' 
                            },
                            { 
                                name: '🛡️ Modérateurs', 
                                value: '`/addmoderator` - Ajouter un modérateur\n' +
                                       '`/remove_mod` - Retirer un modérateur' 
                            },
                            { 
                                name: '🔐 Rôles et permissions', 
                                value: '`/bot_roles` - Gérer les rôles\n' +
                                       '`/bot_permissions` - Gérer les permissions\n' +
                                       '`/user_permissions` - Permissions utilisateur' 
                            }
                        );
                    break;

                case 'moderation':
                    embed.setDescription('**Outils de modération**')
                        .addFields(
                            { 
                                name: '🚫 Bannissements', 
                                value: '`/ban_add` - Bannir un utilisateur\n' +
                                       '`/ban_remove` - Débannir un utilisateur\n' +
                                       '`/ban_list` - Liste des bannis' 
                            },
                            { 
                                name: '🔇 Timeouts', 
                                value: '`/timeout` - Mettre en timeout\n' +
                                       '`/untimeout` - Retirer le timeout' 
                            },
                            { 
                                name: '📝 Logs', 
                                value: '`/mod_logs` - Voir les logs de modération\n' +
                                       '`/audit_log` - Logs d\'audit' 
                            }
                        );
                    break;
            }

            // Ajouter des conseils généraux
            embed.addFields({
                name: '💡 Conseils',
                value: '• Utilisez `/aide` pour voir toutes les commandes\n' +
                       '• Les commandes admin nécessitent les permissions appropriées\n' +
                       '• Utilisez la pagination pour naviguer dans les longues listes\n' +
                       '• Les commandes sont sensibles à la casse',
                inline: false
            });

            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });

            Logger.info('Commande tuto exécutée', {
                userId: interaction.user.id,
                guildId: interaction.guild?.id,
                sujet
            });

        } catch (error) {
            Logger.error('Erreur lors de l\'exécution de tuto:', {
                error: error.message,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('❌ Erreur')
                        .setDescription('Impossible d\'afficher le tutoriel.')
                        .setColor('#e74c3c')
                        .setTimestamp()
                ],
                ephemeral: true
            });
        }
    }
};
