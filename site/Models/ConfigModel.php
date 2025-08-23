<?php
namespace Models;

use Core\Model;
use Exception;

/**
 * Modèle pour la gestion des configurations
 */
class ConfigModel extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'config';
    
    /**
     * Obtenir une valeur de configuration par sa clé
     *
     * @param string $key Clé de configuration
     * @param mixed $default Valeur par défaut
     * @return mixed Valeur de configuration
     */
    public function get($key, $default = null)
    {
        $sql = "SELECT value FROM {$this->table} WHERE `key` = :key LIMIT 1";
        $stmt = $this->db->query($sql, ['key' => $key]);
        $result = $stmt->fetch();
        
        return $result ? $result['value'] : $default;
    }
    
    /**
     * Définir une valeur de configuration
     *
     * @param string $key Clé de configuration
     * @param mixed $value Valeur à définir
     * @return bool Succès de l'opération
     */
    public function set($key, $value)
    {
        // Vérifier si la clé existe déjà
        $exists = $this->get($key) !== null;
        
        if ($exists) {
            $sql = "UPDATE {$this->table} SET value = :value WHERE `key` = :key";
        } else {
            $sql = "INSERT INTO {$this->table} (`key`, value) VALUES (:key, :value)";
        }
        
        $stmt = $this->db->query($sql, [
            'key' => $key,
            'value' => $value
        ]);
        
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Obtenir le token du bot Discord
     *
     * @return string|null Token du bot Discord
     */
    public function getDiscordBotToken()
    {
        return $this->get('discord_bot_token');
    }
    
    /**
     * Obtenir l'ID du serveur Discord principal
     *
     * @return string|null ID du serveur Discord
     */
    public function getDiscordGuildId()
    {
        return $this->get('discord_guild_id');
    }
    
    /**
     * Obtenir l'ID du rôle everyone du serveur Discord principal
     *
     * @return string|null ID du rôle @everyone
     */
    public function getDiscordEveryoneRoleId()
    {
        return $this->get('discord_everyone_role_id');
    }
    
    /**
     * Obtenir toutes les configurations liées à Discord
     *
     * @return array Configurations Discord
     */
    public function getDiscordConfig()
    {
        return [
            'bot_token' => $this->getDiscordBotToken(),
            'guild_id' => $this->getDiscordGuildId(),
            'everyone_role_id' => $this->getDiscordEveryoneRoleId()
        ];
    }
    
    // Vérifier et initialiser les configurations par défaut
    public function initializeDefaultConfig()
    {
        try {
            // Vérifier si la table existe
            $sql = "SHOW TABLES LIKE 'config'";
            $stmt = $this->db->query($sql);
            $tableExists = ($stmt->rowCount() > 0);
            
            if (!$tableExists) {
                // Créer la table config
                $createTableSql = "
                CREATE TABLE IF NOT EXISTS `config` (
                  `id` int(11) NOT NULL AUTO_INCREMENT,
                  `key` varchar(100) NOT NULL,
                  `value` text DEFAULT NULL,
                  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
                  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
                  PRIMARY KEY (`id`),
                  UNIQUE KEY `unique_key` (`key`)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
                ";
                $this->db->query($createTableSql);
                
                // Insérer les configurations par défaut
                $defaultConfigs = [
                    'discord_bot_token' => '',
                    'discord_guild_id' => '',
                    'discord_everyone_role_id' => '',
                    'default_reminder_channel' => ''
                ];
                
                foreach ($defaultConfigs as $key => $value) {
                    $this->set($key, $value);
                }
                
                return true;
            }
            
            return false;
        } catch (Exception $e) {
            error_log("Erreur lors de l'initialisation des configurations par défaut: " . $e->getMessage());
            return false;
        }
    }
} 