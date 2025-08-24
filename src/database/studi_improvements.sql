-- Améliorations du système anti-Studi
-- Tables pour whitelist et escalade automatique

-- Table whitelist Studi (utilisateurs exemptés)
CREATE TABLE IF NOT EXISTS studi_whitelist (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL UNIQUE,
  username VARCHAR(100) NOT NULL,
  reason TEXT,
  added_by VARCHAR(50) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_user_id (user_id),
  INDEX idx_active (is_active),
  INDEX idx_expires_at (expires_at)
);

-- Amélioration de la table des offenseurs avec escalade
CREATE TABLE IF NOT EXISTS studi_offenders_enhanced (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  username VARCHAR(100) NOT NULL,
  guild_id VARCHAR(50) NOT NULL,
  offense_count INT DEFAULT 1,
  last_offense_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  escalation_level ENUM('warning', 'timeout', 'kick', 'ban') DEFAULT 'warning',
  total_messages_deleted INT DEFAULT 0,
  first_offense_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_banned BOOLEAN DEFAULT FALSE,
  banned_at TIMESTAMP NULL DEFAULT NULL,
  banned_by VARCHAR(50) NULL DEFAULT NULL,
  ban_reason TEXT NULL DEFAULT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_user_guild (user_id, guild_id),
  INDEX idx_guild_id (guild_id),
  INDEX idx_escalation_level (escalation_level),
  INDEX idx_last_offense (last_offense_at),
  INDEX idx_banned (is_banned)
);

-- Table des logs détaillés Studi
CREATE TABLE IF NOT EXISTS studi_moderation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  guild_id VARCHAR(50) NOT NULL,
  channel_id VARCHAR(50) NOT NULL,
  message_id VARCHAR(50),
  action_type ENUM('message_deleted', 'warning_sent', 'timeout_applied', 'user_kicked', 'user_banned', 'whitelist_bypass') NOT NULL,
  content_snippet TEXT, -- Premier 200 caractères du message
  detected_keywords JSON, -- Mots-clés détectés
  escalation_level VARCHAR(50),
  automated BOOLEAN DEFAULT TRUE,
  moderator_id VARCHAR(50), -- Si action manuelle
  reason TEXT,
  metadata JSON, -- Données additionnelles
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_id (user_id),
  INDEX idx_guild_id (guild_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at),
  INDEX idx_automated (automated)
);

-- Table de configuration Studi par serveur
CREATE TABLE IF NOT EXISTS studi_guild_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guild_id VARCHAR(50) NOT NULL UNIQUE,
  enabled BOOLEAN DEFAULT TRUE,
  
  -- Configuration des mots-clés
  keywords JSON DEFAULT '["studi", "studi.fr", "studifr", "école studi"]',
  case_sensitive BOOLEAN DEFAULT FALSE,
  
  -- Configuration de l'escalade
  escalation_enabled BOOLEAN DEFAULT TRUE,
  warning_threshold INT DEFAULT 1, -- Nombre d'avertissements avant timeout
  timeout_threshold INT DEFAULT 3, -- Nombre de timeouts avant kick
  kick_threshold INT DEFAULT 2,    -- Nombre de kicks avant ban
  
  -- Durées
  timeout_duration INT DEFAULT 3600, -- 1 heure en secondes
  reset_period INT DEFAULT 604800,   -- 1 semaine en secondes
  
  -- Messages personnalisés
  warning_message TEXT DEFAULT '⚠️ Les références à Studi ne sont pas autorisées dans ce serveur.',
  timeout_reason TEXT DEFAULT 'Références répétées à Studi',
  kick_reason TEXT DEFAULT 'Violations répétées de la politique anti-Studi',
  ban_reason TEXT DEFAULT 'Violations persistantes de la politique anti-Studi',
  
  -- Canaux de logs
  log_channel_id VARCHAR(50),
  alert_channel_id VARCHAR(50),
  
  -- Notifications
  notify_on_warning BOOLEAN DEFAULT FALSE,
  notify_on_timeout BOOLEAN DEFAULT TRUE,
  notify_on_kick BOOLEAN DEFAULT TRUE,
  notify_on_ban BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_guild_id (guild_id),
  INDEX idx_enabled (enabled)
);

-- Table des statistiques Studi
CREATE TABLE IF NOT EXISTS studi_statistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guild_id VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  messages_deleted INT DEFAULT 0,
  warnings_sent INT DEFAULT 0,
  timeouts_applied INT DEFAULT 0,
  kicks_executed INT DEFAULT 0,
  bans_executed INT DEFAULT 0,
  whitelist_bypasses INT DEFAULT 0,
  unique_offenders INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_guild_date (guild_id, date),
  INDEX idx_guild_id (guild_id),
  INDEX idx_date (date)
);

-- Insérer la configuration par défaut pour les serveurs existants
INSERT IGNORE INTO studi_guild_config (guild_id) 
SELECT DISTINCT guild_id FROM studi_offenders WHERE guild_id IS NOT NULL;

-- Migration des données existantes
-- Migrer studi_offenders vers studi_offenders_enhanced
INSERT IGNORE INTO studi_offenders_enhanced 
(user_id, username, guild_id, offense_count, last_offense_at, first_offense_at, total_messages_deleted)
SELECT 
    user_id, 
    username, 
    COALESCE(guild_id, 'unknown') as guild_id,
    offense_count,
    last_offense_at,
    first_offense_at,
    COALESCE(messages_deleted, 0) as messages_deleted
FROM studi_offenders
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'studi_offenders');

-- Migrer studi_banned_users vers studi_offenders_enhanced
UPDATE studi_offenders_enhanced soe
JOIN studi_banned_users sbu ON soe.user_id = sbu.user_id
SET 
    soe.is_banned = TRUE,
    soe.banned_at = sbu.banned_at,
    soe.banned_by = sbu.banned_by,
    soe.escalation_level = 'ban'
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'studi_banned_users');

-- Créer des index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_studi_user_guild_date ON studi_moderation_logs (user_id, guild_id, DATE(created_at));
CREATE INDEX IF NOT EXISTS idx_studi_action_date ON studi_moderation_logs (action_type, DATE(created_at));