-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : dim. 24 août 2025 à 23:10
-- Version du serveur : 11.4.7-MariaDB-deb12
-- Version de PHP : 8.4.7

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `discord_bot`
--

-- --------------------------------------------------------

--
-- Structure de la table `alert_configs`
--

CREATE TABLE `alert_configs` (
  `id` int(11) NOT NULL,
  `guild_id` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `channel_id` varchar(50) NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `bot_admins`
--

CREATE TABLE `bot_admins` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `added_by` varchar(50) NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `bot_admins`
--

INSERT INTO `bot_admins` (`id`, `user_id`, `username`, `added_by`, `added_at`) VALUES
(1, '709042879145836564', 'Laurent', 'hansel_bwa', '2025-05-08 06:35:24');

-- --------------------------------------------------------

--
-- Structure de la table `bot_moderators`
--

CREATE TABLE `bot_moderators` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `added_by` varchar(50) NOT NULL,
  `added_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `bot_permissions`
--

CREATE TABLE `bot_permissions` (
  `id` int(11) NOT NULL,
  `permission_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `bot_permissions`
--

INSERT INTO `bot_permissions` (`id`, `permission_name`, `description`, `is_system`, `created_at`) VALUES
(1, 'bot.admin', 'Administration complète du bot', 1, '2025-08-24 18:47:14'),
(2, 'bot.moderator', 'Modération du bot', 1, '2025-08-24 18:47:14'),
(3, 'bot.helper', 'Aide et support', 1, '2025-08-24 18:47:14'),
(4, 'commands.admin', 'Utiliser les commandes administratives', 1, '2025-08-24 18:47:14'),
(5, 'commands.moderation', 'Utiliser les commandes de modération', 1, '2025-08-24 18:47:14'),
(6, 'commands.database', 'Accès aux commandes de base de données', 1, '2025-08-24 18:47:14'),
(7, 'commands.stats', 'Voir les statistiques du bot', 0, '2025-08-24 18:47:14'),
(8, 'commands.config', 'Modifier la configuration', 1, '2025-08-24 18:47:14'),
(9, 'studi.manage', 'Gérer le système anti-Studi', 1, '2025-08-24 18:47:14'),
(10, 'studi.whitelist', 'Gérer la whitelist Studi', 1, '2025-08-24 18:47:14'),
(11, 'studi.view_logs', 'Voir les logs de modération Studi', 0, '2025-08-24 18:47:14'),
(12, 'users.manage_roles', 'Gérer les rôles des utilisateurs', 1, '2025-08-24 18:47:14'),
(13, 'users.manage_permissions', 'Gérer les permissions des utilisateurs', 1, '2025-08-24 18:47:14'),
(14, 'users.view_info', 'Voir les informations des utilisateurs', 0, '2025-08-24 18:47:14'),
(15, 'system.restart', 'Redémarrer le bot', 1, '2025-08-24 18:47:14'),
(16, 'system.shutdown', 'Arrêter le bot', 1, '2025-08-24 18:47:14'),
(17, 'system.maintenance', 'Mode maintenance', 1, '2025-08-24 18:47:14');

-- --------------------------------------------------------

--
-- Structure de la table `bot_roles`
--

CREATE TABLE `bot_roles` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `role_type` enum('admin','moderator','helper') NOT NULL,
  `granted_by` varchar(50) NOT NULL,
  `granted_at` timestamp NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `bot_roles`
--

INSERT INTO `bot_roles` (`id`, `user_id`, `role_type`, `granted_by`, `granted_at`, `expires_at`, `is_active`) VALUES
(1, '709042879145836564', 'admin', 'hansel_bwa', '2025-05-08 06:35:24', NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `command_history`
--

CREATE TABLE `command_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `command_name` varchar(255) NOT NULL,
  `parameters` text DEFAULT NULL,
  `executed_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `command_logs`
--

CREATE TABLE `command_logs` (
  `id` int(11) NOT NULL,
  `command_name` varchar(100) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `guild_id` varchar(50) DEFAULT NULL,
  `channel_id` varchar(50) NOT NULL,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `success` tinyint(1) DEFAULT 1,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `dashboard_activity_logs`
--

CREATE TABLE `dashboard_activity_logs` (
  `id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `dashboard_members`
--

CREATE TABLE `dashboard_members` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `dashboard_members`
--

INSERT INTO `dashboard_members` (`id`, `username`, `password`, `email`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
(1, 'admin', '$2y$10$KNxZBnzUxiVVGqLjVMPPAuKAVXkK9wlwIZ/11vz0QIZcJ8/TTJ9Ly', 'admin@example.com', 'admin', 1, NULL, '2025-05-15 20:52:24', '2025-05-15 20:52:24');

-- --------------------------------------------------------

--
-- Structure de la table `doc_categories`
--

CREATE TABLE `doc_categories` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `doc_categories`
--

INSERT INTO `doc_categories` (`id`, `name`, `description`, `icon`, `sort_order`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Frontend', 'Technologies pour le développement frontend', '??', 1, 1, '2025-05-07 23:41:26', NULL),
(2, 'Backend', 'Technologies pour le développement backend', '??', 2, 1, '2025-05-07 23:41:26', NULL),
(3, 'Database', 'Systèmes de gestion de bases de données', '??', 3, 1, '2025-05-07 23:41:26', NULL),
(4, 'DevOps', 'Outils et technologies DevOps', '?', 4, 1, '2025-05-07 23:41:26', NULL),
(5, 'Mobile', 'Développement d applications mobiles', '?', 5, 1, '2025-05-07 23:41:26', NULL),
(6, 'Tools', 'Outils de développement', '?', 6, 1, '2025-05-07 23:41:26', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `doc_resources`
--

CREATE TABLE `doc_resources` (
  `id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `url` text NOT NULL,
  `language` varchar(100) NOT NULL,
  `category_id` int(11) DEFAULT NULL,
  `tags` text DEFAULT NULL,
  `search_url` text DEFAULT NULL,
  `tutorial_url` text DEFAULT NULL,
  `popularity` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `added_by` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `doc_resources`
--

INSERT INTO `doc_resources` (`id`, `name`, `description`, `url`, `language`, `category_id`, `tags`, `search_url`, `tutorial_url`, `popularity`, `is_active`, `added_by`, `created_at`, `updated_at`) VALUES
(1, 'JavaScript', 'JavaScript - Langage de programmation pour le web', 'https://developer.mozilla.org/fr/docs/Web/JavaScript', 'Javascript', 1, 'javascript,langage,programmation', 'https://developer.mozilla.org/fr/search?q=', 'https://www.youtube.com/results?search_query=javascript+tutorial+français', 0, 1, NULL, '2025-05-07 23:41:26', '2025-05-07 23:44:44'),
(2, 'PHP', 'PHP - Langage de programmation pour le développement web', 'https://www.php.net/manual/fr/', 'php', 2, 'langage,programmation,développement', 'https://www.php.net/manual/fr/function.', 'https://www.youtube.com/results?search_query=php+tutorial+français', 0, 1, NULL, '2025-05-07 23:41:26', '2025-05-07 23:44:44'),
(3, 'MySQL', 'MySQL - Système de gestion de base de données relationnelle', 'https://dev.mysql.com/doc/', 'Mysql', 3, 'mysql,système,gestion,base,données,relationnelle', 'https://dev.mysql.com/doc/search.html?q=', 'https://www.youtube.com/results?search_query=mysql+tutorial+français', 0, 1, NULL, '2025-05-07 23:41:26', '2025-05-07 23:44:44'),
(4, 'React', 'React - Bibliothèque JavaScript pour créer des interfaces utilisateur', 'https://react.dev/', 'React', 1, 'react,bibliothèque,javascript,créer,interfaces,utilisateur', 'https://react.dev/search?q=', 'https://www.youtube.com/results?search_query=react+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(5, 'CSS', 'CSS - Feuilles de style en cascade', 'https://developer.mozilla.org/fr/docs/Web/CSS', 'CSS', 1, 'feuilles,style,cascade', 'https://developer.mozilla.org/fr/search?q=', 'https://www.youtube.com/results?search_query=css+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(6, 'HTML', 'HTML - Langage de balisage hypertexte', 'https://developer.mozilla.org/fr/docs/Web/HTML', 'HTML', 1, 'html,langage,balisage,hypertexte', 'https://developer.mozilla.org/fr/search?q=', 'https://www.youtube.com/results?search_query=html+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(7, 'Bootstrap', 'Bootstrap - Framework CSS pour le développement web', 'https://getbootstrap.com/docs/5.3/', 'Bootsrap', 1, 'bootstrap,framework,développement', 'https://getbootstrap.com/docs/5.3/search.html?q=', 'https://www.youtube.com/results?search_query=bootstrap+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(8, 'SASS', 'SASS - Préprocesseur CSS', 'https://sass-lang.com/documentation/', 'SASS', 1, 'sass,préprocesseur', 'https://sass-lang.com/documentation/search.html?q=', 'https://www.youtube.com/results?search_query=sass+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(9, 'TypeScript', 'TypeScript - JavaScript typé', 'https://www.typescriptlang.org/docs/', 'Typescript', 1, 'typescript,javascript,typé', 'https://www.typescriptlang.org/docs/search.html?q=', 'https://www.youtube.com/results?search_query=typescript+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(10, 'Webpack', 'Webpack - Module bundler', 'https://webpack.js.org/', 'Webpack', 1, 'webpack,module,bundler', 'https://webpack.js.org/search.html?q=', 'https://www.youtube.com/results?search_query=webpack+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(11, 'Tailwind CSS', 'Tailwind CSS - Framework CSS utilitaire', 'https://tailwindcss.com/docs/', 'Tailwind', 1, 'tailwind,framework,utilitaire', 'https://tailwindcss.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=tailwindcss+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(12, 'Python', 'Python - Langage de programmation polyvalent', 'https://docs.python.org/fr/3/', 'Python', 2, 'python,langage,programmation,polyvalent', 'https://docs.python.org/fr/3/search.html?q=', 'https://www.youtube.com/results?search_query=python+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(13, 'Symfony', 'Symfony - Framework PHP', 'https://symfony.com/doc/current/', 'Symfony', 2, 'symfony,framework', 'https://symfony.com/doc/current/search.html?q=', 'https://www.youtube.com/results?search_query=symfony+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(14, 'Laravel', 'Laravel - Framework PHP', 'https://laravel.com/docs/', 'Laravel', 2, 'laravel,framework', 'https://laravel.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=laravel+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(15, 'Django', 'Django - Framework Python', 'https://docs.djangoproject.com/fr/5.0/', 'Django', 2, 'django,framework,python', 'https://docs.djangoproject.com/fr/5.0/search.html?q=', 'https://www.youtube.com/results?search_query=django+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(16, 'Flask', 'Flask - Framework Python léger', 'https://flask.palletsprojects.com/en/2.3.x/', 'Flask', 2, 'flask,framework,python,léger', 'https://flask.palletsprojects.com/en/2.3.x/search.html?q=', 'https://www.youtube.com/results?search_query=flask+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(17, 'Express.js', 'Express.js - Framework Node.js', 'https://expressjs.com/fr/', 'Express Js', 2, 'express.js,framework,node.js', 'https://expressjs.com/fr/search.html?q=', 'https://www.youtube.com/results?search_query=expressjs+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(18, 'PostgreSQL', 'PostgreSQL - Système de gestion de base de données relationnelle', 'https://www.postgresql.org/docs/', 'PostgreSQL', 3, 'postgresql,système,gestion,base,données,relationnelle', 'https://www.postgresql.org/docs/search.html?q=', 'https://www.youtube.com/results?search_query=postgresql+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(19, 'MongoDB', 'MongoDB - Base de données NoSQL', 'https://www.mongodb.com/docs/', 'MongoDB', 3, 'mongodb,base,données,nosql', 'https://www.mongodb.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=mongodb+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(20, 'Redis', 'Redis - Base de données en mémoire', 'https://redis.io/docs/', 'Redis', 3, 'redis,base,données,mémoire', 'https://redis.io/search.html?q=', 'https://www.youtube.com/results?search_query=redis+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(21, 'SQLite', 'SQLite - Base de données légère', 'https://www.sqlite.org/docs.html', 'SQLite', 3, 'sqlite,base,données,légère', 'https://www.sqlite.org/search.html?q=', 'https://www.youtube.com/results?search_query=sqlite+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(22, 'Git', 'Git - Système de contrôle de version', 'https://git-scm.com/doc/', 'Git', 4, 'système,contrôle,version', 'https://git-scm.com/doc/search.html?q=', 'https://www.youtube.com/results?search_query=git+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(23, 'Docker', 'Docker - Plateforme de conteneurisation', 'https://docs.docker.com/', 'Docker', 4, 'docker,plateforme,conteneurisation', 'https://docs.docker.com/search.html?q=', 'https://www.youtube.com/results?search_query=docker+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(24, 'Kubernetes', 'Kubernetes - Orchestration de conteneurs', 'https://kubernetes.io/fr/docs/', 'Kubernetes', 4, 'kubernetes,orchestration,conteneurs', 'https://kubernetes.io/fr/docs/search.html?q=', 'https://www.youtube.com/results?search_query=kubernetes+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(25, 'Jenkins', 'Jenkins - Serveur d\'intégration continue', 'https://www.jenkins.io/doc/', 'Jenkins', 4, 'jenkins,serveur,d\'intégration,continue', 'https://www.jenkins.io/doc/search.html?q=', 'https://www.youtube.com/results?search_query=jenkins+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(26, 'VS Code', 'Visual Studio Code - Éditeur de code', 'https://code.visualstudio.com/docs/', 'Vscode', 5, 'code,visual,studio,éditeur', 'https://code.visualstudio.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=vscode+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(27, 'npm', 'npm - Gestionnaire de paquets Node.js', 'https://docs.npmjs.com/', 'Npm', 5, 'gestionnaire,paquets,node.js', 'https://docs.npmjs.com/search.html?q=', 'https://www.youtube.com/results?search_query=npm+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(28, 'Yarn', 'Yarn - Gestionnaire de paquets alternatif', 'https://yarnpkg.com/', 'Yarn', 5, 'yarn,gestionnaire,paquets,alternatif', 'https://yarnpkg.com/search.html?q=', 'https://www.youtube.com/results?search_query=yarn+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(29, 'Composer', 'Composer - Gestionnaire de dépendances PHP', 'https://getcomposer.org/doc/', 'Composer', 5, 'composer,gestionnaire,dépendances', 'https://getcomposer.org/doc/search.html?q=', 'https://www.youtube.com/results?search_query=composer+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(30, 'OWASP', 'OWASP - Open Web Application Security Project', 'https://owasp.org/', 'OWASP', 6, 'owasp,open,application,security,project', 'https://owasp.org/search.html?q=', 'https://www.youtube.com/results?search_query=owasp+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(31, 'Web Security Academy', 'Web Security Academy - Plateforme d\'apprentissage de la sécurité web', 'https://portswigger.net/web-security/', 'Web Security Academy', 6, 'security,academy,plateforme,d\'apprentissage,sécurité', 'https://portswigger.net/web-security/search.html?q=', 'https://www.youtube.com/results?search_query=web+security+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(32, 'HackTricks', 'HackTricks - Guide de hacking éthique', 'https://book.hacktricks.xyz/', 'Hacktricks', 6, 'hacktricks,guide,hacking,éthique', 'https://book.hacktricks.xyz/search.html?q=', 'https://www.youtube.com/results?search_query=hacktricks+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(33, 'Kali Linux', 'Kali Linux - Distribution Linux pour la sécurité', 'https://www.kali.org/docs/', 'Kali Linux', 6, 'kali,linux,distribution,sécurité', 'https://www.kali.org/docs/search.html?q=', 'https://www.youtube.com/results?search_query=kali+linux+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(34, 'PenTest', 'PenTest - Tests de pénétration', 'https://www.offensive-security.com/', 'PenTest', 6, 'pentest,tests,pénétration', 'https://www.offensive-security.com/search.html?q=', 'https://www.youtube.com/results?search_query=pentest+tutorial+français', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(35, 'SQL', 'Le CheatSheet SQL', 'https://sql.sh/', 'SQL', 3, 'cheatsheet', '', '', 0, 1, NULL, '2025-05-07 23:44:44', NULL),
(36, 'Angular', 'Documentation Angular', 'https://angular.dev/overview', 'Angular', 1, 'angular,documentation', '', 'https://www.youtube.com/watch?v=U71TQN68QGU&pp=0gcJCfcAhR29_xXO', 0, 1, NULL, '2025-05-07 23:44:44', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `doc_resource_votes`
--

CREATE TABLE `doc_resource_votes` (
  `id` int(11) NOT NULL,
  `resource_id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `vote` tinyint(4) NOT NULL DEFAULT 1,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `integrations`
--

CREATE TABLE `integrations` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `external_id` varchar(200) DEFAULT NULL,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config`)),
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `logs`
--

CREATE TABLE `logs` (
  `id` int(11) NOT NULL,
  `level` enum('debug','info','warn','error','fatal') DEFAULT 'info',
  `message` text NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`data`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `moderation_logs`
--

CREATE TABLE `moderation_logs` (
  `id` int(11) NOT NULL,
  `guild_id` varchar(50) NOT NULL,
  `action_type` enum('warn','kick','ban','unban','mute','unmute') NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `moderator_id` varchar(50) NOT NULL,
  `reason` text DEFAULT NULL,
  `additional_info` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`additional_info`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `permission_logs`
--

CREATE TABLE `permission_logs` (
  `id` int(11) NOT NULL,
  `action_type` enum('grant_role','revoke_role','grant_permission','revoke_permission','check_permission') NOT NULL,
  `executor_id` varchar(50) NOT NULL,
  `target_id` varchar(50) NOT NULL,
  `permission_name` varchar(100) DEFAULT NULL,
  `role_type` varchar(50) DEFAULT NULL,
  `old_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_value`)),
  `new_value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_value`)),
  `reason` text DEFAULT NULL,
  `executed_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('planning','in_progress','paused','completed','cancelled') DEFAULT 'planning',
  `owner_id` varchar(50) NOT NULL,
  `start_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `project_channels`
--

CREATE TABLE `project_channels` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `channel_id` varchar(50) NOT NULL,
  `channel_type` enum('general','tasks','resources','announcements') DEFAULT 'general',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `reminders`
--

CREATE TABLE `reminders` (
  `id` int(11) NOT NULL,
  `guild_id` varchar(50) NOT NULL,
  `channel_id` varchar(50) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `remind_at` datetime NOT NULL,
  `is_completed` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `resources`
--

CREATE TABLE `resources` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `subgroup_id` int(11) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `type` enum('link','file','document','code','other') DEFAULT 'link',
  `url` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `search_url` varchar(500) DEFAULT NULL,
  `tutorial_url` varchar(500) DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL,
  `role_type` enum('admin','moderator','helper') NOT NULL,
  `permission_name` varchar(100) NOT NULL,
  `granted_by` varchar(50) NOT NULL,
  `granted_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `role_type`, `permission_name`, `granted_by`, `granted_at`) VALUES
(1, 'admin', 'bot.admin', 'SYSTEM', '2025-08-24 18:47:14'),
(2, 'admin', 'commands.admin', 'SYSTEM', '2025-08-24 18:47:14'),
(3, 'admin', 'commands.moderation', 'SYSTEM', '2025-08-24 18:47:14'),
(4, 'admin', 'commands.database', 'SYSTEM', '2025-08-24 18:47:14'),
(5, 'admin', 'commands.stats', 'SYSTEM', '2025-08-24 18:47:14'),
(6, 'admin', 'commands.config', 'SYSTEM', '2025-08-24 18:47:14'),
(7, 'admin', 'studi.manage', 'SYSTEM', '2025-08-24 18:47:14'),
(8, 'admin', 'studi.whitelist', 'SYSTEM', '2025-08-24 18:47:14'),
(9, 'admin', 'studi.view_logs', 'SYSTEM', '2025-08-24 18:47:14'),
(10, 'admin', 'users.manage_roles', 'SYSTEM', '2025-08-24 18:47:14'),
(11, 'admin', 'users.manage_permissions', 'SYSTEM', '2025-08-24 18:47:14'),
(12, 'admin', 'users.view_info', 'SYSTEM', '2025-08-24 18:47:14'),
(13, 'admin', 'system.restart', 'SYSTEM', '2025-08-24 18:47:14'),
(14, 'admin', 'system.shutdown', 'SYSTEM', '2025-08-24 18:47:14'),
(15, 'admin', 'system.maintenance', 'SYSTEM', '2025-08-24 18:47:14'),
(16, 'moderator', 'bot.moderator', 'SYSTEM', '2025-08-24 18:47:14'),
(17, 'moderator', 'commands.moderation', 'SYSTEM', '2025-08-24 18:47:14'),
(18, 'moderator', 'commands.stats', 'SYSTEM', '2025-08-24 18:47:14'),
(19, 'moderator', 'studi.manage', 'SYSTEM', '2025-08-24 18:47:14'),
(20, 'moderator', 'studi.view_logs', 'SYSTEM', '2025-08-24 18:47:14'),
(21, 'moderator', 'users.view_info', 'SYSTEM', '2025-08-24 18:47:14'),
(22, 'helper', 'bot.helper', 'SYSTEM', '2025-08-24 18:47:14'),
(23, 'helper', 'commands.stats', 'SYSTEM', '2025-08-24 18:47:14'),
(24, 'helper', 'users.view_info', 'SYSTEM', '2025-08-24 18:47:14');

-- --------------------------------------------------------

--
-- Structure de la table `studi_banned_users`
--

CREATE TABLE `studi_banned_users` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `reason` text DEFAULT NULL,
  `banned_by` varchar(50) NOT NULL,
  `banned_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `studi_config`
--

CREATE TABLE `studi_config` (
  `id` int(11) NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 0,
  `max_offenses` int(11) DEFAULT 3,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Déchargement des données de la table `studi_config`
--

INSERT INTO `studi_config` (`id`, `is_enabled`, `max_offenses`, `created_at`, `updated_at`) VALUES
(1, 1, 3, '2025-05-07 23:41:26', '2025-08-24 19:09:48');

-- --------------------------------------------------------

--
-- Structure de la table `studi_guild_config`
--

CREATE TABLE `studi_guild_config` (
  `id` int(11) NOT NULL,
  `guild_id` varchar(50) NOT NULL,
  `enabled` tinyint(1) DEFAULT 1,
  `keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT '["studi", "studi.fr", "studifr", "école studi"]' CHECK (json_valid(`keywords`)),
  `case_sensitive` tinyint(1) DEFAULT 0,
  `escalation_enabled` tinyint(1) DEFAULT 1,
  `warning_threshold` int(11) DEFAULT 1,
  `timeout_threshold` int(11) DEFAULT 3,
  `kick_threshold` int(11) DEFAULT 2,
  `timeout_duration` int(11) DEFAULT 3600,
  `reset_period` int(11) DEFAULT 604800,
  `warning_message` text DEFAULT '⚠️ Les références à Studi ne sont pas autorisées dans ce serveur.',
  `timeout_reason` text DEFAULT 'Références répétées à Studi',
  `kick_reason` text DEFAULT 'Violations répétées de la politique anti-Studi',
  `ban_reason` text DEFAULT 'Violations persistantes de la politique anti-Studi',
  `log_channel_id` varchar(50) DEFAULT NULL,
  `alert_channel_id` varchar(50) DEFAULT NULL,
  `notify_on_warning` tinyint(1) DEFAULT 0,
  `notify_on_timeout` tinyint(1) DEFAULT 1,
  `notify_on_kick` tinyint(1) DEFAULT 1,
  `notify_on_ban` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `studi_guild_config`
--

INSERT INTO `studi_guild_config` (`id`, `guild_id`, `enabled`, `keywords`, `case_sensitive`, `escalation_enabled`, `warning_threshold`, `timeout_threshold`, `kick_threshold`, `timeout_duration`, `reset_period`, `warning_message`, `timeout_reason`, `kick_reason`, `ban_reason`, `log_channel_id`, `alert_channel_id`, `notify_on_warning`, `notify_on_timeout`, `notify_on_kick`, `notify_on_ban`, `created_at`, `updated_at`) VALUES
(1, '1258751748538105877', 1, '[\"studi\",\"studi.fr\",\"studifr\",\"école studi\"]', 0, 1, 1, 3, 2, 3600, 604800, '⚠️ Les références à Studi ne sont pas autorisées dans ce serveur.', 'Références répétées à Studi', 'Violations répétées de la politique anti-Studi', 'Violations persistantes de la politique anti-Studi', NULL, NULL, 0, 1, 1, 1, '2025-08-24 19:23:25', '2025-08-24 19:23:25');

-- --------------------------------------------------------

--
-- Structure de la table `studi_moderation_logs`
--

CREATE TABLE `studi_moderation_logs` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `guild_id` varchar(50) NOT NULL,
  `channel_id` varchar(50) NOT NULL,
  `message_id` varchar(50) DEFAULT NULL,
  `action_type` enum('message_deleted','warning_sent','timeout_applied','user_kicked','user_banned','whitelist_bypass') NOT NULL,
  `content_snippet` text DEFAULT NULL,
  `detected_keywords` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`detected_keywords`)),
  `escalation_level` varchar(50) DEFAULT NULL,
  `automated` tinyint(1) DEFAULT 1,
  `moderator_id` varchar(50) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `studi_moderation_logs`
--

INSERT INTO `studi_moderation_logs` (`id`, `user_id`, `guild_id`, `channel_id`, `message_id`, `action_type`, `content_snippet`, `detected_keywords`, `escalation_level`, `automated`, `moderator_id`, `reason`, `metadata`, `created_at`) VALUES
(1, '709042879145836564', '1258751748538105877', '1280967980049498315', '1409256808127660163', 'message_deleted', '/studi_config', '[\"studi\"]', NULL, 1, NULL, NULL, NULL, '2025-08-24 19:23:26'),
(2, '709042879145836564', '1258751748538105877', '1280967980049498315', NULL, 'warning_sent', NULL, '[]', NULL, 1, NULL, NULL, NULL, '2025-08-24 19:23:26');

-- --------------------------------------------------------

--
-- Structure de la table `studi_offenders`
--

CREATE TABLE `studi_offenders` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `guild_id` varchar(50) DEFAULT NULL,
  `offense_count` int(11) DEFAULT 1,
  `last_offense_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `studi_offenders_enhanced`
--

CREATE TABLE `studi_offenders_enhanced` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `guild_id` varchar(50) NOT NULL,
  `offense_count` int(11) DEFAULT 1,
  `last_offense_at` timestamp NULL DEFAULT current_timestamp(),
  `escalation_level` enum('warning','timeout','kick','ban') DEFAULT 'warning',
  `total_messages_deleted` int(11) DEFAULT 0,
  `first_offense_at` timestamp NULL DEFAULT current_timestamp(),
  `is_banned` tinyint(1) DEFAULT 0,
  `banned_at` timestamp NULL DEFAULT NULL,
  `banned_by` varchar(50) DEFAULT NULL,
  `ban_reason` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `studi_offenders_enhanced`
--

INSERT INTO `studi_offenders_enhanced` (`id`, `user_id`, `username`, `guild_id`, `offense_count`, `last_offense_at`, `escalation_level`, `total_messages_deleted`, `first_offense_at`, `is_banned`, `banned_at`, `banned_by`, `ban_reason`, `notes`, `created_at`, `updated_at`) VALUES
(1, '709042879145836564', 'hansel_bwa', '1258751748538105877', 1, '2025-08-24 21:23:26', 'warning', 1, '2025-08-24 19:23:26', 0, NULL, NULL, NULL, NULL, '2025-08-24 19:23:26', '2025-08-24 19:23:26');

-- --------------------------------------------------------

--
-- Structure de la table `studi_offenses`
--

CREATE TABLE `studi_offenses` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `guild_id` varchar(50) NOT NULL,
  `offense_count` int(11) DEFAULT 1,
  `last_offense` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `studi_statistics`
--

CREATE TABLE `studi_statistics` (
  `id` int(11) NOT NULL,
  `guild_id` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `messages_deleted` int(11) DEFAULT 0,
  `warnings_sent` int(11) DEFAULT 0,
  `timeouts_applied` int(11) DEFAULT 0,
  `kicks_executed` int(11) DEFAULT 0,
  `bans_executed` int(11) DEFAULT 0,
  `whitelist_bypasses` int(11) DEFAULT 0,
  `unique_offenders` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Déchargement des données de la table `studi_statistics`
--

INSERT INTO `studi_statistics` (`id`, `guild_id`, `date`, `messages_deleted`, `warnings_sent`, `timeouts_applied`, `kicks_executed`, `bans_executed`, `whitelist_bypasses`, `unique_offenders`, `created_at`, `updated_at`) VALUES
(1, '1258751748538105877', '2025-08-24', 1, 1, 0, 0, 0, 0, 0, '2025-08-24 19:23:26', '2025-08-24 19:23:26');

-- --------------------------------------------------------

--
-- Structure de la table `studi_whitelist`
--

CREATE TABLE `studi_whitelist` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `reason` text DEFAULT NULL,
  `added_by` varchar(50) NOT NULL,
  `added_at` timestamp NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `subgroups`
--

CREATE TABLE `subgroups` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `leader_id` varchar(50) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `subgroup_members`
--

CREATE TABLE `subgroup_members` (
  `id` int(11) NOT NULL,
  `subgroup_id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `role` varchar(50) DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `tasks`
--

CREATE TABLE `tasks` (
  `id` int(11) NOT NULL,
  `project_id` int(11) NOT NULL,
  `subgroup_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `status` enum('pending','in_progress','review','completed','cancelled') DEFAULT 'pending',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `assigned_to` varchar(50) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `completed_date` date DEFAULT NULL,
  `created_by` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `task_dependencies`
--

CREATE TABLE `task_dependencies` (
  `id` int(11) NOT NULL,
  `task_id` int(11) NOT NULL,
  `depends_on_task_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `discord_id` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `last_seen` datetime DEFAULT current_timestamp(),
  `preferred_language` varchar(10) DEFAULT 'fr',
  `notifications_enabled` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user_permissions`
--

CREATE TABLE `user_permissions` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `permission_name` varchar(100) NOT NULL,
  `is_granted` tinyint(1) NOT NULL DEFAULT 1,
  `granted_by` varchar(50) NOT NULL,
  `granted_at` timestamp NULL DEFAULT current_timestamp(),
  `expires_at` timestamp NULL DEFAULT NULL,
  `reason` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- --------------------------------------------------------

--
-- Structure de la table `user_preferences`
--

CREATE TABLE `user_preferences` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `theme` varchar(50) DEFAULT 'light',
  `language` varchar(10) DEFAULT 'fr',
  `notifications` tinyint(1) DEFAULT 1,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `alert_configs`
--
ALTER TABLE `alert_configs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_guild_alert_type` (`guild_id`,`type`);

--
-- Index pour la table `bot_admins`
--
ALTER TABLE `bot_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_admin` (`user_id`);

--
-- Index pour la table `bot_moderators`
--
ALTER TABLE `bot_moderators`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_moderator` (`user_id`);

--
-- Index pour la table `bot_permissions`
--
ALTER TABLE `bot_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permission_name` (`permission_name`),
  ADD KEY `idx_permission_name` (`permission_name`);

--
-- Index pour la table `bot_roles`
--
ALTER TABLE `bot_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_role` (`user_id`,`role_type`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_role_type` (`role_type`),
  ADD KEY `idx_active` (`is_active`);

--
-- Index pour la table `command_history`
--
ALTER TABLE `command_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Index pour la table `command_logs`
--
ALTER TABLE `command_logs`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `dashboard_activity_logs`
--
ALTER TABLE `dashboard_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `member_id` (`member_id`);

--
-- Index pour la table `dashboard_members`
--
ALTER TABLE `dashboard_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Index pour la table `doc_categories`
--
ALTER TABLE `doc_categories`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_category_name` (`name`);

--
-- Index pour la table `doc_resources`
--
ALTER TABLE `doc_resources`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_resource_url` (`url`(255)),
  ADD KEY `category_id` (`category_id`);

--
-- Index pour la table `doc_resource_votes`
--
ALTER TABLE `doc_resource_votes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_resource_user_vote` (`resource_id`,`user_id`);

--
-- Index pour la table `integrations`
--
ALTER TABLE `integrations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`);

--
-- Index pour la table `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `moderation_logs`
--
ALTER TABLE `moderation_logs`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `permission_logs`
--
ALTER TABLE `permission_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_executor` (`executor_id`),
  ADD KEY `idx_target` (`target_id`),
  ADD KEY `idx_action_type` (`action_type`),
  ADD KEY `idx_executed_at` (`executed_at`);

--
-- Index pour la table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `project_channels`
--
ALTER TABLE `project_channels`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`);

--
-- Index pour la table `reminders`
--
ALTER TABLE `reminders`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `resources`
--
ALTER TABLE `resources`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`),
  ADD KEY `subgroup_id` (`subgroup_id`);

--
-- Index pour la table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_role_permission` (`role_type`,`permission_name`),
  ADD KEY `idx_role_type` (`role_type`),
  ADD KEY `idx_permission` (`permission_name`);

--
-- Index pour la table `studi_banned_users`
--
ALTER TABLE `studi_banned_users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_id` (`user_id`);

--
-- Index pour la table `studi_config`
--
ALTER TABLE `studi_config`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `studi_guild_config`
--
ALTER TABLE `studi_guild_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `guild_id` (`guild_id`),
  ADD KEY `idx_guild_id` (`guild_id`),
  ADD KEY `idx_enabled` (`enabled`);

--
-- Index pour la table `studi_moderation_logs`
--
ALTER TABLE `studi_moderation_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_guild_id` (`guild_id`),
  ADD KEY `idx_action_type` (`action_type`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_automated` (`automated`),
  ADD KEY `idx_studi_user_guild_date` (`user_id`,`guild_id`,`created_at`),
  ADD KEY `idx_studi_action_date` (`action_type`,`created_at`);

--
-- Index pour la table `studi_offenders`
--
ALTER TABLE `studi_offenders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_id` (`user_id`),
  ADD KEY `idx_studi_guild_id` (`guild_id`);

--
-- Index pour la table `studi_offenders_enhanced`
--
ALTER TABLE `studi_offenders_enhanced`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_user_guild` (`user_id`,`guild_id`),
  ADD KEY `idx_guild_id` (`guild_id`),
  ADD KEY `idx_escalation_level` (`escalation_level`),
  ADD KEY `idx_last_offense` (`last_offense_at`),
  ADD KEY `idx_banned` (`is_banned`);

--
-- Index pour la table `studi_offenses`
--
ALTER TABLE `studi_offenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_guild` (`user_id`,`guild_id`);

--
-- Index pour la table `studi_statistics`
--
ALTER TABLE `studi_statistics`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_guild_date` (`guild_id`,`date`),
  ADD KEY `idx_guild_id` (`guild_id`),
  ADD KEY `idx_date` (`date`);

--
-- Index pour la table `studi_whitelist`
--
ALTER TABLE `studi_whitelist`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_active` (`is_active`),
  ADD KEY `idx_expires_at` (`expires_at`);

--
-- Index pour la table `subgroups`
--
ALTER TABLE `subgroups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`);

--
-- Index pour la table `subgroup_members`
--
ALTER TABLE `subgroup_members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_subgroup_member` (`subgroup_id`,`user_id`);

--
-- Index pour la table `tasks`
--
ALTER TABLE `tasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `project_id` (`project_id`),
  ADD KEY `subgroup_id` (`subgroup_id`);

--
-- Index pour la table `task_dependencies`
--
ALTER TABLE `task_dependencies`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_dependency` (`task_id`,`depends_on_task_id`),
  ADD KEY `depends_on_task_id` (`depends_on_task_id`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `discord_id` (`discord_id`);

--
-- Index pour la table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_permission` (`user_id`,`permission_name`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_permission` (`permission_name`),
  ADD KEY `idx_granted` (`is_granted`);

--
-- Index pour la table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `alert_configs`
--
ALTER TABLE `alert_configs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `bot_admins`
--
ALTER TABLE `bot_admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `bot_moderators`
--
ALTER TABLE `bot_moderators`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `bot_permissions`
--
ALTER TABLE `bot_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT pour la table `bot_roles`
--
ALTER TABLE `bot_roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `command_history`
--
ALTER TABLE `command_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `command_logs`
--
ALTER TABLE `command_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `dashboard_activity_logs`
--
ALTER TABLE `dashboard_activity_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `dashboard_members`
--
ALTER TABLE `dashboard_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT pour la table `doc_categories`
--
ALTER TABLE `doc_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `doc_resources`
--
ALTER TABLE `doc_resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT pour la table `doc_resource_votes`
--
ALTER TABLE `doc_resource_votes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `integrations`
--
ALTER TABLE `integrations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `logs`
--
ALTER TABLE `logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `moderation_logs`
--
ALTER TABLE `moderation_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `permission_logs`
--
ALTER TABLE `permission_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `project_channels`
--
ALTER TABLE `project_channels`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT pour la table `reminders`
--
ALTER TABLE `reminders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `resources`
--
ALTER TABLE `resources`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `role_permissions`
--
ALTER TABLE `role_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=121;

--
-- AUTO_INCREMENT pour la table `studi_banned_users`
--
ALTER TABLE `studi_banned_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `studi_config`
--
ALTER TABLE `studi_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `studi_guild_config`
--
ALTER TABLE `studi_guild_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `studi_moderation_logs`
--
ALTER TABLE `studi_moderation_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `studi_offenders`
--
ALTER TABLE `studi_offenders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `studi_offenders_enhanced`
--
ALTER TABLE `studi_offenders_enhanced`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `studi_offenses`
--
ALTER TABLE `studi_offenses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `studi_statistics`
--
ALTER TABLE `studi_statistics`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `studi_whitelist`
--
ALTER TABLE `studi_whitelist`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `subgroups`
--
ALTER TABLE `subgroups`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `subgroup_members`
--
ALTER TABLE `subgroup_members`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `tasks`
--
ALTER TABLE `tasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `task_dependencies`
--
ALTER TABLE `task_dependencies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `user_permissions`
--
ALTER TABLE `user_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `user_preferences`
--
ALTER TABLE `user_preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `command_history`
--
ALTER TABLE `command_history`
  ADD CONSTRAINT `command_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `dashboard_activity_logs`
--
ALTER TABLE `dashboard_activity_logs`
  ADD CONSTRAINT `dashboard_activity_logs_ibfk_1` FOREIGN KEY (`member_id`) REFERENCES `dashboard_members` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `doc_resources`
--
ALTER TABLE `doc_resources`
  ADD CONSTRAINT `doc_resources_ibfk_1` FOREIGN KEY (`category_id`) REFERENCES `doc_categories` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `doc_resource_votes`
--
ALTER TABLE `doc_resource_votes`
  ADD CONSTRAINT `doc_resource_votes_ibfk_1` FOREIGN KEY (`resource_id`) REFERENCES `doc_resources` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `integrations`
--
ALTER TABLE `integrations`
  ADD CONSTRAINT `integrations_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `project_channels`
--
ALTER TABLE `project_channels`
  ADD CONSTRAINT `project_channels_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `resources`
--
ALTER TABLE `resources`
  ADD CONSTRAINT `resources_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `resources_ibfk_2` FOREIGN KEY (`subgroup_id`) REFERENCES `subgroups` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`permission_name`) REFERENCES `bot_permissions` (`permission_name`) ON DELETE CASCADE;

--
-- Contraintes pour la table `subgroups`
--
ALTER TABLE `subgroups`
  ADD CONSTRAINT `subgroups_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `subgroup_members`
--
ALTER TABLE `subgroup_members`
  ADD CONSTRAINT `subgroup_members_ibfk_1` FOREIGN KEY (`subgroup_id`) REFERENCES `subgroups` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `tasks`
--
ALTER TABLE `tasks`
  ADD CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`subgroup_id`) REFERENCES `subgroups` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `task_dependencies`
--
ALTER TABLE `task_dependencies`
  ADD CONSTRAINT `task_dependencies_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `task_dependencies_ibfk_2` FOREIGN KEY (`depends_on_task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `user_permissions`
--
ALTER TABLE `user_permissions`
  ADD CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`permission_name`) REFERENCES `bot_permissions` (`permission_name`) ON DELETE CASCADE;

--
-- Contraintes pour la table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
