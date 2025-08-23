-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Hôte : localhost:3306
-- Généré le : jeu. 15 mai 2025 à 21:22
-- Version du serveur : 11.4.5-MariaDB-ubu2404
-- Version de PHP : 8.3.21

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `laurent_bot`
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
(5, 'Mobile', 'Développement d\'applications mobiles', '?', 5, 1, '2025-05-07 23:41:26', NULL),
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
  `type` enum('link','file','document','code','other') DEFAULT 'link',
  `url` text DEFAULT NULL,
  `content` text DEFAULT NULL,
  `language` varchar(50) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_by` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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
(1, 0, 3, '2025-05-07 23:41:26', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `studi_offenders`
--

CREATE TABLE `studi_offenders` (
  `id` int(11) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `offense_count` int(11) DEFAULT 1,
  `last_offense_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

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
-- Index pour la table `studi_offenders`
--
ALTER TABLE `studi_offenders`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_id` (`user_id`);

--
-- Index pour la table `studi_offenses`
--
ALTER TABLE `studi_offenses`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_user_guild` (`user_id`,`guild_id`);

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
-- AUTO_INCREMENT pour la table `studi_offenders`
--
ALTER TABLE `studi_offenders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `studi_offenses`
--
ALTER TABLE `studi_offenses`
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
-- Contraintes pour la table `user_preferences`
--
ALTER TABLE `user_preferences`
  ADD CONSTRAINT `user_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
