<?php
namespace Controllers;

use Core\Controller;
use Models\User;
use Models\Resource;
use Models\Category;
use Models\Project;
use Models\ModerationLog;
use Models\StudiConfig;
use Models\StudiOffender;

/**
 * Contrôleur pour le dashboard
 */
class DashboardController extends Controller
{
    /**
     * Modèle des utilisateurs
     *
     * @var User
     */
    private $userModel;
    
    /**
     * Modèle des ressources
     *
     * @var Resource
     */
    private $resourceModel;
    
    /**
     * Modèle des catégories
     *
     * @var Category
     */
    private $categoryModel;
    
    /**
     * Modèle des projets
     *
     * @var Project
     */
    private $projectModel;
    
    /**
     * Modèle des logs de modération
     *
     * @var ModerationLog
     */
    private $modLogModel;
    
    /**
     * Modèle de la configuration Studi
     *
     * @var StudiConfig
     */
    private $studiConfigModel;
    
    /**
     * Modèle des contrevenants Studi
     *
     * @var StudiOffender
     */
    private $studiOffenderModel;
    
    /**
     * Contrôleur d'authentification
     *
     * @var AuthController
     */
    private $authController;
    
    /**
     * Initialisation du contrôleur
     */
    protected function init()
    {
        // Initialiser les modèles
        $this->userModel = new User();
        $this->resourceModel = new Resource();
        $this->categoryModel = new Category();
        $this->projectModel = new Project();
        $this->modLogModel = new ModerationLog();
        $this->studiConfigModel = new StudiConfig();
        $this->studiOffenderModel = new StudiOffender();
        
        // Initialiser le contrôleur d'authentification
        $this->authController = new AuthController();
        
        // Vérifier si l'utilisateur est connecté
        if (!$this->authController->isLoggedIn()) {
            $this->redirect('/login');
        }
        
        // Démarrer la session si elle n'est pas déjà démarrée
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    /**
     * Page d'accueil du dashboard
     */
    public function indexAction()
    {
        // Obtenir les statistiques des utilisateurs
        $userStats = $this->userModel->getStats();
        
        // Obtenir les commandes les plus utilisées
        $topCommands = $this->userModel->getTopCommands(5);
        
        // Obtenir les utilisateurs les plus actifs
        $topUsers = $this->userModel->getMostActiveUsers(5);
        
        // Obtenir les ressources les plus utilisées
        $topResources = $this->resourceModel->getUsageStats(5);
        
        // Obtenir les catégories avec le nombre de ressources
        $categories = $this->categoryModel->getAllWithResourceCount(true);
        
        // Obtenir les statistiques des projets
        $projectStats = $this->projectModel->getStats();
        
        // Obtenir les statistiques de modération (dernier mois)
        $modStats = $this->modLogModel->getModStats(null, 'month');
        
        // Obtenir les informations sur Studi
        $studiConfig = $this->studiConfigModel->getCurrentConfig();
        $studiStats = [];
        
        if ($studiConfig && $studiConfig['is_enabled']) {
            $studiStats = $this->studiOffenderModel->getStats();
        }
        
        $this->render('dashboard/index', [
            'userStats' => $userStats,
            'topCommands' => $topCommands,
            'topUsers' => $topUsers,
            'topResources' => $topResources,
            'categories' => $categories,
            'projectStats' => $projectStats,
            'modStats' => $modStats,
            'studiConfig' => $studiConfig,
            'studiStats' => $studiStats,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
    
    /**
     * Liste des utilisateurs Discord
     */
    public function usersAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('viewer')) {
            $this->redirect('/dashboard');
        }
        
        // Pagination
        $page = max(1, (int)$this->getParam('page', 1));
        $limit = 20;
        $offset = ($page - 1) * $limit;
        
        // Obtenir les utilisateurs
        $sql = "SELECT * FROM users ORDER BY last_seen DESC LIMIT :limit OFFSET :offset";
        $users = $this->userModel->query($sql, ['limit' => $limit, 'offset' => $offset])->fetchAll();
        
        // Obtenir le nombre total d'utilisateurs pour la pagination
        $sqlCount = "SELECT COUNT(*) as count FROM users";
        $count = $this->userModel->query($sqlCount)->fetch()['count'];
        
        $totalPages = ceil($count / $limit);
        
        $this->render('dashboard/users', [
            'users' => $users,
            'currentPage' => $page,
            'totalPages' => $totalPages,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
    
    /**
     * Voir les détails d'un utilisateur
     */
    public function userDetailsAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('viewer')) {
            $this->redirect('/dashboard');
        }
        
        $userId = (int)$this->routeParams['id'];
        
        // Obtenir l'utilisateur
        $user = $this->userModel->findById($userId);
        
        if (!$user) {
            $this->redirect('/dashboard/users');
        }
        
        // Obtenir l'historique des commandes
        $commandHistory = $this->userModel->getCommandHistory($userId, 20);
        
        // Obtenir l'utilisation des ressources
        $resourceUsage = $this->userModel->getResourceUsage($userId, 20);
        
        $this->render('dashboard/user_details', [
            'user' => $user,
            'commandHistory' => $commandHistory,
            'resourceUsage' => $resourceUsage,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
    
    /**
     * Méthode de débogage
     */
    public function debugAction()
    {
        // Vérifier si l'utilisateur est connecté
        $isLoggedIn = isset($_SESSION['member_id']);
        
        echo "<h1>Mode Débogage</h1>";
        
        // Informations sur la session
        echo "<h2>Informations de session</h2>";
        echo "<p>Session active: " . (session_status() === PHP_SESSION_ACTIVE ? 'Oui' : 'Non') . "</p>";
        echo "<p>Utilisateur connecté: " . ($isLoggedIn ? 'Oui' : 'Non') . "</p>";
        
        if ($isLoggedIn) {
            echo "<p>ID du membre: " . $_SESSION['member_id'] . "</p>";
            echo "<p>Nom d'utilisateur: " . $_SESSION['member_username'] . "</p>";
            echo "<p>Rôle: " . $_SESSION['member_role'] . "</p>";
        }
        
        // Test des modèles
        echo "<h2>Test des modèles</h2>";
        
        try {
            echo "<h3>Modèle User</h3>";
            $users = $this->userModel->findAll(5);
            echo "<p>Nombre d'utilisateurs trouvés: " . count($users) . "</p>";
            if (!empty($users)) {
                echo "<pre>" . print_r($users[0], true) . "</pre>";
            }
            
            echo "<h3>Modèle Resource</h3>";
            $resources = $this->resourceModel->findAll(5);
            echo "<p>Nombre de ressources trouvées: " . count($resources) . "</p>";
            if (!empty($resources)) {
                echo "<pre>" . print_r($resources[0], true) . "</pre>";
            }
            
            echo "<h3>Modèle Category</h3>";
            $categories = $this->categoryModel->findAll(5);
            echo "<p>Nombre de catégories trouvées: " . count($categories) . "</p>";
            if (!empty($categories)) {
                echo "<pre>" . print_r($categories[0], true) . "</pre>";
            }
        } catch (Exception $e) {
            echo "<p style='color:red;'>Erreur lors du test des modèles: " . $e->getMessage() . "</p>";
            echo "<pre>" . $e->getTraceAsString() . "</pre>";
        }
        
        // Test de la configuration
        echo "<h2>Configuration</h2>";
        try {
            $config = require ROOT_DIR . '/Config/config.php';
            echo "<p>Base de données: " . $config['database']['dbname'] . "</p>";
            echo "<p>Nom de l'application: " . $config['app']['name'] . "</p>";
            echo "<p>Environnement: " . $config['app']['environment'] . "</p>";
        } catch (Exception $e) {
            echo "<p style='color:red;'>Erreur lors du chargement de la configuration: " . $e->getMessage() . "</p>";
        }
    }
    
    /**
     * Page de monitoring temps réel
     */
    public function monitoringAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('viewer')) {
            $this->redirect('/dashboard');
        }
        
        $this->render('dashboard/monitoring', [
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
} 