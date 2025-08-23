<?php
namespace Models;

use Core\Model;
use Exception;

/**
 * Modèle pour les rappels
 */
class Reminder extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'reminders';
    
    /**
     * Types de fréquence pour les rappels
     */
    const FREQUENCY_ONCE = 'once';
    const FREQUENCY_DAILY = 'daily';
    const FREQUENCY_WEEKLY = 'weekly';
    const FREQUENCY_MONTHLY = 'monthly';
    
    /**
     * Jours de la semaine
     */
    const DAYS_OF_WEEK = [
        1 => 'Lundi',
        2 => 'Mardi',
        3 => 'Mercredi',
        4 => 'Jeudi',
        5 => 'Vendredi',
        6 => 'Samedi',
        7 => 'Dimanche'
    ];
    
    /**
     * Obtenir tous les rappels configurés
     *
     * @param string $orderBy Champ pour l'ordre (ignoré, on utilise created_at)
     * @param string $direction Direction de l'ordre (ignoré, on utilise DESC)
     * @return array
     */
    public function getAll($orderBy = null, $direction = 'ASC')
    {
        return parent::getAll('created_at', 'DESC');
    }
    
    /**
     * Obtenir un rappel par son ID
     *
     * @param int $id ID du rappel
     * @return array|false
     */
    public function getById($id)
    {
        return parent::findById($id);
    }
    
    /**
     * Créer un nouveau rappel
     *
     * @param array $data Données du rappel
     * @return int|false ID du rappel créé ou false
     */
    public function create($data)
    {
        $sql = "INSERT INTO {$this->table} (
                    message, 
                    channel_id, 
                    guild_id, 
                    user_id,
                    remind_at,
                    is_completed,
                    created_at
                ) VALUES (
                    :message, 
                    :channel_id, 
                    :guild_id, 
                    :user_id,
                    :remind_at,
                    :is_completed,
                    NOW()
                )";
        
        $params = [
            'message' => $data['message'],
            'channel_id' => $data['channel_id'],
            'guild_id' => $data['guild_id'],
            'user_id' => $data['user_id'],
            'remind_at' => $data['remind_at'],
            'is_completed' => $data['is_completed'] ?? 0
        ];
        
        $stmt = $this->db->query($sql, $params);
        
        if ($stmt->rowCount() > 0) {
            return $this->db->lastInsertId();
        }
        
        return false;
    }
    
    /**
     * Mettre à jour un rappel existant
     *
     * @param int $id ID du rappel
     * @param array $data Données du rappel
     * @return bool
     */
    public function update($id, $data)
    {
        // Construire la requête SQL dynamiquement en fonction des champs fournis
        $sqlParts = [];
        $params = ['id' => $id];
        
        if (isset($data['message'])) {
            $sqlParts[] = "message = :message";
            $params['message'] = $data['message'];
        }
        
        if (isset($data['channel_id'])) {
            $sqlParts[] = "channel_id = :channel_id";
            $params['channel_id'] = $data['channel_id'];
        }
        
        if (isset($data['remind_at'])) {
            $sqlParts[] = "remind_at = :remind_at";
            $params['remind_at'] = $data['remind_at'];
        }
        
        if (isset($data['is_completed'])) {
            $sqlParts[] = "is_completed = :is_completed";
            $params['is_completed'] = $data['is_completed'];
        }
        
        if (isset($data['user_id'])) {
            $sqlParts[] = "user_id = :user_id";
            $params['user_id'] = $data['user_id'];
        }
        
        if (isset($data['guild_id'])) {
            $sqlParts[] = "guild_id = :guild_id";
            $params['guild_id'] = $data['guild_id'];
        }
        
        // Ajouter la mise à jour de updated_at
        $sqlParts[] = "updated_at = NOW()";
        
        // S'il n'y a rien à mettre à jour, retourner false
        if (empty($sqlParts)) {
            return false;
        }
        
        $sql = "UPDATE {$this->table} SET " . implode(", ", $sqlParts) . " WHERE id = :id";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Supprimer un rappel
     *
     * @param int $id ID du rappel
     * @return bool
     */
    public function delete($id)
    {
        $sql = "DELETE FROM {$this->table} WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Générer l'expression cron pour un rappel
     * 
     * @param array $reminder Données du rappel
     * @return string Expression cron
     */
    public function generateCronExpression($reminder)
    {
        $minute = $reminder['minute'];
        $hour = $reminder['hour'];
        $dayOfMonth = '*';
        $month = '*';
        $dayOfWeek = '*';
        
        switch ($reminder['frequency']) {
            case self::FREQUENCY_ONCE:
                // Pour un rappel unique, la date est gérée différemment
                return null;
            case self::FREQUENCY_DAILY:
                // Tous les jours à l'heure spécifiée
                break;
            case self::FREQUENCY_WEEKLY:
                // Un jour spécifique de la semaine
                $dayOfWeek = $reminder['day_of_week'];
                break;
            case self::FREQUENCY_MONTHLY:
                // Un jour spécifique du mois
                $dayOfMonth = $reminder['day_of_month'];
                break;
        }
        
        return "{$minute} {$hour} {$dayOfMonth} {$month} {$dayOfWeek}";
    }
    
    /**
     * Obtenir la description lisible de la fréquence d'un rappel
     * 
     * @param array $reminder Données du rappel
     * @return string Description de la fréquence
     */
    public function getFrequencyDescription($reminder)
    {
        if (empty($reminder['remind_at'])) {
            return "Date non définie";
        }
        
        $now = new \DateTime();
        $remindAt = new \DateTime($reminder['remind_at']);
        $interval = $now->diff($remindAt);
        
        // Formater la date et l'heure
        $dateFormatted = $remindAt->format('d/m/Y à H:i');
        
        // Si la date est dans le passé
        if ($remindAt < $now) {
            return "Programmé pour le {$dateFormatted} (passé)";
        }
        
        // Si la date est aujourd'hui
        if ($now->format('Y-m-d') === $remindAt->format('Y-m-d')) {
            return "Aujourd'hui à " . $remindAt->format('H:i');
        }
        
        // Si la date est demain
        $tomorrow = new \DateTime('tomorrow');
        if ($tomorrow->format('Y-m-d') === $remindAt->format('Y-m-d')) {
            return "Demain à " . $remindAt->format('H:i');
        }
        
        // Si la date est dans les 7 prochains jours
        if ($interval->days < 7) {
            $jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            $jourSemaine = $jours[$remindAt->format('w')];
            return "{$jourSemaine} " . $remindAt->format('d/m') . " à " . $remindAt->format('H:i');
        }
        
        // Sinon, afficher la date complète
        return "Le {$dateFormatted}";
    }
    
    /**
     * Initialiser la table reminders pour les tests
     */
    public function initRemindersTable()
    {
        try {
            // Vérifier si la table existe
            $sql = "SHOW TABLES LIKE '{$this->table}'";
            $stmt = $this->db->query($sql);
            $tableExists = ($stmt->rowCount() > 0);
            
            if (!$tableExists) {
                // Créer la table reminders
                $createTableSql = "
                CREATE TABLE IF NOT EXISTS `{$this->table}` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `title` varchar(255) NOT NULL,
                  `message` text NOT NULL,
                  `guild_id` varchar(50) NOT NULL,
                  `channel_id` varchar(50) NOT NULL,
                  `frequency` enum('once','daily','weekly','monthly') NOT NULL DEFAULT 'weekly',
                  `day_of_week` int(1) DEFAULT NULL COMMENT '1-7 (lundi-dimanche)',
                  `day_of_month` int(2) DEFAULT NULL COMMENT '1-31',
                  `hour` int(2) NOT NULL DEFAULT 8,
                  `minute` int(2) NOT NULL DEFAULT 0,
                  `mention_everyone` tinyint(1) NOT NULL DEFAULT 0,
                  `last_run_at` datetime DEFAULT NULL,
                  `is_active` tinyint(1) NOT NULL DEFAULT 1,
                  `created_by` varchar(50) NOT NULL,
                  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
                  PRIMARY KEY (`id`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ";
                $this->db->query($createTableSql);
                return true;
            }
            
            return false;
        } catch (Exception $e) {
            error_log("Erreur lors de l'initialisation de la table reminders: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Obtenir la table associée au modèle
     *
     * @return string
     */
    public function getTable()
    {
        return $this->table;
    }
    
    /**
     * Obtenir l'instance de base de données
     *
     * @return \Core\Database
     */
    public function getDb()
    {
        return $this->db;
    }
} 