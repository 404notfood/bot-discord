-- =============================================================================
-- DONNÉES INITIALES POUR LA BASE DE DONNÉES DISCORD BOT
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =============================================================================
-- CONFIGURATION INITIALE DU BOT
-- =============================================================================

INSERT INTO `bot_config` (`config_key`, `config_value`, `description`, `guild_id`) VALUES
('bot.prefix', '!', 'Préfixe des commandes textuelles', NULL),
('bot.language', 'fr', 'Langue du bot', NULL),
('bot.timezone', 'Europe/Paris', 'Fuseau horaire du bot', NULL),
('moderation.auto_mod', 'true', 'Modération automatique activée', NULL),
('moderation.warn_threshold', '3', 'Nombre d avertissements avant action', NULL),
('projects.max_per_user', '2', 'Nombre max de projets par utilisateur', NULL),
('projects.auto_archive_days', '30', 'Archivage automatique après X jours d inactivité', NULL),
('studi.enabled', 'false', 'Système anti-Studi activé', NULL),
('studi.max_offenses', '3', 'Nombre max d infractions Studi', NULL),
('docs.cache_ttl', '3600', 'TTL du cache documentation (secondes)', NULL),
('api.rate_limit', '100', 'Limite de requêtes par minute', NULL);

-- =============================================================================
-- CONFIGURATION STUDI
-- =============================================================================

INSERT INTO `studi_config` (`is_enabled`, `max_offenses`, `ban_duration_hours`, `whitelist_enabled`) VALUES
(false, 3, 24, true);

-- =============================================================================
-- CATÉGORIES DE DOCUMENTATION
-- =============================================================================

INSERT INTO `doc_categories` (`name`, `description`, `parent_id`, `order_index`, `is_active`) VALUES
('Frontend', 'Technologies frontend et interfaces utilisateur', NULL, 1, true),
('Backend', 'Technologies backend et serveurs', NULL, 2, true),
('Database', 'Bases de données et stockage', NULL, 3, true),
('DevOps', 'Déploiement et infrastructure', NULL, 4, true),
('Security', 'Sécurité informatique et pentesting', NULL, 5, true),
('Tools', 'Outils de développement', NULL, 6, true),

-- Sous-catégories Frontend
('HTML', 'HyperText Markup Language', 1, 1, true),
('CSS', 'Cascading Style Sheets', 1, 2, true),
('JavaScript', 'Langage de programmation JavaScript', 1, 3, true),
('React', 'Bibliothèque React', 1, 4, true),
('Vue.js', 'Framework Vue.js', 1, 5, true),
('Angular', 'Framework Angular', 1, 6, true),
('Tailwind CSS', 'Framework CSS utilitaire', 1, 7, true),
('Bootstrap', 'Framework CSS responsive', 1, 8, true),
('SASS', 'Préprocesseur CSS', 1, 9, true),
('TypeScript', 'Superset de JavaScript typé', 1, 10, true),
('Webpack', 'Bundler de modules', 1, 11, true),

-- Sous-catégories Backend
('PHP', 'Langage PHP', 2, 1, true),
('Laravel', 'Framework PHP Laravel', 2, 2, true),
('Symfony', 'Framework PHP Symfony', 2, 3, true),
('Node.js', 'Runtime JavaScript côté serveur', 2, 4, true),
('Express.js', 'Framework web pour Node.js', 2, 5, true),
('Python', 'Langage Python', 2, 6, true),
('Django', 'Framework web Python', 2, 7, true),
('Flask', 'Micro-framework Python', 2, 8, true),

-- Sous-catégories Database
('MySQL', 'Système de gestion de base de données', 3, 1, true),
('PostgreSQL', 'Base de données relationnelle avancée', 3, 2, true),
('MongoDB', 'Base de données NoSQL', 3, 3, true),
('Redis', 'Store clé-valeur en mémoire', 3, 4, true),
('SQLite', 'Base de données légère', 3, 5, true),
('SQL', 'Langage de requête structuré', 3, 6, true),

-- Sous-catégories DevOps
('Docker', 'Plateforme de conteneurisation', 4, 1, true),
('Git', 'Système de contrôle de version', 4, 2, true),
('Jenkins', 'Serveur d intégration continue', 4, 3, true),
('Kubernetes', 'Orchestrateur de conteneurs', 4, 4, true),

-- Sous-catégories Security
('OWASP', 'Projet de sécurité des applications web', 5, 1, true),
('Kali Linux', 'Distribution Linux pour tests de pénétration', 5, 2, true),
('HackTricks', 'Techniques et astuces de hacking éthique', 5, 3, true),
('Pentest', 'Tests de pénétration', 5, 4, true),
('Web Security Academy', 'Académie de sécurité web', 5, 5, true),

-- Sous-catégories Tools
('Composer', 'Gestionnaire de dépendances PHP', 6, 1, true),
('npm', 'Gestionnaire de paquets Node.js', 6, 2, true),
('Yarn', 'Gestionnaire de paquets rapide', 6, 3, true),
('VS Code', 'Éditeur de code', 6, 4, true);

-- =============================================================================
-- RESSOURCES DE DOCUMENTATION
-- =============================================================================

INSERT INTO `doc_resources` (`category_id`, `name`, `description`, `language`, `url`, `search_url`, `tutorial_url`, `tags`, `difficulty_level`, `is_active`) VALUES

-- Frontend Resources
(7, 'MDN HTML', 'Documentation officielle HTML par Mozilla', 'HTML', 'https://developer.mozilla.org/fr/docs/Web/HTML', 'https://developer.mozilla.org/fr/search', NULL, '["html", "mozilla", "mdn", "documentation"]', 'beginner', true),
(8, 'MDN CSS', 'Guide complet CSS par Mozilla', 'CSS', 'https://developer.mozilla.org/fr/docs/Web/CSS', 'https://developer.mozilla.org/fr/search', NULL, '["css", "mozilla", "mdn", "styles"]', 'beginner', true),
(9, 'MDN JavaScript', 'Documentation JavaScript complète', 'JavaScript', 'https://developer.mozilla.org/fr/docs/Web/JavaScript', 'https://developer.mozilla.org/fr/search', NULL, '["javascript", "mdn", "programming"]', 'intermediate', true),
(10, 'React Docs', 'Documentation officielle React', 'React', 'https://react.dev/', 'https://react.dev/learn', NULL, '["react", "frontend", "library"]', 'intermediate', true),
(11, 'Vue.js Guide', 'Guide officiel Vue.js', 'Vue.js', 'https://vuejs.org/', 'https://vuejs.org/guide/', NULL, '["vue", "frontend", "framework"]', 'intermediate', true),
(12, 'Angular Docs', 'Documentation officielle Angular', 'Angular', 'https://angular.io/', 'https://angular.io/docs', NULL, '["angular", "frontend", "framework", "typescript"]', 'advanced', true),
(13, 'Tailwind CSS', 'Framework CSS utilitaire', 'CSS', 'https://tailwindcss.com/', 'https://tailwindcss.com/docs', NULL, '["css", "framework", "utility", "responsive"]', 'intermediate', true),
(14, 'Bootstrap', 'Framework CSS responsive', 'CSS', 'https://getbootstrap.com/', 'https://getbootstrap.com/docs/', NULL, '["css", "framework", "responsive", "components"]', 'beginner', true),
(15, 'SASS/SCSS', 'Préprocesseur CSS avancé', 'SASS', 'https://sass-lang.com/', 'https://sass-lang.com/documentation/', NULL, '["css", "preprocessor", "sass", "scss"]', 'intermediate', true),
(16, 'TypeScript Handbook', 'Guide complet TypeScript', 'TypeScript', 'https://www.typescriptlang.org/', 'https://www.typescriptlang.org/docs/', NULL, '["typescript", "javascript", "types", "programming"]', 'intermediate', true),
(17, 'Webpack', 'Bundler de modules JavaScript', 'JavaScript', 'https://webpack.js.org/', 'https://webpack.js.org/concepts/', NULL, '["webpack", "bundler", "javascript", "build"]', 'advanced', true),

-- Backend Resources
(18, 'PHP Manual', 'Documentation officielle PHP', 'PHP', 'https://www.php.net/manual/fr/', 'https://www.php.net/search.php', NULL, '["php", "backend", "programming", "server"]', 'intermediate', true),
(19, 'Laravel Documentation', 'Framework web PHP élégant', 'PHP', 'https://laravel.com/docs', 'https://laravel.com/docs/master', NULL, '["php", "laravel", "framework", "mvc"]', 'intermediate', true),
(20, 'Symfony Documentation', 'Framework PHP professionnel', 'PHP', 'https://symfony.com/doc/current/index.html', 'https://symfony.com/search', NULL, '["php", "symfony", "framework", "enterprise"]', 'advanced', true),
(21, 'Node.js Documentation', 'Runtime JavaScript côté serveur', 'JavaScript', 'https://nodejs.org/en/docs/', 'https://nodejs.org/en/docs/guides/', NULL, '["nodejs", "javascript", "backend", "runtime"]', 'intermediate', true),
(22, 'Express.js Guide', 'Framework web minimaliste pour Node.js', 'JavaScript', 'https://expressjs.com/', 'https://expressjs.com/en/4x/api.html', NULL, '["express", "nodejs", "web", "framework"]', 'intermediate', true),
(23, 'Python Documentation', 'Langage de programmation Python', 'Python', 'https://docs.python.org/3/', 'https://docs.python.org/3/search.html', NULL, '["python", "programming", "backend"]', 'beginner', true),
(24, 'Django Documentation', 'Framework web Python', 'Python', 'https://docs.djangoproject.com/', 'https://docs.djangoproject.com/en/stable/search/', NULL, '["django", "python", "web", "framework"]', 'intermediate', true),
(25, 'Flask Documentation', 'Micro-framework web Python', 'Python', 'https://flask.palletsprojects.com/', 'https://flask.palletsprojects.com/en/latest/api/', NULL, '["flask", "python", "microframework", "web"]', 'intermediate', true),

-- Database Resources
(26, 'MySQL Documentation', 'Système de gestion de base de données', 'SQL', 'https://dev.mysql.com/doc/', 'https://dev.mysql.com/doc/search/', NULL, '["mysql", "database", "sql", "relational"]', 'intermediate', true),
(27, 'PostgreSQL Documentation', 'Base de données relationnelle avancée', 'SQL', 'https://www.postgresql.org/docs/', 'https://www.postgresql.org/search/', NULL, '["postgresql", "database", "sql", "advanced"]', 'intermediate', true),
(28, 'MongoDB Manual', 'Base de données NoSQL orientée documents', 'NoSQL', 'https://docs.mongodb.com/', 'https://docs.mongodb.com/manual/search/', NULL, '["mongodb", "nosql", "database", "document"]', 'intermediate', true),
(29, 'Redis Documentation', 'Store clé-valeur en mémoire', 'NoSQL', 'https://redis.io/documentation', 'https://redis.io/commands/', NULL, '["redis", "cache", "memory", "keyvalue"]', 'intermediate', true),
(30, 'SQLite Documentation', 'Base de données légère et embarquée', 'SQL', 'https://www.sqlite.org/docs.html', 'https://www.sqlite.org/search', NULL, '["sqlite", "database", "embedded", "lightweight"]', 'beginner', true),
(31, 'SQL Tutorial', 'Langage de requête structuré', 'SQL', 'https://www.w3schools.com/sql/', 'https://www.w3schools.com/sql/sql_syntax.asp', NULL, '["sql", "query", "database", "tutorial"]', 'beginner', true),

-- DevOps Resources
(32, 'Docker Documentation', 'Plateforme de conteneurisation', 'Docker', 'https://docs.docker.com/', 'https://docs.docker.com/search/', NULL, '["docker", "containers", "devops", "deployment"]', 'intermediate', true),
(33, 'Git Documentation', 'Système de contrôle de version', 'Git', 'https://git-scm.com/doc', 'https://git-scm.com/docs', NULL, '["git", "version-control", "scm", "devops"]', 'beginner', true),
(34, 'Jenkins User Guide', 'Serveur d intégration continue', 'Jenkins', 'https://www.jenkins.io/doc/', 'https://www.jenkins.io/doc/book/', NULL, '["jenkins", "ci-cd", "automation", "devops"]', 'advanced', true),
(35, 'Kubernetes Documentation', 'Orchestrateur de conteneurs', 'Kubernetes', 'https://kubernetes.io/docs/', 'https://kubernetes.io/docs/home/', NULL, '["kubernetes", "containers", "orchestration", "k8s"]', 'advanced', true),

-- Security Resources
(36, 'OWASP Top 10', 'Top 10 des vulnérabilités web', 'Security', 'https://owasp.org/www-project-top-ten/', NULL, NULL, '["owasp", "security", "vulnerabilities", "web"]', 'intermediate', true),
(37, 'Kali Linux Tools', 'Distribution pour tests de pénétration', 'Security', 'https://www.kali.org/tools/', NULL, NULL, '["kali", "linux", "pentest", "security"]', 'advanced', true),
(38, 'HackTricks', 'Techniques de hacking éthique', 'Security', 'https://book.hacktricks.xyz/', 'https://book.hacktricks.xyz/welcome/readme', NULL, '["hacktricks", "pentest", "hacking", "security"]', 'advanced', true),
(39, 'NIST Cybersecurity', 'Framework de cybersécurité', 'Security', 'https://www.nist.gov/cyberframework', NULL, NULL, '["nist", "cybersecurity", "framework", "standards"]', 'advanced', true),
(40, 'PortSwigger Web Security', 'Académie de sécurité web', 'Security', 'https://portswigger.net/web-security', 'https://portswigger.net/web-security/all-topics', 'https://portswigger.net/web-security/learning-path', '["portswigger", "web-security", "burp", "academy"]', 'intermediate', true),

-- Tools Resources
(41, 'Composer Documentation', 'Gestionnaire de dépendances PHP', 'PHP', 'https://getcomposer.org/doc/', 'https://packagist.org/', NULL, '["composer", "php", "dependencies", "packages"]', 'beginner', true),
(42, 'npm Documentation', 'Gestionnaire de paquets Node.js', 'JavaScript', 'https://docs.npmjs.com/', 'https://www.npmjs.com/', NULL, '["npm", "nodejs", "packages", "dependencies"]', 'beginner', true),
(43, 'Yarn Documentation', 'Gestionnaire de paquets rapide', 'JavaScript', 'https://yarnpkg.com/getting-started', 'https://yarnpkg.com/cli/', NULL, '["yarn", "packages", "javascript", "fast"]', 'beginner', true),
(44, 'VS Code Documentation', 'Éditeur de code extensible', 'Editor', 'https://code.visualstudio.com/docs', 'https://code.visualstudio.com/docs/editor/codebasics', NULL, '["vscode", "editor", "microsoft", "extensions"]', 'beginner', true);

SET FOREIGN_KEY_CHECKS = 1;