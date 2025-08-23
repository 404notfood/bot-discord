<?php
namespace Models;

use Core\Model;

/**
 * Modèle pour les infractions Studi
 */
class StudiOffender extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'studi_offenders';
    
    /**
     * Obtenir un contrevenant par son ID Discord
     *
     * @param string $userId ID Discord de l'utilisateur
     * @return array|false
     */
    public function getByUserId($userId)
    {
        return $this->findBy(['user_id' => $userId]);
    }
    
    /**
     * Vérifier si un utilisateur est banni
     *
     * @param string $userId ID Discord de l'utilisateur
     * @return bool
     */
    public function isBanned($userId)
    {
        $sql = "SELECT COUNT(*) as count FROM studi_banned_users WHERE user_id = :user_id";
        $stmt = $this->db->query($sql, ['user_id' => $userId]);
        $result = $stmt->fetch();
        
        return $result['count'] > 0;
    }
    
    /**
     * Obtenir les détails d'un bannissement
     *
     * @param string $userId ID Discord de l'utilisateur
     * @return array|false
     */
    public function getBanDetails($userId)
    {
        $sql = "SELECT * FROM studi_banned_users WHERE user_id = :user_id";
        $stmt = $this->db->query($sql, ['user_id' => $userId]);
        return $stmt->fetch();
    }
    
    /**
     * Ajouter une infraction à un utilisateur
     *
     * @param string $userId ID Discord de l'utilisateur
     * @param string $guildId ID Discord du serveur
     * @return array Informations sur l'état de l'utilisateur après l'infraction
     */
    public function addOffense($userId, $guildId)
    {
        // Vérifier si l'utilisateur est déjà banni
        if ($this->isBanned($userId)) {
            return [
                'status' => 'already_banned',
                'ban_details' => $this->getBanDetails($userId)
            ];
        }
        
        // Vérifier si l'utilisateur existe déjà dans la table des contrevenants
        $offender = $this->getByUserId($userId);
        
        if ($offender) {
            // Mettre à jour le compteur d'infractions
            $newCount = $offender['offense_count'] + 1;
            $this->update($offender['id'], [
                'offense_count' => $newCount,
                'last_offense_at' => date('Y-m-d H:i:s')
            ]);
            
            // Mettre à jour ou créer l'entrée dans studi_offenses pour ce serveur
            $this->updateGuildOffense($userId, $guildId);
            
            // Obtenir le nombre maximum d'infractions autorisées
            $studiConfigModel = new StudiConfig();
            $maxOffenses = $studiConfigModel->getMaxOffenses();
            
            // Vérifier si l'utilisateur doit être banni
            if ($newCount >= $maxOffenses) {
                $this->banUser($userId, "Maximum d'infractions Studi atteint ({$maxOffenses})");
                
                return [
                    'status' => 'banned',
                    'offense_count' => $newCount,
                    'max_offenses' => $maxOffenses
                ];
            } else {
                return [
                    'status' => 'warned',
                    'offense_count' => $newCount,
                    'max_offenses' => $maxOffenses,
                    'remaining' => $maxOffenses - $newCount
                ];
            }
        } else {
            // Créer une nouvelle entrée pour l'utilisateur
            $this->create([
                'user_id' => $userId,
                'offense_count' => 1,
                'last_offense_at' => date('Y-m-d H:i:s')
            ]);
            
            // Créer une entrée dans studi_offenses pour ce serveur
            $this->updateGuildOffense($userId, $guildId);
            
            // Obtenir le nombre maximum d'infractions autorisées
            $studiConfigModel = new StudiConfig();
            $maxOffenses = $studiConfigModel->getMaxOffenses();
            
            return [
                'status' => 'first_warning',
                'offense_count' => 1,
                'max_offenses' => $maxOffenses,
                'remaining' => $maxOffenses - 1
            ];
        }
    }
    
    /**
     * Mettre à jour ou créer une entrée dans studi_offenses
     *
     * @param string $userId ID Discord de l'utilisateur
     * @param string $guildId ID Discord du serveur
     * @return bool
     */
    private function updateGuildOffense($userId, $guildId)
    {
        // Vérifier si une entrée existe déjà pour cet utilisateur et ce serveur
        $sql = "SELECT * FROM studi_offenses WHERE user_id = :user_id AND guild_id = :guild_id";
        $stmt = $this->db->query($sql, [
            'user_id' => $userId,
            'guild_id' => $guildId
        ]);
        $offense = $stmt->fetch();
        
        if ($offense) {
            // Mettre à jour l'entrée existante
            $sql = "UPDATE studi_offenses 
                    SET offense_count = offense_count + 1, 
                        last_offense = NOW() 
                    WHERE user_id = :user_id AND guild_id = :guild_id";
        } else {
            // Créer une nouvelle entrée
            $sql = "INSERT INTO studi_offenses (user_id, guild_id, offense_count, last_offense, created_at) 
                    VALUES (:user_id, :guild_id, 1, NOW(), NOW())";
        }
        
        $stmt = $this->db->query($sql, [
            'user_id' => $userId,
            'guild_id' => $guildId
        ]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Bannir un utilisateur
     *
     * @param string $userId ID Discord de l'utilisateur
     * @param string $reason Raison du bannissement
     * @param string $bannedBy ID Discord du modérateur (optionnel)
     * @return bool
     */
    public function banUser($userId, $reason, $bannedBy = 'system')
    {
        $sql = "INSERT INTO studi_banned_users (user_id, reason, banned_by, banned_at) 
                VALUES (:user_id, :reason, :banned_by, NOW())";
        
        $stmt = $this->db->query($sql, [
            'user_id' => $userId,
            'reason' => $reason,
            'banned_by' => $bannedBy
        ]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Débannir un utilisateur
     *
     * @param string $userId ID Discord de l'utilisateur
     * @return bool
     */
    public function unbanUser($userId)
    {
        $sql = "DELETE FROM studi_banned_users WHERE user_id = :user_id";
        $stmt = $this->db->query($sql, ['user_id' => $userId]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Réinitialiser les infractions d'un utilisateur
     *
     * @param string $userId ID Discord de l'utilisateur
     * @return bool
     */
    public function resetOffenses($userId)
    {
        // Supprimer de la table des contrevenants
        $offender = $this->getByUserId($userId);
        if ($offender) {
            $this->delete($offender['id']);
        }
        
        // Supprimer de la table des infractions par serveur
        $sql = "DELETE FROM studi_offenses WHERE user_id = :user_id";
        $this->db->query($sql, ['user_id' => $userId]);
        
        // Débannir si nécessaire
        if ($this->isBanned($userId)) {
            $this->unbanUser($userId);
        }
        
        return true;
    }
    
    /**
     * Obtenir la liste des utilisateurs bannis
     *
     * @param int $limit Limite de résultats
     * @param int $offset Décalage pour la pagination
     * @return array
     */
    public function getBannedUsers($limit = 50, $offset = 0)
    {
        $sql = "SELECT * FROM studi_banned_users ORDER BY banned_at DESC LIMIT :limit OFFSET :offset";
        $stmt = $this->db->query($sql, [
            'limit' => $limit,
            'offset' => $offset
        ]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir les utilisateurs ayant le plus d'infractions
     *
     * @param int $limit Nombre d'utilisateurs à retourner
     * @return array
     */
    public function getTopOffenders($limit = 10)
    {
        $sql = "SELECT * FROM {$this->table} ORDER BY offense_count DESC, last_offense_at DESC LIMIT :limit";
        $stmt = $this->db->query($sql, ['limit' => $limit]);
        
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir les statistiques d'infractions
     *
     * @return array
     */
    public function getStats()
    {
        // Statistiques globales
        $sql = "SELECT 
                COUNT(*) as total_offenders,
                SUM(offense_count) as total_offenses,
                MAX(offense_count) as max_offenses,
                AVG(offense_count) as avg_offenses
                FROM {$this->table}";
        
        $stmt = $this->db->query($sql);
        $stats = $stmt->fetch();
        
        // Nombre d'utilisateurs bannis
        $sql = "SELECT COUNT(*) as banned_count FROM studi_banned_users";
        $stmt = $this->db->query($sql);
        $bannedCount = $stmt->fetch();
        
        $stats['banned_count'] = $bannedCount['banned_count'];
        
        // Statistiques par serveur
        $sql = "SELECT 
                guild_id,
                COUNT(*) as offender_count,
                SUM(offense_count) as offense_count,
                MAX(offense_count) as max_offenses
                FROM studi_offenses
                GROUP BY guild_id
                ORDER BY offense_count DESC";
        
        $stmt = $this->db->query($sql);
        $stats['guilds'] = $stmt->fetchAll();
        
        return $stats;
    }
} 