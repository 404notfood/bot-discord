-- Créer les tables nécessaires pour le dashboard
USE discord_bot;

-- Table des membres du dashboard
CREATE TABLE IF NOT EXISTS dashboard_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL DEFAULT NULL,
    
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table des logs d'activité du dashboard
CREATE TABLE IF NOT EXISTS dashboard_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (member_id) REFERENCES dashboard_members(id) ON DELETE CASCADE,
    INDEX idx_member_id (member_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insérer un utilisateur administrateur par défaut
-- Mot de passe: admin123
INSERT IGNORE INTO dashboard_members (username, email, password, role) 
VALUES ('admin', 'admin@bot.rtfm2win.ovh', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Afficher le résultat
SELECT 'Tables dashboard créées avec succès' as status;
SELECT COUNT(*) as total_members FROM dashboard_members;