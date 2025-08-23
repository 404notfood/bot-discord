<?php
namespace Models;

use Core\Model;

/**
 * Modèle pour les logs de modération
 */
class ModerationLog extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'moderation_logs';
    
    /**
     * Types d'actions de modération
     */
    const ACTION_WARN = 'warn';
    const ACTION_KICK = 'kick';
    const ACTION_BAN = 'ban';
    const ACTION_UNBAN = 'unban';
    const ACTION_MUTE = 'mute';
    const ACTION_UNMUTE = 'unmute';
    
    /**
     * Obtenir les logs de modération avec des filtres
     *
     * @param array $filters Filtres (guild_id, user_id, moderator_id, action_type)
     * @param int $limit Limite de résultats
     * @param int $offset Décalage pour la pagination
     * @return array
     */
    public function getFilteredLogs($filters = [], $limit = 50, $offset = 0)
    {
        $sql = "SELECT * FROM {$this->table} WHERE 1=1";
        $params = [];
        
        if (isset($filters['guild_id'])) {
            $sql .= " AND guild_id = :guild_id";
            $params['guild_id'] = $filters['guild_id'];
        }
        
        if (isset($filters['user_id'])) {
            $sql .= " AND user_id = :user_id";
            $params['user_id'] = $filters['user_id'];
        }
        
        if (isset($filters['moderator_id'])) {
            $sql .= " AND moderator_id = :moderator_id";
            $params['moderator_id'] = $filters['moderator_id'];
        }
        
        if (isset($filters['action_type'])) {
            $sql .= " AND action_type = :action_type";
            $params['action_type'] = $filters['action_type'];
        }
        
        if (isset($filters['date_from'])) {
            $sql .= " AND created_at >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (isset($filters['date_to'])) {
            $sql .= " AND created_at <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT :limit OFFSET :offset";
        $params['limit'] = $limit;
        $params['offset'] = $offset;
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Compter le nombre total de logs correspondant aux filtres
     *
     * @param array $filters Filtres (guild_id, user_id, moderator_id, action_type)
     * @return int
     */
    public function countFilteredLogs($filters = [])
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table} WHERE 1=1";
        $params = [];
        
        if (isset($filters['guild_id'])) {
            $sql .= " AND guild_id = :guild_id";
            $params['guild_id'] = $filters['guild_id'];
        }
        
        if (isset($filters['user_id'])) {
            $sql .= " AND user_id = :user_id";
            $params['user_id'] = $filters['user_id'];
        }
        
        if (isset($filters['moderator_id'])) {
            $sql .= " AND moderator_id = :moderator_id";
            $params['moderator_id'] = $filters['moderator_id'];
        }
        
        if (isset($filters['action_type'])) {
            $sql .= " AND action_type = :action_type";
            $params['action_type'] = $filters['action_type'];
        }
        
        if (isset($filters['date_from'])) {
            $sql .= " AND created_at >= :date_from";
            $params['date_from'] = $filters['date_from'];
        }
        
        if (isset($filters['date_to'])) {
            $sql .= " AND created_at <= :date_to";
            $params['date_to'] = $filters['date_to'];
        }
        
        $stmt = $this->db->query($sql, $params);
        $result = $stmt->fetch();
        
        return (int) $result['count'];
    }
    
    /**
     * Obtenir l'historique de modération d'un utilisateur
     *
     * @param string $userId ID Discord de l'utilisateur
     * @param string $guildId ID Discord du serveur (optionnel)
     * @return array
     */
    public function getUserHistory($userId, $guildId = null)
    {
        $sql = "SELECT * FROM {$this->table} WHERE user_id = :user_id";
        $params = ['user_id' => $userId];
        
        if ($guildId) {
            $sql .= " AND guild_id = :guild_id";
            $params['guild_id'] = $guildId;
        }
        
        $sql .= " ORDER BY created_at DESC";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir les statistiques de modération
     *
     * @param string $guildId ID Discord du serveur (optionnel)
     * @param string $period Période ('day', 'week', 'month', 'year')
     * @return array
     */
    public function getModStats($guildId = null, $period = 'month')
    {
        // Déterminer la date de début selon la période
        $dateFrom = null;
        switch ($period) {
            case 'day':
                $dateFrom = date('Y-m-d H:i:s', strtotime('-1 day'));
                break;
            case 'week':
                $dateFrom = date('Y-m-d H:i:s', strtotime('-1 week'));
                break;
            case 'month':
                $dateFrom = date('Y-m-d H:i:s', strtotime('-1 month'));
                break;
            case 'year':
                $dateFrom = date('Y-m-d H:i:s', strtotime('-1 year'));
                break;
            default:
                $dateFrom = date('Y-m-d H:i:s', strtotime('-1 month'));
        }
        
        $sql = "SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN action_type = 'warn' THEN 1 ELSE 0 END) as warn_count,
                SUM(CASE WHEN action_type = 'kick' THEN 1 ELSE 0 END) as kick_count,
                SUM(CASE WHEN action_type = 'ban' THEN 1 ELSE 0 END) as ban_count,
                SUM(CASE WHEN action_type = 'unban' THEN 1 ELSE 0 END) as unban_count,
                SUM(CASE WHEN action_type = 'mute' THEN 1 ELSE 0 END) as mute_count,
                SUM(CASE WHEN action_type = 'unmute' THEN 1 ELSE 0 END) as unmute_count,
                COUNT(DISTINCT user_id) as unique_users,
                COUNT(DISTINCT moderator_id) as unique_mods
                FROM {$this->table}
                WHERE created_at >= :date_from";
        
        $params = ['date_from' => $dateFrom];
        
        if ($guildId) {
            $sql .= " AND guild_id = :guild_id";
            $params['guild_id'] = $guildId;
        }
        
        $stmt = $this->db->query($sql, $params);
        $stats = $stmt->fetch();
        
        // Obtenir le top 5 des modérateurs
        $sql = "SELECT moderator_id, COUNT(*) as action_count
                FROM {$this->table}
                WHERE created_at >= :date_from";
        
        if ($guildId) {
            $sql .= " AND guild_id = :guild_id";
        }
        
        $sql .= " GROUP BY moderator_id
                  ORDER BY action_count DESC
                  LIMIT 5";
        
        $stmt = $this->db->query($sql, $params);
        $stats['top_moderators'] = $stmt->fetchAll();
        
        return $stats;
    }
    
    /**
     * Enregistrer une action de modération
     *
     * @param array $data Données de l'action
     * @return int|false ID du log ou false
     */
    public function logAction($data)
    {
        // Vérifier que les champs obligatoires sont présents
        $requiredFields = ['guild_id', 'action_type', 'user_id', 'moderator_id'];
        foreach ($requiredFields as $field) {
            if (!isset($data[$field])) {
                return false;
            }
        }
        
        // Vérifier que le type d'action est valide
        $validActions = [
            self::ACTION_WARN,
            self::ACTION_KICK,
            self::ACTION_BAN,
            self::ACTION_UNBAN,
            self::ACTION_MUTE,
            self::ACTION_UNMUTE
        ];
        
        if (!in_array($data['action_type'], $validActions)) {
            return false;
        }
        
        // Encoder les informations additionnelles en JSON si nécessaire
        if (isset($data['additional_info']) && is_array($data['additional_info'])) {
            $data['additional_info'] = json_encode($data['additional_info']);
        }
        
        return $this->create($data);
    }
} 