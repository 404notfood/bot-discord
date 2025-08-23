/**
 * Script pour importer les ressources de documentation dans la base de données
 * Exécuter avec: node scripts/import_resources.js
 */

import * as db from '../src/utils/db.js';
import * as Logger from '../src/utils/logger.js';

// Liste des ressources à importer
const resources = [
    { id: 1, name: 'React', description: 'React - Bibliothèque JavaScript pour créer des interfaces utilisateur', language: 'React', url: 'https://react.dev/', search_url: 'https://react.dev/search?q=', tutorial_url: 'https://www.youtube.com/results?search_query=react+tutorial+français', category_id: 1 },
    { id: 2, name: 'JavaScript', description: 'JavaScript - Langage de programmation pour le web', language: 'Javascript', url: 'https://developer.mozilla.org/fr/docs/Web/JavaScript', search_url: 'https://developer.mozilla.org/fr/search?q=', tutorial_url: 'https://www.youtube.com/results?search_query=javascript+tutorial+français', category_id: 1 },
    { id: 3, name: 'CSS', description: 'CSS - Feuilles de style en cascade', language: 'CSS', url: 'https://developer.mozilla.org/fr/docs/Web/CSS', search_url: 'https://developer.mozilla.org/fr/search?q=', tutorial_url: 'https://www.youtube.com/results?search_query=css+tutorial+français', category_id: 1 },
    { id: 4, name: 'HTML', description: 'HTML - Langage de balisage hypertexte', language: 'HTML', url: 'https://developer.mozilla.org/fr/docs/Web/HTML', search_url: 'https://developer.mozilla.org/fr/search?q=', tutorial_url: 'https://www.youtube.com/results?search_query=html+tutorial+français', category_id: 1 },
    { id: 5, name: 'Bootstrap', description: 'Bootstrap - Framework CSS pour le développement web', language: 'Bootsrap', url: 'https://getbootstrap.com/docs/5.3/', search_url: 'https://getbootstrap.com/docs/5.3/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=bootstrap+tutorial+français', category_id: 1 },
    { id: 6, name: 'SASS', description: 'SASS - Préprocesseur CSS', language: 'SASS', url: 'https://sass-lang.com/documentation/', search_url: 'https://sass-lang.com/documentation/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=sass+tutorial+français', category_id: 1 },
    { id: 7, name: 'TypeScript', description: 'TypeScript - JavaScript typé', language: 'Typescript', url: 'https://www.typescriptlang.org/docs/', search_url: 'https://www.typescriptlang.org/docs/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=typescript+tutorial+français', category_id: 1 },
    { id: 8, name: 'Webpack', description: 'Webpack - Module bundler', language: 'Webpack', url: 'https://webpack.js.org/', search_url: 'https://webpack.js.org/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=webpack+tutorial+français', category_id: 1 },
    { id: 9, name: 'Tailwind CSS', description: 'Tailwind CSS - Framework CSS utilitaire', language: 'Tailwind', url: 'https://tailwindcss.com/docs/', search_url: 'https://tailwindcss.com/docs/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=tailwindcss+tutorial+français', category_id: 1 },
    { id: 10, name: 'PHP', description: 'PHP - Langage de programmation pour le développement web', language: 'php', url: 'https://www.php.net/manual/fr/', search_url: 'https://www.php.net/manual/fr/function.', tutorial_url: 'https://www.youtube.com/results?search_query=php+tutorial+français', category_id: 2 },
    { id: 11, name: 'Python', description: 'Python - Langage de programmation polyvalent', language: 'Python', url: 'https://docs.python.org/fr/3/', search_url: 'https://docs.python.org/fr/3/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=python+tutorial+français', category_id: 2 },
    { id: 12, name: 'Symfony', description: 'Symfony - Framework PHP', language: 'Symfony', url: 'https://symfony.com/doc/current/', search_url: 'https://symfony.com/doc/current/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=symfony+tutorial+français', category_id: 2 },
    { id: 13, name: 'Laravel', description: 'Laravel - Framework PHP', language: 'Laravel', url: 'https://laravel.com/docs/', search_url: 'https://laravel.com/docs/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=laravel+tutorial+français', category_id: 2 },
    { id: 14, name: 'Django', description: 'Django - Framework Python', language: 'Django', url: 'https://docs.djangoproject.com/fr/5.0/', search_url: 'https://docs.djangoproject.com/fr/5.0/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=django+tutorial+français', category_id: 2 },
    { id: 15, name: 'Flask', description: 'Flask - Framework Python léger', language: 'Flask', url: 'https://flask.palletsprojects.com/en/2.3.x/', search_url: 'https://flask.palletsprojects.com/en/2.3.x/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=flask+tutorial+français', category_id: 2 },
    { id: 16, name: 'Express.js', description: 'Express.js - Framework Node.js', language: 'Express Js', url: 'https://expressjs.com/fr/', search_url: 'https://expressjs.com/fr/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=expressjs+tutorial+français', category_id: 2 },
    { id: 17, name: 'MySQL', description: 'MySQL - Système de gestion de base de données relationnelle', language: 'Mysql', url: 'https://dev.mysql.com/doc/', search_url: 'https://dev.mysql.com/doc/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=mysql+tutorial+français', category_id: 3 },
    { id: 18, name: 'PostgreSQL', description: 'PostgreSQL - Système de gestion de base de données relationnelle', language: 'PostgreSQL', url: 'https://www.postgresql.org/docs/', search_url: 'https://www.postgresql.org/docs/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=postgresql+tutorial+français', category_id: 3 },
    { id: 19, name: 'MongoDB', description: 'MongoDB - Base de données NoSQL', language: 'MongoDB', url: 'https://www.mongodb.com/docs/', search_url: 'https://www.mongodb.com/docs/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=mongodb+tutorial+français', category_id: 3 },
    { id: 20, name: 'Redis', description: 'Redis - Base de données en mémoire', language: 'Redis', url: 'https://redis.io/docs/', search_url: 'https://redis.io/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=redis+tutorial+français', category_id: 3 },
    { id: 21, name: 'SQLite', description: 'SQLite - Base de données légère', language: 'SQLite', url: 'https://www.sqlite.org/docs.html', search_url: 'https://www.sqlite.org/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=sqlite+tutorial+français', category_id: 3 },
    { id: 22, name: 'Git', description: 'Git - Système de contrôle de version', language: 'Git', url: 'https://git-scm.com/doc/', search_url: 'https://git-scm.com/doc/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=git+tutorial+français', category_id: 4 },
    { id: 23, name: 'Docker', description: 'Docker - Plateforme de conteneurisation', language: 'Docker', url: 'https://docs.docker.com/', search_url: 'https://docs.docker.com/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=docker+tutorial+français', category_id: 4 },
    { id: 24, name: 'Kubernetes', description: 'Kubernetes - Orchestration de conteneurs', language: 'Kubernetes', url: 'https://kubernetes.io/fr/docs/', search_url: 'https://kubernetes.io/fr/docs/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=kubernetes+tutorial+français', category_id: 4 },
    { id: 25, name: 'Jenkins', description: 'Jenkins - Serveur d\'intégration continue', language: 'Jenkins', url: 'https://www.jenkins.io/doc/', search_url: 'https://www.jenkins.io/doc/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=jenkins+tutorial+français', category_id: 4 },
    { id: 26, name: 'VS Code', description: 'Visual Studio Code - Éditeur de code', language: 'Vscode', url: 'https://code.visualstudio.com/docs/', search_url: 'https://code.visualstudio.com/docs/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=vscode+tutorial+français', category_id: 5 },
    { id: 27, name: 'npm', description: 'npm - Gestionnaire de paquets Node.js', language: 'Npm', url: 'https://docs.npmjs.com/', search_url: 'https://docs.npmjs.com/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=npm+tutorial+français', category_id: 5 },
    { id: 28, name: 'Yarn', description: 'Yarn - Gestionnaire de paquets alternatif', language: 'Yarn', url: 'https://yarnpkg.com/', search_url: 'https://yarnpkg.com/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=yarn+tutorial+français', category_id: 5 },
    { id: 29, name: 'Composer', description: 'Composer - Gestionnaire de dépendances PHP', language: 'Composer', url: 'https://getcomposer.org/doc/', search_url: 'https://getcomposer.org/doc/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=composer+tutorial+français', category_id: 5 },
    { id: 30, name: 'OWASP', description: 'OWASP - Open Web Application Security Project', language: 'OWASP', url: 'https://owasp.org/', search_url: 'https://owasp.org/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=owasp+tutorial+français', category_id: 6 },
    { id: 31, name: 'Web Security Academy', description: 'Web Security Academy - Plateforme d\'apprentissage de la sécurité web', language: 'Web Security Academy', url: 'https://portswigger.net/web-security/', search_url: 'https://portswigger.net/web-security/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=web+security+tutorial+français', category_id: 6 },
    { id: 32, name: 'HackTricks', description: 'HackTricks - Guide de hacking éthique', language: 'Hacktricks', url: 'https://book.hacktricks.xyz/', search_url: 'https://book.hacktricks.xyz/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=hacktricks+tutorial+français', category_id: 6 },
    { id: 33, name: 'Kali Linux', description: 'Kali Linux - Distribution Linux pour la sécurité', language: 'Kali Linux', url: 'https://www.kali.org/docs/', search_url: 'https://www.kali.org/docs/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=kali+linux+tutorial+français', category_id: 6 },
    { id: 34, name: 'PenTest', description: 'PenTest - Tests de pénétration', language: 'PenTest', url: 'https://www.offensive-security.com/', search_url: 'https://www.offensive-security.com/search.html?q=', tutorial_url: 'https://www.youtube.com/results?search_query=pentest+tutorial+français', category_id: 6 },
    { id: 35, name: 'SQL', description: 'Le CheatSheet SQL', language: 'SQL', url: 'https://sql.sh/', search_url: '', tutorial_url: '', category_id: 3 },
    { id: 36, name: 'Angular', description: 'Documentation Angular', language: 'Angular', url: 'https://angular.dev/overview', search_url: '', tutorial_url: 'https://www.youtube.com/watch?v=U71TQN68QGU&pp=0gcJCfcAhR29_xXO', category_id: 1 }
];

/**
 * Fonction principale pour importer les ressources
 */
async function importResources() {
    try {
        console.log("Démarrage de l'importation des ressources...");
        
        // Vérifier que les catégories existent
        const [categories] = await db.query('SELECT id, name FROM doc_categories');
        
        if (categories.length === 0) {
            console.error("Erreur: Aucune catégorie trouvée dans la base de données.");
            console.log("Veuillez d'abord exécuter le script d'initialisation de la base de données.");
            process.exit(1);
        }
        
        console.log(`${categories.length} catégories trouvées.`);
        
        // Pour chaque ressource, on l'insère ou on la met à jour
        let importCount = 0;
        let errorCount = 0;
        
        for (const resource of resources) {
            try {
                // Vérifier si la ressource existe déjà
                const [existingResource] = await db.query(
                    'SELECT id FROM doc_resources WHERE url = ?',
                    [resource.url]
                );
                
                // Extraire les tags à partir du nom et de la description
                const titleWords = resource.name.toLowerCase().split(' ');
                const descWords = resource.description.toLowerCase().split(' ');
                const allWords = [...new Set([...titleWords, ...descWords])];
                const tags = allWords
                    .filter(word => word.length > 3) // Éliminer les mots trop courts
                    .filter(word => !['pour', 'avec', 'dans', 'les', 'des', 'qui', 'que', 'est'].includes(word))
                    .join(',');
                
                if (existingResource.length > 0) {
                    // Mettre à jour la ressource existante
                    await db.query(
                        `UPDATE doc_resources 
                         SET name = ?, description = ?, language = ?, category_id = ?, 
                             search_url = ?, tutorial_url = ?, tags = ?
                         WHERE id = ?`,
                        [
                            resource.name,
                            resource.description,
                            resource.language,
                            resource.category_id,
                            resource.search_url,
                            resource.tutorial_url,
                            tags,
                            existingResource[0].id
                        ]
                    );
                    console.log(`Ressource mise à jour: ${resource.name}`);
                } else {
                    // Insérer une nouvelle ressource
                    await db.query(
                        `INSERT INTO doc_resources 
                         (name, description, url, language, category_id, search_url, tutorial_url, tags)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            resource.name,
                            resource.description,
                            resource.url,
                            resource.language,
                            resource.category_id,
                            resource.search_url,
                            resource.tutorial_url,
                            tags
                        ]
                    );
                    console.log(`Nouvelle ressource ajoutée: ${resource.name}`);
                }
                
                importCount++;
            } catch (error) {
                console.error(`Erreur lors de l'importation de la ressource ${resource.name}:`, error);
                errorCount++;
            }
        }
        
        console.log(`Importation terminée. ${importCount} ressources importées, ${errorCount} erreurs.`);
        
    } catch (error) {
        console.error("Erreur lors de l'importation des ressources:", error);
    } finally {
        // Fermer la connexion à la base de données
        db.end();
    }
}

// Exécuter la fonction d'importation
importResources(); 