<?php
namespace Controllers;

use Core\Controller;
use Models\StudiConfig;
use Models\StudiOffender;
use Models\DashboardMember;

/**
 * Contrôleur pour la gestion de Studi
 */
class StudiController extends Controller
{
    /**
     * Modèle StudiConfig
     *
     * @var StudiConfig
     */
    private $configModel;
    
    /**
     * Modèle StudiOffender
     *
     * @var StudiOffender
     */
    private $offenderModel;
    
    /**
     * Modèle DashboardMember
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
        $this->configModel = new StudiConfig();
        $this->offenderModel = new StudiOffender();
        $this->memberModel = new DashboardMember();
        
        // Initialiser le contrôleur d'authentification
        $this->authController = new AuthController();
        
        // Vérifier si l'utilisateur est connecté
        if (!$this->authController->isLoggedIn()) {
            $this->redirect('/login');
        }
        
        // Vérifier si l'utilisateur a le rôle d'administrateur
        if (!$this->authController->hasRole('admin')) {
            $this->redirect('/dashboard');
        }
        
        // Démarrer la session si elle n'est pas déjà démarrée
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Définir la page courante pour la navigation
        $this->setGlobalViewData('currentPage', 'studi');
    }
    
    /**
     * Afficher le tableau de bord Studi
     */
    public function indexAction()
    {
        $config = $this->configModel->getCurrentConfig();
        $stats = $this->offenderModel->getStats();
        $topOffenders = $this->offenderModel->getTopOffenders(10);
        
        $this->render('studi/index', [
            'config' => $config,
            'stats' => $stats,
            'topOffenders' => $topOffenders,
            'title' => 'Gestion Studi'
        ]);
    }
    
    /**
     * Gérer la configuration de Studi
     */
    public function configAction()
    {
        $config = $this->configModel->getCurrentConfig();
        $errors = [];
        $success = false;
        
        // Traitement du formulaire
        if ($this->isPost()) {
            $isEnabled = (bool)$this->postParam('is_enabled', false);
            $maxOffenses = (int)$this->postParam('max_offenses', 3);
            
            // Validation
            if ($maxOffenses < 1) {
                $errors[] = 'Le nombre maximum d\'infractions doit être au moins 1.';
            }
            
            // Si pas d'erreurs, mettre à jour la configuration
            if (empty($errors)) {
                $updateData = [
                    'is_enabled' => $isEnabled,
                    'max_offenses' => $maxOffenses,
                    'updated_at' => date('Y-m-d H:i:s')
                ];
                
                $success = $this->configModel->updateConfig($updateData);
                
                if ($success) {
                    // Journaliser l'action
                    $this->memberModel->logActivity(
                        $_SESSION['member_id'],
                        'update_studi_config',
                        "Mise à jour de la configuration Studi: " . ($isEnabled ? 'Activé' : 'Désactivé') . ", Max infractions: {$maxOffenses}"
                    );
                    
                    $config = $updateData;
                } else {
                    $errors[] = 'Une erreur est survenue lors de la mise à jour de la configuration.';
                }
            }
        }
        
        $this->render('studi/config', [
            'config' => $config,
            'errors' => $errors,
            'success' => $success,
            'title' => 'Configuration Studi'
        ]);
    }
    
    /**
     * Afficher la liste des contrevenants
     */
    public function offendersAction()
    {
        $page = (int)$this->getParam('page', 1);
        $limit = 50;
        $offset = ($page - 1) * $limit;
        
        // Récupérer les offenders
        $sql = "SELECT o.*, 
                COUNT(DISTINCT so.guild_id) as guild_count,
                (SELECT COUNT(*) FROM studi_banned_users WHERE user_id = o.user_id) as is_banned
                FROM studi_offenders o
                LEFT JOIN studi_offenses so ON o.user_id = so.user_id
                GROUP BY o.id
                ORDER BY o.offense_count DESC, o.last_offense_at DESC
                LIMIT :limit OFFSET :offset";
        
        $stmt = $this->offenderModel->query($sql, [
            'limit' => $limit,
            'offset' => $offset
        ]);
        $offenders = $stmt->fetchAll();
        
        // Compter le nombre total d'offenders
        $sql = "SELECT COUNT(*) as count FROM studi_offenders";
        $stmt = $this->offenderModel->query($sql);
        $totalCount = $stmt->fetch()['count'];
        
        // Calculer la pagination
        $totalPages = ceil($totalCount / $limit);
        
        $this->render('studi/offenders', [
            'offenders' => $offenders,
            'title' => 'Liste des contrevenants',
            'pagination' => [
                'current' => $page,
                'total' => $totalPages,
                'limit' => $limit,
                'total_items' => $totalCount
            ],
            'maxOffenses' => $this->configModel->getMaxOffenses()
        ]);
    }
    
    /**
     * Afficher la liste des utilisateurs bannis
     */
    public function bannedAction()
    {
        $page = (int)$this->getParam('page', 1);
        $limit = 50;
        $offset = ($page - 1) * $limit;
        
        // Récupérer les utilisateurs bannis
        $bannedUsers = $this->offenderModel->getBannedUsers($limit, $offset);
        
        // Compter le nombre total d'utilisateurs bannis
        $sql = "SELECT COUNT(*) as count FROM studi_banned_users";
        $stmt = $this->offenderModel->query($sql);
        $totalCount = $stmt->fetch()['count'];
        
        // Calculer la pagination
        $totalPages = ceil($totalCount / $limit);
        
        $this->render('studi/banned', [
            'bannedUsers' => $bannedUsers,
            'title' => 'Utilisateurs bannis',
            'pagination' => [
                'current' => $page,
                'total' => $totalPages,
                'limit' => $limit,
                'total_items' => $totalCount
            ]
        ]);
    }
    
    /**
     * Débannir un utilisateur
     */
    public function unbanAction()
    {
        $userId = $this->routeParam('user_id');
        
        if (!$userId) {
            $this->redirect('/studi/banned');
        }
        
        $banDetails = $this->offenderModel->getBanDetails($userId);
        $errors = [];
        $success = false;
        
        if (!$banDetails) {
            $this->redirect('/studi/banned');
        }
        
        // Traitement du formulaire
        if ($this->isPost()) {
            // Débannir l'utilisateur
            $success = $this->offenderModel->unbanUser($userId);
            
            if ($success) {
                // Journaliser l'action
                $this->memberModel->logActivity(
                    $_SESSION['member_id'],
                    'unban_studi_user',
                    "Débannissement de l'utilisateur Studi: {$userId}"
                );
                
                $this->redirect('/studi/banned');
            } else {
                $errors[] = 'Une erreur est survenue lors du débannissement de l\'utilisateur.';
            }
        }
        
        $this->render('studi/unban', [
            'userId' => $userId,
            'banDetails' => $banDetails,
            'errors' => $errors,
            'title' => 'Débannir l\'utilisateur'
        ]);
    }
    
    /**
     * Réinitialiser les infractions d'un utilisateur
     */
    public function resetOffensesAction()
    {
        $userId = $this->routeParam('user_id');
        
        if (!$userId) {
            $this->redirect('/studi/offenders');
        }
        
        $offender = $this->offenderModel->getByUserId($userId);
        $errors = [];
        $success = false;
        
        if (!$offender) {
            $this->redirect('/studi/offenders');
        }
        
        // Traitement du formulaire
        if ($this->isPost()) {
            // Réinitialiser les infractions
            $success = $this->offenderModel->resetOffenses($userId);
            
            if ($success) {
                // Journaliser l'action
                $this->memberModel->logActivity(
                    $_SESSION['member_id'],
                    'reset_studi_offenses',
                    "Réinitialisation des infractions Studi pour l'utilisateur: {$userId}"
                );
                
                $this->redirect('/studi/offenders');
            } else {
                $errors[] = 'Une erreur est survenue lors de la réinitialisation des infractions.';
            }
        }
        
        $this->render('studi/reset_offenses', [
            'userId' => $userId,
            'offender' => $offender,
            'errors' => $errors,
            'title' => 'Réinitialiser les infractions'
        ]);
    }
    
    /**
     * Voir les détails d'un contrevenant
     */
    public function viewOffenderAction()
    {
        $userId = $this->routeParam('user_id');
        
        if (!$userId) {
            $this->redirect('/studi/offenders');
        }
        
        $offender = $this->offenderModel->getByUserId($userId);
        
        if (!$offender) {
            $this->redirect('/studi/offenders');
        }
        
        // Récupérer les infractions par serveur
        $sql = "SELECT so.*, 
                (SELECT COUNT(*) FROM moderation_logs WHERE user_id = so.user_id AND guild_id = so.guild_id) as mod_actions
                FROM studi_offenses so
                WHERE so.user_id = :user_id
                ORDER BY so.last_offense DESC";
        
        $stmt = $this->offenderModel->query($sql, ['user_id' => $userId]);
        $offenses = $stmt->fetchAll();
        
        // Vérifier si l'utilisateur est banni
        $isBanned = $this->offenderModel->isBanned($userId);
        $banDetails = $isBanned ? $this->offenderModel->getBanDetails($userId) : null;
        
        $this->render('studi/view_offender', [
            'userId' => $userId,
            'offender' => $offender,
            'offenses' => $offenses,
            'isBanned' => $isBanned,
            'banDetails' => $banDetails,
            'title' => 'Détails du contrevenant',
            'maxOffenses' => $this->configModel->getMaxOffenses()
        ]);
    }
} 