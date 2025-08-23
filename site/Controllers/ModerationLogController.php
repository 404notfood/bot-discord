<?php
namespace Controllers;

use Core\Controller;
use Models\ModerationLog;
use Models\DashboardMember;

/**
 * Contrôleur pour la gestion des logs de modération
 */
class ModerationLogController extends Controller
{
    /**
     * Modèle ModerationLog
     *
     * @var ModerationLog
     */
    private $logModel;
    
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
        $this->logModel = new ModerationLog();
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
        
        // Définir la page courante pour la navigation
        $this->setGlobalViewData('currentPage', 'moderation');
    }
    
    /**
     * Afficher les logs de modération avec filtres
     */
    public function indexAction()
    {
        // Obtenir les paramètres de filtrage
        $filters = [];
        $page = (int)$this->getParam('page', 1);
        $limit = 50;
        $offset = ($page - 1) * $limit;
        
        if ($this->getParam('guild_id')) {
            $filters['guild_id'] = $this->getParam('guild_id');
        }
        
        if ($this->getParam('user_id')) {
            $filters['user_id'] = $this->getParam('user_id');
        }
        
        if ($this->getParam('moderator_id')) {
            $filters['moderator_id'] = $this->getParam('moderator_id');
        }
        
        if ($this->getParam('action_type')) {
            $filters['action_type'] = $this->getParam('action_type');
        }
        
        if ($this->getParam('date_from')) {
            $filters['date_from'] = $this->getParam('date_from') . ' 00:00:00';
        }
        
        if ($this->getParam('date_to')) {
            $filters['date_to'] = $this->getParam('date_to') . ' 23:59:59';
        }
        
        // Récupérer les logs
        $logs = $this->logModel->getFilteredLogs($filters, $limit, $offset);
        $totalLogs = $this->logModel->countFilteredLogs($filters);
        
        // Calculer la pagination
        $totalPages = ceil($totalLogs / $limit);
        
        // Obtenir les statistiques pour la période sélectionnée
        $guildId = $this->getParam('guild_id');
        $period = $this->getParam('period', 'month');
        $stats = $this->logModel->getModStats($guildId, $period);
        
        $this->render('moderation/logs', [
            'logs' => $logs,
            'filters' => $filters,
            'stats' => $stats,
            'pagination' => [
                'current' => $page,
                'total' => $totalPages,
                'limit' => $limit,
                'total_items' => $totalLogs
            ],
            'title' => 'Logs de modération',
            'period' => $period,
            'actionTypes' => [
                ModerationLog::ACTION_WARN => 'Avertissement',
                ModerationLog::ACTION_KICK => 'Expulsion',
                ModerationLog::ACTION_BAN => 'Bannissement',
                ModerationLog::ACTION_UNBAN => 'Débannissement',
                ModerationLog::ACTION_MUTE => 'Mute',
                ModerationLog::ACTION_UNMUTE => 'Unmute'
            ]
        ]);
    }
    
    /**
     * Afficher les détails d'un log de modération
     */
    public function viewAction()
    {
        $logId = (int)$this->routeParam('id');
        $log = $this->logModel->findById($logId);
        
        if (!$log) {
            $this->redirect('/moderation/logs');
        }
        
        // Décoder les informations additionnelles JSON si présentes
        if (!empty($log['additional_info'])) {
            $log['additional_info'] = json_decode($log['additional_info'], true);
        } else {
            $log['additional_info'] = [];
        }
        
        // Récupérer l'historique de l'utilisateur
        $userHistory = $this->logModel->getUserHistory($log['user_id'], $log['guild_id']);
        
        $this->render('moderation/view', [
            'log' => $log,
            'userHistory' => $userHistory,
            'title' => 'Détails de l\'action de modération',
            'actionTypes' => [
                ModerationLog::ACTION_WARN => 'Avertissement',
                ModerationLog::ACTION_KICK => 'Expulsion',
                ModerationLog::ACTION_BAN => 'Bannissement',
                ModerationLog::ACTION_UNBAN => 'Débannissement',
                ModerationLog::ACTION_MUTE => 'Mute',
                ModerationLog::ACTION_UNMUTE => 'Unmute'
            ]
        ]);
    }
    
    /**
     * Afficher l'historique de modération d'un utilisateur
     */
    public function userHistoryAction()
    {
        $userId = $this->routeParam('user_id');
        
        if (!$userId) {
            $this->redirect('/moderation/logs');
        }
        
        $guildId = $this->getParam('guild_id');
        $userHistory = $this->logModel->getUserHistory($userId, $guildId);
        
        $this->render('moderation/user_history', [
            'userId' => $userId,
            'guildId' => $guildId,
            'history' => $userHistory,
            'title' => 'Historique de modération de l\'utilisateur',
            'actionTypes' => [
                ModerationLog::ACTION_WARN => 'Avertissement',
                ModerationLog::ACTION_KICK => 'Expulsion',
                ModerationLog::ACTION_BAN => 'Bannissement',
                ModerationLog::ACTION_UNBAN => 'Débannissement',
                ModerationLog::ACTION_MUTE => 'Mute',
                ModerationLog::ACTION_UNMUTE => 'Unmute'
            ]
        ]);
    }
    
    /**
     * Afficher les statistiques de modération
     */
    public function statsAction()
    {
        $guildId = $this->getParam('guild_id');
        $period = $this->getParam('period', 'month');
        
        $stats = $this->logModel->getModStats($guildId, $period);
        
        $this->render('moderation/stats', [
            'stats' => $stats,
            'guildId' => $guildId,
            'period' => $period,
            'title' => 'Statistiques de modération',
            'periods' => [
                'day' => 'Dernières 24 heures',
                'week' => 'Dernière semaine',
                'month' => 'Dernier mois',
                'year' => 'Dernière année'
            ]
        ]);
    }
} 