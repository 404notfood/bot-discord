<?php
namespace Controllers;

use Core\Controller;
use Models\DashboardMember;

/**
 * Contrôleur pour l'authentification
 */
class AuthController extends Controller
{
    /**
     * Modèle des membres du dashboard
     *
     * @var DashboardMember
     */
    private $memberModel;
    
    /**
     * Initialisation du contrôleur
     */
    protected function init()
    {
        $this->memberModel = new DashboardMember();
        
        // Démarrer la session si elle n'est pas déjà démarrée
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
    }
    
    /**
     * Afficher le formulaire de connexion
     */
    public function loginAction()
    {
        // Si l'utilisateur est déjà connecté, rediriger vers le dashboard
        if ($this->isLoggedIn()) {
            $this->redirect('/dashboard');
        }
        
        $error = '';
        
        // Traitement du formulaire de connexion
        if ($this->isPost()) {
            $username = $this->postParam('username');
            $password = $this->postParam('password');
            
            if (empty($username) || empty($password)) {
                $error = 'Veuillez remplir tous les champs';
            } else {
                $member = $this->memberModel->authenticate($username, $password);
                
                if ($member) {
                    // Stocker l'ID de l'utilisateur en session
                    $_SESSION['member_id'] = $member['id'];
                    $_SESSION['member_username'] = $member['username'];
                    $_SESSION['member_role'] = $member['role'];
                    
                    // Journaliser la connexion
                    $this->memberModel->logActivity($member['id'], 'login', 'Connexion au dashboard');
                    
                    // Rediriger vers le dashboard
                    $this->redirect('/dashboard');
                } else {
                    $error = 'Identifiants incorrects';
                }
            }
        }
        
        $this->render('auth/login', [
            'error' => $error
        ]);
    }
    
    /**
     * Déconnexion
     */
    public function logoutAction()
    {
        if ($this->isLoggedIn()) {
            // Journaliser la déconnexion
            $this->memberModel->logActivity($_SESSION['member_id'], 'logout', 'Déconnexion du dashboard');
            
            // Supprimer les variables de session
            unset($_SESSION['member_id']);
            unset($_SESSION['member_username']);
            unset($_SESSION['member_role']);
            
            // Détruire la session
            session_destroy();
        }
        
        // Rediriger vers la page de connexion
        $this->redirect('/login');
    }
    
    /**
     * Vérifier si l'utilisateur est connecté
     *
     * @return bool
     */
    public function isLoggedIn()
    {
        return isset($_SESSION['member_id']);
    }
    
    /**
     * Vérifier si l'utilisateur a un rôle spécifique
     *
     * @param string $role Rôle à vérifier
     * @return bool
     */
    public function hasRole($role)
    {
        if (!$this->isLoggedIn()) {
            return false;
        }
        
        return $this->memberModel->hasRole($_SESSION['member_id'], $role);
    }
} 