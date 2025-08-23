<?php
namespace Models;

use Core\Model;

/**
 * Modèle pour les tâches
 */
class Task extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'tasks';
    
    /**
     * Statuts possibles
     */
    const STATUS_PENDING = 'pending';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_REVIEW = 'review';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    
    /**
     * Priorités possibles
     */
    const PRIORITY_LOW = 'low';
    const PRIORITY_MEDIUM = 'medium';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';
    
    /**
     * Obtenir toutes les tâches avec des informations supplémentaires
     *
     * @param array $filters Filtres (project_id, subgroup_id, status, assigned_to)
     * @return array
     */
    public function getAllWithDetails($filters = [])
    {
        $sql = "SELECT t.*, p.name as project_name, sg.name as subgroup_name,
                u.username as assigned_username
                FROM {$this->table} t
                JOIN projects p ON t.project_id = p.id
                LEFT JOIN subgroups sg ON t.subgroup_id = sg.id
                LEFT JOIN users u ON t.assigned_to = u.discord_id
                WHERE 1=1";
        
        $params = [];
        
        if (isset($filters['project_id'])) {
            $sql .= " AND t.project_id = :project_id";
            $params['project_id'] = $filters['project_id'];
        }
        
        if (isset($filters['subgroup_id'])) {
            $sql .= " AND t.subgroup_id = :subgroup_id";
            $params['subgroup_id'] = $filters['subgroup_id'];
        }
        
        if (isset($filters['status'])) {
            $sql .= " AND t.status = :status";
            $params['status'] = $filters['status'];
        }
        
        if (isset($filters['assigned_to'])) {
            $sql .= " AND t.assigned_to = :assigned_to";
            $params['assigned_to'] = $filters['assigned_to'];
        }
        
        $sql .= " ORDER BY 
                 CASE t.priority
                    WHEN 'urgent' THEN 1
                    WHEN 'high' THEN 2
                    WHEN 'medium' THEN 3
                    WHEN 'low' THEN 4
                 END,
                 CASE t.status
                    WHEN 'in_progress' THEN 1
                    WHEN 'pending' THEN 2
                    WHEN 'review' THEN 3
                    WHEN 'completed' THEN 4
                    WHEN 'cancelled' THEN 5
                 END,
                 t.due_date";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir une tâche avec tous ses détails (y compris dépendances)
     *
     * @param int $id ID de la tâche
     * @return array|null
     */
    public function getWithFullDetails($id)
    {
        // Récupérer la tâche
        $task = $this->findById($id);
        
        if (!$task) {
            return null;
        }
        
        // Récupérer le projet
        $projectModel = new Project();
        $task['project'] = $projectModel->findById($task['project_id']);
        
        // Récupérer le sous-groupe
        if ($task['subgroup_id']) {
            $subgroupModel = new Subgroup();
            $task['subgroup'] = $subgroupModel->findById($task['subgroup_id']);
        } else {
            $task['subgroup'] = null;
        }
        
        // Récupérer l'utilisateur assigné
        if ($task['assigned_to']) {
            $sql = "SELECT * FROM users WHERE discord_id = :user_id";
            $stmt = $this->db->query($sql, ['user_id' => $task['assigned_to']]);
            $task['assigned_user'] = $stmt->fetch();
        } else {
            $task['assigned_user'] = null;
        }
        
        // Récupérer les dépendances
        $sql = "SELECT t.* FROM tasks t
                JOIN task_dependencies td ON t.id = td.depends_on_task_id
                WHERE td.task_id = :task_id";
        
        $stmt = $this->db->query($sql, ['task_id' => $id]);
        $task['dependencies'] = $stmt->fetchAll();
        
        // Récupérer les tâches qui dépendent de celle-ci
        $sql = "SELECT t.* FROM tasks t
                JOIN task_dependencies td ON t.id = td.task_id
                WHERE td.depends_on_task_id = :task_id";
        
        $stmt = $this->db->query($sql, ['task_id' => $id]);
        $task['dependent_tasks'] = $stmt->fetchAll();
        
        return $task;
    }
    
    /**
     * Ajouter une dépendance entre deux tâches
     *
     * @param int $taskId ID de la tâche
     * @param int $dependsOnTaskId ID de la tâche dont dépend la première
     * @return int|false ID de la dépendance ajoutée ou false
     */
    public function addDependency($taskId, $dependsOnTaskId)
    {
        // Vérifier que les tâches existent
        $task = $this->findById($taskId);
        $dependsOnTask = $this->findById($dependsOnTaskId);
        
        if (!$task || !$dependsOnTask) {
            return false;
        }
        
        // Vérifier que les deux tâches appartiennent au même projet
        if ($task['project_id'] !== $dependsOnTask['project_id']) {
            return false;
        }
        
        // Vérifier qu'on n'ajoute pas une dépendance cyclique
        if ($this->hasCyclicDependency($taskId, $dependsOnTaskId)) {
            return false;
        }
        
        $sql = "INSERT INTO task_dependencies (task_id, depends_on_task_id)
                VALUES (:task_id, :depends_on_task_id)
                ON DUPLICATE KEY UPDATE task_id = :task_id";
        
        $params = [
            'task_id' => $taskId,
            'depends_on_task_id' => $dependsOnTaskId
        ];
        
        $stmt = $this->db->query($sql, $params);
        
        if ($stmt->rowCount() > 0) {
            return $this->db->lastInsertId();
        }
        
        return false;
    }
    
    /**
     * Supprimer une dépendance entre deux tâches
     *
     * @param int $taskId ID de la tâche
     * @param int $dependsOnTaskId ID de la tâche dont dépend la première
     * @return bool
     */
    public function removeDependency($taskId, $dependsOnTaskId)
    {
        $sql = "DELETE FROM task_dependencies 
                WHERE task_id = :task_id AND depends_on_task_id = :depends_on_task_id";
        
        $params = [
            'task_id' => $taskId,
            'depends_on_task_id' => $dependsOnTaskId
        ];
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Vérifier s'il existe une dépendance cyclique entre deux tâches
     *
     * @param int $taskId ID de la tâche
     * @param int $dependsOnTaskId ID de la tâche dont dépend la première
     * @return bool
     */
    private function hasCyclicDependency($taskId, $dependsOnTaskId)
    {
        // Si la tâche dépend d'elle-même, c'est cyclique
        if ($taskId === $dependsOnTaskId) {
            return true;
        }
        
        // Récupérer toutes les dépendances de la tâche dont on dépendrait
        $sql = "SELECT depends_on_task_id FROM task_dependencies 
                WHERE task_id = :task_id";
        
        $stmt = $this->db->query($sql, ['task_id' => $dependsOnTaskId]);
        $dependencies = $stmt->fetchAll();
        
        // Vérifier récursivement si l'une de ces dépendances revient à la tâche initiale
        foreach ($dependencies as $dependency) {
            if ($dependency['depends_on_task_id'] == $taskId || 
                $this->hasCyclicDependency($taskId, $dependency['depends_on_task_id'])) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Mettre à jour le statut d'une tâche
     *
     * @param int $id ID de la tâche
     * @param string $status Nouveau statut
     * @return bool
     */
    public function updateStatus($id, $status)
    {
        // Vérifier que le statut est valide
        $validStatuses = [
            self::STATUS_PENDING,
            self::STATUS_IN_PROGRESS,
            self::STATUS_REVIEW,
            self::STATUS_COMPLETED,
            self::STATUS_CANCELLED
        ];
        
        if (!in_array($status, $validStatuses)) {
            return false;
        }
        
        $data = ['status' => $status];
        
        // Si la tâche est marquée comme terminée, définir la date de fin
        if ($status === self::STATUS_COMPLETED) {
            $data['completed_date'] = date('Y-m-d');
        }
        
        return $this->update($id, $data);
    }
    
    /**
     * Obtenir les statistiques des tâches pour un projet
     *
     * @param int $projectId ID du projet
     * @return array
     */
    public function getProjectStats($projectId)
    {
        $sql = "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) as review,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as priority_low,
                SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as priority_medium,
                SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as priority_high,
                SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as priority_urgent,
                SUM(CASE WHEN assigned_to IS NULL THEN 1 ELSE 0 END) as unassigned
                FROM {$this->table}
                WHERE project_id = :project_id";
        
        $stmt = $this->db->query($sql, ['project_id' => $projectId]);
        return $stmt->fetch();
    }
    
    /**
     * Supprimer toutes les tâches d'un projet
     *
     * @param int $projectId ID du projet
     * @return bool
     */
    public function deleteByProjectId($projectId)
    {
        try {
            $sql = "DELETE FROM {$this->table} WHERE project_id = :project_id";
            $stmt = $this->query($sql, ['project_id' => $projectId]);
            
            return true;
        } catch (\Exception $e) {
            // Gérer l'erreur
            error_log('Erreur lors de la suppression des tâches: ' . $e->getMessage());
            return false;
        }
    }
} 