/**
 * @fileoverview Commande pour envoyer un rappel de bienveillance dans le canal
 */

import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import * as Logger from '../../utils/logger.js';

/**
 * Commande pour envoyer un rappel de bienveillance dans le canal
 */
export default {
    data: new SlashCommandBuilder()
        .setName('rappel')
        .setDescription('Envoie un rappel de bienveillance dans le canal.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addUserOption(option =>
            option.setName('membre')
                .setDescription('Le membre à mentionner (optionnel).')
                .setRequired(false)),
    async execute(interaction) {
        try {
            const member = interaction.options.getUser('membre');
            const message = `
Bonjour à toutes et à tous,

Merci de faire preuve de courtoisie et de bienveillance dans vos échanges. Ce qui se dit sur ce serveur reste sur ce serveur. Inutile de prêter attention à ceux qui cherchent à nuire : ne leur donnez pas d'importance, ignorez-les et restez au-dessus de ce genre de comportements.

Nous sommes ici pour nous entraider, pas pour créer des tensions ou des problèmes inutiles. Toute personne qui cherchera délibérément à envenimer la situation sera immédiatement exclue, sans autre avertissement.

🔔 Petit rappel important :
Nous ne sommes en aucun cas affiliés à Studi. Ce serveur est totalement indépendant et nous tenons à ce qu'il le reste !

Merci à toutes et à tous pour votre compréhension.
${member ? `\n\n${member.toString()}, ce message est pour toi aussi ! 😊` : ''}
            `;

            await interaction.editReply(message);
            
            Logger.info(`Rappel de bienveillance envoyé par ${interaction.user.tag}`, {
                userId: interaction.user.id,
                channelId: interaction.channel.id,
                guildId: interaction.guild.id,
                mentionedUser: member?.id
            });
        } catch (error) {
            Logger.error('Erreur lors de l\'envoi du rappel de bienveillance:', {
                error: error.message,
                stack: error.stack,
                userId: interaction.user.id,
                guildId: interaction.guild?.id
            });
            await interaction.editReply('Une erreur est survenue lors de l\'envoi du rappel.');
        }
    }
}; 