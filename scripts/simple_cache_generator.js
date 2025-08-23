/**
 * Script simplifié pour générer des fichiers de cache de documentation sans dépendre de la base de données
 * Exécuter avec: node scripts/simple_cache_generator.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fsPromises } from 'fs';

// Obtenir l'équivalent de __dirname pour ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Constantes
const CACHE_DIR = path.join(process.cwd(), 'src', 'cache');
const DOCS_PATH = path.join(CACHE_DIR, 'docs');

// Catégories pour organiser les ressources
const CATEGORIES = {
    'Frontend': ['HTML', 'CSS', 'JavaScript', 'React', 'Angular', 'Vue', 'SASS', 'Tailwind', 'Bootstrap', 'TypeScript', 'Webpack'],
    'Backend': ['PHP', 'Node.js', 'Express', 'Laravel', 'Symfony', 'Django', 'Flask', 'Spring', 'Ruby on Rails', 'ASP.NET'],
    'Database': ['MySQL', 'PostgreSQL', 'MongoDB', 'SQLite', 'Redis', 'Elasticsearch', 'SQL', 'NoSQL'],
    'DevOps': ['Docker', 'Kubernetes', 'Jenkins', 'CI/CD', 'Git', 'AWS', 'Azure', 'GCP', 'Terraform'],
    'Tools': ['VS Code', 'Git', 'JIRA', 'Postman', 'Chrome DevTools', 'NPM', 'Yarn', 'Webpack'],
    'Security': ['OWASP', 'OAuth', 'JWT', 'HTTPS', 'Encryption', 'Authentication', 'Authorization']
};

// Ressources prédéfinies
const RESOURCES = [
    // Frontend
    { name: 'HTML', description: 'Langage de balisage pour créer des pages web', url: 'https://developer.mozilla.org/fr/docs/Web/HTML', category: 'Frontend' },
    { name: 'CSS', description: 'Langage de style pour la mise en forme des pages web', url: 'https://developer.mozilla.org/fr/docs/Web/CSS', category: 'Frontend' },
    { name: 'JavaScript', description: 'Langage de programmation pour le développement web côté client', url: 'https://developer.mozilla.org/fr/docs/Web/JavaScript', category: 'Frontend' },
    { name: 'React', description: 'Bibliothèque JavaScript pour construire des interfaces utilisateur', url: 'https://fr.reactjs.org/docs/getting-started.html', category: 'Frontend' },
    { name: 'Angular', description: 'Framework pour applications web développé par Google', url: 'https://angular.io/docs', category: 'Frontend' },
    { name: 'Vue', description: 'Framework JavaScript progressif pour construire des interfaces utilisateur', url: 'https://fr.vuejs.org/v2/guide/', category: 'Frontend' },
    { name: 'SASS', description: 'Préprocesseur CSS qui ajoute des fonctionnalités avancées', url: 'https://sass-lang.com/documentation', category: 'Frontend' },
    { name: 'Tailwind', description: 'Framework CSS utilitaire pour un développement rapide', url: 'https://tailwindcss.com/docs', category: 'Frontend' },
    { name: 'Bootstrap', description: 'Framework CSS populaire pour créer des sites responsives', url: 'https://getbootstrap.com/docs/', category: 'Frontend' },
    { name: 'TypeScript', description: 'Sur-ensemble typé de JavaScript qui compile vers JavaScript pur', url: 'https://www.typescriptlang.org/docs/', category: 'Frontend' },
    
    // Backend
    { name: 'PHP', description: 'Langage de programmation pour le développement web', url: 'https://www.php.net/manual/fr/', category: 'Backend' },
    { name: 'Node.js', description: 'Environnement d\'exécution JavaScript côté serveur', url: 'https://nodejs.org/fr/docs/', category: 'Backend' },
    { name: 'Express', description: 'Framework web minimaliste pour Node.js', url: 'https://expressjs.com/fr/', category: 'Backend' },
    { name: 'Laravel', description: 'Framework PHP élégant pour le développement web', url: 'https://laravel.com/docs', category: 'Backend' },
    { name: 'Symfony', description: 'Framework PHP pour créer des sites web et des applications', url: 'https://symfony.com/doc/current/index.html', category: 'Backend' },
    { name: 'Django', description: 'Framework web Python de haut niveau', url: 'https://docs.djangoproject.com/fr/stable/', category: 'Backend' },
    { name: 'Flask', description: 'Micro-framework web Python léger', url: 'https://flask.palletsprojects.com/en/2.0.x/', category: 'Backend' },
    
    // Database
    { name: 'MySQL', description: 'Système de gestion de base de données relationnelle open-source', url: 'https://dev.mysql.com/doc/', category: 'Database' },
    { name: 'PostgreSQL', description: 'Système de gestion de base de données relationnelle-objet', url: 'https://www.postgresql.org/docs/', category: 'Database' },
    { name: 'MongoDB', description: 'Base de données NoSQL orientée documents', url: 'https://docs.mongodb.com/', category: 'Database' },
    { name: 'SQLite', description: 'Bibliothèque implémentant un moteur de base de données SQL', url: 'https://sqlite.org/docs.html', category: 'Database' },
    { name: 'Redis', description: 'Store de structure de données en mémoire', url: 'https://redis.io/documentation', category: 'Database' },
    { name: 'SQL', description: 'Langage de requête structurée pour les bases de données', url: 'https://www.w3schools.com/sql/', category: 'Database' },
    
    // DevOps
    { name: 'Docker', description: 'Plateforme de conteneurisation pour les applications', url: 'https://docs.docker.com/', category: 'DevOps' },
    { name: 'Kubernetes', description: 'Système d\'orchestration de conteneurs', url: 'https://kubernetes.io/fr/docs/home/', category: 'DevOps' },
    { name: 'Git', description: 'Système de contrôle de version distribué', url: 'https://git-scm.com/doc', category: 'DevOps' },
    
    // Tools
    { name: 'VS Code', description: 'Éditeur de code source développé par Microsoft', url: 'https://code.visualstudio.com/docs', category: 'Tools' },
    { name: 'Postman', description: 'Plateforme API pour construire et utiliser des API', url: 'https://learning.postman.com/docs/getting-started/introduction/', category: 'Tools' },
    
    // Security
    { name: 'OWASP', description: 'Fondation pour la sécurité des applications web', url: 'https://owasp.org/www-project-top-ten/', category: 'Security' },
    { name: 'JWT', description: 'Standard ouvert pour créer des tokens d\'accès', url: 'https://jwt.io/introduction', category: 'Security' }
];

/**
 * Obtenir l'équivalent de __dirname pour ES Modules
 */
function dirname(moduleUrl) {
    const filename = fileURLToPath(moduleUrl);
    return path.dirname(filename);
}

/**
 * Fonction principale pour générer les fichiers de cache
 */
async function generateCache() {
    try {
        console.log("Démarrage de la génération des fichiers cache...");

        // Vérifier que le dossier cache existe
        if (!fs.existsSync(CACHE_DIR)) {
            await fsPromises.mkdir(CACHE_DIR, { recursive: true });
            console.log(`Dossier cache créé: ${CACHE_DIR}`);
        }

        // Créer le dossier docs s'il n'existe pas
        if (!fs.existsSync(DOCS_PATH)) {
            await fsPromises.mkdir(DOCS_PATH, { recursive: true });
            console.log(`Dossier docs créé: ${DOCS_PATH}`);
        }

        // S'assurer que tous les dossiers de catégorie existent
        for (const category of Object.keys(CATEGORIES)) {
            const categoryPath = path.join(CACHE_DIR, category);
            if (!fs.existsSync(categoryPath)) {
                await fsPromises.mkdir(categoryPath, { recursive: true });
                console.log(`Dossier créé: ${category}`);
            }
        }

        console.log(`${RESOURCES.length} ressources prédéfinies à traiter.`);

        // Pour chaque ressource, créer un fichier de cache
        let createdCount = 0;
        let errorCount = 0;

        for (const resource of RESOURCES) {
            try {
                const categoryPath = path.join(CACHE_DIR, resource.category);
                
                // S'assurer que le dossier existe
                if (!fs.existsSync(categoryPath)) {
                    await fsPromises.mkdir(categoryPath, { recursive: true });
                }
                
                // Normaliser le nom du fichier
                const fileName = resource.name
                    .replace(/[^\w\s-]/g, '') // Supprimer les caractères spéciaux
                    .replace(/\s+/g, '_')     // Remplacer les espaces par des underscores
                    .toLowerCase() + '.txt';
                
                const filePath = path.join(categoryPath, fileName);
                
                // Construire le contenu du fichier
                const content = `${resource.description}\n${resource.url}`;
                
                // Écrire le fichier
                await fsPromises.writeFile(filePath, content, 'utf8');
                
                console.log(`Fichier créé: ${resource.category}/${fileName}`);
                createdCount++;
            } catch (error) {
                console.error(`Erreur lors de la création du fichier pour ${resource.name}:`, error);
                errorCount++;
            }
        }

        // Créer également des entrées dans le dossier docs avec un format plus détaillé
        // Pour chaque ressource, créer un fichier dans docs/
        for (const resource of RESOURCES) {
            try {
                // Normaliser le nom du fichier
                const fileName = resource.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '_') 
                    + '.txt';
                
                const filePath = path.join(DOCS_PATH, fileName);
                
                // Construire le contenu du fichier au format détaillé
                const content = `Description: ${resource.description}\nURL: ${resource.url}\nTags: ${resource.category.toLowerCase()},${resource.name.toLowerCase()}`;
                
                // Écrire le fichier
                await fsPromises.writeFile(filePath, content, 'utf8');
                
                console.log(`Fichier détaillé créé: docs/${fileName}`);
                createdCount++;
            } catch (error) {
                console.error(`Erreur lors de la création du fichier détaillé pour ${resource.name}:`, error);
                errorCount++;
            }
        }

        console.log(`\nGénération des fichiers cache terminée:
- ${createdCount} fichiers créés
- ${errorCount} erreurs`);

    } catch (error) {
        console.error("Erreur lors de la génération des fichiers cache:", error);
    }
}

// Exécuter la fonction principale
generateCache(); 