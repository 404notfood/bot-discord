<?php
namespace Core;

/**
 * Classe de base pour tous les contrôleurs
 */
abstract class Controller
{
    /**
     * Paramètres de la route
     *
     * @var array
     */
    protected $routeParams = [];
    
    /**
     * Données à passer aux vues
     *
     * @var array
     */
    protected $viewData = [];
    
    /**
     * Instance de base de données
     *
     * @var Database
     */
    protected $db;
    
    /**
     * Constructeur
     */
    public function __construct()
    {
        $this->db = Database::getInstance();
        
        // Initialiser les données de session pour toutes les vues
        $this->initSessionData();
        
        // Méthode personnalisée d'initialisation pour les classes enfants
        $this->init();
    }
    
    /**
     * Initialiser les données de session qui seront disponibles dans toutes les vues
     */
    protected function initSessionData()
    {
        // S'assurer que la session est démarrée
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Ajouter les données de session aux données de vue
        $this->setGlobalViewData('loggedIn', isset($_SESSION['member_id']));
        $this->setGlobalViewData('username', $_SESSION['member_username'] ?? '');
        $this->setGlobalViewData('role', $_SESSION['member_role'] ?? '');
        $this->setGlobalViewData('currentPage', ''); // Sera défini par chaque contrôleur
    }
    
    /**
     * Méthode appelée après le constructeur, à surcharger dans les classes enfants
     */
    protected function init()
    {
    }
    
    /**
     * Définir les paramètres de la route
     *
     * @param array $params Paramètres de la route
     * @return void
     */
    public function setRouteParams($params)
    {
        $this->routeParams = $params;
    }
    
    /**
     * Obtenir un paramètre de route
     *
     * @param string $name Nom du paramètre
     * @param mixed $default Valeur par défaut
     * @return mixed
     */
    protected function routeParam($name, $default = null)
    {
        return $this->routeParams[$name] ?? $default;
    }
    
    /**
     * Obtenir un paramètre GET
     *
     * @param string $name Nom du paramètre
     * @param mixed $default Valeur par défaut
     * @return mixed
     */
    protected function getParam($name, $default = null)
    {
        return isset($_GET[$name]) ? filter_input(INPUT_GET, $name, FILTER_SANITIZE_SPECIAL_CHARS) : $default;
    }
    
    /**
     * Obtenir un paramètre POST
     *
     * @param string $name Nom du paramètre
     * @param mixed $default Valeur par défaut
     * @return mixed
     */
    protected function postParam($name, $default = null)
    {
        return isset($_POST[$name]) ? filter_input(INPUT_POST, $name, FILTER_SANITIZE_SPECIAL_CHARS) : $default;
    }
    
    /**
     * Vérifier si la requête est en POST
     *
     * @return bool
     */
    protected function isPost()
    {
        return $_SERVER['REQUEST_METHOD'] === 'POST';
    }
    
    /**
     * Vérifier si la requête est en GET
     *
     * @return bool
     */
    protected function isGet()
    {
        return $_SERVER['REQUEST_METHOD'] === 'GET';
    }
    
    /**
     * Rediriger vers une URL
     *
     * @param string $url URL de redirection
     * @return void
     */
    protected function redirect($url)
    {
        header('Location: ' . $url);
        exit;
    }
    
    /**
     * Rendre une vue
     *
     * @param string $view Chemin de la vue
     * @param array $data Données à passer à la vue
     * @return void
     */
    protected function render($view, $data = [])
    {
        // Fusionner les données spécifiques à la vue avec les données globales
        $this->viewData = array_merge($this->viewData, $data);
        
        // Extraire les données pour les rendre accessibles dans la vue
        extract($this->viewData);
        
        // Chemin du fichier de vue
        $viewFile = dirname(__DIR__) . '/Views/' . $view . '.php';
        
        if (file_exists($viewFile)) {
            require $viewFile;
        } else {
            throw new \Exception("La vue '$view' n'existe pas");
        }
    }
    
    /**
     * Définir une donnée globale pour toutes les vues
     *
     * @param string $key Clé
     * @param mixed $value Valeur
     * @return void
     */
    protected function setGlobalViewData($key, $value)
    {
        $this->viewData[$key] = $value;
    }
    
    /**
     * Retourner une réponse JSON
     *
     * @param mixed $data Données à convertir en JSON
     * @param int $statusCode Code HTTP
     * @return void
     */
    protected function jsonResponse($data, $statusCode = 200)
    {
        header('Content-Type: application/json');
        http_response_code($statusCode);
        echo json_encode($data);
        exit;
    }
    
    /**
     * Retourner une erreur 404
     *
     * @return void
     */
    protected function notFound()
    {
        header("HTTP/1.0 404 Not Found");
        $this->render('404');
        exit;
    }
    
    /**
     * Retourner une erreur 403
     *
     * @return void
     */
    protected function forbidden()
    {
        header("HTTP/1.0 403 Forbidden");
        $this->render('403');
        exit;
    }
} 