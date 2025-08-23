<?php
namespace Models;

use Core\Model;

/**
 * Modèle pour les sous-groupes
 */
class Subgroup extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'subgroups';
    
    /**
     * Obtenir les sous-groupes avec le nombre de membres et tâches
     *
     * @param int $projectId ID du projet (optionnel)
     * @return array
     */
    public function getAllWithDetails($projectId = null)
    {
        $sql = "SELECT sg.*, p.name as project_name, 
                COUNT(DISTINCT sm.id) as member_count, 
                COUNT(DISTINCT t.id) as task_count
                FROM {$this->table} sg
                JOIN projects p ON sg.project_id = p.id
                LEFT JOIN subgroup_members sm ON sg.id = sm.subgroup_id
                LEFT JOIN tasks t ON sg.id = t.subgroup_id";
        
        $params = [];
        if ($projectId) {
            $sql .= " WHERE sg.project_id = :project_id";
            $params['project_id'] = $projectId;
        }
        
        $sql .= " GROUP BY sg.id
                  ORDER BY sg.name";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir un sous-groupe avec tous ses membres et tâches
     *
     * @param int $id ID du sous-groupe
     * @return array|null
     */
    public function getWithFullDetails($id)
    {
        // Récupérer le sous-groupe
        $subgroup = $this->findById($id);
        
        if (!$subgroup) {
            return null;
        }
        
        // Récupérer le projet
        $projectModel = new Project();
        $subgroup['project'] = $projectModel->findById($subgroup['project_id']);
        
        // Récupérer les membres
        $sql = "SELECT sm.*, u.username, u.discord_id
                FROM subgroup_members sm
                LEFT JOIN users u ON sm.user_id = u.discord_id
                WHERE sm.subgroup_id = :subgroup_id
                ORDER BY sm.role DESC, u.username";
        
        $stmt = $this->db->query($sql, ['subgroup_id' => $id]);
        $subgroup['members'] = $stmt->fetchAll();
        
        // Récupérer les tâches
        $taskModel = new Task();
        $subgroup['tasks'] = $taskModel->findAllBy(['subgroup_id' => $id], 'due_date', 'ASC');
        
        return $subgroup;
    }
    
    /**
     * Ajouter un membre à un sous-groupe
     *
     * @param int $subgroupId ID du sous-groupe
     * @param string $userId ID Discord de l'utilisateur
     * @param string $role Rôle du membre dans le sous-groupe
     * @return int|false ID du membre ajouté ou false
     */
    public function addMember($subgroupId, $userId, $role = 'member')
    {
        $sql = "INSERT INTO subgroup_members (subgroup_id, user_id, role)
                VALUES (:subgroup_id, :user_id, :role)
                ON DUPLICATE KEY UPDATE role = :role";
        
        $params = [
            'subgroup_id' => $subgroupId,
            'user_id' => $userId,
            'role' => $role
        ];
        
        $stmt = $this->db->query($sql, $params);
        
        if ($stmt->rowCount() > 0) {
            return $this->db->lastInsertId();
        }
        
        return false;
    }
    
    /**
     * Retirer un membre d'un sous-groupe
     *
     * @param int $subgroupId ID du sous-groupe
     * @param string $userId ID Discord de l'utilisateur
     * @return bool
     */
    public function removeMember($subgroupId, $userId)
    {
        $sql = "DELETE FROM subgroup_members 
                WHERE subgroup_id = :subgroup_id AND user_id = :user_id";
        
        $params = [
            'subgroup_id' => $subgroupId,
            'user_id' => $userId
        ];
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Vérifier si un utilisateur est membre d'un sous-groupe
     *
     * @param int $subgroupId ID du sous-groupe
     * @param string $userId ID Discord de l'utilisateur
     * @return bool
     */
    public function isMember($subgroupId, $userId)
    {
        $sql = "SELECT COUNT(*) as count FROM subgroup_members
                WHERE subgroup_id = :subgroup_id AND user_id = :user_id";
        
        $params = [
            'subgroup_id' => $subgroupId,
            'user_id' => $userId
        ];
        
        $stmt = $this->db->query($sql, $params);
        $result = $stmt->fetch();
        
        return $result['count'] > 0;
    }
    
    /**
     * Obtenir le rôle d'un utilisateur dans un sous-groupe
     *
     * @param int $subgroupId ID du sous-groupe
     * @param string $userId ID Discord de l'utilisateur
     * @return string|null Le rôle ou null si non membre
     */
    public function getMemberRole($subgroupId, $userId)
    {
        $sql = "SELECT role FROM subgroup_members
                WHERE subgroup_id = :subgroup_id AND user_id = :user_id";
        
        $params = [
            'subgroup_id' => $subgroupId,
            'user_id' => $userId
        ];
        
        $stmt = $this->db->query($sql, $params);
        $result = $stmt->fetch();
        
        return $result ? $result['role'] : null;
    }
    
    /**
     * Supprimer tous les sous-groupes d'un projet
     *
     * @param int $projectId ID du projet
     * @return bool
     */
    public function deleteByProjectId($projectId)
    {
        try {
            // Supprimer d'abord les membres des sous-groupes
            $sql = "DELETE sm FROM subgroup_members sm
                    JOIN subgroups s ON sm.subgroup_id = s.id
                    WHERE s.project_id = :project_id";
            $this->query($sql, ['project_id' => $projectId]);
            
            // Ensuite supprimer les sous-groupes eux-mêmes
            $sql = "DELETE FROM {$this->table} WHERE project_id = :project_id";
            $stmt = $this->query($sql, ['project_id' => $projectId]);
            
            return true;
        } catch (\Exception $e) {
            // Gérer l'erreur
            error_log('Erreur lors de la suppression des sous-groupes: ' . $e->getMessage());
            return false;
        }
    }
} 