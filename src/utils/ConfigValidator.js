/**
 * Validateur de configuration pour vérifier l'intégrité du setup
 */

import fs from 'fs';
import path from 'path';
import * as Logger from './logger.js';

export class ConfigValidator {
    constructor() {
        this.validationResults = {
            passed: [],
            warnings: [],
            errors: [],
            criticalErrors: []
        };
    }

    /**
     * Valide toute la configuration du bot
     * @returns {Object} Résultats de validation
     */
    async validateAll() {
        Logger.info('🔍 Démarrage de la validation de configuration...');

        // Reset des résultats
        this.validationResults = {
            passed: [],
            warnings: [],
            errors: [],
            criticalErrors: []
        };

        // Exécuter toutes les validations
        await this.validateEnvironment();
        await this.validateFileStructure();
        await this.validateDependencies();
        await this.validatePermissions();
        await this.validateDatabase();
        await this.validateSecurity();

        // Log des résultats
        this.logValidationResults();

        return {
            ...this.validationResults,
            isValid: this.validationResults.criticalErrors.length === 0,
            hasWarnings: this.validationResults.warnings.length > 0,
            summary: this.getValidationSummary()
        };
    }

    /**
     * Valide les variables d'environnement
     */
    async validateEnvironment() {
        const requiredEnvVars = {
            BOT_TOKEN: { required: true, minLength: 50 },
            CLIENT_ID: { required: true, pattern: /^\d+$/ },
            GUILD_ID: { required: false, pattern: /^\d+$/ }
        };

        const optionalEnvVars = {
            DB_HOST: { defaultValue: 'localhost' },
            DB_USER: { defaultValue: 'root' },
            DB_PASSWORD: { sensitive: true },
            DB_NAME: { defaultValue: 'discord_bot' },
            LOG_LEVEL: { defaultValue: 'INFO', allowedValues: ['DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'] }
        };

        // Vérifier les variables requises
        for (const [varName, config] of Object.entries(requiredEnvVars)) {
            const value = process.env[varName];

            if (!value) {
                if (config.required) {
                    this.validationResults.criticalErrors.push(`Variable d'environnement manquante: ${varName}`);
                } else {
                    this.validationResults.warnings.push(`Variable d'environnement optionnelle manquante: ${varName}`);
                }
                continue;
            }

            // Vérifier la longueur minimale
            if (config.minLength && value.length < config.minLength) {
                this.validationResults.errors.push(`${varName} trop court (min ${config.minLength} caractères)`);
                continue;
            }

            // Vérifier le pattern
            if (config.pattern && !config.pattern.test(value)) {
                this.validationResults.errors.push(`${varName} ne correspond pas au format attendu`);
                continue;
            }

            // Vérifier les valeurs dangereuses
            const dangerousValues = ['your_token_here', 'change_me', 'password', '123456'];
            if (dangerousValues.includes(value.toLowerCase())) {
                this.validationResults.criticalErrors.push(`${varName} utilise une valeur par défaut dangereuse`);
                continue;
            }

            this.validationResults.passed.push(`${varName} valide`);
        }

        // Vérifier les variables optionnelles
        for (const [varName, config] of Object.entries(optionalEnvVars)) {
            const value = process.env[varName];

            if (!value) {
                if (config.defaultValue) {
                    this.validationResults.warnings.push(`${varName} utilise la valeur par défaut: ${config.defaultValue}`);
                }
                continue;
            }

            if (config.allowedValues && !config.allowedValues.includes(value)) {
                this.validationResults.warnings.push(`${varName} valeur non recommandée: ${value}`);
            }
        }

        // Vérifier la cohérence de la configuration DB
        const dbVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
        const dbVarsPresent = dbVars.filter(varName => process.env[varName]);
        
        if (dbVarsPresent.length > 0 && dbVarsPresent.length < dbVars.length) {
            this.validationResults.warnings.push('Configuration de base de données incomplète');
        }
    }

    /**
     * Valide la structure des fichiers
     */
    async validateFileStructure() {
        const requiredPaths = [
            { path: 'src', type: 'directory', critical: true },
            { path: 'src/commands', type: 'directory', critical: true },
            { path: 'src/events', type: 'directory', critical: true },
            { path: 'src/utils', type: 'directory', critical: true },
            { path: 'src/managers', type: 'directory', critical: true },
            { path: 'src/middleware', type: 'directory', critical: true },
            { path: 'src/services', type: 'directory', critical: true },
            { path: 'src/index.js', type: 'file', critical: true },
            { path: 'src/DiscordBot.js', type: 'file', critical: true },
            { path: 'package.json', type: 'file', critical: true }
        ];

        const recommendedPaths = [
            { path: '.env', type: 'file' },
            { path: '.gitignore', type: 'file' },
            { path: 'README.md', type: 'file' },
            { path: 'logs', type: 'directory' },
            { path: 'cache', type: 'directory' }
        ];

        // Vérifier les chemins requis
        for (const { path: filePath, type, critical } of requiredPaths) {
            try {
                const stats = fs.statSync(filePath);
                const isCorrectType = type === 'directory' ? stats.isDirectory() : stats.isFile();

                if (isCorrectType) {
                    this.validationResults.passed.push(`Structure: ${filePath} OK`);
                } else {
                    const error = `${filePath} existe mais n'est pas un ${type}`;
                    if (critical) {
                        this.validationResults.criticalErrors.push(error);
                    } else {
                        this.validationResults.errors.push(error);
                    }
                }
            } catch (error) {
                const errorMsg = `Structure: ${filePath} manquant`;
                if (critical) {
                    this.validationResults.criticalErrors.push(errorMsg);
                } else {
                    this.validationResults.errors.push(errorMsg);
                }
            }
        }

        // Vérifier les chemins recommandés
        for (const { path: filePath, type } of recommendedPaths) {
            try {
                const stats = fs.statSync(filePath);
                const isCorrectType = type === 'directory' ? stats.isDirectory() : stats.isFile();

                if (isCorrectType) {
                    this.validationResults.passed.push(`Structure recommandée: ${filePath} OK`);
                } else {
                    this.validationResults.warnings.push(`${filePath} existe mais n'est pas un ${type}`);
                }
            } catch (error) {
                this.validationResults.warnings.push(`Structure recommandée: ${filePath} manquant`);
            }
        }
    }

    /**
     * Valide les dépendances
     */
    async validateDependencies() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            
            const requiredDependencies = {
                'discord.js': '^14.0.0',
                'node-cron': '^3.0.0',
                'dotenv': '^16.0.0',
                'mysql2': '^3.0.0'
            };

            // Vérifier les dépendances requises
            const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
            
            for (const [depName, expectedVersion] of Object.entries(requiredDependencies)) {
                if (!deps[depName]) {
                    this.validationResults.errors.push(`Dépendance manquante: ${depName}`);
                } else {
                    this.validationResults.passed.push(`Dépendance: ${depName} installée`);
                }
            }

            // Vérifier la version de Node.js
            const nodeVersion = process.version;
            const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
            
            if (majorVersion < 18) {
                this.validationResults.errors.push(`Version Node.js trop ancienne: ${nodeVersion} (min: v18.0.0)`);
            } else {
                this.validationResults.passed.push(`Version Node.js: ${nodeVersion} OK`);
            }

            // Vérifier les scripts essentiels
            const requiredScripts = ['start', 'dev'];
            const scripts = packageJson.scripts || {};
            
            for (const scriptName of requiredScripts) {
                if (!scripts[scriptName]) {
                    this.validationResults.warnings.push(`Script manquant dans package.json: ${scriptName}`);
                } else {
                    this.validationResults.passed.push(`Script: ${scriptName} défini`);
                }
            }

        } catch (error) {
            this.validationResults.criticalErrors.push(`Erreur lecture package.json: ${error.message}`);
        }
    }

    /**
     * Valide les permissions
     */
    async validatePermissions() {
        const pathsToCheck = [
            { path: 'logs', needsWrite: true, canCreate: true },
            { path: 'cache', needsWrite: true, canCreate: true },
            { path: '.env', needsRead: true, needsWrite: false },
            { path: 'src', needsRead: true, needsWrite: false }
        ];

        for (const { path: filePath, needsWrite, needsRead, canCreate } of pathsToCheck) {
            try {
                // Vérifier si le chemin existe
                await fs.promises.access(filePath, fs.constants.F_OK);
                
                // Vérifier les permissions de lecture
                if (needsRead) {
                    try {
                        await fs.promises.access(filePath, fs.constants.R_OK);
                        this.validationResults.passed.push(`Permissions lecture: ${filePath} OK`);
                    } catch {
                        this.validationResults.errors.push(`Permissions lecture manquantes: ${filePath}`);
                    }
                }

                // Vérifier les permissions d'écriture
                if (needsWrite) {
                    try {
                        await fs.promises.access(filePath, fs.constants.W_OK);
                        this.validationResults.passed.push(`Permissions écriture: ${filePath} OK`);
                    } catch {
                        this.validationResults.errors.push(`Permissions écriture manquantes: ${filePath}`);
                    }
                }

            } catch (error) {
                // Le chemin n'existe pas
                if (canCreate) {
                    try {
                        await fs.promises.mkdir(filePath, { recursive: true });
                        this.validationResults.passed.push(`Dossier créé: ${filePath}`);
                    } catch (createError) {
                        this.validationResults.errors.push(`Impossible de créer: ${filePath}`);
                    }
                } else {
                    this.validationResults.errors.push(`Chemin manquant: ${filePath}`);
                }
            }
        }
    }

    /**
     * Valide la configuration de la base de données
     */
    async validateDatabase() {
        if (!process.env.DB_HOST) {
            this.validationResults.warnings.push('Configuration base de données non définie (mode sans DB)');
            return;
        }

        // Vérifier que toutes les variables DB sont présentes
        const dbVars = ['DB_HOST', 'DB_USER', 'DB_NAME'];
        const missingVars = dbVars.filter(varName => !process.env[varName]);
        
        if (missingVars.length > 0) {
            this.validationResults.errors.push(`Variables DB manquantes: ${missingVars.join(', ')}`);
            return;
        }

        // Test de connexion basique (sans réellement se connecter)
        const host = process.env.DB_HOST;
        const port = process.env.DB_PORT || 3306;
        
        if (host === 'localhost' || host === '127.0.0.1') {
            this.validationResults.passed.push('Configuration DB: localhost détecté');
        } else {
            this.validationResults.passed.push(`Configuration DB: hôte distant ${host}`);
        }

        if (port !== '3306') {
            this.validationResults.warnings.push(`Port DB non standard: ${port}`);
        }
    }

    /**
     * Valide la sécurité
     */
    async validateSecurity() {
        // Vérifier l'environnement
        const nodeEnv = process.env.NODE_ENV;
        if (!nodeEnv) {
            this.validationResults.warnings.push('NODE_ENV non définie');
        } else if (nodeEnv === 'development') {
            this.validationResults.warnings.push('Environnement de développement (normal pour les tests)');
        } else if (nodeEnv === 'production') {
            this.validationResults.passed.push('Environnement de production configuré');
        }

        // Vérifier les permissions du fichier .env
        if (process.platform !== 'win32') {
            try {
                const stats = fs.statSync('.env');
                const permissions = (stats.mode & parseInt('777', 8)).toString(8);
                
                if (permissions === '600' || permissions === '644') {
                    this.validationResults.passed.push('Permissions .env sécurisées');
                } else {
                    this.validationResults.warnings.push(`Permissions .env trop permissives: ${permissions}`);
                }
            } catch (error) {
                // Fichier .env n'existe pas, déjà signalé ailleurs
            }
        }

        // Vérifier les tokens et mots de passe
        const sensitiveVars = {
            BOT_TOKEN: process.env.BOT_TOKEN,
            DB_PASSWORD: process.env.DB_PASSWORD
        };

        for (const [varName, value] of Object.entries(sensitiveVars)) {
            if (value) {
                // Vérifier que ce ne sont pas des valeurs par défaut
                const defaultValues = ['password', '123456', 'admin', 'root', 'changeme'];
                if (defaultValues.includes(value.toLowerCase())) {
                    this.validationResults.criticalErrors.push(`${varName} utilise une valeur par défaut non sécurisée`);
                } else if (value.length < 8) {
                    this.validationResults.warnings.push(`${varName} pourrait être trop court`);
                } else {
                    this.validationResults.passed.push(`${varName} semble sécurisé`);
                }
            }
        }

        // Vérifier si des fichiers sensibles sont exposés
        const sensitiveFiles = ['.env', 'config.json', 'secrets.json'];
        for (const filename of sensitiveFiles) {
            if (fs.existsSync(filename)) {
                this.validationResults.warnings.push(`Fichier sensible présent: ${filename} (vérifier .gitignore)`);
            }
        }
    }

    /**
     * Log les résultats de validation
     */
    logValidationResults() {
        const { passed, warnings, errors, criticalErrors } = this.validationResults;

        Logger.info(`✅ Validations réussies: ${passed.length}`);
        
        if (warnings.length > 0) {
            Logger.warn(`⚠️ Avertissements: ${warnings.length}`);
            warnings.forEach(warning => Logger.warn(`  - ${warning}`));
        }

        if (errors.length > 0) {
            Logger.error(`❌ Erreurs: ${errors.length}`);
            errors.forEach(error => Logger.error(`  - ${error}`));
        }

        if (criticalErrors.length > 0) {
            Logger.fatal(`🚨 Erreurs critiques: ${criticalErrors.length}`);
            criticalErrors.forEach(error => Logger.fatal(`  - ${error}`));
        }
    }

    /**
     * Génère un résumé de validation
     */
    getValidationSummary() {
        const { passed, warnings, errors, criticalErrors } = this.validationResults;
        const total = passed.length + warnings.length + errors.length + criticalErrors.length;

        return {
            total,
            passed: passed.length,
            warnings: warnings.length,
            errors: errors.length,
            criticalErrors: criticalErrors.length,
            successRate: total > 0 ? Math.round((passed.length / total) * 100) : 0
        };
    }

    /**
     * Vérifie si la configuration est prête pour la production
     */
    isProductionReady() {
        const { criticalErrors, errors } = this.validationResults;
        return criticalErrors.length === 0 && errors.length === 0;
    }
}