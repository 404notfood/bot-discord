<?php
/**
 * Configuration principale de l'application
 */

// Charger les variables d'environnement
if (file_exists(__DIR__ . '/../.env')) {
    $env = parse_ini_file(__DIR__ . '/../.env');
    foreach ($env as $key => $value) {
        $_ENV[$key] = $value;
    }
}

return [
    // Configuration de la base de données
    'database' => [
        'host'     => $_ENV['DB_HOST_PHP'] ?? 'localhost',
        'dbname'   => $_ENV['DB_NAME_PHP'] ?? 'discord_bot',
        'username' => $_ENV['DB_USER_PHP'] ?? 'discord_bot',
        'password' => $_ENV['DB_PASSWORD_PHP'] ?? '',
        'charset'  => 'utf8mb4',
    ],
    
    // Configuration de l'application
    'app' => [
        'name'        => $_ENV['APP_NAME'] ?? 'Bot Discord Dashboard',
        'environment' => $_ENV['APP_ENV'] ?? 'development',
        'debug'       => filter_var($_ENV['APP_DEBUG'] ?? true, FILTER_VALIDATE_BOOLEAN),
        'locale'      => 'fr',
        'timezone'    => 'Europe/Paris',
        'base_url'    => $_ENV['APP_URL'] ?? 'https://bot.rtfm2win.ovh',
    ],
    
    // Configuration des chemins
    'paths' => [
        'root'       => dirname(__DIR__),
        'app'        => dirname(__DIR__) . '/App',
        'controllers' => dirname(__DIR__) . '/Controllers',
        'models'     => dirname(__DIR__) . '/Models',
        'views'      => dirname(__DIR__) . '/Views',
        'public'     => dirname(__DIR__) . '/Public',
        'uploads'    => dirname(__DIR__) . '/Public/uploads',
    ],
    
    // Configuration du routage
    'routes' => [
        'default_controller' => 'Auth',
        'default_action'     => 'login',
        'error_controller'   => 'Error',
        'error_action'       => 'notFound',
    ],
    
    // Configuration de la sécurité
    'security' => [
        'session_name'    => 'bot_discord_session',
        'session_lifetime' => (int)($_ENV['SESSION_LIFETIME'] ?? 86400),
        'csrf_token_name' => 'csrf_token',
        'password_algo'   => PASSWORD_BCRYPT,
        'password_cost'   => 12,
    ],
    
    // Configuration des logs
    'logs' => [
        'enabled'    => true,
        'path'       => dirname(__DIR__) . '/Logs',
        'level'      => 'debug', // debug, info, warning, error
    ],
]; 