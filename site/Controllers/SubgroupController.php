<?php
namespace Controllers;

use Core\Controller;
use Models\Subgroup;
use Models\Project;
use Models\Task;
use Models\DashboardMember;

/**
 * Contrôleur pour la gestion des sous-groupes
 */
class SubgroupController extends Controller
{
    /**
     * Modèle Subgroup
     *
     * @var Subgroup
     */
    private $subgroupModel;
    
    /**
     * Modèle Project
     *
     * @var Project
     */
    private $projectModel;
    
    /**
     * Modèle Task
     *
     * @var Task
     */
    private $taskModel;
    
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
        $this->subgroupModel = new Subgroup();
        $this->projectModel = new Project();
        $this->taskModel = new Task();
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
     * Afficher la liste des sous-groupes
     */
    public function indexAction()
    {
        $projectId = (int)$this->getParam('project_id');
        
        if ($projectId) {
            $project = $this->projectModel->findById($projectId);
            if (!$project) {
                $this->redirect('/projects');
            }
            
            $subgroups = $this->subgroupModel->getAllWithDetails($projectId);
            $title = 'Sous-groupes du projet: ' . $project['name'];
        } else {
            $subgroups = $this->subgroupModel->getAllWithDetails();
            $title = 'Tous les sous-groupes';
        }
        
        $this->render('subgroups/index', [
            'subgroups' => $subgroups,
            'projectId' => $projectId,
            'project' => $project ?? null,
            'title' => $title,
            'isAdmin' => $this->authController->hasRole('admin'),
            'isEditor' => $this->authController->hasRole('editor')
        ]);
    }
    
    /**
     * Afficher les détails d'un sous-groupe
     */
    public function viewAction()
    {
        $subgroupId = (int)$this->routeParam('id');
        $subgroup = $this->subgroupModel->getWithFullDetails($subgroupId);
        
        if (!$subgroup) {
            $this->redirect('/projects');
        }
        
        $this->render('subgroups/view', [
            'subgroup' => $subgroup,
            'project' => $subgroup['project'],
            'members' => $subgroup['members'],
            'tasks' => $subgroup['tasks'],
            'title' => 'Détails du sous-groupe: ' . $subgroup['name'],
            'isAdmin' => $this->authController->hasRole('admin'),
            'isEditor' => $this->authController->hasRole('editor')
        ]);
    }
    
    /**
     * Créer un nouveau sous-groupe
     */
    public function createAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('editor')) {
            $this->redirect('/projects');
        }
        
        $projectId = (int)$this->getParam('project_id');
        $project = null;
        
        if ($projectId) {
            $project = $this->projectModel->findById($projectId);
            if (!$project) {
                $this->redirect('/projects');
            }
        }
        
        $errors = [];
        $subgroup = [
            'name' => '',
            'description' => '',
            'project_id' => $projectId,
            'leader_id' => ''
        ];
        
        // Liste des projets pour le formulaire
        $projects = $this->projectModel->findAll('name', 'ASC');
        
        // Traitement du formulaire
        if ($this->isPost()) {
            $subgroup = [
                'name' => $this->postParam('name'),
                'description' => $this->postParam('description'),
                'project_id' => (int)$this->postParam('project_id'),
                'leader_id' => $this->postParam('leader_id')
            ];
            
            // Validation
            if (empty($subgroup['name'])) {
                $errors[] = 'Le nom du sous-groupe est obligatoire.';
            }
            
            if (empty($subgroup['project_id'])) {
                $errors[] = 'Le projet est obligatoire.';
            } else {
                // Vérifier que le projet existe
                $projectExists = $this->projectModel->findById($subgroup['project_id']);
                if (!$projectExists) {
                    $errors[] = 'Le projet sélectionné n\'existe pas.';
                }
            }
            
            if (empty($errors)) {
                $subgroupId = $this->subgroupModel->create($subgroup);
                
                if ($subgroupId) {
                    // Journaliser l'action
                    $this->memberModel->logActivity(
                        $_SESSION['member_id'],
                        'create_subgroup',
                        "Création du sous-groupe: {$subgroup['name']} pour le projet #{$subgroup['project_id']}"
                    );
                    
                    // Si un leader est spécifié, l'ajouter comme membre
                    if (!empty($subgroup['leader_id'])) {
                        $this->subgroupModel->addMember($subgroupId, $subgroup['leader_id'], 'leader');
                    }
                    
                    // Créer les canaux Discord pour le sous-groupe
                    $this->createDiscordChannels($subgroupId, $subgroup);
                    
                    $this->redirect('/subgroups/view/' . $subgroupId);
                } else {
                    $errors[] = 'Une erreur est survenue lors de la création du sous-groupe.';
                }
            }
        }
        
        $this->render('subgroups/form', [
            'subgroup' => $subgroup,
            'projects' => $projects,
            'project' => $project,
            'errors' => $errors,
            'isNew' => true,
            'title' => 'Créer un sous-groupe'
        ]);
    }
    
    /**
     * Modifier un sous-groupe existant
     */
    public function editAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('editor')) {
            $this->redirect('/projects');
        }
        
        $subgroupId = (int)$this->routeParam('id');
        $subgroup = $this->subgroupModel->findById($subgroupId);
        
        if (!$subgroup) {
            $this->redirect('/projects');
        }
        
        $errors = [];
        
        // Liste des projets pour le formulaire
        $projects = $this->projectModel->findAll('name', 'ASC');
        
        // Traitement du formulaire
        if ($this->isPost()) {
            $updatedSubgroup = [
                'name' => $this->postParam('name'),
                'description' => $this->postParam('description'),
                'project_id' => (int)$this->postParam('project_id'),
                'leader_id' => $this->postParam('leader_id'),
                'updated_at' => date('Y-m-d H:i:s')
            ];
            
            // Validation
            if (empty($updatedSubgroup['name'])) {
                $errors[] = 'Le nom du sous-groupe est obligatoire.';
            }
            
            if (empty($updatedSubgroup['project_id'])) {
                $errors[] = 'Le projet est obligatoire.';
            } else {
                // Vérifier que le projet existe
                $projectExists = $this->projectModel->findById($updatedSubgroup['project_id']);
                if (!$projectExists) {
                    $errors[] = 'Le projet sélectionné n\'existe pas.';
                }
            }
            
            // Si pas d'erreurs, mettre à jour le sous-groupe
            if (empty($errors)) {
                $success = $this->subgroupModel->update($subgroupId, $updatedSubgroup);
                
                if ($success) {
                    // Journaliser l'action
                    $this->memberModel->logActivity(
                        $_SESSION['member_id'],
                        'update_subgroup',
                        "Mise à jour du sous-groupe: {$updatedSubgroup['name']}"
                    );
                    
                    // Mettre à jour le leader si nécessaire
                    if ($updatedSubgroup['leader_id'] !== $subgroup['leader_id']) {
                        if (!empty($updatedSubgroup['leader_id'])) {
                            // Si un nouveau leader est spécifié, l'ajouter comme membre avec le rôle leader
                            $this->subgroupModel->addMember($subgroupId, $updatedSubgroup['leader_id'], 'leader');
                            
                            // Si l'ancien leader existe, le rétrograder au rôle de membre
                            if (!empty($subgroup['leader_id'])) {
                                $isMember = $this->subgroupModel->isMember($subgroupId, $subgroup['leader_id']);
                                if ($isMember) {
                                    $this->subgroupModel->addMember($subgroupId, $subgroup['leader_id'], 'member');
                                }
                            }
                        }
                    }
                    
                    $this->redirect('/subgroups/view/' . $subgroupId);
                } else {
                    $errors[] = 'Une erreur est survenue lors de la mise à jour du sous-groupe.';
                }
            }
            
            // En cas d'erreur, utiliser les données soumises
            $subgroup = array_merge($subgroup, $updatedSubgroup);
        }
        
        $this->render('subgroups/form', [
            'subgroup' => $subgroup,
            'projects' => $projects,
            'errors' => $errors,
            'isNew' => false,
            'title' => 'Modifier le sous-groupe: ' . $subgroup['name']
        ]);
    }
    
    /**
     * Supprimer un sous-groupe
     */
    public function deleteAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('admin')) {
            $this->redirect('/projects');
        }
        
        $subgroupId = (int)$this->routeParam('id');
        $subgroup = $this->subgroupModel->findById($subgroupId);
        
        if (!$subgroup) {
            $this->redirect('/projects');
        }
        
        $projectId = $subgroup['project_id'];
        $errors = [];
        
        // Traitement de la suppression
        if ($this->isPost()) {
            // Commencer une transaction
            $this->subgroupModel->query('START TRANSACTION');
            
            try {
                // Supprimer les tâches du sous-groupe ou les réassigner au projet principal
                $reassignTasks = (bool)$this->postParam('reassign_tasks', false);
                
                if ($reassignTasks) {
                    // Réassigner les tâches au projet principal (sans sous-groupe)
                    $this->taskModel->query("UPDATE tasks SET subgroup_id = NULL WHERE subgroup_id = :subgroup_id", [
                        'subgroup_id' => $subgroupId
                    ]);
                } else {
                    // Supprimer les tâches
                    $this->taskModel->query("DELETE FROM tasks WHERE subgroup_id = :subgroup_id", [
                        'subgroup_id' => $subgroupId
                    ]);
                }
                
                // Supprimer les membres du sous-groupe
                $this->subgroupModel->query("DELETE FROM subgroup_members WHERE subgroup_id = :subgroup_id", [
                    'subgroup_id' => $subgroupId
                ]);
                
                // Supprimer le sous-groupe
                $success = $this->subgroupModel->delete($subgroupId);
                
                if ($success) {
                    // Journaliser l'action
                    $this->memberModel->logActivity(
                        $_SESSION['member_id'],
                        'delete_subgroup',
                        "Suppression du sous-groupe: {$subgroup['name']}"
                    );
                    
                    // Valider la transaction
                    $this->subgroupModel->query('COMMIT');
                    
                    $this->redirect($projectId ? "/projects/view/{$projectId}" : "/projects");
                } else {
                    throw new \Exception("Échec de la suppression du sous-groupe.");
                }
            } catch (\Exception $e) {
                // Annuler la transaction en cas d'erreur
                $this->subgroupModel->query('ROLLBACK');
                
                $errors[] = 'Une erreur est survenue lors de la suppression du sous-groupe: ' . $e->getMessage();
            }
        }
        
        $this->render('subgroups/delete', [
            'subgroup' => $subgroup,
            'errors' => $errors,
            'title' => 'Supprimer le sous-groupe: ' . $subgroup['name']
        ]);
    }
    
    /**
     * Gérer les membres d'un sous-groupe
     */
    public function membersAction()
    {
        // Vérifier si l'utilisateur a les droits
        if (!$this->authController->hasRole('editor')) {
            $this->redirect('/projects');
        }
        
        $subgroupId = (int)$this->routeParam('id');
        $subgroup = $this->subgroupModel->getWithFullDetails($subgroupId);
        
        if (!$subgroup) {
            $this->redirect('/projects');
        }
        
        $errors = [];
        $success = false;
        
        // Traitement du formulaire d'ajout de membre
        if ($this->isPost()) {
            $action = $this->postParam('action');
            
            if ($action === 'add') {
                $userId = $this->postParam('user_id');
                $role = $this->postParam('role', 'member');
                
                // Validation
                if (empty($userId)) {
                    $errors[] = 'L\'ID Discord de l\'utilisateur est obligatoire.';
                }
                
                                // Si pas d'erreurs, ajouter le membre                if (empty($errors)) {                    $memberId = $this->subgroupModel->addMember($subgroupId, $userId, $role);                                        if ($memberId) {                        // Journaliser l'action                        $this->memberModel->logActivity(                            $_SESSION['member_id'],                            'add_subgroup_member',                            "Ajout du membre {$userId} au sous-groupe: {$subgroup['name']}"                        );                                                // Mettre à jour les permissions Discord pour ce membre                        $this->updateDiscordMemberPermissions($subgroupId, $userId, true);                                                $success = true;                                                // Rafraîchir les données du sous-groupe                        $subgroup = $this->subgroupModel->getWithFullDetails($subgroupId);                    } else {                        $errors[] = 'Une erreur est survenue lors de l\'ajout du membre.';                    }                }
            } elseif ($action === 'remove') {
                $userId = $this->postParam('user_id');
                
                if (empty($userId)) {
                    $errors[] = 'L\'ID Discord de l\'utilisateur est obligatoire.';
                }
                
                                // Si pas d'erreurs, retirer le membre                if (empty($errors)) {                    $removed = $this->subgroupModel->removeMember($subgroupId, $userId);                                        if ($removed) {                        // Journaliser l'action                        $this->memberModel->logActivity(                            $_SESSION['member_id'],                            'remove_subgroup_member',                            "Retrait du membre {$userId} du sous-groupe: {$subgroup['name']}"                        );                                                // Mettre à jour les permissions Discord pour ce membre (retirer l'accès)                        $this->updateDiscordMemberPermissions($subgroupId, $userId, false);                                                $success = true;                                                // Rafraîchir les données du sous-groupe                        $subgroup = $this->subgroupModel->getWithFullDetails($subgroupId);                    } else {                        $errors[] = 'Une erreur est survenue lors du retrait du membre.';                    }                }
            } elseif ($action === 'update_role') {
                $userId = $this->postParam('user_id');
                $role = $this->postParam('role');
                
                // Validation
                if (empty($userId) || empty($role)) {
                    $errors[] = 'L\'ID Discord de l\'utilisateur et le rôle sont obligatoires.';
                }
                
                // Si pas d'erreurs, mettre à jour le rôle
                if (empty($errors)) {
                    $updated = $this->subgroupModel->addMember($subgroupId, $userId, $role);
                    
                    if ($updated) {
                        // Journaliser l'action
                        $this->memberModel->logActivity(
                            $_SESSION['member_id'],
                            'update_subgroup_member',
                            "Mise à jour du rôle du membre {$userId} dans le sous-groupe: {$subgroup['name']}"
                        );
                        
                        $success = true;
                        
                        // Rafraîchir les données du sous-groupe
                        $subgroup = $this->subgroupModel->getWithFullDetails($subgroupId);
                    } else {
                        $errors[] = 'Une erreur est survenue lors de la mise à jour du rôle.';
                    }
                }
            }
        }
        
        $this->render('subgroups/members', [
            'subgroup' => $subgroup,
            'project' => $subgroup['project'],
            'members' => $subgroup['members'],
            'errors' => $errors,
            'success' => $success,
            'title' => 'Membres du sous-groupe: ' . $subgroup['name'],
            'roles' => [
                'leader' => 'Chef d\'équipe',
                'member' => 'Membre'
            ]
        ]);
    }
    
    /**
     * Créer les canaux Discord pour un sous-groupe
     *
     * @param int $subgroupId ID du sous-groupe
     * @param array $subgroup Données du sous-groupe
     * @return bool Succès de l'opération
     */
    private function createDiscordChannels($subgroupId, $subgroup)
    {
        try {
            // Initialiser les services nécessaires
            $discordService = new \Models\DiscordService();
            $configModel = new \Models\ConfigModel();
            $channelModel = new \Models\ProjectChannel();
            
            // Récupérer les configurations Discord
            $guildId = $configModel->getDiscordGuildId();
            $everyoneRoleId = $configModel->getDiscordEveryoneRoleId();
            
            // Si l'ID du serveur n'est pas configuré, on ne peut pas créer les canaux
            if (empty($guildId) || empty($everyoneRoleId)) {
                error_log("Erreur: Configuration Discord incomplète pour créer des canaux de sous-groupe");
                return false;
            }
            
            // Récupérer les détails du projet parent
            $project = $this->projectModel->findById($subgroup['project_id']);
            if (!$project) {
                error_log("Erreur: Projet parent #{$subgroup['project_id']} introuvable pour le sous-groupe #{$subgroupId}");
                return false;
            }
            
            // Récupérer la catégorie du projet
            $projectChannels = $channelModel->findAllBy(['project_id' => $subgroup['project_id']]);
            $categoryId = null;
            
            foreach ($projectChannels as $channel) {
                if ($channel['channel_type'] === 'category') {
                    $categoryId = $channel['channel_id'];
                    break;
                }
            }
            
            if (!$categoryId) {
                error_log("Erreur: Catégorie Discord introuvable pour le projet #{$subgroup['project_id']}");
                return false;
            }
            
            // Sanitizer le nom du sous-groupe pour le nom du canal
            $sanitizedName = $this->sanitizeChannelName($subgroup['name']);
            
            // Créer un canal textuel public pour le sous-groupe
            $textChannelName = "💬-" . $sanitizedName;
            $textChannelData = $discordService->createTextChannel($guildId, $textChannelName, [
                'parent_id' => $categoryId
            ]);
            
            if ($textChannelData) {
                // Enregistrer le canal dans la base de données
                $channelModel->create([
                    'project_id' => $subgroup['project_id'],
                    'subgroup_id' => $subgroupId,
                    'channel_id' => $textChannelData['id'],
                    'channel_type' => 'text',
                    'is_private' => 0
                ]);
                
                // Envoyer un message d'introduction dans le canal
                $discordService->sendMessage($textChannelData['id'], 
                    "**Bienvenue dans le canal du sous-groupe {$subgroup['name']}**\n" .
                    "Ce canal a été créé automatiquement par le système de gestion de projets.\n" .
                    "Description: {$subgroup['description']}"
                );
            }
            
            // Créer un canal vocal privé pour le sous-groupe
            $voiceChannelName = "🔒 " . $sanitizedName;
            
            // Préparer les permissions (privé, seulement accessible aux membres du sous-groupe)
            $permissions = $discordService->getPrivateChannelPermissions($everyoneRoleId);
            
            // Si un leader est spécifié, lui donner accès au canal
            if (!empty($subgroup['leader_id'])) {
                $permissions[] = [
                    'id' => $subgroup['leader_id'],
                    'type' => 1, // Type 1 = membre
                    'allow' => "1024", // VIEW_CHANNEL
                    'deny' => "0"
                ];
            }
            
            // Créer le canal vocal privé
            $voiceChannelData = $discordService->createVoiceChannel($guildId, $voiceChannelName, [
                'parent_id' => $categoryId,
                'permission_overwrites' => $permissions
            ]);
            
            if ($voiceChannelData) {
                // Enregistrer le canal dans la base de données
                $channelModel->create([
                    'project_id' => $subgroup['project_id'],
                    'subgroup_id' => $subgroupId,
                    'channel_id' => $voiceChannelData['id'],
                    'channel_type' => 'voice',
                    'is_private' => 1
                ]);
            }
            
            return true;
            
        } catch (\Exception $e) {
            error_log("Erreur lors de la création des canaux Discord pour le sous-groupe: " . $e->getMessage());
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
    
    /**
     * Mettre à jour les permissions Discord d'un membre de sous-groupe
     *
     * @param int $subgroupId ID du sous-groupe
     * @param string $userId ID Discord de l'utilisateur
     * @param bool $addAccess True pour ajouter l'accès, false pour le retirer
     * @return bool Succès de l'opération
     */
    private function updateDiscordMemberPermissions($subgroupId, $userId, $addAccess = true)
    {
        try {
            // Initialiser les services nécessaires
            $discordService = new \Models\DiscordService();
            $channelModel = new \Models\ProjectChannel();
            
            // Récupérer les canaux privés du sous-groupe
            $privateChannels = $channelModel->findAllBy([
                'subgroup_id' => $subgroupId,
                'is_private' => 1
            ]);
            
            if (empty($privateChannels)) {
                // Pas de canaux privés, rien à faire
                return true;
            }
            
            foreach ($privateChannels as $channel) {
                if ($addAccess) {
                    // Ajouter l'accès au canal pour cet utilisateur
                    $discordService->addUserPermission(
                        $channel['channel_id'],
                        $userId,
                        1024, // VIEW_CHANNEL permission
                        0
                    );
                } else {
                    // Retirer l'accès au canal pour cet utilisateur
                    $discordService->addUserPermission(
                        $channel['channel_id'],
                        $userId,
                        0,
                        1024 // VIEW_CHANNEL permission
                    );
                }
            }
            
            return true;
            
        } catch (\Exception $e) {
            error_log("Erreur lors de la mise à jour des permissions Discord: " . $e->getMessage());
            return false;
        }
    }
} 