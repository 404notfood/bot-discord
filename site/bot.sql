-- Création de la table users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    discord_id VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    preferred_language VARCHAR(10) DEFAULT 'fr',
    notifications_enabled BOOLEAN DEFAULT TRUE
);

-- Création de la table command_history
CREATE TABLE IF NOT EXISTS command_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    command_name VARCHAR(255) NOT NULL,
    parameters TEXT,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Création de la table user_preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    theme VARCHAR(50) DEFAULT 'light',
    language VARCHAR(10) DEFAULT 'fr',
    notifications BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Création de la table resources
CREATE TABLE IF NOT EXISTS resources (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    url VARCHAR(255) NOT NULL,
    search_url VARCHAR(255),
    tutorial_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Création de la table resource_usage
CREATE TABLE IF NOT EXISTS resource_usage (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    resource_id INT NOT NULL,
    search_query TEXT,
    used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE
);

-- Création des index pour optimiser les performances
CREATE INDEX idx_users_discord_id ON users(discord_id);
CREATE INDEX idx_command_history_user_id ON command_history(user_id);
CREATE INDEX idx_command_history_executed_at ON command_history(executed_at);
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_resources_name ON resources(name);
CREATE INDEX idx_resource_usage_user_id ON resource_usage(user_id);
CREATE INDEX idx_resource_usage_resource_id ON resource_usage(resource_id);
CREATE INDEX idx_resource_usage_used_at ON resource_usage(used_at);

-- Création de la table categories pour gérer les catégories de ressources
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Modifier la table resources pour utiliser la table categories
ALTER TABLE resources 
DROP COLUMN category,
ADD COLUMN category_id INT NOT NULL,
ADD CONSTRAINT fk_resources_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- Création d'un index pour category_id
CREATE INDEX idx_resources_category_id ON resources(category_id);

-- Création de la table dashboard_members pour les utilisateurs du dashboard
CREATE TABLE IF NOT EXISTS dashboard_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('admin', 'editor', 'viewer') NOT NULL DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Création d'une table pour les logs d'activité du dashboard
CREATE TABLE IF NOT EXISTS dashboard_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES dashboard_members(id) ON DELETE CASCADE
);

-- Insertion des catégories par défaut
INSERT INTO categories (name, description) VALUES
('Frontend', 'Technologies pour le développement front-end'),
('Backend', 'Technologies pour le développement back-end'),
('Database', 'Systèmes de gestion de bases de données'),
('DevOps', 'Outils et technologies DevOps'),
('Tools', 'Outils de développement'),
('Security', 'Sécurité informatique');

-- Création d'un utilisateur admin par défaut pour le dashboard (mot de passe: admin123)
INSERT INTO dashboard_members (username, password, email, role) VALUES
('admin', '$2y$10$KNxZBnzUxiVVGqLjVMPPAuKAVXkK9wlwIZ/11vz0QIZcJ8/TTJ9Ly', 'admin@example.com', 'admin');

-- Insertion des ressources par défaut
INSERT INTO resources (name, description, category_id, url, search_url, tutorial_url) VALUES
-- Frontend
('React', 'React - Bibliothèque JavaScript pour créer des interfaces utilisateur', (SELECT id FROM categories WHERE name = 'Frontend'), 'https://react.dev/', 'https://react.dev/search?q=', 'https://www.youtube.com/results?search_query=react+tutorial+français'),
('JavaScript', 'JavaScript - Langage de programmation pour le web', (SELECT id FROM categories WHERE name = 'Frontend'), 'https://developer.mozilla.org/fr/docs/Web/JavaScript', 'https://developer.mozilla.org/fr/search?q=', 'https://www.youtube.com/results?search_query=javascript+tutorial+français'),
('CSS', 'CSS - Feuilles de style en cascade', (SELECT id FROM categories WHERE name = 'Frontend'), 'https://developer.mozilla.org/fr/docs/Web/CSS', 'https://developer.mozilla.org/fr/search?q=', 'https://www.youtube.com/results?search_query=css+tutorial+français'),
('HTML', 'HTML - Langage de balisage hypertexte', (SELECT id FROM categories WHERE name = 'Frontend'), 'https://developer.mozilla.org/fr/docs/Web/HTML', 'https://developer.mozilla.org/fr/search?q=', 'https://www.youtube.com/results?search_query=html+tutorial+français'),
('Bootstrap', 'Bootstrap - Framework CSS pour le développement web', (SELECT id FROM categories WHERE name = 'Frontend'), 'https://getbootstrap.com/docs/5.3/', 'https://getbootstrap.com/docs/5.3/search.html?q=', 'https://www.youtube.com/results?search_query=bootstrap+tutorial+français'),
('SASS', 'SASS - Préprocesseur CSS', (SELECT id FROM categories WHERE name = 'Frontend'), 'https://sass-lang.com/documentation/', 'https://sass-lang.com/documentation/search.html?q=', 'https://www.youtube.com/results?search_query=sass+tutorial+français'),
('TypeScript', 'TypeScript - JavaScript typé', (SELECT id FROM categories WHERE name = 'Frontend'), 'https://www.typescriptlang.org/docs/', 'https://www.typescriptlang.org/docs/search.html?q=', 'https://www.youtube.com/results?search_query=typescript+tutorial+français'),
('Webpack', 'Webpack - Module bundler', (SELECT id FROM categories WHERE name = 'Frontend'), 'https://webpack.js.org/', 'https://webpack.js.org/search.html?q=', 'https://www.youtube.com/results?search_query=webpack+tutorial+français'),
('Tailwind CSS', 'Tailwind CSS - Framework CSS utilitaire', (SELECT id FROM categories WHERE name = 'Frontend'), 'https://tailwindcss.com/docs/', 'https://tailwindcss.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=tailwindcss+tutorial+français'),

-- Backend
('PHP', 'PHP - Langage de programmation pour le développement web', (SELECT id FROM categories WHERE name = 'Backend'), 'https://www.php.net/manual/fr/', 'https://www.php.net/manual/fr/function.', 'https://www.youtube.com/results?search_query=php+tutorial+français'),
('Python', 'Python - Langage de programmation polyvalent', (SELECT id FROM categories WHERE name = 'Backend'), 'https://docs.python.org/fr/3/', 'https://docs.python.org/fr/3/search.html?q=', 'https://www.youtube.com/results?search_query=python+tutorial+français'),
('Symfony', 'Symfony - Framework PHP', (SELECT id FROM categories WHERE name = 'Backend'), 'https://symfony.com/doc/current/', 'https://symfony.com/doc/current/search.html?q=', 'https://www.youtube.com/results?search_query=symfony+tutorial+français'),
('Laravel', 'Laravel - Framework PHP', (SELECT id FROM categories WHERE name = 'Backend'), 'https://laravel.com/docs/', 'https://laravel.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=laravel+tutorial+français'),
('Django', 'Django - Framework Python', (SELECT id FROM categories WHERE name = 'Backend'), 'https://docs.djangoproject.com/fr/5.0/', 'https://docs.djangoproject.com/fr/5.0/search.html?q=', 'https://www.youtube.com/results?search_query=django+tutorial+français'),
('Flask', 'Flask - Framework Python léger', (SELECT id FROM categories WHERE name = 'Backend'), 'https://flask.palletsprojects.com/en/2.3.x/', 'https://flask.palletsprojects.com/en/2.3.x/search.html?q=', 'https://www.youtube.com/results?search_query=flask+tutorial+français'),
('Express.js', 'Express.js - Framework Node.js', (SELECT id FROM categories WHERE name = 'Backend'), 'https://expressjs.com/fr/', 'https://expressjs.com/fr/search.html?q=', 'https://www.youtube.com/results?search_query=expressjs+tutorial+français'),

-- Base de données
('MySQL', 'MySQL - Système de gestion de base de données relationnelle', (SELECT id FROM categories WHERE name = 'Database'), 'https://dev.mysql.com/doc/', 'https://dev.mysql.com/doc/search.html?q=', 'https://www.youtube.com/results?search_query=mysql+tutorial+français'),
('PostgreSQL', 'PostgreSQL - Système de gestion de base de données relationnelle', (SELECT id FROM categories WHERE name = 'Database'), 'https://www.postgresql.org/docs/', 'https://www.postgresql.org/docs/search.html?q=', 'https://www.youtube.com/results?search_query=postgresql+tutorial+français'),
('MongoDB', 'MongoDB - Base de données NoSQL', (SELECT id FROM categories WHERE name = 'Database'), 'https://www.mongodb.com/docs/', 'https://www.mongodb.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=mongodb+tutorial+français'),
('Redis', 'Redis - Base de données en mémoire', (SELECT id FROM categories WHERE name = 'Database'), 'https://redis.io/docs/', 'https://redis.io/search.html?q=', 'https://www.youtube.com/results?search_query=redis+tutorial+français'),
('SQLite', 'SQLite - Base de données légère', (SELECT id FROM categories WHERE name = 'Database'), 'https://www.sqlite.org/docs.html', 'https://www.sqlite.org/search.html?q=', 'https://www.youtube.com/results?search_query=sqlite+tutorial+français'),

-- DevOps
('Git', 'Git - Système de contrôle de version', (SELECT id FROM categories WHERE name = 'DevOps'), 'https://git-scm.com/doc/', 'https://git-scm.com/doc/search.html?q=', 'https://www.youtube.com/results?search_query=git+tutorial+français'),
('Docker', 'Docker - Plateforme de conteneurisation', (SELECT id FROM categories WHERE name = 'DevOps'), 'https://docs.docker.com/', 'https://docs.docker.com/search.html?q=', 'https://www.youtube.com/results?search_query=docker+tutorial+français'),
('Kubernetes', 'Kubernetes - Orchestration de conteneurs', (SELECT id FROM categories WHERE name = 'DevOps'), 'https://kubernetes.io/fr/docs/', 'https://kubernetes.io/fr/docs/search.html?q=', 'https://www.youtube.com/results?search_query=kubernetes+tutorial+français'),
('Jenkins', 'Jenkins - Serveur d''intégration continue', (SELECT id FROM categories WHERE name = 'DevOps'), 'https://www.jenkins.io/doc/', 'https://www.jenkins.io/doc/search.html?q=', 'https://www.youtube.com/results?search_query=jenkins+tutorial+français'),

-- Outils
('VS Code', 'Visual Studio Code - Éditeur de code', (SELECT id FROM categories WHERE name = 'Tools'), 'https://code.visualstudio.com/docs/', 'https://code.visualstudio.com/docs/search.html?q=', 'https://www.youtube.com/results?search_query=vscode+tutorial+français'),
('npm', 'npm - Gestionnaire de paquets Node.js', (SELECT id FROM categories WHERE name = 'Tools'), 'https://docs.npmjs.com/', 'https://docs.npmjs.com/search.html?q=', 'https://www.youtube.com/results?search_query=npm+tutorial+français'),
('Yarn', 'Yarn - Gestionnaire de paquets alternatif', (SELECT id FROM categories WHERE name = 'Tools'), 'https://yarnpkg.com/', 'https://yarnpkg.com/search.html?q=', 'https://www.youtube.com/results?search_query=yarn+tutorial+français'),
('Composer', 'Composer - Gestionnaire de dépendances PHP', (SELECT id FROM categories WHERE name = 'Tools'), 'https://getcomposer.org/doc/', 'https://getcomposer.org/doc/search.html?q=', 'https://www.youtube.com/results?search_query=composer+tutorial+français'),

-- Sécurité
('OWASP', 'OWASP - Open Web Application Security Project', (SELECT id FROM categories WHERE name = 'Security'), 'https://owasp.org/', 'https://owasp.org/search.html?q=', 'https://www.youtube.com/results?search_query=owasp+tutorial+français'),
('Web Security Academy', 'Web Security Academy - Plateforme d''apprentissage de la sécurité web', (SELECT id FROM categories WHERE name = 'Security'), 'https://portswigger.net/web-security/', 'https://portswigger.net/web-security/search.html?q=', 'https://www.youtube.com/results?search_query=web+security+tutorial+français'),
('HackTricks', 'HackTricks - Guide de hacking éthique', (SELECT id FROM categories WHERE name = 'Security'), 'https://book.hacktricks.xyz/', 'https://book.hacktricks.xyz/search.html?q=', 'https://www.youtube.com/results?search_query=hacktricks+tutorial+français'),
('Kali Linux', 'Kali Linux - Distribution Linux pour la sécurité', (SELECT id FROM categories WHERE name = 'Security'), 'https://www.kali.org/docs/', 'https://www.kali.org/docs/search.html?q=', 'https://www.youtube.com/results?search_query=kali+linux+tutorial+français'),
('PenTest', 'PenTest - Tests de pénétration', (SELECT id FROM categories WHERE name = 'Security'), 'https://www.offensive-security.com/', 'https://www.offensive-security.com/search.html?q=', 'https://www.youtube.com/results?search_query=pentest+tutorial+français'); 