/**
 * @fileoverview Utilitaire pour gérer le cache des langages de programmation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as db from './db.js';
import * as Logger from './logger.js';

// Obtenir l'équivalent de __dirname pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Classe utilitaire pour gérer le cache des langages de programmation disponibles
 */
class LanguageCache {
    /**
     * Chemin vers le fichier de cache des langages
     */
    static get CACHE_FILE() {
        return path.join(__dirname, '../cache/languages.json');
    }

    /**
     * Met à jour le cache des langages à partir de la base de données
     * @returns {Promise<Array>} Liste des langages mis en cache
     */
    static async updateCache() {
        try {
            // Récupérer les langages depuis la colonne language
            const languageQuery = `
                SELECT DISTINCT language 
                FROM resources 
                WHERE language IS NOT NULL AND is_active = 1
            `;
            const [languageRows] = await db.query(languageQuery);
            const languagesFromColumn = languageRows.map(row => row.language).filter(Boolean);

            // Récupérer les langages depuis les noms des ressources
            const nameQuery = `
                SELECT name 
                FROM resources 
                WHERE is_active = 1
            `;
            const [nameRows] = await db.query(nameQuery);
            
            // Analyse des noms pour extraire des langages potentiels
            const languagesFromNames = [];
            const languagePatterns = [
                { pattern: /PHP/i, value: 'php' },
                { pattern: /JavaScript/i, value: 'javascript' },
                { pattern: /TypeScript/i, value: 'typescript' },
                { pattern: /HTML/i, value: 'html' },
                { pattern: /CSS/i, value: 'css' },
                { pattern: /Java(?!\s*Script)/i, value: 'java' },
                { pattern: /Python/i, value: 'python' },
                { pattern: /C\s*#/i, value: 'csharp' },
                { pattern: /C\+\+/i, value: 'cpp' },
                { pattern: /React/i, value: 'react' },
                { pattern: /Angular/i, value: 'angular' },
                { pattern: /Vue(?:\.js)?/i, value: 'vue' },
                { pattern: /Node(?:\.js)?/i, value: 'nodejs' },
                { pattern: /SQL/i, value: 'sql' },
                { pattern: /Ruby/i, value: 'ruby' },
                { pattern: /Go(?:lang)?/i, value: 'go' },
                { pattern: /Swift/i, value: 'swift' },
                { pattern: /Kotlin/i, value: 'kotlin' },
                { pattern: /Rust/i, value: 'rust' },
                { pattern: /Scala/i, value: 'scala' },
                { pattern: /Docker/i, value: 'docker' },
                { pattern: /Kubernetes|K8s/i, value: 'kubernetes' },
                { pattern: /Git/i, value: 'git' },
                { pattern: /MongoDB/i, value: 'mongodb' },
                { pattern: /Redis/i, value: 'redis' },
                { pattern: /PostgreSQL/i, value: 'postgresql' },
                { pattern: /MySQL/i, value: 'mysql' },
                { pattern: /Express(?:\.js)?/i, value: 'express' },
                { pattern: /Laravel/i, value: 'laravel' },
                { pattern: /Django/i, value: 'django' },
                { pattern: /Flask/i, value: 'flask' },
                { pattern: /Spring(?:\s*Boot)?/i, value: 'spring' }
            ];

            nameRows.forEach(row => {
                languagePatterns.forEach(({ pattern, value }) => {
                    if (pattern.test(row.name) && !languagesFromNames.includes(value)) {
                        languagesFromNames.push(value);
                    }
                });
            });

            // Recherche des langages dans les fichiers de cache existants
            const cachePath = path.join(__dirname, '../cache');
            let cacheLanguages = [];
            
            if (fs.existsSync(cachePath)) {
                const cacheFiles = fs.readdirSync(cachePath);
                cacheFiles.forEach(file => {
                    if (file !== 'languages.json') {
                        const parts = file.toLowerCase().split('_');
                        if (parts.length > 0) {
                            const lang = parts[0].replace('.txt', '');
                            if (lang && !cacheLanguages.includes(lang)) {
                                cacheLanguages.push(lang);
                            }
                        }
                    }
                });
            }

            // Combiner tous les langages trouvés, supprimer les doublons et trier
            const allLanguages = [...new Set([
                ...languagesFromColumn,
                ...languagesFromNames,
                ...cacheLanguages
            ])].filter(Boolean).sort();

            // Enregistrer dans le fichier de cache
            // S'assurer que le dossier de cache existe
            if (!fs.existsSync(cachePath)) {
                fs.mkdirSync(cachePath, { recursive: true });
            }

            // Structure de données du cache
            const cacheData = {
                lastUpdate: new Date().toISOString(),
                languages: allLanguages,
                count: allLanguages.length
            };

            // Écrire dans le fichier cache
            fs.writeFileSync(
                this.CACHE_FILE,
                JSON.stringify(cacheData, null, 2),
                'utf8'
            );

            Logger.info(`Cache des langages mis à jour avec ${allLanguages.length} langages.`);
            return allLanguages;
        } catch (error) {
            Logger.error('Erreur lors de la mise à jour du cache des langages:', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Récupère la liste des langages depuis le cache ou met à jour le cache si nécessaire
     * @param {boolean} forceUpdate - Force la mise à jour du cache même s'il existe déjà
     * @returns {Promise<Array>} Liste des langages disponibles
     */
    static async getLanguages(forceUpdate = false) {
        try {
            // Vérifier si le cache existe et s'il faut le mettre à jour
            if (forceUpdate || !fs.existsSync(this.CACHE_FILE)) {
                return await this.updateCache();
            }

            // Lire le fichier de cache
            const cacheContent = fs.readFileSync(this.CACHE_FILE, 'utf8');
            const cacheData = JSON.parse(cacheContent);

            // Vérifier si le cache est obsolète (plus de 24h)
            const lastUpdate = new Date(cacheData.lastUpdate);
            const now = new Date();
            const diffHours = (now - lastUpdate) / (1000 * 60 * 60);

            if (diffHours > 24) {
                return await this.updateCache();
            }

            return cacheData.languages;
        } catch (error) {
            Logger.error('Erreur lors de la récupération du cache des langages:', {
                error: error.message,
                stack: error.stack
            });
            
            // En cas d'erreur, essayer de mettre à jour le cache
            return await this.updateCache();
        }
    }
}

export { LanguageCache as default, LanguageCache }; 