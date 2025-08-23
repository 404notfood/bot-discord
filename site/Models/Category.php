<?php
namespace Models;

use Core\Model;

/**
 * Modèle pour les catégories
 */
class Category extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'doc_categories';
    
    /**
     * Obtenir toutes les catégories avec le nombre de ressources
     *
     * @param bool $countActiveOnly Compter uniquement les ressources actives
     * @return array
     */
    public function getAllWithResourceCount($countActiveOnly = false)
    {
        $sql = "SELECT c.*, COUNT(r.id) as resource_count 
                FROM {$this->table} c
                LEFT JOIN doc_resources r ON c.id = r.category_id";
        
        if ($countActiveOnly) {
            $sql .= " AND r.is_active = TRUE";
        }
        
        $sql .= " GROUP BY c.id ORDER BY c.name";
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Vérifier si une catégorie a des ressources
     *
     * @param int $id ID de la catégorie
     * @return bool
     */
    public function hasResources($id)
    {
        $sql = "SELECT COUNT(*) as count FROM doc_resources WHERE category_id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        $result = $stmt->fetch();
        
        return $result['count'] > 0;
    }
    
    /**
     * Supprimer une catégorie et toutes ses ressources
     *
     * @param int $id ID de la catégorie
     * @return bool
     */
    public function deleteWithResources($id)
    {
        // Commencer une transaction
        $this->db->getConnection()->beginTransaction();
        
        try {
            // Supprimer d'abord les votes sur les ressources de cette catégorie
            $sql = "DELETE v FROM doc_resource_votes v
                    JOIN doc_resources r ON v.resource_id = r.id
                    WHERE r.category_id = :id";
            $this->db->query($sql, ['id' => $id]);
            
            // Supprimer les ressources de la catégorie
            $sql = "DELETE FROM doc_resources WHERE category_id = :id";
            $this->db->query($sql, ['id' => $id]);
            
            // Finalement supprimer la catégorie
            $result = $this->delete($id);
            
            // Valider la transaction
            $this->db->getConnection()->commit();
            
            return $result;
        } catch (\Exception $e) {
            // En cas d'erreur, annuler la transaction
            $this->db->getConnection()->rollBack();
            throw $e;
        }
    }
} 