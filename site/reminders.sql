-- Structure de la table `reminders`
CREATE TABLE IF NOT EXISTS `reminders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `guild_id` varchar(50) NOT NULL,
  `channel_id` varchar(50) NOT NULL,
  `frequency` enum('once','daily','weekly','monthly') NOT NULL DEFAULT 'weekly',
  `day_of_week` int(1) DEFAULT NULL COMMENT '1-7 (lundi-dimanche)',
  `day_of_month` int(2) DEFAULT NULL COMMENT '1-31',
  `hour` int(2) NOT NULL DEFAULT 8,
  `minute` int(2) NOT NULL DEFAULT 0,
  `mention_everyone` tinyint(1) NOT NULL DEFAULT 0,
  `last_run_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `channel_id` (`channel_id`),
  KEY `guild_id` (`guild_id`),
  KEY `frequency` (`frequency`),
  KEY `is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci; 