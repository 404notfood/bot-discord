<?php
namespace Controllers;

use Core\Controller;
use Models\DashboardMember;

/**
 * Contrôleur pour la gestion des membres du dashboard
 */
class MemberController extends Controller
{
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
        $this->memberModel = new DashboardMember();
        
        // Initialiser le contrôleur d'authentification
        $this->authController = new AuthController();
        
        // Vérifier si l'utilisateur est connecté
        if (!$this->authController->isLoggedIn()) {
            $this->redirect('/login');
        }
        
        // Vérifier si l'utilisateur a les droits d'admin
        if (!$this->authController->hasRole('admin')) {
            $this->redirect('/dashboard');
        }
        
        // Démarrer la session si elle n'est pas déjà démarrée
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    /**
     * Liste des membres
     */
    public function indexAction()
    {
        // Obtenir tous les membres
        $members = $this->memberModel->getAll('username');
        
        $this->render('members/index', [
            'members' => $members,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role'],
            'user_id' => $_SESSION['member_id'] ?? null
        ]);
    }
    
    /**
     * Afficher le formulaire d'ajout de membre
     */
    public function createAction()
    {
        $errors = [];
        $member = [
            'username' => '',
            'email' => '',
            'password' => '',
            'role' => 'viewer',
            'is_active' => true
        ];
        
        // Traitement du formulaire
        if ($this->isPost()) {
            $member = [
                'username' => $this->postParam('username'),
                'email' => $this->postParam('email'),
                'password' => $this->postParam('password'),
                'role' => $this->postParam('role', 'viewer'),
                'is_active' => (bool)$this->postParam('is_active', true)
            ];
            
            // Validation
            if (empty($member['username'])) {
                $errors[] = 'Le nom d\'utilisateur est obligatoire.';
            } else {
                // Vérifier si le nom d'utilisateur existe déjà
                $sql = "SELECT COUNT(*) as count FROM dashboard_members WHERE username = :username";
                $result = $this->memberModel->query($sql, ['username' => $member['username']])->fetch();
                
                if ($result['count'] > 0) {
                    $errors[] = 'Ce nom d\'utilisateur est déjà pris.';
                }
            }
            
            if (empty($member['email'])) {
                $errors[] = 'L\'email est obligatoire.';
            } else if (!filter_var($member['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'L\'email est invalide.';
            } else {
                // Vérifier si l'email existe déjà
                $sql = "SELECT COUNT(*) as count FROM dashboard_members WHERE email = :email";
                $result = $this->memberModel->query($sql, ['email' => $member['email']])->fetch();
                
                if ($result['count'] > 0) {
                    $errors[] = 'Cet email est déjà utilisé.';
                }
            }
            
            if (empty($member['password'])) {
                $errors[] = 'Le mot de passe est obligatoire.';
            } else if (strlen($member['password']) < 6) {
                $errors[] = 'Le mot de passe doit contenir au moins 6 caractères.';
            }
            
            if (!in_array($member['role'], ['admin', 'editor', 'viewer'])) {
                $errors[] = 'Le rôle sélectionné est invalide.';
            }
            
            // Si pas d'erreurs, enregistrer le membre
            if (empty($errors)) {
                $memberId = $this->memberModel->create($member);
                
                if ($memberId) {
                    // Journaliser l'action
                    $this->memberModel->logActivity(
                        $_SESSION['member_id'],
                        'create_member',
                        "Création du membre: {$member['username']}"
                    );
                    
                    $this->redirect('/members');
                } else {
                    $errors[] = 'Une erreur est survenue lors de la création du membre.';
                }
            }
        }
        
        $this->render('members/form', [
            'member' => $member,
            'errors' => $errors,
            'isNew' => true,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
    
    /**
     * Afficher le formulaire de modification d'un membre
     */
    public function editAction()
    {
        $memberId = (int)$this->routeParams['id'];
        $member = $this->memberModel->findById($memberId);
        
        if (!$member) {
            $this->redirect('/members');
        }
        
        // Empêcher la modification de son propre compte (pour éviter de se verrouiller)
        if ($memberId == $_SESSION['member_id']) {
            $this->redirect('/members');
        }
        
        $errors = [];
        
        // Traitement du formulaire
        if ($this->isPost()) {
            $updatedMember = [
                'username' => $this->postParam('username'),
                'email' => $this->postParam('email'),
                'password' => $this->postParam('password'),
                'role' => $this->postParam('role', 'viewer'),
                'is_active' => (bool)$this->postParam('is_active', false)
            ];
            
            // Validation
            if (empty($updatedMember['username'])) {
                $errors[] = 'Le nom d\'utilisateur est obligatoire.';
            } else if ($updatedMember['username'] !== $member['username']) {
                // Vérifier si le nom d'utilisateur existe déjà (seulement si le nom a changé)
                $sql = "SELECT COUNT(*) as count FROM dashboard_members WHERE username = :username AND id != :id";
                $result = $this->memberModel->query($sql, [
                    'username' => $updatedMember['username'],
                    'id' => $memberId
                ])->fetch();
                
                if ($result['count'] > 0) {
                    $errors[] = 'Ce nom d\'utilisateur est déjà pris.';
                }
            }
            
            if (empty($updatedMember['email'])) {
                $errors[] = 'L\'email est obligatoire.';
            } else if (!filter_var($updatedMember['email'], FILTER_VALIDATE_EMAIL)) {
                $errors[] = 'L\'email est invalide.';
            } else if ($updatedMember['email'] !== $member['email']) {
                // Vérifier si l'email existe déjà (seulement si l'email a changé)
                $sql = "SELECT COUNT(*) as count FROM dashboard_members WHERE email = :email AND id != :id";
                $result = $this->memberModel->query($sql, [
                    'email' => $updatedMember['email'],
                    'id' => $memberId
                ])->fetch();
                
                if ($result['count'] > 0) {
                    $errors[] = 'Cet email est déjà utilisé.';
                }
            }
            
            if (!empty($updatedMember['password']) && strlen($updatedMember['password']) < 6) {
                $errors[] = 'Le mot de passe doit contenir au moins 6 caractères.';
            }
            
            if (!in_array($updatedMember['role'], ['admin', 'editor', 'viewer'])) {
                $errors[] = 'Le rôle sélectionné est invalide.';
            }
            
            // Si pas d'erreurs, mettre à jour le membre
            if (empty($errors)) {
                $success = $this->memberModel->update($memberId, $updatedMember);
                
                if ($success) {
                    // Journaliser l'action
                    $this->memberModel->logActivity(
                        $_SESSION['member_id'],
                        'update_member',
                        "Mise à jour du membre: {$updatedMember['username']}"
                    );
                    
                    $this->redirect('/members');
                } else {
                    $errors[] = 'Une erreur est survenue lors de la mise à jour du membre.';
                }
            }
            
            // En cas d'erreur, utiliser les données soumises
            $member = array_merge($member, $updatedMember);
        }
        
        // Supprimer le mot de passe pour l'affichage
        $member['password'] = '';
        
        $this->render('members/form', [
            'member' => $member,
            'errors' => $errors,
            'isNew' => false,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
    
    /**
     * Supprimer un membre
     */
    public function deleteAction()
    {
        $memberId = (int)$this->routeParams['id'];
        $member = $this->memberModel->findById($memberId);
        
        if (!$member) {
            $this->redirect('/members');
        }
        
        // Empêcher la suppression de son propre compte
        if ($memberId == $_SESSION['member_id']) {
            $this->redirect('/members');
        }
        
        // Traitement de la suppression
        if ($this->isPost()) {
            // Supprimer d'abord les logs d'activité du membre
            $sql = "DELETE FROM dashboard_activity_logs WHERE member_id = :id";
            $this->memberModel->query($sql, ['id' => $memberId]);
            
            // Supprimer le membre
            $success = $this->memberModel->delete($memberId);
            
            if ($success) {
                // Journaliser l'action
                $this->memberModel->logActivity(
                    $_SESSION['member_id'],
                    'delete_member',
                    "Suppression du membre: {$member['username']}"
                );
            }
            
            $this->redirect('/members');
        }
        
        $this->render('members/delete', [
            'member' => $member,
            'username' => $_SESSION['member_username'],
            'role' => $_SESSION['member_role']
        ]);
    }
} 