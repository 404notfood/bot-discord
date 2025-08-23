-- Script d'initialisation de la base de données du bot Discord
-- Ce script crée toutes les tables nécessaires pour le fonctionnement du bot

-- Désactiver les contraintes de clés étrangères pour faciliter la création des tables
SET FOREIGN_KEY_CHECKS = 0;


-- Table des administrateurs du bot
CREATE TABLE IF NOT EXISTS bot_admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  username VARCHAR(100) NOT NULL,
  added_by VARCHAR(50) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_admin (user_id)
);

-- Table des modérateurs du bot
CREATE TABLE IF NOT EXISTS bot_moderators (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  username VARCHAR(100) NOT NULL,
  added_by VARCHAR(50) NOT NULL,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_moderator (user_id)
);

-- Table des journaux de commandes
CREATE TABLE IF NOT EXISTS command_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  command_name VARCHAR(100) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  guild_id VARCHAR(50),
  channel_id VARCHAR(50) NOT NULL,
  options JSON,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de configuration studi
CREATE TABLE IF NOT EXISTS studi_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  is_enabled BOOLEAN DEFAULT FALSE,
  max_offenses INT DEFAULT 3,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Table des utilisateurs bannis du système studi
CREATE TABLE IF NOT EXISTS studi_banned_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  reason TEXT,
  banned_by VARCHAR(50) NOT NULL,
  banned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_id (user_id)
);

-- Table des infractions Studi
CREATE TABLE IF NOT EXISTS studi_offenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  guild_id VARCHAR(50) NOT NULL,
  offense_count INT DEFAULT 1,
  last_offense TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_user_guild (user_id, guild_id)
);

-- Table des projets
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status ENUM('planning', 'in_progress', 'paused', 'completed', 'cancelled') DEFAULT 'planning',
  owner_id VARCHAR(50) NOT NULL,
  start_date DATE,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Table des canaux de projets
CREATE TABLE IF NOT EXISTS project_channels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  channel_id VARCHAR(50) NOT NULL,
  channel_type ENUM('general', 'tasks', 'resources', 'announcements') DEFAULT 'general',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Table des sous-groupes
CREATE TABLE IF NOT EXISTS subgroups (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  leader_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Table des membres de sous-groupes
CREATE TABLE IF NOT EXISTS subgroup_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  subgroup_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subgroup_id) REFERENCES subgroups(id) ON DELETE CASCADE,
  UNIQUE KEY unique_subgroup_member (subgroup_id, user_id)
);

-- Table des tâches
CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  subgroup_id INT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  status ENUM('pending', 'in_progress', 'review', 'completed', 'cancelled') DEFAULT 'pending',
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  assigned_to VARCHAR(50),
  start_date DATE,
  due_date DATE,
  completed_date DATE,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (subgroup_id) REFERENCES subgroups(id) ON DELETE SET NULL
);

-- Table des dépendances de tâches
CREATE TABLE IF NOT EXISTS task_dependencies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  task_id INT NOT NULL,
  depends_on_task_id INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dependency (task_id, depends_on_task_id)
);

-- Table des ressources
CREATE TABLE IF NOT EXISTS resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  subgroup_id INT,
  name VARCHAR(200) NOT NULL,
  type ENUM('link', 'file', 'document', 'code', 'other') DEFAULT 'link',
  url TEXT,
  content TEXT,
  language VARCHAR(50),
  is_active BOOLEAN DEFAULT TRUE,
  created_by VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (subgroup_id) REFERENCES subgroups(id) ON DELETE SET NULL
);

-- Table des intégrations externes (GitHub, Trello, etc.)
CREATE TABLE IF NOT EXISTS integrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  external_id VARCHAR(200),
  config JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Table des logs
CREATE TABLE IF NOT EXISTS logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level ENUM('debug', 'info', 'warn', 'error', 'fatal') DEFAULT 'info',
  message TEXT NOT NULL,
  data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des configurations d'alertes
CREATE TABLE IF NOT EXISTS alert_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guild_id VARCHAR(50) NOT NULL,
  type VARCHAR(50) NOT NULL,
  channel_id VARCHAR(50) NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  config JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_guild_alert_type (guild_id, type)
);

-- Table des rappels
CREATE TABLE IF NOT EXISTS reminders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guild_id VARCHAR(50) NOT NULL,
  channel_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  message TEXT NOT NULL,
  remind_at DATETIME NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP
);

-- Table des logs de modération
CREATE TABLE IF NOT EXISTS moderation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  guild_id VARCHAR(50) NOT NULL,
  action_type ENUM('warn', 'kick', 'ban', 'unban', 'mute', 'unmute') NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  moderator_id VARCHAR(50) NOT NULL,
  reason TEXT,
  additional_info JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des catégories de documentation
CREATE TABLE IF NOT EXISTS doc_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_category_name (name)
);

-- Table des ressources de documentation
CREATE TABLE IF NOT EXISTS doc_resources (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  language VARCHAR(100) NOT NULL,
  category_id INT,
  tags TEXT,
  search_url TEXT,
  tutorial_url TEXT,
  popularity INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  added_by VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES doc_categories(id) ON DELETE SET NULL,
  UNIQUE KEY unique_resource_url (url(255))
);

-- Table des votes/évaluations de ressources de documentation
CREATE TABLE IF NOT EXISTS doc_resource_votes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  resource_id INT NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  vote TINYINT NOT NULL DEFAULT 1,
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (resource_id) REFERENCES doc_resources(id) ON DELETE CASCADE,
  UNIQUE KEY unique_resource_user_vote (resource_id, user_id)
);

-- Configurer la configuration par défaut de studi_config si aucune n'existe
INSERT INTO studi_config (is_enabled, max_offenses)
SELECT FALSE, 3
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM studi_config LIMIT 1);

-- Insérer les catégories de documentation par défaut
INSERT INTO doc_categories (name, description, icon, sort_order)
SELECT 'Frontend', 'Technologies pour le développement frontend', '🖥️', 1
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doc_categories WHERE name = 'Frontend');

INSERT INTO doc_categories (name, description, icon, sort_order)
SELECT 'Backend', 'Technologies pour le développement backend', '⚙️', 2
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doc_categories WHERE name = 'Backend');

INSERT INTO doc_categories (name, description, icon, sort_order)
SELECT 'Database', 'Systèmes de gestion de bases de données', '🗄️', 3
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doc_categories WHERE name = 'Database');

INSERT INTO doc_categories (name, description, icon, sort_order)
SELECT 'DevOps', 'Outils et technologies DevOps', '🚀', 4
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doc_categories WHERE name = 'DevOps');

INSERT INTO doc_categories (name, description, icon, sort_order)
SELECT 'Mobile', 'Développement d\'applications mobiles', '📱', 5
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doc_categories WHERE name = 'Mobile');

INSERT INTO doc_categories (name, description, icon, sort_order)
SELECT 'Tools', 'Outils de développement', '🔧', 6
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doc_categories WHERE name = 'Tools');

-- Insérer les ressources de documentation par défaut
INSERT INTO doc_resources (name, description, url, language, category_id, tags, search_url, tutorial_url)
SELECT 
    'MDN JavaScript', 
    'Documentation officielle de Mozilla pour JavaScript', 
    'https://developer.mozilla.org/fr/docs/Web/JavaScript',
    'JavaScript',
    (SELECT id FROM doc_categories WHERE name = 'Frontend'),
    'javascript,web,frontend,ecmascript',
    'https://developer.mozilla.org/fr/search?q=',
    'https://www.youtube.com/results?search_query=javascript+tutorial+français'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doc_resources WHERE url = 'https://developer.mozilla.org/fr/docs/Web/JavaScript');

INSERT INTO doc_resources (name, description, url, language, category_id, tags, search_url, tutorial_url)
SELECT 
    'PHP Documentation', 
    'Manuel PHP officiel', 
    'https://www.php.net/manual/fr/',
    'PHP',
    (SELECT id FROM doc_categories WHERE name = 'Backend'),
    'php,backend,web',
    'https://www.php.net/manual/fr/function.',
    'https://www.youtube.com/results?search_query=php+tutorial+français'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doc_resources WHERE url = 'https://www.php.net/manual/fr/');

INSERT INTO doc_resources (name, description, url, language, category_id, tags, search_url, tutorial_url)
SELECT 
    'MySQL Documentation', 
    'Documentation officielle MySQL', 
    'https://dev.mysql.com/doc/',
    'SQL',
    (SELECT id FROM doc_categories WHERE name = 'Database'),
    'mysql,sql,database,db',
    'https://dev.mysql.com/doc/search.html?q=',
    'https://www.youtube.com/results?search_query=mysql+tutorial+français'
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM doc_resources WHERE url = 'https://dev.mysql.com/doc/');




-- Réactiver les contraintes de clés étrangères
SET FOREIGN_KEY_CHECKS = 1; 