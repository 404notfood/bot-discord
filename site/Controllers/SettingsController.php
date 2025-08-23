<?php
namespace Controllers;

use Core\Controller;
use Models\ConfigModel;
use Models\DashboardMember;

/**
 * Contrôleur pour la gestion des paramètres
 */
class SettingsController extends Controller
{
    /**
     * Modèle ConfigModel
     *
     * @var ConfigModel
     */
    private $configModel;
    
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
        $this->configModel = new ConfigModel();
        $this->memberModel = new DashboardMember();
        
        // Initialiser le contrôleur d'authentification
        $this->authController = new AuthController();
        
        // Vérifier si l'utilisateur est connecté et est admin
        if (!$this->authController->isLoggedIn() || !$this->authController->hasRole('admin')) {
            $this->redirect('/login');
        }
        
        // Démarrer la session si elle n'est pas déjà démarrée
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Définir la page courante pour la navigation
        $this->setGlobalViewData('currentPage', 'settings');
    }
    
    /**
     * Afficher les paramètres généraux
     */
    public function indexAction()
    {
        $this->redirect('/settings/general');
    }
    
    /**
     * Afficher et gérer les paramètres généraux
     */
    public function generalAction()
    {
        $errors = [];
        $success = false;
        
        // Traitement du formulaire
        if ($this->isPost()) {
            // TODO: Implémenter la sauvegarde des paramètres généraux
            $success = true;
        }
        
        $this->render('settings/general', [
            'title' => 'Paramètres généraux',
            'errors' => $errors,
            'success' => $success
        ]);
    }
    
    /**
     * Afficher et gérer les paramètres Discord
     */
    public function discordAction()
    {
        $errors = [];
        $success = false;
        
        // Récupérer les configurations Discord actuelles
        $discordConfig = $this->configModel->getDiscordConfig();
        
        // Traitement du formulaire
        if ($this->isPost()) {
            $botToken = $this->postParam('bot_token');
            $guildId = $this->postParam('guild_id');
            $everyoneRoleId = $this->postParam('everyone_role_id');
            
            // Validation de base
            if (empty($botToken)) {
                $errors[] = 'Le token du bot Discord est obligatoire.';
            }
            
            if (empty($guildId)) {
                $errors[] = 'L\'ID du serveur Discord est obligatoire.';
            }
            
            if (empty($everyoneRoleId)) {
                $errors[] = 'L\'ID du rôle @everyone est obligatoire.';
            }
            
            // Si pas d'erreurs, enregistrer les configurations
            if (empty($errors)) {
                $this->configModel->set('discord_bot_token', $botToken);
                $this->configModel->set('discord_guild_id', $guildId);
                $this->configModel->set('discord_everyone_role_id', $everyoneRoleId);
                
                // Journaliser l'action
                $this->memberModel->logActivity(
                    $_SESSION['member_id'],
                    'update_discord_settings',
                    "Mise à jour des paramètres Discord"
                );
                
                $success = true;
                
                // Mettre à jour les configurations pour l'affichage
                $discordConfig = $this->configModel->getDiscordConfig();
            }
        }
        
        $this->render('settings/discord', [
            'title' => 'Paramètres Discord',
            'discordConfig' => $discordConfig,
            'errors' => $errors,
            'success' => $success
        ]);
    }
    
    /**
     * Tester la connexion Discord
     */
    public function testDiscordAction()
    {
        $errors = [];
        $success = false;
        $result = null;
        
        try {
            // Initialiser le service Discord
            $discordService = new \Models\DiscordService();
            
            // Tester la connexion en récupérant des informations sur le bot
            $result = $discordService->sendRequest('users/@me');
            
            if ($result && isset($result['id'])) {
                $success = true;
                $message = "Connexion réussie avec le bot '{$result['username']}#{$result['discriminator']}'.";
            } else {
                $errors[] = "La connexion a échoué. Vérifiez le token du bot.";
            }
        } catch (\Exception $e) {
            $errors[] = "Erreur lors du test: " . $e->getMessage();
        }
        
        $this->render('settings/test_discord', [
            'title' => 'Test de connexion Discord',
            'result' => $result,
            'errors' => $errors,
            'success' => $success,
            'message' => $message ?? ''
        ]);
    }
} 