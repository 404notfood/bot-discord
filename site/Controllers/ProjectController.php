<?php
namespace Controllers;

use Core\Controller;
use Models\Project;
use Models\Subgroup;
use Models\Task;
use Models\ProjectChannel;
use Models\DashboardMember;

/**
 * Contrôleur pour la gestion des projets
 */
class ProjectController extends Controller
{
    /**
     * Modèle Project
     *
     * @var Project
     */
    private $projectModel;
    
    /**
     * Modèle Subgroup
     *
     * @var Subgroup
     */
    private $subgroupModel;
    
    /**
     * Modèle Task
     *
     * @var Task
     */
    private $taskModel;
    
    /**
     * Modèle ProjectChannel
     *
     * @var ProjectChannel
     */
    private $channelModel;
    
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
        $this->projectModel = new Project();
        $this->subgroupModel = new Subgroup();
        $this->taskModel = new Task();
        $this->channelModel = new ProjectChannel();
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
        $this->setGlobalViewData('currentPage', 'projects');
    }
    
    /**
     * Afficher la liste des projets
     */
    public function indexAction()
    {
        $projects = $this->projectModel->getAllWithDetails();
        
        $this->render('projects/index', [
            'projects' => $projects,
            'title' => 'Gestion des projets',
            'stats' => $this->projectModel->getStats(),
            'isAdmin' => $this->authController->hasRole('admin'),
            'isEditor' => $this->authController->hasRole('editor')
        ]);
    }
    
    /**
     * Afficher les détails d'un projet
     */
    public function viewAction()
    {
        $projectId = (int)$this->routeParam('id');
        $project = $this->projectModel->getWithFullDetails($projectId);
        
        if (!$project) {
            $this->redirect('/projects');
        }
        
        $this->render('projects/view', [
            'project' => $project,
            'title' => 'Détails du projet: ' . $project['name'],
            'taskStats' => $this->taskModel->getProjectStats($projectId),
            'isAdmin' => $this->authController->hasRole('admin'),
            'isEditor' => $this->authController->hasRole('editor')
        ]);
    }
    
    /**
     * Créer un nouveau projet
     */
    public function createAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('editor')) {
            $this->redirect('/projects');
        }
        
        $errors = [];
        $project = [
            'name' => '',
            'description' => '',
            'status' => 'planning',
            'owner_id' => '',
            'start_date' => date('Y-m-d'),
            'due_date' => date('Y-m-d', strtotime('+1 month'))
        ];
        
        $this->render('projects/form', [
            'project' => $project,
            'errors' => $errors,
            'isNew' => true,
            'title' => 'Créer un projet',
            'statuses' => [
                'planning' => 'Planification',
                'in_progress' => 'En cours',
                'paused' => 'En pause',
                'completed' => 'Terminé',
                'cancelled' => 'Annulé'
            ]
        ]);
    }
    
    /**
     * Traiter le formulaire de création d'un projet
     */
    public function storeAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('editor')) {
            $this->redirect('/projects');
        }
        
        $errors = [];
        
        // Vérifier si la méthode est POST
        if (!$this->isPost()) {
            $this->redirect('/projects/create');
        }
        
        // Récupérer les données du formulaire
        $project = [
            'name' => $this->postParam('name'),
            'description' => $this->postParam('description'),
            'status' => $this->postParam('status'),
            'owner_id' => $this->postParam('owner_id'),
            'start_date' => $this->postParam('start_date'),
            'due_date' => $this->postParam('due_date'),
            'created_at' => date('Y-m-d H:i:s')
        ];
        
        // Validation
        if (empty($project['name'])) {
            $errors[] = 'Le nom du projet est obligatoire.';
        }
        
        if (empty($project['owner_id'])) {
            $errors[] = 'L\'ID Discord du propriétaire est obligatoire.';
        }
        
        // Si pas d'erreurs, créer le projet
        if (empty($errors)) {
            $projectId = $this->projectModel->create($project);
            
            if ($projectId) {
                // Journaliser l'action
                $this->memberModel->logActivity(
                    $_SESSION['member_id'],
                    'create_project',
                    "Création du projet: {$project['name']}"
                );
                
                // Créer les canaux Discord pour le projet
                $this->createDiscordChannels($projectId, $project);
                
                $this->redirect('/projects/view/' . $projectId);
            } else {
                $errors[] = 'Une erreur est survenue lors de la création du projet.';
            }
        }
        
        // En cas d'erreur, retourner au formulaire avec les données et les erreurs
        $this->render('projects/form', [
            'project' => $project,
            'errors' => $errors,
            'isNew' => true,
            'title' => 'Créer un projet',
            'statuses' => [
                'planning' => 'Planification',
                'in_progress' => 'En cours',
                'paused' => 'En pause',
                'completed' => 'Terminé',
                'cancelled' => 'Annulé'
            ]
        ]);
    }
    
    /**
     * Modifier un projet existant
     */
    public function editAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('editor')) {
            $this->redirect('/projects');
        }
        
        $projectId = (int)$this->routeParam('id');
        $project = $this->projectModel->findById($projectId);
        
        if (!$project) {
            $this->redirect('/projects');
        }
        
        $this->render('projects/form', [
            'project' => $project,
            'errors' => [],
            'isNew' => false,
            'title' => 'Modifier le projet: ' . $project['name'],
            'statuses' => [
                'planning' => 'Planification',
                'in_progress' => 'En cours',
                'paused' => 'En pause',
                'completed' => 'Terminé',
                'cancelled' => 'Annulé'
            ]
        ]);
    }
    
    /**
     * Traiter le formulaire de modification d'un projet
     */
    public function updateAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('editor')) {
            $this->redirect('/projects');
        }
        
        $projectId = (int)$this->routeParam('id');
        $project = $this->projectModel->findById($projectId);
        
        if (!$project) {
            $this->redirect('/projects');
        }
        
        $errors = [];
        
        // Vérifier si la méthode est POST
        if (!$this->isPost()) {
            $this->redirect('/projects/edit/' . $projectId);
        }
        
        // Récupérer les données du formulaire
        $updatedProject = [
            'name' => $this->postParam('name'),
            'description' => $this->postParam('description'),
            'status' => $this->postParam('status'),
            'owner_id' => $this->postParam('owner_id'),
            'start_date' => $this->postParam('start_date'),
            'due_date' => $this->postParam('due_date'),
            'updated_at' => date('Y-m-d H:i:s')
        ];
        
        // Validation
        if (empty($updatedProject['name'])) {
            $errors[] = 'Le nom du projet est obligatoire.';
        }
        
        if (empty($updatedProject['owner_id'])) {
            $errors[] = 'L\'ID Discord du propriétaire est obligatoire.';
        }
        
        // Si pas d'erreurs, mettre à jour le projet
        if (empty($errors)) {
            $success = $this->projectModel->update($projectId, $updatedProject);
            
            if ($success) {
                // Journaliser l'action
                $this->memberModel->logActivity(
                    $_SESSION['member_id'],
                    'update_project',
                    "Mise à jour du projet: {$updatedProject['name']}"
                );
                
                $this->redirect('/projects/view/' . $projectId);
            } else {
                $errors[] = 'Une erreur est survenue lors de la mise à jour du projet.';
            }
        }
        
        // En cas d'erreur, retourner au formulaire avec les données et les erreurs
        $project = array_merge($project, $updatedProject);
        $this->render('projects/form', [
            'project' => $project,
            'errors' => $errors,
            'isNew' => false,
            'title' => 'Modifier le projet: ' . $project['name'],
            'statuses' => [
                'planning' => 'Planification',
                'in_progress' => 'En cours',
                'paused' => 'En pause',
                'completed' => 'Terminé',
                'cancelled' => 'Annulé'
            ]
        ]);
    }
    
    /**
     * Supprimer un projet
     */
    public function deleteAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('admin')) {
            $this->redirect('/projects');
        }
        
        $projectId = (int)$this->routeParam('id');
        $project = $this->projectModel->findById($projectId);
        
        if (!$project) {
            $this->redirect('/projects');
        }
        
        $errors = [];
        
        // Traitement du formulaire
        if ($this->isPost()) {
            try {
                // Démarrer une transaction
                $this->projectModel->query('START TRANSACTION');
                
                // Supprimer les tâches associées
                $this->taskModel->deleteByProjectId($projectId);
                
                // Supprimer les canaux associés
                $this->channelModel->deleteByProjectId($projectId);
                
                // Supprimer les sous-groupes associés
                $this->subgroupModel->deleteByProjectId($projectId);
                
                // Supprimer le projet
                $success = $this->projectModel->delete($projectId);
                
                if ($success) {
                    // Journaliser l'action
                    $this->memberModel->logActivity(
                        $_SESSION['member_id'],
                        'delete_project',
                        "Suppression du projet: {$project['name']}"
                    );
                    
                    // Valider la transaction
                    $this->projectModel->query('COMMIT');
                    
                    $this->redirect('/projects');
                } else {
                    throw new \Exception("Échec de la suppression du projet.");
                }
            } catch (\Exception $e) {
                // Annuler la transaction en cas d'erreur
                $this->projectModel->query('ROLLBACK');
                
                $errors[] = 'Une erreur est survenue lors de la suppression du projet: ' . $e->getMessage();
                
                $this->render('projects/delete', [
                    'project' => $project,
                    'errors' => $errors,
                    'title' => 'Supprimer le projet: ' . $project['name']
                ]);
                
                return;
            }
        }
        
        $this->render('projects/delete', [
            'project' => $project,
            'title' => 'Supprimer le projet: ' . $project['name']
        ]);
    }
    
    /**
     * Créer les canaux Discord pour un projet
     *
     * @param int $projectId ID du projet
     * @param array $project Données du projet
     * @return bool Succès de l'opération
     */
    private function createDiscordChannels($projectId, $project)
    {
        try {
            // Initialiser le service Discord
            $discordService = new \Models\DiscordService();
            $configModel = new \Models\ConfigModel();
            
            // Récupérer les configurations Discord
            $guildId = $configModel->getDiscordGuildId();
            
            // Si l'ID du serveur n'est pas configuré, on ne peut pas créer les canaux
            if (empty($guildId)) {
                error_log("Erreur: ID du serveur Discord non configuré");
                return false;
            }
            
            // Créer une catégorie pour le projet
            $categoryName = "📂 " . $project['name'];
            $categoryData = $discordService->createCategory($guildId, $categoryName);
            
            if (!$categoryData) {
                error_log("Erreur lors de la création de la catégorie Discord pour le projet #{$projectId}");
                return false;
            }
            
            $categoryId = $categoryData['id'];
            
            // Ajouter la catégorie aux canaux du projet
            $this->channelModel->addOrUpdateChannel($projectId, $categoryId, 'category');
            
            // Créer un canal textuel général
            $textChannelName = "📝-général-" . $this->sanitizeChannelName($project['name']);
            $textChannelData = $discordService->createTextChannel($guildId, $textChannelName, [
                'parent_id' => $categoryId
            ]);
            
            if ($textChannelData) {
                $this->channelModel->addOrUpdateChannel($projectId, $textChannelData['id'], 'general');
                
                // Envoyer un message d'introduction dans le canal
                $discordService->sendMessage($textChannelData['id'], 
                    "**Bienvenue dans le canal du projet {$project['name']}**\n" .
                    "Ce canal a été créé automatiquement par le système de gestion de projets.\n" .
                    "Description du projet: {$project['description']}"
                );
            }
            
            // Créer un canal vocal pour le projet
            $voiceChannelName = "🔊 " . $this->sanitizeChannelName($project['name']);
            $voiceChannelData = $discordService->createVoiceChannel($guildId, $voiceChannelName, [
                'parent_id' => $categoryId
            ]);
            
            if ($voiceChannelData) {
                $this->channelModel->addOrUpdateChannel($projectId, $voiceChannelData['id'], 'voice');
            }
            
            return true;
            
        } catch (\Exception $e) {
            error_log("Erreur lors de la création des canaux Discord: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Sanitize un nom pour l'utiliser comme nom de canal Discord
     *
     * @param string $name Nom à sanitizer
     * @return string Nom sanitizé
     */
    private function sanitizeChannelName($name)
    {
        // Convertir en minuscules
        $name = strtolower($name);
        
        // Remplacer les caractères accentués
        $name = preg_replace('/[àáâãäåå]/u', 'a', $name);
        $name = preg_replace('/[èéêë]/u', 'e', $name);
        $name = preg_replace('/[ìíîï]/u', 'i', $name);
        $name = preg_replace('/[òóôõö]/u', 'o', $name);
        $name = preg_replace('/[ùúûü]/u', 'u', $name);
        $name = preg_replace('/[ýÿ]/u', 'y', $name);
        $name = preg_replace('/[ç]/u', 'c', $name);
        
        // Remplacer les espaces et caractères spéciaux par des tirets
        $name = preg_replace('/[^a-z0-9]+/', '-', $name);
        
        // Supprimer les tirets en début et fin
        $name = trim($name, '-');
        
        // Limiter la longueur (Discord limite les noms de canaux à 100 caractères)
        if (strlen($name) > 90) {
            $name = substr($name, 0, 90);
        }
        
        return $name;
    }
} 