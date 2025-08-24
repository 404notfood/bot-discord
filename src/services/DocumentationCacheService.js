/**
 * Service de cache pour la documentation et les ressources
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as Logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DocumentationCacheService {
    /**
     * Initialise le service de cache documentation
     * @param {DatabaseManager} databaseManager - Gestionnaire de base de données
     */
    constructor(databaseManager) {
        this.databaseManager = databaseManager;
        this.cacheDir = path.join(__dirname, '../cache');
        this.languagesCacheFile = path.join(this.cacheDir, 'languages.json');
        this.resourcesCacheFile = path.join(this.cacheDir, 'resources.json');
        
        // Cache en mémoire
        this.languagesCache = new Map();
        this.resourcesCache = new Map();
        
        // TTL des caches (1 heure)
        this.cacheTTL = 3600000;
        this.lastCacheUpdate = {
            languages: 0,
            resources: 0
        };
        
        this.stats = {
            cacheHits: 0,
            cacheMisses: 0,
            updates: 0,
            errors: 0
        };

        // S'assurer que le dossier cache existe
        this.ensureCacheDirectory();
    }

    /**
     * S'assure que le dossier cache existe
     */
    ensureCacheDirectory() {
        if (!fs.existsSync(this.cacheDir)) {
            fs.mkdirSync(this.cacheDir, { recursive: true });
            Logger.info('Dossier cache créé:', this.cacheDir);
        }
    }

    /**
     * Initialise le service
     * @returns {Promise<boolean>}
     */
    async initialize() {
        try {
            Logger.info('📚 Initialisation du service de cache documentation...');
            
            // Charger les caches depuis les fichiers
            await this.loadCachesFromFiles();
            
            // Mettre à jour les caches si nécessaire
            await this.updateCachesIfNeeded();
            
            Logger.info('✅ Service de cache documentation initialisé');
            return true;

        } catch (error) {
            Logger.error('Erreur lors de l\'initialisation du cache documentation:', {
                error: error.message
            });
            return false;
        }
    }

    /**
     * Charge les caches depuis les fichiers
     */
    async loadCachesFromFiles() {
        try {
            // Charger le cache des langages
            if (fs.existsSync(this.languagesCacheFile)) {
                const languagesData = JSON.parse(fs.readFileSync(this.languagesCacheFile, 'utf8'));
                languagesData.forEach(lang => this.languagesCache.set(lang.toLowerCase(), lang));
            }

            // Charger le cache des ressources
            if (fs.existsSync(this.resourcesCacheFile)) {
                const resourcesData = JSON.parse(fs.readFileSync(this.resourcesCacheFile, 'utf8'));
                resourcesData.forEach(resource => this.resourcesCache.set(resource.id, resource));
            }

        } catch (error) {
            Logger.error('Erreur lors du chargement des caches:', { error: error.message });
        }
    }

    /**
     * Met à jour les caches si nécessaire
     */
    async updateCachesIfNeeded() {
        const now = Date.now();
        
        // Mettre à jour les langages
        if (now - this.lastCacheUpdate.languages > this.cacheTTL) {
            await this.updateLanguagesCache();
        }
        
        // Mettre à jour les ressources
        if (now - this.lastCacheUpdate.resources > this.cacheTTL) {
            await this.updateResourcesCache();
        }
    }

    /**
     * Met à jour le cache des langages
     */
    async updateLanguagesCache() {
        if (!this.databaseManager?.isAvailable()) {
            Logger.warn('Base de données non disponible pour la mise à jour du cache langages');
            return;
        }

        try {
            // Récupérer les langages depuis la colonne language
            const languageRows = await this.databaseManager.query(`
                SELECT DISTINCT language 
                FROM resources 
                WHERE language IS NOT NULL AND is_active = 1
            `);
            
            const languagesFromColumn = languageRows.map(row => row.language).filter(Boolean);

            // Récupérer les langages depuis les noms des ressources
            const nameRows = await this.databaseManager.query(`
                SELECT name 
                FROM resources 
                WHERE is_active = 1
            `);
            
            // Analyse des noms pour extraire des langages potentiels
            const languagesFromNames = this.extractLanguagesFromNames(nameRows);
            
            // Combiner et dédupliquer
            const allLanguages = [...new Set([...languagesFromColumn, ...languagesFromNames])]
                .filter(lang => lang && lang.trim())
                .map(lang => lang.trim())
                .sort();

            // Mettre à jour le cache en mémoire
            this.languagesCache.clear();
            allLanguages.forEach(lang => this.languagesCache.set(lang.toLowerCase(), lang));

            // Sauvegarder dans le fichier
            fs.writeFileSync(this.languagesCacheFile, JSON.stringify(allLanguages, null, 2));
            
            this.lastCacheUpdate.languages = Date.now();
            this.stats.updates++;
            
            Logger.info('Cache des langages mis à jour:', {
                count: allLanguages.length,
                languages: allLanguages.slice(0, 10)
            });

        } catch (error) {
            Logger.error('Erreur lors de la mise à jour du cache langages:', {
                error: error.message
            });
            this.stats.errors++;
        }
    }

    /**
     * Met à jour le cache des ressources
     */
    async updateResourcesCache() {
        if (!this.databaseManager?.isAvailable()) {
            Logger.warn('Base de données non disponible pour la mise à jour du cache ressources');
            return;
        }

        try {
            const resources = await this.databaseManager.query(`
                SELECT id, name, description, url, language, search_url, tutorial_url
                FROM resources 
                WHERE is_active = 1
                ORDER BY name
            `);

            // Mettre à jour le cache en mémoire
            this.resourcesCache.clear();
            resources.forEach(resource => this.resourcesCache.set(resource.id, resource));

            // Sauvegarder dans le fichier
            fs.writeFileSync(this.resourcesCacheFile, JSON.stringify(resources, null, 2));
            
            this.lastCacheUpdate.resources = Date.now();
            this.stats.updates++;
            
            Logger.info('Cache des ressources mis à jour:', {
                count: resources.length
            });

        } catch (error) {
            Logger.error('Erreur lors de la mise à jour du cache ressources:', {
                error: error.message
            });
            this.stats.errors++;
        }
    }

    /**
     * Extrait les langages potentiels depuis les noms de ressources
     * @param {Array} nameRows - Lignes contenant les noms
     * @returns {Array} - Liste des langages extraits
     */
    extractLanguagesFromNames(nameRows) {
        const commonLanguages = [
            'javascript', 'python', 'java', 'php', 'typescript', 'css', 'html',
            'react', 'vue', 'angular', 'node', 'nodejs', 'express',
            'mysql', 'mongodb', 'postgresql', 'docker', 'git', 'linux',
            'laravel', 'django', 'flask', 'bootstrap', 'jquery',
            'c++', 'c#', 'ruby', 'golang', 'rust', 'kotlin', 'swift'
        ];
        
        const extractedLanguages = [];
        
        nameRows.forEach(row => {
            const name = row.name.toLowerCase();
            commonLanguages.forEach(lang => {
                if (name.includes(lang)) {
                    extractedLanguages.push(lang);
                }
            });
        });

        return [...new Set(extractedLanguages)];
    }

    /**
     * Récupère tous les langages depuis le cache
     * @returns {Array} - Liste des langages
     */
    getLanguages() {
        if (this.languagesCache.size === 0) {
            this.stats.cacheMisses++;
            return [];
        }
        
        this.stats.cacheHits++;
        return Array.from(this.languagesCache.values());
    }

    /**
     * Recherche des ressources par langage
     * @param {string} language - Langage recherché
     * @returns {Array} - Ressources correspondantes
     */
    getResourcesByLanguage(language) {
        const resources = Array.from(this.resourcesCache.values());
        const filtered = resources.filter(resource => 
            resource.language?.toLowerCase().includes(language.toLowerCase()) ||
            resource.name.toLowerCase().includes(language.toLowerCase())
        );
        
        if (filtered.length > 0) {
            this.stats.cacheHits++;
        } else {
            this.stats.cacheMisses++;
        }
        
        return filtered;
    }

    /**
     * Recherche de ressources par terme
     * @param {string} term - Terme de recherche
     * @returns {Array} - Ressources correspondantes
     */
    searchResources(term) {
        const resources = Array.from(this.resourcesCache.values());
        const searchTerm = term.toLowerCase();
        
        const filtered = resources.filter(resource => 
            resource.name.toLowerCase().includes(searchTerm) ||
            resource.description?.toLowerCase().includes(searchTerm) ||
            resource.language?.toLowerCase().includes(searchTerm)
        );
        
        if (filtered.length > 0) {
            this.stats.cacheHits++;
        } else {
            this.stats.cacheMisses++;
        }
        
        return filtered;
    }

    /**
     * Force la mise à jour des caches
     */
    async forceUpdate() {
        this.lastCacheUpdate.languages = 0;
        this.lastCacheUpdate.resources = 0;
        await this.updateCachesIfNeeded();
    }

    /**
     * Récupère les statistiques du service
     * @returns {Object} - Statistiques
     */
    getStats() {
        return {
            ...this.stats,
            languagesCount: this.languagesCache.size,
            resourcesCount: this.resourcesCache.size,
            lastUpdate: {
                languages: new Date(this.lastCacheUpdate.languages),
                resources: new Date(this.lastCacheUpdate.resources)
            }
        };
    }

    /**
     * Arrêt propre du service
     */
    async shutdown() {
        Logger.info('🔽 Arrêt du service de cache documentation...');
        // Sauvegarder les caches une dernière fois si nécessaire
    }
}