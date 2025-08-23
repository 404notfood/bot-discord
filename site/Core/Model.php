<?php
namespace Core;

/**
 * Classe de base pour tous les modèles
 */
abstract class Model
{
    /**
     * Nom de la table dans la base de données
     *
     * @var string
     */
    protected $table;
    
    /**
     * Clé primaire de la table
     *
     * @var string
     */
    protected $primaryKey = 'id';
    
    /**
     * Instance de base de données
     *
     * @var Database
     */
    protected $db;
    
    /**
     * Constructeur
     */
    public function __construct()
    {
        $this->db = Database::getInstance();
        $this->init();
    }
    
    /**
     * Méthode appelée après le constructeur, à surcharger dans les classes enfants
     */
    protected function init()
    {
    }
    
    /**
     * Trouver toutes les entrées dans la table
     *
     * @param string $orderBy Champ pour l'ordre
     * @param string $direction Direction de l'ordre (ASC ou DESC)
     * @return array
     */
    public function getAll($orderBy = null, $direction = 'ASC')
    {
        $sql = "SELECT * FROM {$this->table}";
        
        if ($orderBy) {
            $sql .= " ORDER BY {$orderBy} {$direction}";
        }
        
        $stmt = $this->db->query($sql);
        return $stmt->fetchAll();
    }
    
    /**
     * Trouver une entrée par son ID
     *
     * @param int $id ID de l'entrée
     * @return array|false
     */
    public function findById($id)
    {
        $sql = "SELECT * FROM {$this->table} WHERE {$this->primaryKey} = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        return $stmt->fetch();
    }
    
    /**
     * Trouver une entrée par des conditions
     *
     * @param array $conditions Conditions de recherche (associative array)
     * @return array|false
     */
    public function findBy(array $conditions)
    {
        $sql = "SELECT * FROM {$this->table} WHERE ";
        $params = [];
        
        $i = 0;
        foreach ($conditions as $field => $value) {
            if ($i > 0) {
                $sql .= " AND ";
            }
            $sql .= "{$field} = :{$field}";
            $params[$field] = $value;
            $i++;
        }
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetch();
    }
    
    /**
     * Trouver plusieurs entrées par des conditions
     *
     * @param array $conditions Conditions de recherche (associative array)
     * @param string $orderBy Champ pour l'ordre
     * @param string $direction Direction de l'ordre (ASC ou DESC)
     * @return array
     */
    public function findAllBy(array $conditions, $orderBy = null, $direction = 'ASC')
    {
        $sql = "SELECT * FROM {$this->table}";
        $params = [];
        
        if (!empty($conditions)) {
            $sql .= " WHERE ";
            $i = 0;
            foreach ($conditions as $field => $value) {
                if ($i > 0) {
                    $sql .= " AND ";
                }
                $sql .= "{$field} = :{$field}";
                $params[$field] = $value;
                $i++;
            }
        }
        
        if ($orderBy) {
            $sql .= " ORDER BY {$orderBy} {$direction}";
        }
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
    
    /**
     * Créer une nouvelle entrée
     *
     * @param array $data Données à insérer
     * @return int|false ID de la nouvelle entrée ou false si erreur
     */
    public function create(array $data)
    {
        $fields = array_keys($data);
        $placeholders = array_map(function($field) {
            return ":{$field}";
        }, $fields);
        
        $sql = "INSERT INTO {$this->table} (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
        
        $stmt = $this->db->query($sql, $data);
        
        if ($stmt) {
            return $this->db->lastInsertId();
        }
        
        return false;
    }
    
    /**
     * Mettre à jour une entrée
     *
     * @param int $id ID de l'entrée
     * @param array $data Données à mettre à jour
     * @return bool
     */
    public function update($id, array $data)
    {
        $sets = [];
        foreach ($data as $field => $value) {
            $sets[] = "{$field} = :{$field}";
        }
        
        $sql = "UPDATE {$this->table} SET " . implode(', ', $sets) . " WHERE {$this->primaryKey} = :id";
        
        $data['id'] = $id;
        
        $stmt = $this->db->query($sql, $data);
        
        return $stmt ? true : false;
    }
    
    /**
     * Supprimer une entrée
     *
     * @param int $id ID de l'entrée
     * @return bool
     */
    public function delete($id)
    {
        $sql = "DELETE FROM {$this->table} WHERE {$this->primaryKey} = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        
        return $stmt ? true : false;
    }
    
    /**
     * Compter le nombre d'entrées
     *
     * @param array $conditions Conditions de recherche (optionnel)
     * @return int
     */
    public function count(array $conditions = [])
    {
        $sql = "SELECT COUNT(*) as count FROM {$this->table}";
        $params = [];
        
        if (!empty($conditions)) {
            $sql .= " WHERE ";
            $i = 0;
            foreach ($conditions as $field => $value) {
                if ($i > 0) {
                    $sql .= " AND ";
                }
                $sql .= "{$field} = :{$field}";
                $params[$field] = $value;
                $i++;
            }
        }
        
        $stmt = $this->db->query($sql, $params);
        $result = $stmt->fetch();
        
        return (int) $result['count'];
    }
    
    /**
     * Exécuter une requête SQL personnalisée
     *
     * @param string $sql Requête SQL
     * @param array $params Paramètres
     * @return \PDOStatement
     */
    public function query($sql, array $params = [])
    {
        return $this->db->query($sql, $params);
    }
    
    /**
     * Trouver un nombre limité d'entrées
     *
     * @param int $limit Nombre d'entrées à retourner
     * @param int $offset Décalage pour la pagination
     * @param string $orderBy Champ pour l'ordre
     * @param string $direction Direction de l'ordre (ASC ou DESC)
     * @return array
     */
    public function findAll($limit = null, $offset = 0, $orderBy = null, $direction = 'ASC')
    {
        $sql = "SELECT * FROM {$this->table}";
        
        $params = [];
        
        if ($orderBy) {
            $sql .= " ORDER BY {$orderBy} {$direction}";
        }
        
        if ($limit !== null) {
            $sql .= " LIMIT :limit";
            $params['limit'] = $limit;
            
            if ($offset > 0) {
                $sql .= " OFFSET :offset";
                $params['offset'] = $offset;
            }
        }
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
} 