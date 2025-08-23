<?php
namespace Models;

use Core\Model;

/**
 * Modèle pour les membres du dashboard
 */
class DashboardMember extends Model
{
    /**
     * Nom de la table
     *
     * @var string
     */
    protected $table = 'dashboard_members';
    
    /**
     * Rôles disponibles
     */
    const ROLE_ADMIN = 'admin';
    const ROLE_EDITOR = 'editor';
    const ROLE_VIEWER = 'viewer';
    
    /**
     * Vérifier les identifiants d'un membre
     *
     * @param string $username Nom d'utilisateur
     * @param string $password Mot de passe
     * @return array|false Les données du membre ou false si non trouvé
     */
    public function authenticate($username, $password)
    {
        $sql = "SELECT * FROM {$this->table} WHERE username = :username AND is_active = TRUE";
        $stmt = $this->db->query($sql, ['username' => $username]);
        $member = $stmt->fetch();
        
        if ($member && password_verify($password, $member['password'])) {
            // Mettre à jour la date de dernière connexion
            $this->updateLastLogin($member['id']);
            return $member;
        }
        
        return false;
    }
    
    /**
     * Mettre à jour la date de dernière connexion
     *
     * @param int $id ID du membre
     * @return bool
     */
    public function updateLastLogin($id)
    {
        $sql = "UPDATE {$this->table} SET last_login = NOW() WHERE id = :id";
        $stmt = $this->db->query($sql, ['id' => $id]);
        return $stmt->rowCount() > 0;
    }
    
    /**
     * Créer un nouveau membre
     *
     * @param array $data Données du membre
     * @return int|false ID du membre créé ou false
     */
    public function create($data)
    {
        // Hacher le mot de passe
        if (isset($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        return parent::create($data);
    }
    
    /**
     * Mettre à jour un membre
     *
     * @param int $id ID du membre
     * @param array $data Données à mettre à jour
     * @return bool
     */
    public function update($id, $data)
    {
        // Hacher le mot de passe si présent
        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        } else {
            // Ne pas mettre à jour le mot de passe si vide
            unset($data['password']);
        }
        
        return parent::update($id, $data);
    }
    
    /**
     * Journaliser une activité
     *
     * @param int $memberId ID du membre
     * @param string $action Action effectuée
     * @param string $details Détails de l'action
     * @return int|false ID de l'entrée du journal
     */
    public function logActivity($memberId, $action, $details = null)
    {
        $sql = "INSERT INTO dashboard_activity_logs (member_id, action, details, ip_address, user_agent, created_at)
                VALUES (:member_id, :action, :details, :ip_address, :user_agent, NOW())";
        
        $params = [
            'member_id' => $memberId,
            'action' => $action,
            'details' => $details,
            'ip_address' => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_agent' => $_SERVER['HTTP_USER_AGENT'] ?? null
        ];
        
        $stmt = $this->db->query($sql, $params);
        
        if ($stmt->rowCount() > 0) {
            return $this->db->lastInsertId();
        }
        
        return false;
    }
    
    /**
     * Vérifier si un membre a le rôle spécifié
     *
     * @param int $id ID du membre
     * @param string $role Rôle à vérifier
     * @return bool
     */
    public function hasRole($id, $role)
    {
        $member = $this->findById($id);
        
        if (!$member) {
            return false;
        }
        
        // Admin a tous les droits
        if ($member['role'] === self::ROLE_ADMIN) {
            return true;
        }
        
        // Editor peut modifier mais pas gérer les utilisateurs
        if ($member['role'] === self::ROLE_EDITOR && $role === self::ROLE_VIEWER) {
            return true;
        }
        
        return $member['role'] === $role;
    }
    
    /**
     * Réinitialiser le mot de passe d'un administrateur
     *
     * @param int $id ID du membre
     * @param string $password Nouveau mot de passe
     * @return bool
     */
    public function resetAdminPassword($id, $password)
    {
        // Vérifier que le membre est un administrateur
        $member = $this->findById($id);
        if (!$member || $member['role'] !== self::ROLE_ADMIN) {
            return false;
        }
        
        // Hacher le mot de passe
        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
        
        // Mettre à jour le mot de passe
        return $this->update($id, [
            'password' => $hashedPassword,
            'updated_at' => date('Y-m-d H:i:s')
        ]);
    }
    
    /**
     * Obtenir les dernières activités
     *
     * @param int $limit Nombre d'activités à récupérer
     * @param int $memberId ID du membre (optionnel)
     * @return array
     */
    public function getRecentActivities($limit = 10, $memberId = null)
    {
        $sql = "SELECT l.*, m.username 
                FROM dashboard_activity_logs l
                JOIN dashboard_members m ON l.member_id = m.id";
        
        $params = [];
        
        if ($memberId) {
            $sql .= " WHERE l.member_id = :member_id";
            $params['member_id'] = $memberId;
        }
        
        $sql .= " ORDER BY l.created_at DESC LIMIT :limit";
        $params['limit'] = $limit;
        
        $stmt = $this->db->query($sql, $params);
        return $stmt->fetchAll();
    }
} 