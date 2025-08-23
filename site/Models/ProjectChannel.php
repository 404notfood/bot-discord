<?php
namespace Models;

use Core\Model;

/**
 * Modèle pour les canaux de projet
 */
class ProjectChannel extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'project_channels';
    
    /**
     * Types de canaux
     */
    const TYPE_GENERAL = 'general';
    const TYPE_TASKS = 'tasks';
    const TYPE_RESOURCES = 'resources';
    const TYPE_ANNOUNCEMENTS = 'announcements';
    
    /**
     * Obtenir tous les canaux avec des informations sur le projet
     *
     * @param int $projectId ID du projet (optionnel)
     * @return array
     */
    public function getAllWithProjectInfo($projectId = null)
    {
        $sql = "SELECT pc.*, p.name as project_name
                FROM {$this->table} pc
                JOIN projects p ON pc.project_id = p.id";
        
        $params = [];
        if ($projectId) {
            $sql .= " WHERE pc.project_id = :project_id";
            $params['project_id'] = $projectId;
        }
        
        $sql .= " ORDER BY p.name, pc.channel_type";
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir un canal de projet par son ID Discord
     *
     * @param string $channelId ID Discord du canal
     * @return array|false
     */
    public function findByChannelId($channelId)
    {
        return $this->findBy(['channel_id' => $channelId]);
    }
    
    /**
     * Vérifier si un canal est associé à un projet
     *
     * @param string $channelId ID Discord du canal
     * @return bool
     */
    public function isProjectChannel($channelId)
    {
        $sql = "SELECT COUNT(*) as count 
                FROM {$this->table} 
                WHERE channel_id = :channel_id";
        
        $stmt = $this->db->query($sql, ['channel_id' => $channelId]);
        $result = $stmt->fetch();
        
        return $result['count'] > 0;
    }
    
    /**
     * Obtenir le type de canal de projet
     *
     * @param string $channelId ID Discord du canal
     * @return string|null
     */
    public function getChannelType($channelId)
    {
        $sql = "SELECT channel_type 
                FROM {$this->table} 
                WHERE channel_id = :channel_id";
        
        $stmt = $this->db->query($sql, ['channel_id' => $channelId]);
        $result = $stmt->fetch();
        
        return $result ? $result['channel_type'] : null;
    }
    
    /**
     * Obtenir l'ID du projet associé à un canal
     *
     * @param string $channelId ID Discord du canal
     * @return int|null
     */
    public function getProjectId($channelId)
    {
        $sql = "SELECT project_id 
                FROM {$this->table} 
                WHERE channel_id = :channel_id";
        
        $stmt = $this->db->query($sql, ['channel_id' => $channelId]);
        $result = $stmt->fetch();
        
        return $result ? $result['project_id'] : null;
    }
    
    /**
     * Obtenir les canaux d'un type spécifique pour un projet
     *
     * @param int $projectId ID du projet
     * @param string $type Type de canal
     * @return array
     */
    public function getProjectChannelsByType($projectId, $type)
    {
        return $this->findAllBy([
            'project_id' => $projectId,
            'channel_type' => $type
        ]);
    }
    
    /**
     * Ajouter ou mettre à jour un canal de projet
     *
     * @param int $projectId ID du projet
     * @param string $channelId ID Discord du canal
     * @param string $channelType Type de canal
     * @return int|false ID du canal ou false
     */
    public function addOrUpdateChannel($projectId, $channelId, $channelType)
    {
        // Vérifier si le canal existe déjà
        $existingChannel = $this->findByChannelId($channelId);
        
        if ($existingChannel) {
            // Mettre à jour le type de canal
            $this->update($existingChannel['id'], [
                'channel_type' => $channelType
            ]);
            return $existingChannel['id'];
        } else {
            // Créer un nouveau canal
            return $this->create([
                'project_id' => $projectId,
                'channel_id' => $channelId,
                'channel_type' => $channelType
            ]);
        }
    }
    
    /**
     * Supprimer tous les canaux d'un projet
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
            error_log('Erreur lors de la suppression des canaux: ' . $e->getMessage());
            return false;
        }
    }
} 