/**
 * @file test.js
 * @description Commande de test pour vérifier que toutes les fonctionnalités du bot fonctionnent
 */

import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import * as Logger from '../../utils/logger.js';

export default {
  data: new SlashCommandBuilder()
      .setName('test')
      .setDescription('Test de toutes les fonctionnalités du bot.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addStringOption(option =>
          option.setName('component')
              .setDescription('Composant à tester')
              .setRequired(false)
              .addChoices(
                  { name: 'Base de données', value: 'database' },
                  { name: 'API Site Laravel', value: 'api' },
                  { name: 'Synchronisation Users', value: 'sync' },
                  { name: 'Services du Bot', value: 'services' },
                  { name: 'Tous les tests', value: 'all' }
              )
      ),
  
  async execute(interaction) {
    try {
      await interaction.deferReply();
      
      const component = interaction.options.getString('component') || 'all';
      const testResults = {
        passed: 0,
        failed: 0,
        tests: []
      };

      // Tests de base de données
      if (component === 'database' || component === 'all') {
        await testDatabase(interaction, testResults);
      }

      // Tests API Laravel
      if (component === 'api' || component === 'all') {
        await testLaravelApi(interaction, testResults);
      }

      // Tests synchronisation
      if (component === 'sync' || component === 'all') {
        await testUserSync(interaction, testResults);
      }

      // Tests services
      if (component === 'services' || component === 'all') {
        await testServices(interaction, testResults);
      }

      // Créer le rapport de test
      const embed = createTestReportEmbed(testResults, component);
      
      await interaction.editReply({ embeds: [embed] });
      
      Logger.info('Tests exécutés', {
        userId: interaction.user.id,
        component,
        passed: testResults.passed,
        failed: testResults.failed
      });
      
    } catch (error) {
      Logger.error('Erreur commande test:', {
        error: error.message,
        stack: error.stack,
        user: interaction.user.id
      });
      
      const content = 'Une erreur est survenue lors des tests.';
      
      if (interaction.deferred) {
        await interaction.editReply({ content });
      } else {
        await interaction.reply({ content, ephemeral: true });
      }
    }
  }
};

/**
 * Test de la base de données
 */
async function testDatabase(interaction, testResults) {
  const databaseManager = interaction.client.databaseManager;
  
  // Test 1: Connexion à la base de données
  try {
    if (databaseManager && databaseManager.isAvailable()) {
      testResults.tests.push({
        name: 'Connexion base de données',
        status: '✅ PASS',
        details: 'Connexion active et disponible'
      });
      testResults.passed++;
    } else {
      throw new Error('Base de données non disponible');
    }
  } catch (error) {
    testResults.tests.push({
      name: 'Connexion base de données',
      status: '❌ FAIL',
      details: error.message
    });
    testResults.failed++;
  }

  // Test 2: Requête simple
  try {
    const result = await databaseManager.query('SELECT 1 as test');
    if (result && result.length > 0) {
      testResults.tests.push({
        name: 'Requête simple',
        status: '✅ PASS',
        details: 'SELECT 1 exécuté avec succès'
      });
      testResults.passed++;
    } else {
      throw new Error('Résultat inattendu');
    }
  } catch (error) {
    testResults.tests.push({
      name: 'Requête simple',
      status: '❌ FAIL',
      details: error.message
    });
    testResults.failed++;
  }

  // Test 3: Vérification des tables principales
  try {
    const tables = await databaseManager.getTables();
    const requiredTables = [
      'bot_admins', 'bot_moderators', 'dashboard_members',
      'main_projects', 'moderation_logs', 'doc_resources'
    ];
    
    const missingTables = requiredTables.filter(table => !tables.includes(table));
    
    if (missingTables.length === 0) {
      testResults.tests.push({
        name: 'Tables principales',
        status: '✅ PASS',
        details: `${tables.length} tables trouvées`
      });
      testResults.passed++;
    } else {
      throw new Error(`Tables manquantes: ${missingTables.join(', ')}`);
    }
  } catch (error) {
    testResults.tests.push({
      name: 'Tables principales',
      status: '❌ FAIL',
      details: error.message
    });
    testResults.failed++;
  }
}

/**
 * Test de l'API Laravel
 */
async function testLaravelApi(interaction, testResults) {
  try {
    const apiUrl = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';
    const apiToken = process.env.API_SECRET_KEY;

    if (!apiToken) {
      throw new Error('Token API non configuré');
    }

    // Test 1: Health check
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Discord-Bot/1.0'
        }
      });

      if (response.ok) {
        const data = await response.json();
        testResults.tests.push({
          name: 'API Health Check',
          status: '✅ PASS',
          details: `Status: ${data.status || 'OK'}`
        });
        testResults.passed++;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      testResults.tests.push({
        name: 'API Health Check',
        status: '❌ FAIL',
        details: error.message
      });
      testResults.failed++;
    }

    // Test 2: API authentifiée
    try {
      const fetch = (await import('node-fetch')).default;
      const response = await fetch(`${apiUrl}/discord/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Token': apiToken,
          'User-Agent': 'Discord-Bot/1.0'
        }
      });

      if (response.ok) {
        testResults.tests.push({
          name: 'API Authentification',
          status: '✅ PASS',
          details: 'Token API valide'
        });
        testResults.passed++;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      testResults.tests.push({
        name: 'API Authentification',
        status: '❌ FAIL',
        details: error.message
      });
      testResults.failed++;
    }

  } catch (error) {
    testResults.tests.push({
      name: 'Configuration API',
      status: '❌ FAIL',
      details: error.message
    });
    testResults.failed++;
  }
}

/**
 * Test de synchronisation des utilisateurs
 */
async function testUserSync(interaction, testResults) {
  const databaseManager = interaction.client.databaseManager;

  if (!databaseManager || !databaseManager.isAvailable()) {
    testResults.tests.push({
      name: 'Test Synchronisation',
      status: '❌ FAIL',
      details: 'Base de données non disponible'
    });
    testResults.failed++;
    return;
  }

  // Test 1: Compter les admins
  try {
    const adminCount = await databaseManager.query('SELECT COUNT(*) as count FROM bot_admins');
    const moderatorCount = await databaseManager.query('SELECT COUNT(*) as count FROM bot_moderators');
    const memberCount = await databaseManager.query('SELECT COUNT(*) as count FROM dashboard_members');

    testResults.tests.push({
      name: 'Comptage Users',
      status: '✅ PASS',
      details: `Admins: ${adminCount[0]?.count || 0}, Mods: ${moderatorCount[0]?.count || 0}, Membres: ${memberCount[0]?.count || 0}`
    });
    testResults.passed++;
  } catch (error) {
    testResults.tests.push({
      name: 'Comptage Users',
      status: '❌ FAIL',
      details: error.message
    });
    testResults.failed++;
  }

  // Test 2: Vérifier les relations
  try {
    const result = await databaseManager.query(`
      SELECT 
        (SELECT COUNT(*) FROM bot_admins ba WHERE EXISTS(SELECT 1 FROM dashboard_members dm WHERE dm.discord_id = ba.user_id)) as admins_synced,
        (SELECT COUNT(*) FROM bot_moderators bm WHERE EXISTS(SELECT 1 FROM dashboard_members dm WHERE dm.discord_id = bm.user_id)) as mods_synced
    `);

    if (result && result.length > 0) {
      testResults.tests.push({
        name: 'Relations Users',
        status: '✅ PASS',
        details: `Admins sync: ${result[0].admins_synced}, Mods sync: ${result[0].mods_synced}`
      });
      testResults.passed++;
    } else {
      throw new Error('Aucun résultat');
    }
  } catch (error) {
    testResults.tests.push({
      name: 'Relations Users',
      status: '❌ FAIL',
      details: error.message
    });
    testResults.failed++;
  }
}

/**
 * Test des services du bot
 */
async function testServices(interaction, testResults) {
  const client = interaction.client;

  // Test des services
  const services = [
    { name: 'MonitoringService', prop: 'monitoringService' },
    { name: 'SchedulerService', prop: 'schedulerService' },
    { name: 'DatabaseSyncService', prop: 'databaseSyncService' },
    { name: 'AntiStudiService', prop: 'antiStudiService' },
    { name: 'AutoModerationService', prop: 'autoModerationService' }
  ];

  for (const service of services) {
    const serviceInstance = client[service.prop];
    
    if (serviceInstance && serviceInstance.active) {
      testResults.tests.push({
        name: service.name,
        status: '✅ PASS',
        details: `Actif depuis: ${serviceInstance.startedAt ? new Date(serviceInstance.startedAt).toLocaleString() : 'N/A'}`
      });
      testResults.passed++;
    } else if (serviceInstance) {
      testResults.tests.push({
        name: service.name,
        status: '⚠️ WARN',
        details: 'Service inactif'
      });
    } else {
      testResults.tests.push({
        name: service.name,
        status: '❌ FAIL',
        details: 'Service non initialisé'
      });
      testResults.failed++;
    }
  }
}

/**
 * Créer l'embed du rapport de test
 */
function createTestReportEmbed(testResults, component) {
  const totalTests = testResults.passed + testResults.failed;
  const successRate = totalTests > 0 ? Math.round((testResults.passed / totalTests) * 100) : 0;

  const embed = new EmbedBuilder()
    .setTitle('🧪 Rapport de Tests')
    .setColor(testResults.failed === 0 ? '#2ecc71' : successRate >= 80 ? '#f39c12' : '#e74c3c')
    .setTimestamp();

  // Résumé
  embed.addFields({
    name: '📊 Résumé',
    value: `**Tests:** ${totalTests}\n**Réussis:** ${testResults.passed} ✅\n**Échoués:** ${testResults.failed} ❌\n**Taux de réussite:** ${successRate}%`,
    inline: true
  });

  embed.addFields({
    name: '🎯 Composant testé',
    value: component === 'all' ? 'Tous les composants' : component,
    inline: true
  });

  // Détails des tests (limité à 25 tests pour éviter la limite Discord)
  const testsToShow = testResults.tests.slice(0, 20);
  if (testsToShow.length > 0) {
    const testDetails = testsToShow
      .map(test => `${test.status} **${test.name}**\n${test.details}`)
      .join('\n\n');

    embed.addFields({
      name: '📝 Détails des Tests',
      value: testDetails.length > 1000 ? testDetails.substring(0, 997) + '...' : testDetails,
      inline: false
    });
  }

  if (testResults.tests.length > 20) {
    embed.addFields({
      name: 'ℹ️ Information',
      value: `${testResults.tests.length - 20} tests supplémentaires non affichés`,
      inline: false
    });
  }

  // Status global
  if (testResults.failed === 0) {
    embed.setDescription('✅ **Tous les tests sont passés avec succès !**');
  } else if (successRate >= 80) {
    embed.setDescription('⚠️ **La plupart des tests sont passés, quelques problèmes détectés.**');
  } else {
    embed.setDescription('❌ **Plusieurs tests ont échoué, vérification nécessaire.**');
  }

  return embed;
}