<?php
namespace Core;

/**
 * Classe Router pour gérer les routes de l'application
 */
class Router
{
    /**
     * Routes définies
     *
     * @var array
     */
    private $routes = [];
    
    /**
     * Configuration de l'application
     *
     * @var array
     */
    private $config;
    
    /**
     * Constructeur
     */
    public function __construct()
    {
        $this->config = require dirname(__DIR__) . '/Config/config.php';
    }
    
    /**
     * Ajouter une route
     *
     * @param string $route Chemin de la route (ex: 'blog/view/:id')
     * @param array $params Paramètres de la route (controller, action)
     * @return void
     */
    public function addRoute($route, $params = [])
    {
        // Convertir les routes avec des paramètres (ex: 'blog/view/:id') en expressions régulières
        $route = preg_replace('/\//', '\\/', $route);
        $route = preg_replace('/\:([a-z]+)/', '(?P<\1>[^\/]+)', $route);
        $route = '/^' . $route . '$/i';
        
        $this->routes[$route] = $params;
    }
    
    /**
     * Trouver la route correspondante à l'URL
     *
     * @param string $url URL à matcher
     * @return array|false Paramètres de la route ou false si non trouvée
     */
    private function match($url)
    {
        foreach ($this->routes as $route => $params) {
            if (preg_match($route, $url, $matches)) {
                // Extraire les paramètres nommés (id, slug, etc.)
                foreach ($matches as $key => $match) {
                    if (is_string($key)) {
                        $params[$key] = $match;
                    }
                }
                
                return $params;
            }
        }
        
        return false;
    }
    
    /**
     * Dispatcher la requête vers le contrôleur approprié
     *
     * @param string $url URL à dispatcher
     * @param string $requestMethod Méthode HTTP de la requête
     * @return void
     */
    public function dispatch($url, $requestMethod = 'GET')
    {
        // Supprimer les slashes en début et fin d'URL
        $url = trim($url, '/');
        
        // Si l'URL est vide, utiliser le contrôleur et l'action par défaut
        if (empty($url)) {
            $url = $this->config['routes']['default_controller'] . '/' . $this->config['routes']['default_action'];
        }
        
        // Trouver la route correspondante
        $params = $this->match($url);
        
        if ($params === false) {
            // Route non trouvée, charger le contrôleur d'erreur
            $controller = 'Controllers\\' . $this->config['routes']['error_controller'] . 'Controller';
            $action = $this->config['routes']['error_action'] . 'Action';
            
            if (class_exists($controller)) {
                $controllerInstance = new $controller();
                
                if (method_exists($controllerInstance, $action)) {
                    $controllerInstance->$action();
                } else {
                    throw new \Exception("Méthode {$action} non trouvée dans le contrôleur {$controller}");
                }
            } else {
                // Si même le contrôleur d'erreur n'existe pas, afficher une erreur 404
                header("HTTP/1.0 404 Not Found");
                echo "<h1>404 Not Found</h1>";
                echo "<p>The page you requested could not be found.</p>";
                exit;
            }
        } else {
            // Route trouvée, récupérer le contrôleur et l'action
            $controller = isset($params['controller']) ? $params['controller'] : $this->config['routes']['default_controller'];
            $action = isset($params['action']) ? $params['action'] : $this->config['routes']['default_action'];
            
            // Formater le nom du contrôleur
            $controller = 'Controllers\\' . ucfirst($controller) . 'Controller';
            $action = $action . 'Action';
            
            if (class_exists($controller)) {
                $controllerInstance = new $controller();
                
                // Stocker les paramètres de la route dans le contrôleur
                if (method_exists($controllerInstance, 'setRouteParams')) {
                    $controllerInstance->setRouteParams($params);
                }
                
                // Vérifier que la méthode existe et qu'elle peut être appelée
                if (method_exists($controllerInstance, $action) && is_callable([$controllerInstance, $action])) {
                    // Appeler la méthode avec les paramètres appropriés
                    call_user_func_array([$controllerInstance, $action], []);
                } else {
                    // Action non trouvée, charger le contrôleur d'erreur
                    $errorController = 'Controllers\\' . $this->config['routes']['error_controller'] . 'Controller';
                    $errorAction = $this->config['routes']['error_action'] . 'Action';
                    
                    if (class_exists($errorController)) {
                        $errorControllerInstance = new $errorController();
                        
                        if (method_exists($errorControllerInstance, $errorAction)) {
                            $errorControllerInstance->$errorAction();
                        } else {
                            throw new \Exception("Méthode {$errorAction} non trouvée dans le contrôleur {$errorController}");
                        }
                    } else {
                        // Si même le contrôleur d'erreur n'existe pas, afficher une erreur 404
                        header("HTTP/1.0 404 Not Found");
                        echo "<h1>404 Not Found</h1>";
                        echo "<p>The page you requested could not be found.</p>";
                        exit;
                    }
                }
            } else {
                // Contrôleur non trouvé, charger le contrôleur d'erreur
                $errorController = 'Controllers\\' . $this->config['routes']['error_controller'] . 'Controller';
                $errorAction = $this->config['routes']['error_action'] . 'Action';
                
                if (class_exists($errorController)) {
                    $errorControllerInstance = new $errorController();
                    
                    if (method_exists($errorControllerInstance, $errorAction)) {
                        $errorControllerInstance->$errorAction();
                    } else {
                        throw new \Exception("Méthode {$errorAction} non trouvée dans le contrôleur {$errorController}");
                    }
                } else {
                    // Si même le contrôleur d'erreur n'existe pas, afficher une erreur 404
                    header("HTTP/1.0 404 Not Found");
                    echo "<h1>404 Not Found</h1>";
                    echo "<p>The page you requested could not be found.</p>";
                    exit;
                }
            }
        }
    }
} 