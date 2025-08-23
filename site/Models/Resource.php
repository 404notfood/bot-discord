<?php
namespace Models;

use Core\Model;

/**
 * Modèle pour les ressources
 */
class Resource extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'doc_resources';
    
    /**
     * Obtenir toutes les ressources avec leurs catégories
     *
     * @param bool $activeOnly Ne retourner que les ressources actives
     * @return array
     */
    public function getAllWithCategories($activeOnly = false)
    {
        $sql = "SELECT r.*, c.name as category_name, c.description as category_description 
                FROM {$this->table} r
                LEFT JOIN doc_categories c ON r.category_id = c.id";
        
        if ($activeOnly) {
            $sql .= " WHERE r.is_active = TRUE";
        }
        
        $sql .= " ORDER BY c.name, r.name";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir les ressources d'une catégorie spécifique
     *
     * @param int $categoryId ID de la catégorie
     * @param bool $activeOnly Ne retourner que les ressources actives
     * @return array
     */
    public function getByCategoryId($categoryId, $activeOnly = false)
    {
        $sql = "SELECT r.*, c.name as category_name 
                FROM {$this->table} r
                JOIN doc_categories c ON r.category_id = c.id
                WHERE r.category_id = :category_id";
        
        if ($activeOnly) {
            $sql .= " AND r.is_active = TRUE";
        }
        
        $sql .= " ORDER BY r.name";
        
        $stmt = $this->db->query($sql, ['category_id' => $categoryId]);
        return $stmt->fetchAll();
    }
    
    /**
     * Rechercher des ressources par terme
     *
     * @param string $term Terme de recherche
     * @param bool $activeOnly Ne retourner que les ressources actives
     * @return array
     */
    public function search($term, $activeOnly = false)
    {
        $term = '%' . $term . '%';
        
        $sql = "SELECT r.*, c.name as category_name 
                FROM {$this->table} r
                JOIN doc_categories c ON r.category_id = c.id
                WHERE (r.name LIKE :term OR r.description LIKE :term OR r.tags LIKE :term)";
        
        if ($activeOnly) {
            $sql .= " AND r.is_active = TRUE";
        }
        
        $sql .= " ORDER BY c.name, r.name";
        
        $stmt = $this->db->query($sql, ['term' => $term]);
        return $stmt->fetchAll();
    }
    
    /**
     * Obtenir les statistiques d'utilisation des ressources
     *
     * @param int $limit Nombre de ressources à retourner
     * @return array
     */
    public function getUsageStats($limit = 10)
    {
        $sql = "SELECT r.*, c.name as category_name, r.popularity as usage_count 
                FROM {$this->table} r
                JOIN doc_categories c ON r.category_id = c.id
                ORDER BY popularity DESC
                LIMIT :limit";
        
        $stmt = $this->db->query($sql, ['limit' => $limit]);
        return $stmt->fetchAll();
    }
    
    /**
     * Activer ou désactiver une ressource
     *
     * @param int $id ID de la ressource
     * @param bool $active État d'activation
     * @return bool
     */
    public function setActive($id, $active = true)
    {
        $sql = "UPDATE {$this->table} SET is_active = :active WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id, 'active' => $active]);
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Incrémenter la popularité d'une ressource
     *
     * @param int $id ID de la ressource
     * @return bool
     */
    public function incrementPopularity($id)
    {
        $sql = "UPDATE {$this->table} SET popularity = popularity + 1 WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        return $stmt->rowCount() > 0;
    }
} 