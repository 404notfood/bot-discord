<?php
namespace Models;

use Core\Model;

/**
 * Modèle pour les utilisateurs Discord
 */
class User extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'users';
    
    /**
     * Obtenir les statistiques d'utilisateurs
     *
     * @return array
     */
    public function getStats()
    {
        // Total des utilisateurs
        $sqlTotal = "SELECT COUNT(*) as total FROM {$this->table}";
        $stmtTotal = $this->db->query($sqlTotal);
        $total = $stmtTotal->fetch()['total'];
        
        // Utilisateurs actifs (derniers 30 jours)
        $sqlActive = "SELECT COUNT(*) as active FROM {$this->table} 
                      WHERE last_seen >= DATE_SUB(NOW(), INTERVAL 30 DAY)";
        $stmtActive = $this->db->query($sqlActive);
        $active = $stmtActive->fetch()['active'];
        
        // Nouveaux utilisateurs (derniers 7 jours)
        $sqlNew = "SELECT COUNT(*) as new FROM {$this->table} 
                   WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $stmtNew = $this->db->query($sqlNew);
        $new = $stmtNew->fetch()['new'];
        
        // Utilisateurs par préférence de langue
        $sqlLanguages = "SELECT preferred_language, COUNT(*) as count 
                         FROM {$this->table} 
                         GROUP BY preferred_language 
                         ORDER BY count DESC";
        $stmtLanguages = $this->db->query($sqlLanguages);
        $languages = $stmtLanguages->fetchAll();
        
        return [
            'total' => $total,
            'active' => $active,
            'new' => $new,
            'languages' => $languages
        ];
    }
    
    /**
     * Obtenir l'historique des commandes d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param int $limit Nombre de commandes à retourner
     * @return array
     */
    public function getCommandHistory($userId, $limit = 10)
    {
        $sql = "SELECT ch.* 
                FROM command_history ch
                WHERE ch.user_id = :user_id
                ORDER BY ch.executed_at DESC
                LIMIT :limit";
        
        $stmt = $this->db->query($sql, [
            'user_id' => $userId,
            'limit' => $limit
        ]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir les commandes les plus utilisées
     *
     * @param int $limit Nombre de commandes à retourner
     * @return array
     */
    public function getTopCommands($limit = 10)
    {
        $sql = "SELECT command_name, COUNT(*) as count 
                FROM command_history 
                GROUP BY command_name 
                ORDER BY count DESC 
                LIMIT :limit";
        
        $stmt = $this->db->query($sql, ['limit' => $limit]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir les utilisateurs les plus actifs
     *
     * @param int $limit Nombre d'utilisateurs à retourner
     * @return array
     */
    public function getMostActiveUsers($limit = 10)
    {
        $sql = "SELECT u.id, u.username, u.discord_id, COUNT(ch.id) as command_count 
                FROM {$this->table} u
                JOIN command_history ch ON u.id = ch.user_id
                GROUP BY u.id
                ORDER BY command_count DESC
                LIMIT :limit";
        
        $stmt = $this->db->query($sql, ['limit' => $limit]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir les utilisations de ressources par un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param int $limit Nombre d'enregistrements à retourner
     * @return array
     */
    public function getResourceUsage($userId, $limit = 10)
    {
        $sql = "SELECT ru.*, r.name as resource_name, c.name as category_name
                FROM resource_usage ru
                JOIN resources r ON ru.resource_id = r.id
                JOIN categories c ON r.category_id = c.id
                WHERE ru.user_id = :user_id
                ORDER BY ru.used_at DESC
                LIMIT :limit";
        
        $stmt = $this->db->query($sql, [
            'user_id' => $userId,
            'limit' => $limit
        ]);
        
        return $stmt->fetchAll();
    }
} 