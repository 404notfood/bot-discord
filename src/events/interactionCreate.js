/**
 * @fileoverview Gestionnaire des interactions Discord
 */

import { Events } from 'discord.js';
import * as Logger from '../utils/logger.js';

/**
 * Gestionnaire d'événements pour les interactions Discord
 * @type {Object}
 */
export default {
  name: Events.InteractionCreate,
  
  /**
   * Fonction exécutée lorsqu'une interaction est créée
   * @param {Interaction} interaction - L'interaction Discord
   * @param {Client} client - Le client Discord
   */
  async execute(interaction, client) {
    try {
      // Journaliser l'interaction reçue
      Logger.debug('Interaction reçue', {
        userId: interaction.user.id,
        guildId: interaction.guild?.id,
        channelId: interaction.channelId,
        type: interaction.type
      });
      
      // Traiter l'interaction selon son type
      if (interaction.isChatInputCommand()) {
        await handleCommandInteraction(interaction, client);
      } else if (interaction.isButton()) {
        await handleButtonInteraction(interaction, client);
      } else if (interaction.isSelectMenu()) {
        await handleSelectMenuInteraction(interaction, client);
      } else if (interaction.isModalSubmit()) {
        await handleModalSubmitInteraction(interaction, client);
      }
    } catch (error) {
      Logger.error('Erreur lors du traitement de l\'interaction', {
        error: error.message,
        interactionType: interaction.type,
        commandName: interaction.commandName
      });
      
      // Informer l'utilisateur de l'erreur si nécessaire
      try {
        if (!interaction.replied && !interaction.deferred) {
          try {
            await interaction.reply({
              content: 'Une erreur est survenue lors du traitement de cette interaction.',
              ephemeral: true
            });
          } catch (replyError) {
            // Ignorer les erreurs spécifiques
            if (!replyError.message.includes('Unknown interaction') && 
                !replyError.message.includes('already been acknowledged')) {
              Logger.error('Erreur lors de la réponse d\'erreur', {
                error: replyError.message
              });
            }
          }
        } else if (!interaction.replied) {
          await interaction.editReply({
            content: 'Une erreur est survenue lors du traitement de cette interaction.'
          });
        }
      } catch (finalError) {
        // Dernière ligne de défense
        Logger.error('Erreur catastrophique lors de la gestion d\'erreur', {
          error: finalError.message
        });
      }
    }
  }
};

/**
 * Gère les interactions de type commande
 * @param {ChatInputCommandInteraction} interaction - L'interaction de commande
 * @param {Client} client - Le client Discord
 */
async function handleCommandInteraction(interaction, client) {
  // Récupérer la commande
  const command = client.commands.get(interaction.commandName);
  
  if (!command) {
    Logger.warn(`Commande ${interaction.commandName} non trouvée`, {
      userId: interaction.user.id
    });
    
    return interaction.reply({
      content: `La commande /${interaction.commandName} n'existe pas ou n'est pas chargée.`,
      ephemeral: true
    });
  }
  
  Logger.debug(`Exécution de la commande ${interaction.commandName}`, {
    userId: interaction.user.id,
    options: interaction.options.data
  });
  
  try {
    // Vérifier les permissions
    if (command.hasPermission && !(await command.hasPermission(interaction))) {
      return interaction.reply({
        content: 'Vous n\'avez pas les permissions nécessaires pour exécuter cette commande.',
        ephemeral: true
      });
    }
    
    // Différer la réponse pour éviter les timeouts
    await interaction.deferReply({
      ephemeral: command.ephemeral === true
    });
    
    // Exécuter la commande en utilisant la méthode disponible (execute ou run)
    if (typeof command.execute === 'function') {
      await command.execute(interaction);
    } else if (typeof command.run === 'function') {
      await command.run(interaction);
    } else {
      Logger.error(`La commande ${interaction.commandName} n'a pas de méthode d'exécution valide`);
      await interaction.editReply('Cette commande n\'est pas correctement configurée.');
    }
  } catch (cmdError) {
    // Gérer les erreurs spécifiques aux commandes
    Logger.error(`Erreur lors de l'exécution de la commande ${interaction.commandName}:`, {
      error: cmdError.message,
      userId: interaction.user.id
    });
    
    try {
      if (!interaction.replied) {
        await interaction.editReply('Une erreur est survenue lors de l\'exécution de cette commande.');
      }
    } catch (responseError) {
      // Ignorer les erreurs spécifiques
      if (!responseError.message.includes('Unknown interaction') && 
          !responseError.message.includes('already been acknowledged')) {
        Logger.error('Erreur lors de la réponse à l\'erreur de commande', {
          error: responseError.message
        });
      }
    }
  }
}

/**
 * Gère les interactions de type bouton
 * @param {ButtonInteraction} interaction - L'interaction de bouton
 * @param {Client} client - Le client Discord
 */
async function handleButtonInteraction(interaction, client) {
  const [category, action, ...params] = interaction.customId.split(':');
  
  Logger.debug(`Interaction de bouton reçue`, {
    userId: interaction.user.id,
    category,
    action
  });
  
  // Exemple de gestion de pagination
  if (category === 'pagination') {
    await handlePaginationButton(interaction, action, params);
  } else {
    await interaction.reply({
      content: 'Ce bouton n\'est pas pris en charge actuellement.',
      ephemeral: true
    });
  }
}

/**
 * Gère les interactions de type menu déroulant
 * @param {SelectMenuInteraction} interaction - L'interaction de menu déroulant
 * @param {Client} client - Le client Discord
 */
async function handleSelectMenuInteraction(interaction, client) {
  const selectedValues = interaction.values;
  
  Logger.debug(`Interaction de menu déroulant reçue`, {
    userId: interaction.user.id,
    selectedValues
  });
  
  await interaction.reply({
    content: 'Ce menu n\'est pas pris en charge actuellement.',
    ephemeral: true
  });
}

/**
 * Gère les interactions de type modal
 * @param {ModalSubmitInteraction} interaction - L'interaction de soumission de modal
 * @param {Client} client - Le client Discord
 */
async function handleModalSubmitInteraction(interaction, client) {
  Logger.debug(`Interaction de modal reçue`, {
    userId: interaction.user.id
  });
  
  await interaction.reply({
    content: 'Ce formulaire n\'est pas pris en charge actuellement.',
    ephemeral: true
  });
}

/**
 * Gère les boutons de pagination
 * @param {ButtonInteraction} interaction - L'interaction de bouton
 * @param {string} action - L'action à effectuer (next, prev, etc.)
 * @param {Array<string>} params - Les paramètres supplémentaires
 */
async function handlePaginationButton(interaction, action, params) {
  await interaction.reply({
    content: 'La pagination n\'est pas encore implémentée.',
    ephemeral: true
  });
}

// Ces fonctions seront implémentées plus tard dans des modules dédiés
async function handleConfirmationButton() {}
async function handleProjectButton() {}
async function handleTaskButton() {}
async function handleProjectSelect() {}
async function handleTaskSelect() {}
async function handleMemberSelect() {}
async function handleProjectModal() {}
async function handleTaskModal() {}
async function handleSubgroupModal() {} 