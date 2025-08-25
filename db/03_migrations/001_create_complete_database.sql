-- =============================================================================
-- SCRIPT DE MIGRATION COMPLÈTE - VERSION 1.0
-- =============================================================================
-- Ce script migre la base de données vers la structure complète
-- Compatible avec le bot Discord et le site Laravel
-- =============================================================================

USE discord_bot;

-- Vérifier et créer les tables manquantes
SET @sql = '';

-- Table command_logs
SELECT COUNT(*) INTO @exists FROM information_schema.tables 
WHERE table_schema = 'discord_bot' AND table_name = 'command_logs';

IF @exists = 0 THEN
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
END IF;

-- Table banned_users
SELECT COUNT(*) INTO @exists FROM information_schema.tables 
WHERE table_schema = 'discord_bot' AND table_name = 'banned_users';

IF @exists = 0 THEN
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
END IF;

-- Table studi_config
SELECT COUNT(*) INTO @exists FROM information_schema.tables 
WHERE table_schema = 'discord_bot' AND table_name = 'studi_config';

IF @exists = 0 THEN
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
    
    -- Insérer la configuration par défaut
    INSERT INTO `studi_config` (`is_enabled`, `max_offenses`, `ban_duration_hours`, `whitelist_enabled`) 
    VALUES (false, 3, 24, true);
END IF;

-- Table studi_banned_users
SELECT COUNT(*) INTO @exists FROM information_schema.tables 
WHERE table_schema = 'discord_bot' AND table_name = 'studi_banned_users';

IF @exists = 0 THEN
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
END IF;

-- Table studi_offenses
SELECT COUNT(*) INTO @exists FROM information_schema.tables 
WHERE table_schema = 'discord_bot' AND table_name = 'studi_offenses';

IF @exists = 0 THEN
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
END IF;

-- Table studi_whitelist
SELECT COUNT(*) INTO @exists FROM information_schema.tables 
WHERE table_schema = 'discord_bot' AND table_name = 'studi_whitelist';

IF @exists = 0 THEN
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
END IF;

-- Mettre à jour les tables existantes
-- Ajouter des colonnes manquantes à main_projects
ALTER TABLE `main_projects` 
ADD COLUMN IF NOT EXISTS `channel_id` varchar(50) NULL COMMENT 'Canal Discord du projet' AFTER `leader_username`,
ADD COLUMN IF NOT EXISTS `role_id` varchar(50) NULL COMMENT 'Rôle Discord du projet' AFTER `channel_id`,
ADD COLUMN IF NOT EXISTS `max_members` int NULL DEFAULT 10 AFTER `role_id`,
ADD COLUMN IF NOT EXISTS `technologies` json NULL COMMENT 'Technologies utilisées' AFTER `max_members`,
ADD COLUMN IF NOT EXISTS `start_date` date NULL AFTER `technologies`,
ADD COLUMN IF NOT EXISTS `end_date` date NULL AFTER `start_date`;

-- Ajouter des colonnes manquantes à project_subgroups
ALTER TABLE `project_subgroups`
ADD COLUMN IF NOT EXISTS `channel_id` varchar(50) NULL AFTER `leader_username`,
ADD COLUMN IF NOT EXISTS `role_id` varchar(50) NULL AFTER `channel_id`,
ADD COLUMN IF NOT EXISTS `max_members` int NULL DEFAULT 5 AFTER `role_id`;

-- Ajouter des colonnes manquantes à dashboard_members
ALTER TABLE `dashboard_members`
ADD COLUMN IF NOT EXISTS `last_seen_at` timestamp NULL AFTER `is_active`,
ADD COLUMN IF NOT EXISTS `permissions` json NULL COMMENT 'Permissions spécifiques' AFTER `last_seen_at`;

-- Ajouter des colonnes manquantes à bot_admins
ALTER TABLE `bot_admins`
ADD COLUMN IF NOT EXISTS `added_by` varchar(50) NOT NULL COMMENT 'Discord User ID qui a ajouté' AFTER `username`,
ADD COLUMN IF NOT EXISTS `added_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER `added_by`;

-- Ajouter des colonnes manquantes à doc_resources
ALTER TABLE `doc_resources`
ADD COLUMN IF NOT EXISTS `tags` json NULL AFTER `tutorial_url`,
ADD COLUMN IF NOT EXISTS `difficulty_level` enum('beginner','intermediate','advanced') DEFAULT 'beginner' AFTER `tags`,
ADD COLUMN IF NOT EXISTS `is_active` boolean DEFAULT TRUE AFTER `difficulty_level`,
ADD COLUMN IF NOT EXISTS `view_count` int DEFAULT 0 AFTER `is_active`;

-- Créer les index manquants
CREATE INDEX IF NOT EXISTS idx_channel_id ON main_projects(channel_id);
CREATE INDEX IF NOT EXISTS idx_role_id ON main_projects(role_id);
CREATE INDEX IF NOT EXISTS idx_technologies ON main_projects(technologies(100));

-- Logs de fin
SELECT 'Migration 001 terminée avec succès' as status;