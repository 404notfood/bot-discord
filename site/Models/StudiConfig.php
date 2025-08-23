<?php
namespace Models;

use Core\Model;

/**
 * Modèle pour la configuration Studi
 */
class StudiConfig extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'studi_config';
    
    /**
     * Obtenir la configuration actuelle
     *
     * @return array|false
     */
    public function getCurrentConfig()
    {
        $sql = "SELECT * FROM {$this->table} ORDER BY id LIMIT 1";
        $stmt = $this->db->query($sql);
        return $stmt->fetch();
    }
    
    /**
     * Mettre à jour la configuration
     *
     * @param array $data Données de configuration
     * @return bool
     */
    public function updateConfig($data)
    {
        $config = $this->getCurrentConfig();
        
        if (!$config) {
            // Si aucune configuration n'existe, en créer une
            return $this->create($data) ? true : false;
        }
        
        return $this->update($config['id'], $data);
    }
    
    /**
     * Vérifier si le module Studi est activé
     *
     * @return bool
     */
    public function isEnabled()
    {
        $config = $this->getCurrentConfig();
        return $config && $config['is_enabled'];
    }
    
    /**
     * Activer ou désactiver le module Studi
     *
     * @param bool $enabled État d'activation
     * @return bool
     */
    public function setEnabled($enabled)
    {
        $config = $this->getCurrentConfig();
        
        if (!$config) {
            // Si aucune configuration n'existe, en créer une
            return $this->create([
                'is_enabled' => (bool) $enabled,
                'max_offenses' => 3
            ]) ? true : false;
        }
        
        return $this->update($config['id'], ['is_enabled' => (bool) $enabled]);
    }
    
    /**
     * Obtenir le nombre maximum d'infractions
     *
     * @return int
     */
    public function getMaxOffenses()
    {
        $config = $this->getCurrentConfig();
        return $config ? (int) $config['max_offenses'] : 3; // Valeur par défaut: 3
    }
    
    /**
     * Définir le nombre maximum d'infractions
     *
     * @param int $maxOffenses Nombre maximum d'infractions
     * @return bool
     */
    public function setMaxOffenses($maxOffenses)
    {
        $config = $this->getCurrentConfig();
        
        if (!$config) {
            // Si aucune configuration n'existe, en créer une
            return $this->create([
                'is_enabled' => false,
                'max_offenses' => (int) $maxOffenses
            ]) ? true : false;
        }
        
        return $this->update($config['id'], ['max_offenses' => (int) $maxOffenses]);
    }
} 