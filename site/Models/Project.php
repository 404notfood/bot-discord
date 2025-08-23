<?php
namespace Models;

use Core\Model;

/**
 * Modèle pour les projets
 */
class Project extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'projects';
    
    /**
     * Statuts possibles
     */
    const STATUS_PLANNING = 'planning';
    const STATUS_IN_PROGRESS = 'in_progress';
    const STATUS_PAUSED = 'paused';
    const STATUS_COMPLETED = 'completed';
    const STATUS_CANCELLED = 'cancelled';
    
    /**
     * Obtenir tous les projets avec des informations supplémentaires
     *
     * @return array
     */
    public function getAllWithDetails()
    {
        $sql = "SELECT p.*, 
                COUNT(DISTINCT s.id) as subgroup_count, 
                COUNT(DISTINCT t.id) as task_count,
                COUNT(DISTINCT pc.id) as channel_count
                FROM {$this->table} p
                LEFT JOIN subgroups s ON p.id = s.project_id
                LEFT JOIN tasks t ON p.id = t.project_id
                LEFT JOIN project_channels pc ON p.id = pc.project_id
                GROUP BY p.id
                ORDER BY p.created_at DESC";
                
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir un projet avec toutes ses informations associées
     *
     * @param int $id ID du projet
     * @return array
     */
    public function getWithFullDetails($id)
    {
        // Récupérer le projet
        $project = $this->findById($id);
        
        if (!$project) {
            return null;
        }
        
        // Récupérer les sous-groupes
        $subgroupModel = new Subgroup();
        $project['subgroups'] = $subgroupModel->findAllBy(['project_id' => $id]);
        
        // Récupérer les tâches
        $taskModel = new Task();
        $project['tasks'] = $taskModel->findAllBy(['project_id' => $id]);
        
        // Récupérer les canaux
        $channelModel = new ProjectChannel();
        $project['channels'] = $channelModel->findAllBy(['project_id' => $id]);
        
        // Récupérer les ressources - Commenté car la classe ProjectResource n'existe pas
        /*
        $resourceModel = new ProjectResource();
        $project['resources'] = $resourceModel->findAllBy(['project_id' => $id]);
        */
        
        return $project;
    }
    
    /**
     * Récupérer les projets d'un utilisateur
     *
     * @param string $userId ID Discord de l'utilisateur
     * @return array
     */
    public function getByUserId($userId)
    {
        $sql = "SELECT p.* FROM {$this->table} p
                LEFT JOIN subgroup_members sm ON sm.subgroup_id IN 
                    (SELECT s.id FROM subgroups s WHERE s.project_id = p.id)
                WHERE p.owner_id = :user_id OR sm.user_id = :user_id
                GROUP BY p.id
                ORDER BY p.created_at DESC";
                
        $stmt = $this->db->query($sql, ['user_id' => $userId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir les statistiques des projets
     *
     * @return array
     */
    public function getStats()
    {
        $stats = [
            'total' => $this->count(),
            'in_progress' => $this->count(['status' => self::STATUS_IN_PROGRESS]),
            'completed' => $this->count(['status' => self::STATUS_COMPLETED]),
            'planning' => $this->count(['status' => self::STATUS_PLANNING]),
            'paused' => $this->count(['status' => self::STATUS_PAUSED]),
            'cancelled' => $this->count(['status' => self::STATUS_CANCELLED])
        ];
        
        // Compter le nombre total de tâches, sous-groupes, etc.
        $sql = "SELECT 
                COUNT(DISTINCT s.id) as total_subgroups,
                COUNT(DISTINCT t.id) as total_tasks,
                COUNT(DISTINCT pc.id) as total_channels,
                COUNT(DISTINCT sm.id) as total_members
                FROM {$this->table} p
                LEFT JOIN subgroups s ON p.id = s.project_id
                LEFT JOIN tasks t ON p.id = t.project_id
                LEFT JOIN project_channels pc ON p.id = pc.project_id
                LEFT JOIN subgroup_members sm ON sm.subgroup_id IN 
                    (SELECT s2.id FROM subgroups s2 WHERE s2.project_id = p.id)";
                
        $stmt = $this->db->query($sql);
        $counters = $stmt->fetch();
        
        $stats = array_merge($stats, $counters);
        
        return $stats;
    }
} 