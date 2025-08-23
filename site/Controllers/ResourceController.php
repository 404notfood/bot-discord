<?php
namespace Controllers;

use Core\Controller;
use Models\Resource;
use Models\Category;
use Models\DashboardMember;

/**
 * Contrôleur pour la gestion des ressources
 */
class ResourceController extends Controller
{
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
     * Modèle des membres du dashboard
     *
     * @var DashboardMember
     */
    private $memberModel;
    
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
        $this->resourceModel = new Resource();
        $this->categoryModel = new Category();
        $this->memberModel = new DashboardMember();
        
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
     * Liste des ressources
     */
    public function indexAction()
    {
        // Obtenir les ressources avec leurs catégories
        $resources = $this->resourceModel->getAllWithCategories();
        
        $this->render('resources/index', [
            'resources' => $resources,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role'],
            'isAdmin' => $this->authController->hasRole('admin'),
            'isEditor' => $this->authController->hasRole('editor')
        ]);
    }
    
    /**
     * Afficher le formulaire d'ajout de ressource
     */
    public function createAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('editor')) {
            $this->redirect('/resources');
        }
        
        // Obtenir les catégories pour le formulaire
        $categories = $this->categoryModel->getAll('name');
        
        $errors = [];
        $resource = [
            'name' => '',
            'description' => '',
            'category_id' => '',
            'url' => '',
            'language' => '',
            'tags' => '',
            'search_url' => '',
            'tutorial_url' => '',
            'is_active' => true,
            'added_by' => $_SESSION['member_username'] ?? null
        ];
        
        // Traitement du formulaire
        if ($this->isPost()) {
            $resource = [
                'name' => $this->postParam('name'),
                'description' => $this->postParam('description'),
                'category_id' => $this->postParam('category_id'),
                'url' => $this->postParam('url'),
                'language' => $this->postParam('language'),
                'tags' => $this->postParam('tags'),
                'search_url' => $this->postParam('search_url'),
                'tutorial_url' => $this->postParam('tutorial_url'),
                'is_active' => (bool)$this->postParam('is_active', true),
                'added_by' => $_SESSION['member_username'] ?? null
            ];
            
            // Validation
            if (empty($resource['name'])) {
                $errors[] = 'Le nom est obligatoire.';
            }
            
            if (empty($resource['description'])) {
                $errors[] = 'La description est obligatoire.';
            }
            
            if (empty($resource['language'])) {
                $errors[] = 'Le langage est obligatoire.';
            }
            
            if (empty($resource['category_id'])) {
                $errors[] = 'La catégorie est obligatoire.';
            }
            
            if (empty($resource['url'])) {
                $errors[] = 'L\'URL est obligatoire.';
            } else if (!filter_var($resource['url'], FILTER_VALIDATE_URL)) {
                $errors[] = 'L\'URL est invalide.';
            }
            
            if (!empty($resource['search_url']) && !filter_var($resource['search_url'], FILTER_VALIDATE_URL)) {
                $errors[] = 'L\'URL de recherche est invalide.';
            }
            
            if (!empty($resource['tutorial_url']) && !filter_var($resource['tutorial_url'], FILTER_VALIDATE_URL)) {
                $errors[] = 'L\'URL du tutoriel est invalide.';
            }
            
            // Si pas d'erreurs, enregistrer la ressource
            if (empty($errors)) {
                $resourceId = $this->resourceModel->create($resource);
                
                if ($resourceId) {
                    // Journaliser l'action
                    $this->memberModel->logActivity(
                        $_SESSION['member_id'],
                        'create_resource',
                        "Création de la ressource: {$resource['name']}"
                    );
                    
                    $this->redirect('/resources');
                } else {
                    $errors[] = 'Une erreur est survenue lors de la création de la ressource.';
                }
            }
        }
        
        $this->render('resources/form', [
            'resource' => $resource,
            'categories' => $categories,
            'errors' => $errors,
            'isNew' => true,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
    
    /**
     * Afficher le formulaire de modification d'une ressource
     */
    public function editAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('editor')) {
            $this->redirect('/resources');
        }
        
        $resourceId = (int)$this->routeParams['id'];
        $resource = $this->resourceModel->findById($resourceId);
        
        if (!$resource) {
            $this->redirect('/resources');
        }
        
        // Obtenir les catégories pour le formulaire
        $categories = $this->categoryModel->getAll('name');
        
        $errors = [];
        
        // Traitement du formulaire
        if ($this->isPost()) {
            $updatedResource = [
                'name' => $this->postParam('name'),
                'description' => $this->postParam('description'),
                'category_id' => $this->postParam('category_id'),
                'url' => $this->postParam('url'),
                'language' => $this->postParam('language'),
                'tags' => $this->postParam('tags'),
                'search_url' => $this->postParam('search_url'),
                'tutorial_url' => $this->postParam('tutorial_url'),
                'is_active' => (bool)$this->postParam('is_active', false),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            // Validation
            if (empty($updatedResource['name'])) {
                $errors[] = 'Le nom est obligatoire.';
            }
            
            if (empty($updatedResource['description'])) {
                $errors[] = 'La description est obligatoire.';
            }
            
            if (empty($updatedResource['language'])) {
                $errors[] = 'Le langage est obligatoire.';
            }
            
            if (empty($updatedResource['category_id'])) {
                $errors[] = 'La catégorie est obligatoire.';
            }
            
            if (empty($updatedResource['url'])) {
                $errors[] = 'L\'URL est obligatoire.';
            } else if (!filter_var($updatedResource['url'], FILTER_VALIDATE_URL)) {
                $errors[] = 'L\'URL est invalide.';
            }
            
            if (!empty($updatedResource['search_url']) && !filter_var($updatedResource['search_url'], FILTER_VALIDATE_URL)) {
                $errors[] = 'L\'URL de recherche est invalide.';
            }
            
            if (!empty($updatedResource['tutorial_url']) && !filter_var($updatedResource['tutorial_url'], FILTER_VALIDATE_URL)) {
                $errors[] = 'L\'URL du tutoriel est invalide.';
            }
            
            // Si pas d'erreurs, mettre à jour la ressource
            if (empty($errors)) {
                $success = $this->resourceModel->update($resourceId, $updatedResource);
                
                if ($success) {
                    // Journaliser l'action
                    $this->memberModel->logActivity(
                        $_SESSION['member_id'],
                        'update_resource',
                        "Mise à jour de la ressource: {$updatedResource['name']}"
                    );
                    
                    $this->redirect('/resources');
                } else {
                    $errors[] = 'Une erreur est survenue lors de la mise à jour de la ressource.';
                }
            }
            
            // En cas d'erreur, utiliser les données soumises
            $resource = array_merge($resource, $updatedResource);
        }
        
        $this->render('resources/form', [
            'resource' => $resource,
            'categories' => $categories,
            'errors' => $errors,
            'isNew' => false,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
    
    /**
     * Supprimer une ressource
     */
    public function deleteAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('admin')) {
            $this->redirect('/resources');
        }
        
        $resourceId = (int)$this->routeParams['id'];
        $resource = $this->resourceModel->findById($resourceId);
        
        if (!$resource) {
            $this->redirect('/resources');
        }
        
        // Traitement de la suppression
        if ($this->isPost()) {
            // Supprimer d'abord les utilisations de la ressource
            $sql = "DELETE FROM resource_usage WHERE resource_id = :id";
            $this->resourceModel->query($sql, ['id' => $resourceId]);
            
            // Supprimer la ressource
            $success = $this->resourceModel->delete($resourceId);
            
            if ($success) {
                // Journaliser l'action
                $this->memberModel->logActivity(
                    $_SESSION['member_id'],
                    'delete_resource',
                    "Suppression de la ressource: {$resource['name']}"
                );
            }
            
            $this->redirect('/resources');
        }
        
        $this->render('resources/delete', [
            'resource' => $resource,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
} 