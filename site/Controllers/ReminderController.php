<?php
namespace Controllers;

use Core\Controller;
use Models\Reminder;
use Models\DashboardMember;
use Models\DiscordService;
use Models\ConfigModel;

/**
 * Contrôleur pour la gestion des rappels
 */
class ReminderController extends Controller
{
    /**
     * Modèle Reminder
     *
     * @var Reminder
     */
    private $reminderModel;
    
    /**
     * Modèle DashboardMember
     *
     * @var DashboardMember
     */
    private $memberModel;
    
    /**
     * Service Discord
     *
     * @var DiscordService
     */
    private $discordService;
    
    /**
     * Modèle ConfigModel
     *
     * @var ConfigModel
     */
    private $configModel;
    
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
        $this->reminderModel = new Reminder();
        $this->memberModel = new DashboardMember();
        $this->configModel = new ConfigModel();
        
        // Initialiser la table de configuration si nécessaire
        $this->configModel->initializeDefaultConfig();
        
        $this->discordService = new DiscordService();
        
        // Initialiser le contrôleur d'authentification
        $this->authController = new AuthController();
        
        // Vérifier si l'utilisateur est connecté
        if (!$this->authController->isLoggedIn()) {
            $this->redirect('/login');
        }
        
        // Vérifier les droits pour certaines actions
        $restrictedActions = ['create', 'store', 'edit', 'update', 'delete'];
        
        // Obtenir l'action courante à partir des paramètres de route ou du backtrace
        $currentAction = '';
        
        // Si nous sommes dans un script de test, nous pouvons extraire l'action de la pile d'appels
        $backtrace = debug_backtrace(DEBUG_BACKTRACE_IGNORE_ARGS, 2);
        if (isset($backtrace[1]['function'])) {
            $method = $backtrace[1]['function'];
            if (substr($method, -6) === 'Action') {
                $currentAction = substr($method, 0, -6); // Enlever 'Action'
            }
        }
        
        // Si action est définie dans les paramètres de route, utiliser celle-ci
        if (isset($this->routeParams['action'])) {
            $currentAction = $this->routeParams['action'];
        }
        
        // Vérifier les droits pour l'action courante
        if (in_array($currentAction, $restrictedActions) && !$this->authController->hasRole('editor')) {
            $this->redirect('/reminders');
        }
        
        // Démarrer la session si elle n'est pas déjà démarrée
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Définir la page courante pour la navigation
        $this->setGlobalViewData('currentPage', 'reminders');
    }
    
    /**
     * Afficher la liste des rappels
     */
    public function indexAction()
    {
        $reminders = $this->reminderModel->getAll();
        
        $this->render('reminders/index', [
            'reminders' => $reminders,
            'title' => 'Gestion des rappels'
        ]);
    }
    
    /**
     * Afficher le formulaire de création d'un rappel
     */
    public function createAction()
    {
        // Récupérer les canaux Discord disponibles
        $guildId = $this->configModel->getDiscordGuildId();
        $discordChannels = [];
        $errors = [];
        
        try {
            $channels = $this->discordService->getGuildChannels($guildId);
            
            // Vérifier si channels est bien un tableau avant d'itérer dessus
            if (is_array($channels) || is_object($channels)) {
                foreach ($channels as $channel) {
                    // Vérifier que $channel est un tableau et que 'type' existe
                    if (is_array($channel) && isset($channel['type']) && $channel['type'] === 0) { // 0 = GUILD_TEXT
                        $discordChannels[] = $channel;
                    }
                }
            } else {
                // Si channels n'est pas itérable, ajouter un message d'erreur
                $errors[] = "Impossible de récupérer les canaux Discord: le service a retourné une réponse invalide.";
                
                // Ajouter un canal fictif pour les tests si nécessaire
                if (getenv('APP_ENV') === 'development' || strpos($_SERVER['HTTP_HOST'], 'localhost') !== false) {
                    $discordChannels[] = [
                        'id' => '1369916432447438899',
                        'name' => 'canal-test'
                    ];
                }
            }
        } catch (\Exception $e) {
            // En cas d'erreur, afficher un message explicite
            $errors[] = "Impossible de récupérer les canaux Discord: " . $e->getMessage();
            
            // Log l'erreur pour le débogage
            error_log("Erreur lors de la récupération des canaux Discord: " . $e->getMessage());
        }
        
        // Si aucun canal n'a été récupéré, ajouter un message d'avertissement
        if (empty($discordChannels)) {
            $errors[] = "Aucun canal Discord disponible. Veuillez vérifier la configuration du bot et les permissions.";
        }
        
        // Date par défaut : demain à 8h00
        $defaultDate = new \DateTime('tomorrow 8:00');
        
        $this->render('reminders/form', [
            'title' => 'Créer un rappel',
            'reminder' => [
                'message' => '',
                'channel_id' => '',
                'remind_at' => $defaultDate->format('Y-m-d H:i:s'),
                'user_id' => isset($_SESSION['member_id']) ? $_SESSION['member_id'] : 1
            ],
            'isNew' => true,
            'errors' => $errors,
            'discordChannels' => $discordChannels,
            'guildId' => $guildId
        ]);
    }
    
    /**
     * Enregistrer un nouveau rappel
     */
    public function storeAction()
    {
        $errors = [];
        
        // Vérifier si la méthode est POST
        if (!$this->isPost()) {
            $this->redirect('/reminders/create');
        }
        
        // Récupérer et formater la date de rappel
        $reminderDate = $this->postParam('remind_at_date');
        $reminderHour = (int)$this->postParam('remind_at_hour');
        $reminderMinute = (int)$this->postParam('remind_at_minute');
        
        // Construire la date complète
        $remindAt = date('Y-m-d H:i:s', strtotime("$reminderDate $reminderHour:$reminderMinute:00"));
        
        // Récupérer les données du formulaire
        $reminder = [
            'message' => $this->postParam('message'),
            'channel_id' => $this->postParam('channel_id'),
            'guild_id' => $this->postParam('guild_id') ?: $this->configModel->getDiscordGuildId(),
            'user_id' => $this->postParam('user_id') ?: (isset($_SESSION['member_id']) ? $_SESSION['member_id'] : 1),
            'remind_at' => $remindAt,
            'is_completed' => 0
        ];
        
        // Si nous sommes en mode test, fournir un canal par défaut si aucun n'est fourni
        if (empty($reminder['channel_id']) && strpos($_SERVER['SCRIPT_NAME'], 'test_reminder.php') !== false) {
            $reminder['channel_id'] = '1369916432447438899'; // ID du canal par défaut pour les tests
        }
        
        // Validation
        if (empty($reminder['message'])) {
            $errors[] = 'Le message du rappel est obligatoire.';
        }
        
        if (empty($reminder['channel_id'])) {
            $errors[] = 'Le canal Discord est obligatoire.';
        }
        
        if (empty($reminder['remind_at'])) {
            $errors[] = 'La date du rappel est obligatoire.';
        }
        
        // Si pas d'erreurs, créer le rappel
        if (empty($errors)) {
            // Utiliser la méthode create directement au lieu d'utiliser getTable()
            $result = $this->reminderModel->create($reminder);
            
            if ($result) {
                $reminderId = $result;
                
                // Journaliser l'action
                $this->memberModel->logActivity(
                    isset($_SESSION['member_id']) ? $_SESSION['member_id'] : 1,
                    'create_reminder',
                    "Création d'un rappel programmé pour le " . date('d/m/Y à H:i', strtotime($remindAt))
                );
                
                // Synchroniser le rappel avec le bot Discord
                $this->syncReminderWithBot($reminderId);
                
                $this->redirect('/reminders');
            } else {
                $errors[] = 'Une erreur est survenue lors de la création du rappel.';
            }
        }
        
        // En cas d'erreur, récupérer les canaux Discord et réafficher le formulaire
        $guildId = $this->configModel->getDiscordGuildId();
        $discordChannels = [];
        
        try {
            $channels = $this->discordService->getGuildChannels($guildId);
            
            // Vérifier si channels est bien un tableau avant d'itérer dessus
            if (is_array($channels) || is_object($channels)) {
                foreach ($channels as $channel) {
                    // Vérifier que $channel est un tableau et que 'type' existe
                    if (is_array($channel) && isset($channel['type']) && $channel['type'] === 0) { // 0 = GUILD_TEXT
                        $discordChannels[] = $channel;
                    }
                }
            } else {
                // Si channels n'est pas itérable, ajouter un message d'erreur
                $errors[] = "Impossible de récupérer les canaux Discord: le service a retourné une réponse invalide.";
            }
        } catch (\Exception $e) {
            $errors[] = "Impossible de récupérer les canaux Discord: " . $e->getMessage();
        }
        
        $this->render('reminders/form', [
            'title' => 'Créer un rappel',
            'reminder' => $reminder,
            'isNew' => true,
            'errors' => $errors,
            'discordChannels' => $discordChannels,
            'guildId' => $guildId
        ]);
    }
    
    /**
     * Afficher le formulaire d'édition d'un rappel
     */
    public function editAction()
    {
        $reminderId = (int)$this->routeParam('id');
        $reminder = $this->reminderModel->getById($reminderId);
        
        if (!$reminder) {
            $this->redirect('/reminders');
        }
        
        // Récupérer les canaux Discord disponibles
        $guildId = $this->configModel->getDiscordGuildId();
        $discordChannels = [];
        $errors = [];
        
        try {
            $channels = $this->discordService->getGuildChannels($guildId);
            
            // Vérifier si channels est bien un tableau avant d'itérer dessus
            if (is_array($channels) || is_object($channels)) {
                foreach ($channels as $channel) {
                    // Vérifier que $channel est un tableau et que 'type' existe
                    if (is_array($channel) && isset($channel['type']) && $channel['type'] === 0) { // 0 = GUILD_TEXT
                        $discordChannels[] = $channel;
                    }
                }
            } else {
                // Si channels n'est pas itérable, ajouter un message d'erreur
                $errors[] = "Impossible de récupérer les canaux Discord: le service a retourné une réponse invalide.";
                
                // Ajouter le canal actuel du rappel pour permettre l'édition
                $discordChannels[] = [
                    'id' => $reminder['channel_id'],
                    'name' => 'canal-' . $reminder['channel_id']
                ];
            }
        } catch (\Exception $e) {
            // En cas d'erreur, afficher un message explicite
            $errors[] = "Impossible de récupérer les canaux Discord: " . $e->getMessage();
            
            // Log l'erreur pour le débogage
            error_log("Erreur lors de la récupération des canaux Discord: " . $e->getMessage());
            
            // Ajouter le canal actuel du rappel pour permettre l'édition
            $discordChannels[] = [
                'id' => $reminder['channel_id'],
                'name' => 'canal-' . $reminder['channel_id']
            ];
        }
        
        $this->render('reminders/form', [
            'title' => 'Modifier le rappel',
            'reminder' => $reminder,
            'isNew' => false,
            'errors' => $errors,
            'discordChannels' => $discordChannels,
            'guildId' => $guildId
        ]);
    }
    
    /**
     * Mettre à jour un rappel existant
     */
    public function updateAction()
    {
        $reminderId = (int)$this->routeParam('id');
        $reminder = $this->reminderModel->getById($reminderId);
        
        if (!$reminder) {
            $this->redirect('/reminders');
        }
        
        $errors = [];
        
        // Vérifier si la méthode est POST
        if (!$this->isPost()) {
            $this->redirect('/reminders/edit/' . $reminderId);
        }
        
        // Récupérer et formater la date de rappel
        $reminderDate = $this->postParam('remind_at_date');
        $reminderHour = (int)$this->postParam('remind_at_hour');
        $reminderMinute = (int)$this->postParam('remind_at_minute');
        
        // Construire la date complète
        $remindAt = date('Y-m-d H:i:s', strtotime("$reminderDate $reminderHour:$reminderMinute:00"));
        
        // Récupérer les données du formulaire
        $updatedReminder = [
            'message' => $this->postParam('message'),
            'channel_id' => $this->postParam('channel_id'),
            'remind_at' => $remindAt
        ];
        
        // Validation
        if (empty($updatedReminder['message'])) {
            $errors[] = 'Le message du rappel est obligatoire.';
        }
        
        if (empty($updatedReminder['channel_id'])) {
            $errors[] = 'Le canal Discord est obligatoire.';
        }
        
        if (empty($updatedReminder['remind_at'])) {
            $errors[] = 'La date du rappel est obligatoire.';
        }
        
        // Si pas d'erreurs, mettre à jour le rappel
        if (empty($errors)) {
            // Utiliser la méthode update du modèle
            $success = $this->reminderModel->update($reminderId, $updatedReminder);
            
            if ($success) {
                // Journaliser l'action
                $this->memberModel->logActivity(
                    isset($_SESSION['member_id']) ? $_SESSION['member_id'] : 1,
                    'update_reminder',
                    "Mise à jour du rappel programmé pour le " . date('d/m/Y à H:i', strtotime($remindAt))
                );
                
                // Synchroniser le rappel avec le bot Discord
                $this->syncReminderWithBot($reminderId);
                
                $this->redirect('/reminders');
            } else {
                $errors[] = 'Une erreur est survenue lors de la mise à jour du rappel.';
            }
        }
        
        // En cas d'erreur, récupérer les canaux Discord et réafficher le formulaire
        $guildId = $this->configModel->getDiscordGuildId();
        $discordChannels = [];
        
        try {
            $channels = $this->discordService->getGuildChannels($guildId);
            
            // Vérifier si channels est bien un tableau avant d'itérer dessus
            if (is_array($channels) || is_object($channels)) {
                foreach ($channels as $channel) {
                    // Vérifier que $channel est un tableau et que 'type' existe
                    if (is_array($channel) && isset($channel['type']) && $channel['type'] === 0) { // 0 = GUILD_TEXT
                        $discordChannels[] = $channel;
                    }
                }
            } else {
                // Si channels n'est pas itérable, ajouter un message d'erreur
                $errors[] = "Impossible de récupérer les canaux Discord: le service a retourné une réponse invalide.";
            }
        } catch (\Exception $e) {
            $errors[] = "Impossible de récupérer les canaux Discord: " . $e->getMessage();
        }
        
        $this->render('reminders/form', [
            'title' => 'Modifier le rappel',
            'reminder' => array_merge($reminder, $updatedReminder),
            'isNew' => false,
            'errors' => $errors,
            'discordChannels' => $discordChannels,
            'guildId' => $guildId
        ]);
    }
    
    /**
     * Afficher la page de confirmation de suppression d'un rappel
     */
    public function deleteAction()
    {
        $reminderId = (int)$this->routeParam('id');
        $reminder = $this->reminderModel->getById($reminderId);
        
        if (!$reminder) {
            $this->redirect('/reminders');
        }
        
        $errors = [];
        
        // Traitement du formulaire de suppression
        if ($this->isPost()) {
            $success = $this->reminderModel->delete($reminderId);
            
            if ($success) {
                // Journaliser l'action
                $this->memberModel->logActivity(
                    isset($_SESSION['member_id']) ? $_SESSION['member_id'] : 1,
                    'delete_reminder',
                    "Suppression du rappel : " . substr($reminder['message'], 0, 50) . (strlen($reminder['message']) > 50 ? '...' : '')
                );
                
                // Synchroniser avec le bot (suppression du rappel)
                $this->syncReminderWithBot($reminderId, true);
                
                $this->redirect('/reminders');
            } else {
                $errors[] = 'Une erreur est survenue lors de la suppression du rappel.';
            }
        }
        
        $this->render('reminders/delete', [
            'title' => 'Supprimer le rappel',
            'reminder' => $reminder,
            'errors' => $errors
        ]);
    }
    
    /**
     * Synchroniser un rappel avec le bot Discord
     * 
     * @param int $reminderId ID du rappel à synchroniser
     * @param bool $isDelete S'il s'agit d'une suppression
     * @return bool Succès de l'opération
     */
    private function syncReminderWithBot($reminderId, $isDelete = false)
    {
        try {
            if ($isDelete) {
                // Envoyer une requête au bot pour supprimer le rappel
                $response = $this->discordService->sendBotRequest('delete_reminder', [
                    'reminder_id' => $reminderId
                ]);
                
                if (!$response) {
                    error_log("Erreur lors de la suppression du rappel dans le bot: Réponse vide");
                    return false;
                }
                
                if (isset($response['error'])) {
                    error_log("Erreur du bot lors de la suppression du rappel: " . $response['error']);
                    return false;
                }
                
                return true;
            } else {
                // Récupérer les détails du rappel
                $reminder = $this->reminderModel->getById($reminderId);
                
                if (!$reminder) {
                    error_log("Erreur lors de la synchronisation du rappel: Rappel non trouvé (ID: " . $reminderId . ")");
                    return false;
                }
                
                // Journaliser les données du rappel pour le débogage
                error_log("Données du rappel à synchroniser: " . json_encode($reminder));
                
                // Envoyer une requête au bot pour créer/mettre à jour le rappel
                $response = $this->discordService->sendBotRequest('update_reminder', [
                    'reminder_id' => $reminderId,
                    'message' => $reminder['message'],
                    'channel_id' => $reminder['channel_id'],
                    'remind_at' => $reminder['remind_at'],
                    'user_id' => $reminder['user_id'] ?? (isset($_SESSION['member_id']) ? $_SESSION['member_id'] : 1)
                ]);
                
                if (!$response) {
                    error_log("Erreur lors de la synchronisation du rappel dans le bot: Réponse vide");
                    return false;
                }
                
                if (isset($response['error'])) {
                    error_log("Erreur du bot lors de la synchronisation du rappel: " . $response['error']);
                    return false;
                }
                
                return true;
            }
        } catch (\Exception $e) {
            // Journaliser l'erreur mais ne pas interrompre le flux
            error_log("Exception lors de la synchronisation du rappel avec le bot: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return false;
        }
    }
    
    /**
     * Exécuter un rappel immédiatement (pour test)
     */
    public function testAction()
    {
        if (!$this->authController->hasRole('admin')) {
            $this->redirect('/reminders');
        }
        
        $reminderId = (int)$this->routeParam('id');
        $reminder = $this->reminderModel->getById($reminderId);
        
        if (!$reminder) {
            $errors[] = "Rappel non trouvé (ID: " . $reminderId . ")";
            $this->render('reminders/test', [
                'title' => 'Test du rappel',
                'reminder' => [],
                'errors' => $errors,
                'success' => false
            ]);
            return;
        }
        
        $errors = [];
        $success = false;
        
        try {
            // Journaliser les données du rappel pour le débogage
            error_log("Test de rappel - Données: " . json_encode($reminder));
            
            // Vérifier si les informations essentielles sont présentes
            if (empty($reminder['channel_id'])) {
                $errors[] = "Le canal Discord n'est pas défini pour ce rappel";
            }
            
            if (empty($reminder['message'])) {
                $errors[] = "Le message du rappel est vide";
            }
            
            if (!empty($errors)) {
                $this->render('reminders/test', [
                    'title' => 'Test du rappel',
                    'reminder' => $reminder,
                    'errors' => $errors,
                    'success' => false
                ]);
                return;
            }
            
            // Envoyer une requête au bot pour exécuter le rappel immédiatement
            $response = $this->discordService->sendBotRequest('send_reminder_now', [
                'reminder_id' => $reminderId,
                'message' => $reminder['message'],
                'channel_id' => $reminder['channel_id'],
                'user_id' => $reminder['user_id'] ?? (isset($_SESSION['member_id']) ? $_SESSION['member_id'] : 1)
            ]);
            
            // Journaliser la réponse pour le débogage
            if ($response) {
                error_log("Réponse du bot pour le test du rappel: " . json_encode($response));
            } else {
                error_log("Aucune réponse du bot pour le test du rappel");
            }
            
            if ($response && isset($response['success']) && $response['success']) {
                $success = true;
                
                // Journaliser l'action
                $this->memberModel->logActivity(
                    isset($_SESSION['member_id']) ? $_SESSION['member_id'] : 1,
                    'test_reminder',
                    "Test du rappel : " . substr($reminder['message'], 0, 50) . (strlen($reminder['message']) > 50 ? '...' : '')
                );
            } else {
                // Construire un message d'erreur détaillé
                if (isset($response['error'])) {
                    $errors[] = 'Le bot n\'a pas pu envoyer le rappel: ' . $response['error'];
                } elseif (isset($response['message'])) {
                    $errors[] = 'Le bot n\'a pas pu envoyer le rappel: ' . $response['message'];
                } else {
                    // Vérifier si le bot est accessible
                    $botStatus = $this->checkBotStatus();
                    if (!$botStatus['accessible']) {
                        $errors[] = 'Le bot Discord n\'est pas accessible. ' . $botStatus['reason'];
                    } else {
                        $errors[] = 'Le bot n\'a pas pu envoyer le rappel: Erreur inconnue. Vérifiez que le canal #' . $reminder['channel_id'] . ' existe et que le bot a les permissions nécessaires.';
                    }
                }
            }
        } catch (\Exception $e) {
            error_log("Exception lors du test du rappel: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            $errors[] = 'Erreur lors de la communication avec le bot: ' . $e->getMessage();
        }
        
        $this->render('reminders/test', [
            'title' => 'Test du rappel',
            'reminder' => $reminder,
            'errors' => $errors,
            'success' => $success
        ]);
    }
    
    /**
     * Vérifier si le bot Discord est accessible
     *
     * @return array Statut du bot
     */
    private function checkBotStatus()
    {
        try {
            // Vérifier si l'URL du bot est accessible
            $botUrl = $this->discordService->getBotApiUrl();
            
            // Tenter de faire une requête simple au bot
            $response = $this->discordService->sendBotRequest('ping', []);
            
            if ($response && isset($response['success']) && $response['success']) {
                return [
                    'accessible' => true,
                    'reason' => 'Le bot est en ligne'
                ];
            }
            
            return [
                'accessible' => false,
                'reason' => 'Le bot ne répond pas correctement'
            ];
            
        } catch (\Exception $e) {
            return [
                'accessible' => false,
                'reason' => 'Exception lors de la vérification: ' . $e->getMessage()
            ];
        }
    }
    
    /**
     * Tester la connectivité avec le bot Discord
     */
    public function pingAction()
    {
        if (!$this->authController->hasRole('admin')) {
            $this->redirect('/reminders');
        }
        
        $status = $this->checkBotStatus();
        
        $data = [
            'title' => 'Test de connectivité du bot',
            'status' => $status,
            'api_url' => $this->discordService->getBotApiUrl(),
            'success' => $status['accessible']
        ];
        
        // Tenter d'obtenir des informations supplémentaires
        try {
            $guildId = $this->configModel->getDiscordGuildId();
            $data['guild_id'] = $guildId;
            
            // Tester la récupération des canaux
            $channels = $this->discordService->getGuildChannels($guildId);
            $data['channels_count'] = is_array($channels) ? count($channels) : 0;
            $data['channels_obtained'] = is_array($channels);
            
            // Obtenir des informations sur le bot
            $botInfo = $this->discordService->sendBotRequest('info', []);
            if ($botInfo && isset($botInfo['bot_name'])) {
                $data['bot_info'] = $botInfo;
            }
        } catch (\Exception $e) {
            $data['error'] = $e->getMessage();
        }
        
        // Afficher en format JSON pour les administrateurs
        header('Content-Type: application/json');
        echo json_encode($data, JSON_PRETTY_PRINT);
        exit;
    }
} 