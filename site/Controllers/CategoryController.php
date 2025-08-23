<?php
namespace Controllers;

use Core\Controller;
use Models\Category;
use Models\DashboardMember;

/**
 * Contrôleur pour la gestion des catégories
 */
class CategoryController extends Controller
{
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
     * Liste des catégories
     */
    public function indexAction()
    {
        // Obtenir les catégories avec le nombre de ressources
        $categories = $this->categoryModel->getAllWithResourceCount();
        
        $this->render('categories/index', [
            'categories' => $categories,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role'],
            'isAdmin' => $this->authController->hasRole('admin'),
            'isEditor' => $this->authController->hasRole('editor')
        ]);
    }
    
    /**
     * Afficher le formulaire d'ajout de catégorie
     */
    public function createAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('editor')) {
            $this->redirect('/categories');
        }
        
        $errors = [];
        $category = [
            'name' => '',
            'description' => ''
        ];
        
        // Traitement du formulaire
        if ($this->isPost()) {
            $category = [
                'name' => $this->postParam('name'),
                'description' => $this->postParam('description')
            ];
            
            // Validation
            if (empty($category['name'])) {
                $errors[] = 'Le nom est obligatoire.';
            } else {
                // Vérifier si le nom existe déjà
                $sql = "SELECT COUNT(*) as count FROM categories WHERE name = :name";
                $result = $this->categoryModel->query($sql, ['name' => $category['name']])->fetch();
                
                if ($result['count'] > 0) {
                    $errors[] = 'Une catégorie avec ce nom existe déjà.';
                }
            }
            
            // Si pas d'erreurs, enregistrer la catégorie
            if (empty($errors)) {
                $categoryId = $this->categoryModel->create($category);
                
                if ($categoryId) {
                    // Journaliser l'action
                    $this->memberModel->logActivity(
                        $_SESSION['member_id'],
                        'create_category',
                        "Création de la catégorie: {$category['name']}"
                    );
                    
                    $this->redirect('/categories');
                } else {
                    $errors[] = 'Une erreur est survenue lors de la création de la catégorie.';
                }
            }
        }
        
        $this->render('categories/form', [
            'category' => $category,
            'errors' => $errors,
            'isNew' => true,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
    
    /**
     * Afficher le formulaire de modification d'une catégorie
     */
    public function editAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('editor')) {
            $this->redirect('/categories');
        }
        
        $categoryId = (int)$this->routeParams['id'];
        $category = $this->categoryModel->findById($categoryId);
        
        if (!$category) {
            $this->redirect('/categories');
        }
        
        $errors = [];
        
        // Traitement du formulaire
        if ($this->isPost()) {
            $updatedCategory = [
                'name' => $this->postParam('name'),
                'description' => $this->postParam('description')
            ];
            
            // Validation
            if (empty($updatedCategory['name'])) {
                $errors[] = 'Le nom est obligatoire.';
            } else if ($updatedCategory['name'] !== $category['name']) {
                // Vérifier si le nom existe déjà (seulement si le nom a changé)
                $sql = "SELECT COUNT(*) as count FROM categories WHERE name = :name AND id != :id";
                $result = $this->categoryModel->query($sql, [
                    'name' => $updatedCategory['name'],
                    'id' => $categoryId
                ])->fetch();
                
                if ($result['count'] > 0) {
                    $errors[] = 'Une catégorie avec ce nom existe déjà.';
                }
            }
            
            // Si pas d'erreurs, mettre à jour la catégorie
            if (empty($errors)) {
                $success = $this->categoryModel->update($categoryId, $updatedCategory);
                
                if ($success) {
                    // Journaliser l'action
                    $this->memberModel->logActivity(
                        $_SESSION['member_id'],
                        'update_category',
                        "Mise à jour de la catégorie: {$updatedCategory['name']}"
                    );
                    
                    $this->redirect('/categories');
                } else {
                    $errors[] = 'Une erreur est survenue lors de la mise à jour de la catégorie.';
                }
            }
            
            // En cas d'erreur, utiliser les données soumises
            $category = array_merge($category, $updatedCategory);
        }
        
        $this->render('categories/form', [
            'category' => $category,
            'errors' => $errors,
            'isNew' => false,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
    
    /**
     * Supprimer une catégorie
     */
    public function deleteAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('admin')) {
            $this->redirect('/categories');
        }
        
        $categoryId = (int)$this->routeParams['id'];
        $category = $this->categoryModel->findById($categoryId);
        
        if (!$category) {
            $this->redirect('/categories');
        }
        
        // Vérifier si la catégorie a des ressources
        $hasResources = $this->categoryModel->hasResources($categoryId);
        
        // Traitement de la suppression
        if ($this->isPost()) {
            $confirm = (bool)$this->postParam('confirm', false);
            
            if ($confirm) {
                try {
                    // Supprimer la catégorie et ses ressources
                    $success = $this->categoryModel->deleteWithResources($categoryId);
                    
                    if ($success) {
                        // Journaliser l'action
                        $this->memberModel->logActivity(
                            $_SESSION['member_id'],
                            'delete_category',
                            "Suppression de la catégorie: {$category['name']}"
                        );
                    }
                } catch (\Exception $e) {
                    // Gérer l'erreur
                }
            }
            
            $this->redirect('/categories');
        }
        
        $this->render('categories/delete', [
            'category' => $category,
            'hasResources' => $hasResources,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
} 