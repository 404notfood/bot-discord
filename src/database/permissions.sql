-- Tables de permissions étendues pour le bot Discord
-- Ces tables permettent une gestion plus fine des permissions

-- Table des rôles du bot (plus flexible que les tables séparées)
CREATE TABLE IF NOT EXISTS bot_roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  role_type ENUM('admin', 'moderator', 'helper') NOT NULL,
  granted_by VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE KEY unique_user_role (user_id, role_type),
  INDEX idx_user_id (user_id),
  INDEX idx_role_type (role_type),
  INDEX idx_active (is_active)
);

-- Table des permissions spécifiques
CREATE TABLE IF NOT EXISTS bot_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  permission_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_permission_name (permission_name)
);

-- Table de liaison rôles-permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role_type ENUM('admin', 'moderator', 'helper') NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  granted_by VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (permission_name) REFERENCES bot_permissions(permission_name) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_type, permission_name),
  INDEX idx_role_type (role_type),
  INDEX idx_permission (permission_name)
);

-- Table des permissions spéciales par utilisateur (overrides)
CREATE TABLE IF NOT EXISTS user_permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  permission_name VARCHAR(100) NOT NULL,
  is_granted BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE = accordé, FALSE = refusé
  granted_by VARCHAR(50) NOT NULL,
  granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL DEFAULT NULL,
  reason TEXT,
  FOREIGN KEY (permission_name) REFERENCES bot_permissions(permission_name) ON DELETE CASCADE,
  UNIQUE KEY unique_user_permission (user_id, permission_name),
  INDEX idx_user_id (user_id),
  INDEX idx_permission (permission_name),
  INDEX idx_granted (is_granted)
);

-- Table des logs d'actions de permissions
CREATE TABLE IF NOT EXISTS permission_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  action_type ENUM('grant_role', 'revoke_role', 'grant_permission', 'revoke_permission', 'check_permission') NOT NULL,
  executor_id VARCHAR(50) NOT NULL, -- Qui a fait l'action
  target_id VARCHAR(50) NOT NULL,   -- Sur qui l'action a été faite
  permission_name VARCHAR(100),
  role_type VARCHAR(50),
  old_value JSON,
  new_value JSON,
  reason TEXT,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_executor (executor_id),
  INDEX idx_target (target_id),
  INDEX idx_action_type (action_type),
  INDEX idx_executed_at (executed_at)
);

-- Insertion des permissions par défaut
INSERT IGNORE INTO bot_permissions (permission_name, description, is_system) VALUES
-- Permissions de base
('bot.admin', 'Administration complète du bot', TRUE),
('bot.moderator', 'Modération du bot', TRUE),
('bot.helper', 'Aide et support', TRUE),

-- Permissions de commandes
('commands.admin', 'Utiliser les commandes administratives', TRUE),
('commands.moderation', 'Utiliser les commandes de modération', TRUE),
('commands.database', 'Accès aux commandes de base de données', TRUE),
('commands.stats', 'Voir les statistiques du bot', FALSE),
('commands.config', 'Modifier la configuration', TRUE),

-- Permissions Studi
('studi.manage', 'Gérer le système anti-Studi', TRUE),
('studi.whitelist', 'Gérer la whitelist Studi', TRUE),
('studi.view_logs', 'Voir les logs de modération Studi', FALSE),

-- Permissions de gestion des utilisateurs
('users.manage_roles', 'Gérer les rôles des utilisateurs', TRUE),
('users.manage_permissions', 'Gérer les permissions des utilisateurs', TRUE),
('users.view_info', 'Voir les informations des utilisateurs', FALSE),

-- Permissions système
('system.restart', 'Redémarrer le bot', TRUE),
('system.shutdown', 'Arrêter le bot', TRUE),
('system.maintenance', 'Mode maintenance', TRUE);

-- Attribution des permissions par défaut aux rôles
INSERT IGNORE INTO role_permissions (role_type, permission_name, granted_by) VALUES
-- Admin : toutes les permissions
('admin', 'bot.admin', 'SYSTEM'),
('admin', 'commands.admin', 'SYSTEM'),
('admin', 'commands.moderation', 'SYSTEM'),
('admin', 'commands.database', 'SYSTEM'),
('admin', 'commands.stats', 'SYSTEM'),
('admin', 'commands.config', 'SYSTEM'),
('admin', 'studi.manage', 'SYSTEM'),
('admin', 'studi.whitelist', 'SYSTEM'),
('admin', 'studi.view_logs', 'SYSTEM'),
('admin', 'users.manage_roles', 'SYSTEM'),
('admin', 'users.manage_permissions', 'SYSTEM'),
('admin', 'users.view_info', 'SYSTEM'),
('admin', 'system.restart', 'SYSTEM'),
('admin', 'system.shutdown', 'SYSTEM'),
('admin', 'system.maintenance', 'SYSTEM'),

-- Moderator : permissions de modération
('moderator', 'bot.moderator', 'SYSTEM'),
('moderator', 'commands.moderation', 'SYSTEM'),
('moderator', 'commands.stats', 'SYSTEM'),
('moderator', 'studi.manage', 'SYSTEM'),
('moderator', 'studi.view_logs', 'SYSTEM'),
('moderator', 'users.view_info', 'SYSTEM'),

-- Helper : permissions de base
('helper', 'bot.helper', 'SYSTEM'),
('helper', 'commands.stats', 'SYSTEM'),
('helper', 'users.view_info', 'SYSTEM');

-- Migrer les données existantes des anciennes tables (si elles existent)
-- Bot admins
INSERT IGNORE INTO bot_roles (user_id, role_type, granted_by, granted_at)
SELECT user_id, 'admin', added_by, added_at 
FROM bot_admins
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'bot_admins');

-- Bot moderators
INSERT IGNORE INTO bot_roles (user_id, role_type, granted_by, granted_at)
SELECT user_id, 'moderator', added_by, added_at 
FROM bot_moderators
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'bot_moderators');