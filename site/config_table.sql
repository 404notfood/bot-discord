-- Structure de la table `config`
CREATE TABLE IF NOT EXISTS `config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Insérer les configurations par défaut pour Discord
INSERT INTO `config` (`key`, `value`) VALUES
('discord_bot_token', ''),
('discord_guild_id', ''),
('discord_everyone_role_id', '');

-- Ajouter une colonne `subgroup_id` à la table `project_channels` si elle n'existe pas déjà
ALTER TABLE `project_channels` 
ADD COLUMN IF NOT EXISTS `subgroup_id` int(11) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS `is_private` tinyint(1) DEFAULT 0,
ADD INDEX IF NOT EXISTS `subgroup_id` (`subgroup_id`);

-- Ajouter une contrainte de clé étrangère si elle n'existe pas
-- ALTER TABLE `project_channels` 
-- ADD CONSTRAINT `fk_project_channels_subgroup` FOREIGN KEY (`subgroup_id`) REFERENCES `subgroups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE; 