-- --------------------------------------------------------
-- Hôte:                         127.0.0.1
-- Version du serveur:           8.0.30 - MySQL Community Server - GPL
-- SE du serveur:                Win64
-- HeidiSQL Version:             12.1.0.6537
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Listage de la structure de la base pour discord_bot
CREATE DATABASE IF NOT EXISTS `discord_bot` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `discord_bot`;

-- Listage de la structure de table discord_bot. alerts
CREATE TABLE IF NOT EXISTS `alerts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `alert_type` varchar(50) NOT NULL,
  `message` text NOT NULL,
  `level` varchar(50) DEFAULT 'info',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.alerts : ~0 rows (environ)

-- Listage de la structure de table discord_bot. banned_users
CREATE TABLE IF NOT EXISTS `banned_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(20) NOT NULL,
  `reason` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.banned_users : ~0 rows (environ)

-- Listage de la structure de table discord_bot. bot_admins
CREATE TABLE IF NOT EXISTS `bot_admins` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table discord_bot.bot_admins : ~2 rows (environ)
INSERT IGNORE INTO `bot_admins` (`id`, `user_id`, `username`, `created_at`, `updated_at`) VALUES
	(1, '709042879145836564', 'Owner', '2025-05-04 01:58:05', '2025-05-04 01:58:05'),
	(2, '1098199835917701190', 'elileroi17', '2025-05-04 02:00:08', '2025-05-04 02:00:08');

-- Listage de la structure de table discord_bot. bot_config
CREATE TABLE IF NOT EXISTS `bot_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Clé de configuration',
  `config_value` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Valeur de configuration',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Description de la configuration',
  `guild_id` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ID du serveur (NULL pour global)',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table discord_bot.bot_config : ~5 rows (environ)
INSERT IGNORE INTO `bot_config` (`id`, `config_key`, `config_value`, `description`, `guild_id`, `created_at`, `updated_at`) VALUES
	(1, 'max_warnings', '3', 'Nombre maximum d\'avertissements avant action automatique', NULL, '2025-05-04 00:48:54', '2025-05-04 00:48:54'),
	(2, 'warn_action', 'kick', 'Action à effectuer après avoir atteint le nombre maximum d\'avertissements (kick, tempban, ban)', NULL, '2025-05-04 00:48:54', '2025-05-04 00:48:54'),
	(3, 'tempban_duration', '7', 'Durée en jours des bannissements temporaires', NULL, '2025-05-04 00:48:54', '2025-05-04 00:48:54'),
	(4, 'welcome_message', 'welcome', 'Bienvenue sur le serveur {server_name}, {user_mention} ! N\'hésitez pas à consulter les règles et à vous présenter.', NULL, '2025-05-04 00:48:54', '2025-05-04 00:48:54'),
	(5, 'cooldown_commands', '5', 'Temps de recharge (en secondes) entre les commandes', NULL, '2025-05-04 00:48:54', '2025-05-04 00:48:54');

-- Listage de la structure de table discord_bot. bot_moderators
CREATE TABLE IF NOT EXISTS `bot_moderators` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `added_by` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Listage des données de la table discord_bot.bot_moderators : ~0 rows (environ)

-- Listage de la structure de table discord_bot. categories
CREATE TABLE IF NOT EXISTS `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.categories : ~6 rows (environ)
INSERT IGNORE INTO `categories` (`id`, `name`, `description`, `created_at`, `updated_at`) VALUES
	(1, 'Frontend', 'Technologies pour le développement frontend', '2025-05-04 00:44:35', '2025-05-04 00:44:35'),
	(2, 'Backend', 'Technologies pour le développement backend', '2025-05-04 00:44:35', '2025-05-04 00:44:35'),
	(3, 'Database', 'Systèmes de gestion de bases de données', '2025-05-04 00:44:35', '2025-05-04 00:44:35'),
	(4, 'DevOps', 'Outils et technologies DevOps', '2025-05-04 00:44:35', '2025-05-04 00:44:35'),
	(5, 'Tools', 'Outils de développement', '2025-05-04 00:44:35', '2025-05-04 00:44:35'),
	(6, 'Security', 'Sécurité informatique', '2025-05-04 00:44:35', '2025-05-04 00:44:35');

-- Listage de la structure de table discord_bot. command_history
CREATE TABLE IF NOT EXISTS `command_history` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `command_name` varchar(255) NOT NULL,
  `parameters` text,
  `guild_id` varchar(30) DEFAULT NULL,
  `channel_id` varchar(30) DEFAULT NULL,
  `success` tinyint(1) DEFAULT '1',
  `error` text,
  `timestamp` datetime DEFAULT CURRENT_TIMESTAMP,
  `executed_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.command_history : ~0 rows (environ)

-- Listage de la structure de table discord_bot. dashboard_members
CREATE TABLE IF NOT EXISTS `dashboard_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) NOT NULL,
  `role` enum('admin','editor','viewer') NOT NULL DEFAULT 'viewer',
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.dashboard_members : ~2 rows (environ)
INSERT IGNORE INTO `dashboard_members` (`id`, `username`, `password`, `email`, `role`, `is_active`, `last_login`, `created_at`, `updated_at`) VALUES
	(1, 'admin', '$2y$10$iuaFZLmgIrUtadaflEXyNeAkPvYJ1QqrYmNUCU/UPrm5HBVp0NZfC', 'admin@example.com', 'admin', 1, NULL, '2025-05-04 00:44:35', '2025-05-04 00:44:35'),
	(2, 'lionel', '$2y$10$bmHxe8ZNimX2EEOyXEDAK.hIkMn13NGu/JGdMykTT6hYC6Z3L7q4O', 'lionel@bot-discord.com', 'admin', 1, NULL, '2025-05-04 00:44:35', '2025-08-24 22:44:04');

-- Listage de la structure de table discord_bot. external_integrations
CREATE TABLE IF NOT EXISTS `external_integrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `project_id` int NOT NULL,
  `service` varchar(50) NOT NULL,
  `url` varchar(255) NOT NULL,
  `subgroup_ids` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `events` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `external_integrations_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `main_projects` (`id`),
  CONSTRAINT `external_integrations_chk_1` CHECK (json_valid(`subgroup_ids`)),
  CONSTRAINT `external_integrations_chk_2` CHECK (json_valid(`events`))
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.external_integrations : ~0 rows (environ)

-- Listage de la structure de table discord_bot. main_projects
CREATE TABLE IF NOT EXISTS `main_projects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `status` varchar(50) DEFAULT 'active',
  `start_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `end_date` datetime DEFAULT NULL,
  `manager_id` int DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.main_projects : ~1 rows (environ)
INSERT IGNORE INTO `main_projects` (`id`, `name`, `description`, `status`, `start_date`, `end_date`, `manager_id`, `created_at`, `updated_at`) VALUES
	(1, 'rtfm2loose', 'test', 'active', '2025-05-04 13:48:31', NULL, NULL, '2025-05-04 13:48:31', '2025-05-04 13:48:31');

-- Listage de la structure de table discord_bot. member_contributions
CREATE TABLE IF NOT EXISTS `member_contributions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subgroup_id` int NOT NULL,
  `user_id` int NOT NULL,
  `level` int NOT NULL,
  `notes` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subgroup_id` (`subgroup_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `member_contributions_ibfk_1` FOREIGN KEY (`subgroup_id`) REFERENCES `project_subgroups` (`id`),
  CONSTRAINT `member_contributions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `dashboard_members` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.member_contributions : ~0 rows (environ)

-- Listage de la structure de table discord_bot. moderation_logs
CREATE TABLE IF NOT EXISTS `moderation_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action` varchar(50) NOT NULL,
  `user_id` int NOT NULL,
  `details` text,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.moderation_logs : ~0 rows (environ)

-- Listage de la structure de table discord_bot. project_group_members
CREATE TABLE IF NOT EXISTS `project_group_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `role_id` int DEFAULT NULL,
  `subgroup_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `subgroup_id` (`subgroup_id`),
  CONSTRAINT `project_group_members_ibfk_1` FOREIGN KEY (`subgroup_id`) REFERENCES `project_subgroups` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.project_group_members : ~0 rows (environ)

-- Listage de la structure de table discord_bot. project_meetings
CREATE TABLE IF NOT EXISTS `project_meetings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `agenda` text,
  `meeting_date` datetime NOT NULL,
  `project_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_meetings_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `main_projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.project_meetings : ~0 rows (environ)

-- Listage de la structure de table discord_bot. project_subgroups
CREATE TABLE IF NOT EXISTS `project_subgroups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `technology` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `status` varchar(50) DEFAULT 'active',
  `max_members` int DEFAULT NULL,
  `project_id` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `project_subgroups_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `main_projects` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.project_subgroups : ~0 rows (environ)

-- Listage de la structure de table discord_bot. resources
CREATE TABLE IF NOT EXISTS `resources` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `language` varchar(50) DEFAULT NULL,
  `url` varchar(255) NOT NULL,
  `search_url` varchar(255) DEFAULT NULL,
  `tutorial_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `user_id` varchar(30) DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.resources : ~35 rows (environ)
INSERT IGNORE INTO `resources` (`id`, `name`, `description`, `language`, `url`, `search_url`, `tutorial_url`, `is_active`, `user_id`, `created_at`, `updated_at`, `category_id`) VALUES
	(1, 'React', 'React - Bibliothèque JavaScript pour créer des interfaces utilisateur', 'react', 'https://react.dev/', 'https://react.dev/search?q=', 'https://www.youtube.com/results?search_query=react+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 1),
	(2, 'JavaScript', 'JavaScript - Langage de programmation pour le web', 'javascript', 'https://developer.mozilla.org/fr/docs/Web/JavaScript', 'https://developer.mozilla.org/fr/search?q=', 'https://www.youtube.com/results?search_query=javascript+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 1),
	(3, 'CSS', 'CSS - Feuilles de style en cascade', 'css', 'https://developer.mozilla.org/fr/docs/Web/CSS', 'https://developer.mozilla.org/fr/search?q=', 'https://www.youtube.com/results?search_query=css+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 1),
	(4, 'HTML', 'HTML - Langage de balisage hypertexte', 'html', 'https://developer.mozilla.org/fr/docs/Web/HTML', 'https://developer.mozilla.org/fr/search?q=', 'https://www.youtube.com/results?search_query=html+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 1),
	(5, 'Bootstrap', 'Bootstrap - Framework CSS pour le développement web', NULL, 'https://getbootstrap.com/docs/5.3/', 'https://getbootstrap.com/docs/5.3/search.html?q=', 'https://www.youtube.com/results?search_query=bootstrap+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 1),
	(6, 'SASS', 'SASS - Préprocesseur CSS', NULL, 'https://sass-lang.com/documentation/', 'https://sass-lang.com/documentation/search.html?q=', 'https://www.youtube.com/results?search_query=sass+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 1),
	(7, 'TypeScript', 'TypeScript - JavaScript typé', 'typescript', 'https://www.typescriptlang.org/docs/', 'https://www.typescriptlang.org/docs/search.html?q=', 'https://www.youtube.com/results?search_query=typescript+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 1),
	(8, 'Webpack', 'Webpack - Module bundler', NULL, 'https://webpack.js.org/', 'https://webpack.js.org/search.html?q=', 'https://www.youtube.com/results?search_query=webpack+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 1),
	(9, 'Tailwind CSS', 'Tailwind CSS - Framework CSS utilitaire', 'css', 'https://tailwindcss.com/docs/', 'https://tailwindcss.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=tailwindcss+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 1),
	(10, 'PHP', 'PHP - Langage de programmation pour le développement web', 'php', 'https://www.php.net/manual/fr/', 'https://www.php.net/manual/fr/function.', 'https://www.youtube.com/results?search_query=php+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 2),
	(11, 'Python', 'Python - Langage de programmation polyvalent', 'python', 'https://docs.python.org/fr/3/', 'https://docs.python.org/fr/3/search.html?q=', 'https://www.youtube.com/results?search_query=python+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 2),
	(12, 'Symfony', 'Symfony - Framework PHP', NULL, 'https://symfony.com/doc/current/', 'https://symfony.com/doc/current/search.html?q=', 'https://www.youtube.com/results?search_query=symfony+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 2),
	(13, 'Laravel', 'Laravel - Framework PHP', NULL, 'https://laravel.com/docs/', 'https://laravel.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=laravel+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 2),
	(14, 'Django', 'Django - Framework Python', 'go', 'https://docs.djangoproject.com/fr/5.0/', 'https://docs.djangoproject.com/fr/5.0/search.html?q=', 'https://www.youtube.com/results?search_query=django+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 2),
	(15, 'Flask', 'Flask - Framework Python léger', NULL, 'https://flask.palletsprojects.com/en/2.3.x/', 'https://flask.palletsprojects.com/en/2.3.x/search.html?q=', 'https://www.youtube.com/results?search_query=flask+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 2),
	(16, 'Express.js', 'Express.js - Framework Node.js', NULL, 'https://expressjs.com/fr/', 'https://expressjs.com/fr/search.html?q=', 'https://www.youtube.com/results?search_query=expressjs+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 2),
	(17, 'MySQL', 'MySQL - Système de gestion de base de données relationnelle', 'sql', 'https://dev.mysql.com/doc/', 'https://dev.mysql.com/doc/search.html?q=', 'https://www.youtube.com/results?search_query=mysql+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 3),
	(18, 'PostgreSQL', 'PostgreSQL - Système de gestion de base de données relationnelle', 'sql', 'https://www.postgresql.org/docs/', 'https://www.postgresql.org/docs/search.html?q=', 'https://www.youtube.com/results?search_query=postgresql+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 3),
	(19, 'MongoDB', 'MongoDB - Base de données NoSQL', 'go', 'https://www.mongodb.com/docs/', 'https://www.mongodb.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=mongodb+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 3),
	(20, 'Redis', 'Redis - Base de données en mémoire', NULL, 'https://redis.io/docs/', 'https://redis.io/search.html?q=', 'https://www.youtube.com/results?search_query=redis+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 3),
	(21, 'SQLite', 'SQLite - Base de données légère', 'sql', 'https://www.sqlite.org/docs.html', 'https://www.sqlite.org/search.html?q=', 'https://www.youtube.com/results?search_query=sqlite+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 3),
	(22, 'Git', 'Git - Système de contrôle de version', NULL, 'https://git-scm.com/doc/', 'https://git-scm.com/doc/search.html?q=', 'https://www.youtube.com/results?search_query=git+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 4),
	(23, 'Docker', 'Docker - Plateforme de conteneurisation', NULL, 'https://docs.docker.com/', 'https://docs.docker.com/search.html?q=', 'https://www.youtube.com/results?search_query=docker+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 4),
	(24, 'Kubernetes', 'Kubernetes - Orchestration de conteneurs', NULL, 'https://kubernetes.io/fr/docs/', 'https://kubernetes.io/fr/docs/search.html?q=', 'https://www.youtube.com/results?search_query=kubernetes+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 4),
	(25, 'Jenkins', 'Jenkins - Serveur d\'intégration continue', NULL, 'https://www.jenkins.io/doc/', 'https://www.jenkins.io/doc/search.html?q=', 'https://www.youtube.com/results?search_query=jenkins+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 4),
	(26, 'VS Code', 'Visual Studio Code - Éditeur de code', NULL, 'https://code.visualstudio.com/docs/', 'https://code.visualstudio.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=vscode+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 5),
	(27, 'npm', 'npm - Gestionnaire de paquets Node.js', NULL, 'https://docs.npmjs.com/', 'https://docs.npmjs.com/search.html?q=', 'https://www.youtube.com/results?search_query=npm+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 5),
	(28, 'Yarn', 'Yarn - Gestionnaire de paquets alternatif', NULL, 'https://yarnpkg.com/', 'https://yarnpkg.com/search.html?q=', 'https://www.youtube.com/results?search_query=yarn+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 5),
	(29, 'Composer', 'Composer - Gestionnaire de dépendances PHP', NULL, 'https://getcomposer.org/doc/', 'https://getcomposer.org/doc/search.html?q=', 'https://www.youtube.com/results?search_query=composer+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 5),
	(30, 'OWASP', 'OWASP - Open Web Application Security Project', NULL, 'https://owasp.org/', 'https://owasp.org/search.html?q=', 'https://www.youtube.com/results?search_query=owasp+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 6),
	(31, 'Web Security Academy', 'Web Security Academy - Plateforme d\'apprentissage de la sécurité web', NULL, 'https://portswigger.net/web-security/', 'https://portswigger.net/web-security/search.html?q=', 'https://www.youtube.com/results?search_query=web+security+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 6),
	(32, 'HackTricks', 'HackTricks - Guide de hacking éthique', NULL, 'https://book.hacktricks.xyz/', 'https://book.hacktricks.xyz/search.html?q=', 'https://www.youtube.com/results?search_query=hacktricks+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 6),
	(33, 'Kali Linux', 'Kali Linux - Distribution Linux pour la sécurité', NULL, 'https://www.kali.org/docs/', 'https://www.kali.org/docs/search.html?q=', 'https://www.youtube.com/results?search_query=kali+linux+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 6),
	(34, 'PenTest', 'PenTest - Tests de pénétration', NULL, 'https://www.offensive-security.com/', 'https://www.offensive-security.com/search.html?q=', 'https://www.youtube.com/results?search_query=pentest+tutorial+français', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 00:44:36', 6),
	(35, 'SQL', 'Le CheatSheet SQL', 'sql', 'https://sql.sh/', '', '', 1, NULL, '2025-05-04 00:44:36', '2025-05-04 13:45:28', 3);

-- Listage de la structure de table discord_bot. resources_groups
CREATE TABLE IF NOT EXISTS `resources_groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text NOT NULL,
  `url` varchar(255) NOT NULL,
  `search_url` varchar(255) DEFAULT NULL,
  `tutorial_url` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `category_id` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.resources_groups : ~0 rows (environ)

-- Listage de la structure de table discord_bot. study_offenders
CREATE TABLE IF NOT EXISTS `study_offenders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `offense_count` int DEFAULT '0',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.study_offenders : ~0 rows (environ)

-- Listage de la structure de table discord_bot. subgroup_tasks
CREATE TABLE IF NOT EXISTS `subgroup_tasks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `priority` varchar(50) DEFAULT 'medium',
  `assignee_id` int DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `deadline` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `subgroup_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `subgroup_id` (`subgroup_id`),
  CONSTRAINT `subgroup_tasks_ibfk_1` FOREIGN KEY (`subgroup_id`) REFERENCES `project_subgroups` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.subgroup_tasks : ~0 rows (environ)

-- Listage de la structure de table discord_bot. task_dependencies
CREATE TABLE IF NOT EXISTS `task_dependencies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `task_id` int NOT NULL,
  `depends_on` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  KEY `depends_on` (`depends_on`),
  CONSTRAINT `task_dependencies_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `subgroup_tasks` (`id`),
  CONSTRAINT `task_dependencies_ibfk_2` FOREIGN KEY (`depends_on`) REFERENCES `subgroup_tasks` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Listage des données de la table discord_bot.task_dependencies : ~0 rows (environ)

/*!40103 SET TIME_ZONE=IFNULL(@OLD_TIME_ZONE, 'system') */;
/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
