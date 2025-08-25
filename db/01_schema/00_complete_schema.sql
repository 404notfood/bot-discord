-- =============================================================================
-- SCHÉMA COMPLET DE LA BASE DE DONNÉES DISCORD BOT
-- =============================================================================
-- Utilisé par le bot Discord (Node.js) et le site web (Laravel)
-- Compatible MySQL 8.0+ et MariaDB 10.4+
-- =============================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET FOREIGN_KEY_CHECKS = 0;
SET time_zone = "+00:00";

-- =============================================================================
-- TABLES CORE BOT DISCORD
-- =============================================================================

-- Administrateurs du bot
CREATE TABLE `bot_admins` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL COMMENT 'Discord User ID',
  `username` varchar(100) NOT NULL COMMENT 'Discord Username',
  `added_by` varchar(50) NOT NULL COMMENT 'Discord User ID qui a ajouté',
  `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_id` (`user_id`),
  KEY `idx_added_by` (`added_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Modérateurs du bot
CREATE TABLE `bot_moderators` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL COMMENT 'Discord User ID',
  `username` varchar(100) NOT NULL COMMENT 'Discord Username', 
  `added_by` varchar(50) NOT NULL COMMENT 'Discord User ID qui a ajouté',
  `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_id` (`user_id`),
  KEY `idx_added_by` (`added_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuration du bot
CREATE TABLE `bot_config` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `config_key` varchar(50) NOT NULL COMMENT 'Clé de configuration',
  `config_value` text NOT NULL COMMENT 'Valeur de configuration',
  `description` text NULL COMMENT 'Description de la configuration',
  `guild_id` varchar(30) NULL COMMENT 'ID du serveur (NULL pour global)',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_config_guild` (`config_key`, `guild_id`),
  KEY `idx_config_key` (`config_key`),
  KEY `idx_guild_id` (`guild_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Logs des commandes
CREATE TABLE `command_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `command_name` varchar(100) NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `guild_id` varchar(50) NULL,
  `channel_id` varchar(50) NOT NULL,
  `options` json NULL,
  `success` boolean DEFAULT TRUE,
  `error_message` text NULL,
  `execution_time` int NULL COMMENT 'Temps d exécution en ms',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_command_name` (`command_name`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_guild_id` (`guild_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_success` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Logs de modération
CREATE TABLE `moderation_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(50) NOT NULL COMMENT 'ID du serveur Discord',
  `action_type` enum('warn','kick','ban','unban','mute','unmute','timeout','message_delete') NOT NULL,
  `user_id` varchar(50) NOT NULL COMMENT 'ID utilisateur ciblé',
  `moderator_id` varchar(50) NOT NULL COMMENT 'ID modérateur qui fait l action',
  `reason` text NULL COMMENT 'Raison de l action',
  `additional_info` json NULL COMMENT 'Informations supplémentaires',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_guild_id` (`guild_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_moderator_id` (`moderator_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Utilisateurs bannis
CREATE TABLE `banned_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `reason` text NULL,
  `banned_by` varchar(50) NOT NULL,
  `duration_days` int NULL COMMENT 'Durée en jours (NULL = permanent)',
  `expires_at` timestamp NULL COMMENT 'Date d expiration du ban',
  `is_active` boolean DEFAULT TRUE,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_banned_by` (`banned_by`),
  KEY `idx_is_active` (`is_active`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLES PROJETS
-- =============================================================================

-- Projets principaux
CREATE TABLE `main_projects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text NULL,
  `type` enum('web','mobile','desktop','api','other') NOT NULL DEFAULT 'web',
  `status` enum('planning','in_progress','on_hold','completed','cancelled') NOT NULL DEFAULT 'planning',
  `leader_id` varchar(50) NOT NULL,
  `leader_username` varchar(100) NOT NULL,
  `channel_id` varchar(50) NULL COMMENT 'Canal Discord du projet',
  `role_id` varchar(50) NULL COMMENT 'Rôle Discord du projet',
  `max_members` int NULL DEFAULT 10,
  `technologies` json NULL COMMENT 'Technologies utilisées',
  `start_date` date NULL,
  `end_date` date NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_name` (`name`),
  KEY `idx_leader_id` (`leader_id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_channel_id` (`channel_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sous-groupes de projets
CREATE TABLE `project_subgroups` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `project_id` bigint unsigned NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text NULL,
  `leader_id` varchar(50) NOT NULL,
  `leader_username` varchar(100) NOT NULL,
  `channel_id` varchar(50) NULL,
  `role_id` varchar(50) NULL,
  `max_members` int NULL DEFAULT 5,
  `is_active` boolean DEFAULT TRUE,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_subgroup_project` (`project_id`),
  KEY `idx_leader_id` (`leader_id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_subgroup_project` FOREIGN KEY (`project_id`) REFERENCES `main_projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Membres des sous-groupes
CREATE TABLE `project_group_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `subgroup_id` bigint unsigned NOT NULL,
  `user_id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `role` enum('leader','member','contributor') DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_subgroup_user` (`subgroup_id`, `user_id`),
  KEY `fk_member_subgroup` (`subgroup_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_member_subgroup` FOREIGN KEY (`subgroup_id`) REFERENCES `project_subgroups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLES DOCUMENTATION
-- =============================================================================

-- Catégories de documentation
CREATE TABLE `doc_categories` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text NULL,
  `parent_id` bigint unsigned NULL,
  `order_index` int DEFAULT 0,
  `is_active` boolean DEFAULT TRUE,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_order_index` (`order_index`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `fk_category_parent` FOREIGN KEY (`parent_id`) REFERENCES `doc_categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ressources de documentation
CREATE TABLE `doc_resources` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `category_id` bigint unsigned NOT NULL,
  `name` varchar(200) NOT NULL,
  `description` text NULL,
  `language` varchar(50) NULL,
  `url` text NULL,
  `search_url` text NULL,
  `tutorial_url` text NULL,
  `tags` json NULL,
  `difficulty_level` enum('beginner','intermediate','advanced') DEFAULT 'beginner',
  `is_active` boolean DEFAULT TRUE,
  `view_count` int DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_resource_category` (`category_id`),
  KEY `idx_language` (`language`),
  KEY `idx_difficulty_level` (`difficulty_level`),
  KEY `idx_is_active` (`is_active`),
  FULLTEXT KEY `ft_name_description` (`name`, `description`),
  CONSTRAINT `fk_resource_category` FOREIGN KEY (`category_id`) REFERENCES `doc_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLES SYSTÈME STUDI
-- =============================================================================

-- Configuration anti-Studi
CREATE TABLE `studi_config` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `is_enabled` boolean DEFAULT FALSE,
  `max_offenses` int DEFAULT 3,
  `ban_duration_hours` int DEFAULT 24,
  `whitelist_enabled` boolean DEFAULT TRUE,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Utilisateurs bannis du système Studi
CREATE TABLE `studi_banned_users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `reason` text NULL,
  `banned_by` varchar(50) NOT NULL,
  `banned_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL,
  `is_active` boolean DEFAULT TRUE,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_id` (`user_id`),
  KEY `idx_banned_by` (`banned_by`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Infractions Studi
CREATE TABLE `studi_offenses` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `guild_id` varchar(50) NOT NULL,
  `offense_count` int DEFAULT 1,
  `last_offense` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_guild` (`user_id`, `guild_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_guild_id` (`guild_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Liste blanche Studi
CREATE TABLE `studi_whitelist` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL,
  `username` varchar(100) NOT NULL,
  `added_by` varchar(50) NOT NULL,
  `reason` text NULL,
  `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_id` (`user_id`),
  KEY `idx_added_by` (`added_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLES DASHBOARD/SITE LARAVEL
-- =============================================================================

-- Utilisateurs Laravel
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Membres du dashboard Discord
CREATE TABLE `dashboard_members` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` varchar(50) NOT NULL COMMENT 'Discord User ID',
  `username` varchar(100) NOT NULL COMMENT 'Discord Username',
  `guild_id` varchar(30) NOT NULL COMMENT 'Discord Guild ID',
  `is_active` boolean DEFAULT TRUE,
  `last_seen_at` timestamp NULL,
  `permissions` json NULL COMMENT 'Permissions spécifiques',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_guild` (`user_id`, `guild_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_guild_id` (`guild_id`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configurations d'alertes
CREATE TABLE `alert_configs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `guild_id` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL COMMENT 'Type d alerte',
  `channel_id` varchar(50) NOT NULL COMMENT 'Canal de destination',
  `is_enabled` boolean DEFAULT TRUE,
  `config` json NULL COMMENT 'Configuration spécifique',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_guild_id` (`guild_id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_enabled` (`is_enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- TABLES SYSTÈME LARAVEL
-- =============================================================================

-- Cache Laravel
CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jobs Laravel
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned NULL DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Jobs échoués Laravel
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions Laravel
CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint unsigned NULL DEFAULT NULL,
  `ip_address` varchar(45) NULL DEFAULT NULL,
  `user_agent` text NULL DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- RÉACTIVER LES CONTRAINTES
-- =============================================================================

SET FOREIGN_KEY_CHECKS = 1;