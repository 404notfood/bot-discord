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
-- ADMINISTRATEURS ET MODÉRATEURS PAR DÉFAUT
-- =============================================================================

-- Administrateur par défaut (votre ID Discord)
INSERT INTO `bot_admins` (`user_id`, `username`, `added_by`, `added_at`) VALUES
('709042879145836564', 'hansel_bwa', 'SYSTEM', NOW())
ON DUPLICATE KEY UPDATE `username` = VALUES(`username`);

-- Rôle administrateur par défaut
INSERT INTO `bot_roles` (`user_id`, `role_type`, `granted_by`, `granted_at`, `is_active`) VALUES
('709042879145836564', 'admin', 'SYSTEM', NOW(), 1)
ON DUPLICATE KEY UPDATE `is_active` = 1;

-- =============================================================================
-- CONFIGURATION STUDI
-- =============================================================================

INSERT INTO `studi_config` (`is_enabled`, `max_offenses`, `ban_duration_hours`, `whitelist_enabled`) VALUES
(false, 3, 24, true)
ON DUPLICATE KEY UPDATE `is_enabled` = VALUES(`is_enabled`);

-- Configuration Studi par serveur par défaut
INSERT INTO `studi_guild_config` (`guild_id`, `is_enabled`, `max_offenses`, `ban_duration_hours`, `created_at`, `updated_at`) VALUES
('1258751748538105877', 0, 3, 24, NOW(), NOW())
ON DUPLICATE KEY UPDATE `updated_at` = NOW();

-- =============================================================================
-- CATÉGORIES DE DOCUMENTATION
-- =============================================================================

INSERT INTO `doc_categories` (`id`, `name`, `description`, `icon`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Frontend', 'Technologies pour le développement frontend', '🎨', 1, 1, NOW(), NOW()),
(2, 'Backend', 'Technologies pour le développement backend', '⚙️', 2, 1, NOW(), NOW()),
(3, 'Database', 'Systèmes de gestion de bases de données', '🗄️', 3, 1, NOW(), NOW()),
(4, 'DevOps', 'Outils et technologies DevOps', '🚀', 4, 1, NOW(), NOW()),
(5, 'Tools', 'Outils de développement', '🛠️', 5, 1, NOW(), NOW()),
(6, 'Security', 'Sécurité informatique', '🔒', 6, 1, NOW(), NOW()),

-- Sous-catégories Frontend
(7, 'HTML', 'HyperText Markup Language', '📄', 1, 1, NOW(), NOW()),
(8, 'CSS', 'Cascading Style Sheets', '🎨', 2, 1, NOW(), NOW()),
(9, 'JavaScript', 'Langage de programmation JavaScript', '📜', 3, 1, NOW(), NOW()),
(10, 'React', 'Bibliothèque React', '⚛️', 4, 1, NOW(), NOW()),
(11, 'Vue.js', 'Framework Vue.js', '💚', 5, 1, NOW(), NOW()),
(12, 'Angular', 'Framework Angular', '🔴', 6, 1, NOW(), NOW()),
(13, 'Tailwind CSS', 'Framework CSS utilitaire', '🎨', 7, 1, NOW(), NOW()),
(14, 'Bootstrap', 'Framework CSS responsive', '🎨', 8, 1, NOW(), NOW()),
(15, 'SASS', 'Préprocesseur CSS', '🎨', 9, 1, NOW(), NOW()),
(16, 'TypeScript', 'Superset de JavaScript typé', '📘', 10, 1, NOW(), NOW()),
(17, 'Webpack', 'Bundler de modules', '📦', 11, 1, NOW(), NOW()),

-- Sous-catégories Backend
(18, 'PHP', 'Langage PHP', '🐘', 1, 1, NOW(), NOW()),
(19, 'Laravel', 'Framework PHP Laravel', '🔥', 2, 1, NOW(), NOW()),
(20, 'Symfony', 'Framework PHP Symfony', '🎭', 3, 1, NOW(), NOW()),
(21, 'Node.js', 'Runtime JavaScript côté serveur', '🟢', 4, 1, NOW(), NOW()),
(22, 'Express.js', 'Framework web pour Node.js', '🚂', 5, 1, NOW(), NOW()),
(23, 'Python', 'Langage Python', '🐍', 6, 1, NOW(), NOW()),
(24, 'Django', 'Framework web Python', '🎸', 7, 1, NOW(), NOW()),
(25, 'Flask', 'Micro-framework Python', '🍶', 8, 1, NOW(), NOW()),

-- Sous-catégories Database
(26, 'MySQL', 'Système de gestion de base de données', '🐬', 1, 1, NOW(), NOW()),
(27, 'PostgreSQL', 'Base de données relationnelle avancée', '🐘', 2, 1, NOW(), NOW()),
(28, 'MongoDB', 'Base de données NoSQL', '🍃', 3, 1, NOW(), NOW()),
(29, 'Redis', 'Store clé-valeur en mémoire', '🔴', 4, 1, NOW(), NOW()),
(30, 'SQLite', 'Base de données légère', '📱', 5, 1, NOW(), NOW()),
(31, 'SQL', 'Langage de requête structuré', '🗃️', 6, 1, NOW(), NOW()),

-- Sous-catégories DevOps
(32, 'Docker', 'Plateforme de conteneurisation', '🐳', 1, 1, NOW(), NOW()),
(33, 'Git', 'Système de contrôle de version', '📚', 2, 1, NOW(), NOW()),
(34, 'Jenkins', 'Serveur d intégration continue', '🤖', 3, 1, NOW(), NOW()),
(35, 'Kubernetes', 'Orchestrateur de conteneurs', '⚓', 4, 1, NOW(), NOW()),

-- Sous-catégories Security
(36, 'OWASP', 'Projet de sécurité des applications web', '🛡️', 1, 1, NOW(), NOW()),
(37, 'Kali Linux', 'Distribution Linux pour tests de pénétration', '🐉', 2, 1, NOW(), NOW()),
(38, 'HackTricks', 'Techniques de hacking éthique', '🔍', 3, 1, NOW(), NOW()),
(39, 'Pentest', 'Tests de pénétration', '🔐', 4, 1, NOW(), NOW()),
(40, 'Web Security Academy', 'Académie de sécurité web', '🎓', 5, 1, NOW(), NOW()),

-- Sous-catégories Tools
(41, 'Composer', 'Gestionnaire de dépendances PHP', '🎼', 1, 1, NOW(), NOW()),
(42, 'npm', 'Gestionnaire de paquets Node.js', '📦', 2, 1, NOW(), NOW()),
(43, 'Yarn', 'Gestionnaire de paquets rapide', '🧶', 3, 1, NOW(), NOW()),
(44, 'VS Code', 'Éditeur de code', '💻', 4, 1, NOW(), NOW());

-- =============================================================================
-- RESSOURCES DE DOCUMENTATION
-- =============================================================================

INSERT INTO `doc_resources` (`id`, `name`, `description`, `url`, `language`, `category_id`, `tags`, `difficulty_level`, `search_url`, `tutorial_url`, `popularity`, `is_active`, `view_count`, `added_by`, `created_at`, `updated_at`) VALUES

-- Frontend Resources
(1, 'MDN HTML', 'Documentation officielle HTML par Mozilla', 'https://developer.mozilla.org/fr/docs/Web/HTML', 'HTML', 7, '["html", "mozilla", "mdn", "documentation"]', 'beginner', 'https://developer.mozilla.org/fr/search', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(2, 'MDN CSS', 'Guide complet CSS par Mozilla', 'https://developer.mozilla.org/fr/docs/Web/CSS', 'CSS', 8, '["css", "mozilla", "mdn", "styles"]', 'beginner', 'https://developer.mozilla.org/fr/search', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(3, 'MDN JavaScript', 'Documentation JavaScript complète', 'https://developer.mozilla.org/fr/docs/Web/JavaScript', 'JavaScript', 9, '["javascript", "mdn", "programming"]', 'intermediate', 'https://developer.mozilla.org/fr/search', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(4, 'React Docs', 'Documentation officielle React', 'https://react.dev/', 'React', 10, '["react", "frontend", "library"]', 'intermediate', 'https://react.dev/learn', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(5, 'Vue.js Guide', 'Guide officiel Vue.js', 'https://vuejs.org/', 'Vue.js', 11, '["vue", "frontend", "framework"]', 'intermediate', 'https://vuejs.org/guide/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(6, 'Angular Docs', 'Documentation officielle Angular', 'https://angular.io/', 'Angular', 12, '["angular", "frontend", "framework", "typescript"]', 'advanced', 'https://angular.io/docs', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(7, 'Tailwind CSS', 'Framework CSS utilitaire', 'https://tailwindcss.com/', 'CSS', 13, '["css", "framework", "utility", "responsive"]', 'intermediate', 'https://tailwindcss.com/docs', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(8, 'Bootstrap', 'Framework CSS responsive', 'https://getbootstrap.com/', 'CSS', 14, '["css", "framework", "responsive", "components"]', 'beginner', 'https://getbootstrap.com/docs/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(9, 'SASS/SCSS', 'Préprocesseur CSS avancé', 'https://sass-lang.com/', 'SASS', 15, '["css", "preprocessor", "sass", "scss"]', 'intermediate', 'https://sass-lang.com/documentation/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(10, 'TypeScript Handbook', 'Guide complet TypeScript', 'https://www.typescriptlang.org/', 'TypeScript', 16, '["typescript", "javascript", "types", "programming"]', 'intermediate', 'https://www.typescriptlang.org/docs/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(11, 'Webpack', 'Bundler de modules JavaScript', 'https://webpack.js.org/', 'JavaScript', 17, '["webpack", "bundler", "javascript", "build"]', 'advanced', 'https://webpack.js.org/concepts/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),

-- Backend Resources
(12, 'PHP Manual', 'Documentation officielle PHP', 'https://www.php.net/manual/fr/', 'PHP', 18, '["php", "backend", "programming", "server"]', 'intermediate', 'https://www.php.net/search.php', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(13, 'Laravel Documentation', 'Framework web PHP élégant', 'https://laravel.com/docs', 'PHP', 19, '["php", "laravel", "framework", "mvc"]', 'intermediate', 'https://laravel.com/docs/master', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(14, 'Symfony Documentation', 'Framework PHP professionnel', 'https://symfony.com/doc/current/index.html', 'PHP', 20, '["php", "symfony", "framework", "enterprise"]', 'advanced', 'https://symfony.com/search', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(15, 'Node.js Documentation', 'Runtime JavaScript côté serveur', 'https://nodejs.org/en/docs/', 'JavaScript', 21, '["nodejs", "javascript", "backend", "runtime"]', 'intermediate', 'https://nodejs.org/en/docs/guides/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(16, 'Express.js Guide', 'Framework web minimaliste pour Node.js', 'https://expressjs.com/', 'JavaScript', 22, '["express", "nodejs", "web", "framework"]', 'intermediate', 'https://expressjs.com/en/4x/api.html', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(17, 'Python Documentation', 'Langage de programmation Python', 'https://docs.python.org/3/', 'Python', 23, '["python", "programming", "backend"]', 'beginner', 'https://docs.python.org/3/search.html', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(18, 'Django Documentation', 'Framework web Python', 'https://docs.djangoproject.com/', 'Python', 24, '["django", "python", "web", "framework"]', 'intermediate', 'https://docs.djangoproject.com/en/stable/search/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(19, 'Flask Documentation', 'Micro-framework web Python', 'https://flask.palletsprojects.com/', 'Python', 25, '["flask", "python", "microframework", "web"]', 'intermediate', 'https://flask.palletsprojects.com/en/latest/api/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),

-- Database Resources
(20, 'MySQL Documentation', 'Système de gestion de base de données', 'https://dev.mysql.com/doc/', 'SQL', 26, '["mysql", "database", "sql", "relational"]', 'intermediate', 'https://dev.mysql.com/doc/search/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(21, 'PostgreSQL Documentation', 'Base de données relationnelle avancée', 'https://www.postgresql.org/docs/', 'SQL', 27, '["postgresql", "database", "sql", "advanced"]', 'intermediate', 'https://www.postgresql.org/search/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(22, 'MongoDB Manual', 'Base de données NoSQL orientée documents', 'https://docs.mongodb.com/', 'NoSQL', 28, '["mongodb", "nosql", "database", "document"]', 'intermediate', 'https://docs.mongodb.com/manual/search/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(23, 'Redis Documentation', 'Store clé-valeur en mémoire', 'https://redis.io/documentation', 'NoSQL', 29, '["redis", "cache", "memory", "keyvalue"]', 'intermediate', 'https://redis.io/commands/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(24, 'SQLite Documentation', 'Base de données légère et embarquée', 'https://www.sqlite.org/docs.html', 'SQL', 30, '["sqlite", "database", "embedded", "lightweight"]', 'beginner', 'https://www.sqlite.org/search', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(25, 'SQL Tutorial', 'Langage de requête structuré', 'https://www.w3schools.com/sql/', 'SQL', 31, '["sql", "query", "database", "tutorial"]', 'beginner', 'https://www.w3schools.com/sql/sql_syntax.asp', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),

-- DevOps Resources
(26, 'Docker Documentation', 'Plateforme de conteneurisation', 'https://docs.docker.com/', 'Docker', 32, '["docker", "containers", "devops", "deployment"]', 'intermediate', 'https://docs.docker.com/search/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(27, 'Git Documentation', 'Système de contrôle de version', 'https://git-scm.com/doc', 'Git', 33, '["git", "version-control", "scm", "devops"]', 'beginner', 'https://git-scm.com/docs', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(28, 'Jenkins User Guide', 'Serveur d intégration continue', 'https://www.jenkins.io/doc/', 'Jenkins', 34, '["jenkins", "ci-cd", "automation", "devops"]', 'advanced', 'https://www.jenkins.io/doc/book/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(29, 'Kubernetes Documentation', 'Orchestrateur de conteneurs', 'https://kubernetes.io/docs/', 'Kubernetes', 35, '["kubernetes", "containers", "orchestration", "k8s"]', 'advanced', 'https://kubernetes.io/docs/home/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),

-- Security Resources
(30, 'OWASP Top 10', 'Top 10 des vulnérabilités web', 'https://owasp.org/www-project-top-ten/', 'Security', 36, '["owasp", "security", "vulnerabilities", "web"]', 'intermediate', NULL, NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(31, 'Kali Linux Tools', 'Distribution pour tests de pénétration', 'https://www.kali.org/tools/', 'Security', 37, '["kali", "linux", "pentest", "security"]', 'advanced', NULL, NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(32, 'HackTricks', 'Techniques de hacking éthique', 'https://book.hacktricks.xyz/', 'Security', 38, '["hacktricks", "pentest", "hacking", "security"]', 'advanced', 'https://book.hacktricks.xyz/welcome/readme', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(33, 'NIST Cybersecurity', 'Framework de cybersécurité', 'https://www.nist.gov/cyberframework', 'Security', 39, '["nist", "cybersecurity", "framework", "standards"]', 'advanced', NULL, NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(34, 'PortSwigger Web Security', 'Académie de sécurité web', 'https://portswigger.net/web-security', 'Security', 40, '["portswigger", "web-security", "burp", "academy"]', 'intermediate', 'https://portswigger.net/web-security/all-topics', 'https://portswigger.net/web-security/learning-path', 0, 1, 0, 'SYSTEM', NOW(), NOW()),

-- Tools Resources
(35, 'Composer Documentation', 'Gestionnaire de dépendances PHP', 'https://getcomposer.org/doc/', 'PHP', 41, '["composer", "php", "dependencies", "packages"]', 'beginner', 'https://packagist.org/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(36, 'npm Documentation', 'Gestionnaire de paquets Node.js', 'https://docs.npmjs.com/', 'JavaScript', 42, '["npm", "nodejs", "packages", "dependencies"]', 'beginner', 'https://www.npmjs.com/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(37, 'Yarn Documentation', 'Gestionnaire de paquets rapide', 'https://yarnpkg.com/getting-started', 'JavaScript', 43, '["yarn", "packages", "javascript", "fast"]', 'beginner', 'https://yarnpkg.com/cli/', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW()),
(38, 'VS Code Documentation', 'Éditeur de code extensible', 'https://code.visualstudio.com/docs', 'Editor', 44, '["vscode", "editor", "microsoft", "extensions"]', 'beginner', 'https://code.visualstudio.com/docs/editor/codebasics', NULL, 0, 1, 0, 'SYSTEM', NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;