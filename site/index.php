<?php
/**
 * Point d'entrée de l'application
 */

// Activer l'affichage des erreurs pour le débogage
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Définir le mode débogage
$_SERVER['DEBUG'] = true;

// Définir le répertoire racine
define('ROOT_DIR', __DIR__);

// Charger l'autoloader
spl_autoload_register(function($className) {
    $file = ROOT_DIR . '/' . str_replace('\\', '/', $className) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

// Définir le fuseau horaire
date_default_timezone_set('Europe/Paris');

// Démarrer la session
session_start();

// Obtenir l'URL demandée
$requestUri = $_SERVER['REQUEST_URI'];

// Supprimer le chemin de base
$basePath = dirname($_SERVER['SCRIPT_NAME']);
if ($basePath !== '/') {
    $requestUri = substr($requestUri, strlen($basePath));
}

// Supprimer la chaîne de requête
$requestUri = explode('?', $requestUri)[0];

// Créer le routeur
$router = new Core\Router();

// Définir les routes
// Routes d'authentification
$router->addRoute('', ['controller' => 'Auth', 'action' => 'login']);
$router->addRoute('login', ['controller' => 'Auth', 'action' => 'login']);
$router->addRoute('logout', ['controller' => 'Auth', 'action' => 'logout']);

// Routes du dashboard
$router->addRoute('dashboard', ['controller' => 'Dashboard', 'action' => 'index']);
$router->addRoute('dashboard/monitoring', ['controller' => 'Dashboard', 'action' => 'monitoring']);
$router->addRoute('dashboard/users', ['controller' => 'Dashboard', 'action' => 'users']);
$router->addRoute('dashboard/user/:id', ['controller' => 'Dashboard', 'action' => 'userDetails']);

// Routes API pour le monitoring
$router->addRoute('api/bot-status', ['controller' => 'Api', 'action' => 'getBotStatus']);
$router->addRoute('api/live-stats', ['controller' => 'Api', 'action' => 'getLiveStats']);
$router->addRoute('api/metrics', ['controller' => 'Api', 'action' => 'getMetrics']);
$router->addRoute('api/discord-webhook', ['controller' => 'Api', 'action' => 'discordWebhook']);

// Routes pour les ressources
$router->addRoute('resources', ['controller' => 'Resource', 'action' => 'index']);
$router->addRoute('resources/create', ['controller' => 'Resource', 'action' => 'create']);
$router->addRoute('resources/edit/:id', ['controller' => 'Resource', 'action' => 'edit']);
$router->addRoute('resources/delete/:id', ['controller' => 'Resource', 'action' => 'delete']);

// Routes pour les catégories
$router->addRoute('categories', ['controller' => 'Category', 'action' => 'index']);
$router->addRoute('categories/create', ['controller' => 'Category', 'action' => 'create']);
$router->addRoute('categories/edit/:id', ['controller' => 'Category', 'action' => 'edit']);
$router->addRoute('categories/delete/:id', ['controller' => 'Category', 'action' => 'delete']);

// Routes pour les membres du dashboard
$router->addRoute('members', ['controller' => 'Member', 'action' => 'index']);
$router->addRoute('members/create', ['controller' => 'Member', 'action' => 'create']);
$router->addRoute('members/edit/:id', ['controller' => 'Member', 'action' => 'edit']);
$router->addRoute('members/delete/:id', ['controller' => 'Member', 'action' => 'delete']);

// Routes pour les projets
$router->addRoute('projects', ['controller' => 'Project', 'action' => 'index']);
$router->addRoute('projects/create', ['controller' => 'Project', 'action' => 'create']);
$router->addRoute('projects/store', ['controller' => 'Project', 'action' => 'store']);
$router->addRoute('projects/view/:id', ['controller' => 'Project', 'action' => 'view']);
$router->addRoute('projects/edit/:id', ['controller' => 'Project', 'action' => 'edit']);
$router->addRoute('projects/update/:id', ['controller' => 'Project', 'action' => 'update']);
$router->addRoute('projects/delete/:id', ['controller' => 'Project', 'action' => 'delete']);

// Routes pour les sous-groupes
$router->addRoute('subgroups', ['controller' => 'Subgroup', 'action' => 'index']);
$router->addRoute('subgroups/create', ['controller' => 'Subgroup', 'action' => 'create']);
$router->addRoute('subgroups/create/:id', ['controller' => 'Subgroup', 'action' => 'create']);
$router->addRoute('subgroups/view/:id', ['controller' => 'Subgroup', 'action' => 'view']);
$router->addRoute('subgroups/edit/:id', ['controller' => 'Subgroup', 'action' => 'edit']);
$router->addRoute('subgroups/delete/:id', ['controller' => 'Subgroup', 'action' => 'delete']);
$router->addRoute('subgroups/members/:id', ['controller' => 'Subgroup', 'action' => 'members']);

// Routes pour les tâches
$router->addRoute('tasks', ['controller' => 'Task', 'action' => 'index']);
$router->addRoute('tasks/create', ['controller' => 'Task', 'action' => 'create']);
$router->addRoute('tasks/create/:id', ['controller' => 'Task', 'action' => 'create']);
$router->addRoute('tasks/view/:id', ['controller' => 'Task', 'action' => 'view']);
$router->addRoute('tasks/edit/:id', ['controller' => 'Task', 'action' => 'edit']);
$router->addRoute('tasks/delete/:id', ['controller' => 'Task', 'action' => 'delete']);
$router->addRoute('tasks/status/:id/:status', ['controller' => 'Task', 'action' => 'changeStatus']);

// Routes pour les logs de modération
$router->addRoute('moderation/logs', ['controller' => 'ModerationLog', 'action' => 'index']);
$router->addRoute('moderation/logs/view/:id', ['controller' => 'ModerationLog', 'action' => 'view']);
$router->addRoute('moderation/logs/user/:user_id', ['controller' => 'ModerationLog', 'action' => 'userHistory']);
$router->addRoute('moderation/stats', ['controller' => 'ModerationLog', 'action' => 'stats']);

// Routes pour Studi
$router->addRoute('studi', ['controller' => 'Studi', 'action' => 'index']);
$router->addRoute('studi/config', ['controller' => 'Studi', 'action' => 'config']);
$router->addRoute('studi/offenders', ['controller' => 'Studi', 'action' => 'offenders']);
$router->addRoute('studi/banned', ['controller' => 'Studi', 'action' => 'banned']);
$router->addRoute('studi/unban/:user_id', ['controller' => 'Studi', 'action' => 'unban']);
$router->addRoute('studi/reset-offenses/:user_id', ['controller' => 'Studi', 'action' => 'resetOffenses']);
$router->addRoute('studi/view-offender/:user_id', ['controller' => 'Studi', 'action' => 'viewOffender']);

// Routes pour les paramètres
$router->addRoute('settings', ['controller' => 'Settings', 'action' => 'index']);
$router->addRoute('settings/general', ['controller' => 'Settings', 'action' => 'general']);
$router->addRoute('settings/discord', ['controller' => 'Settings', 'action' => 'discord']);
$router->addRoute('settings/test-discord', ['controller' => 'Settings', 'action' => 'testDiscord']);

// Routes pour les rappels
$router->addRoute('reminders', ['controller' => 'Reminder', 'action' => 'index']);
$router->addRoute('reminders/create', ['controller' => 'Reminder', 'action' => 'create']);
$router->addRoute('reminders/store', ['controller' => 'Reminder', 'action' => 'store']);
$router->addRoute('reminders/edit/:id', ['controller' => 'Reminder', 'action' => 'edit']);
$router->addRoute('reminders/update/:id', ['controller' => 'Reminder', 'action' => 'update']);
$router->addRoute('reminders/delete/:id', ['controller' => 'Reminder', 'action' => 'delete']);
$router->addRoute('reminders/test/:id', ['controller' => 'Reminder', 'action' => 'test']);

// Ajouter une route de débogage
$router->addRoute('debug', ['controller' => 'Dashboard', 'action' => 'debug']);

// Dispatcher la requête
try {
    $router->dispatch($requestUri, $_SERVER['REQUEST_METHOD']);
} catch (Exception $e) {
    // Gérer l'erreur
    http_response_code(500);
    
    if (isset($_SERVER['DEBUG']) && $_SERVER['DEBUG']) {
        echo '<h1>Erreur</h1>';
        echo '<p>' . $e->getMessage() . '</p>';
        echo '<pre>' . $e->getTraceAsString() . '</pre>';
    } else {
        include ROOT_DIR . '/Views/500.php';
    }
} 