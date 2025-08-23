<?php

/**
 * Modèle pour la gestion des membres
 */
class MemberModel
{
    /**
     * @var PDO Instance de la connexion à la base de données
     */
    private $db;

    /**
     * Constructeur
     */
    public function __construct()
    {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Récupère tous les membres
     * 
     * @return array Liste des membres
     */
    public function getAllMembers()
    {
        $query = "SELECT * FROM members ORDER BY created_at DESC";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère un membre par son identifiant
     * 
     * @param int $id Identifiant du membre
     * @return array|false Données du membre ou false si inexistant
     */
    public function getMemberById($id)
    {
        $query = "SELECT * FROM members WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère un membre par son nom d'utilisateur
     * 
     * @param string $username Nom d'utilisateur
     * @return array|false Données du membre ou false si inexistant
     */
    public function getMemberByUsername($username)
    {
        $query = "SELECT * FROM members WHERE username = :username";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Récupère un membre par son email
     * 
     * @param string $email Adresse email
     * @return array|false Données du membre ou false si inexistant
     */
    public function getMemberByEmail($email)
    {
        $query = "SELECT * FROM members WHERE email = :email";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    /**
     * Vérifie si un nom d'utilisateur existe déjà
     * 
     * @param string $username Nom d'utilisateur
     * @return bool True si le nom d'utilisateur existe, false sinon
     */
    public function usernameExists($username)
    {
        $query = "SELECT COUNT(*) FROM members WHERE username = :username";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':username', $username, PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Vérifie si une adresse email existe déjà
     * 
     * @param string $email Adresse email
     * @return bool True si l'adresse email existe, false sinon
     */
    public function emailExists($email)
    {
        $query = "SELECT COUNT(*) FROM members WHERE email = :email";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        
        return $stmt->fetchColumn() > 0;
    }

    /**
     * Crée un nouveau membre
     * 
     * @param array $data Données du membre
     * @return int|false Identifiant du membre créé ou false en cas d'échec
     */
    public function createMember($data)
    {
        $query = "INSERT INTO members (username, email, password, role, is_active, created_at, updated_at) 
                  VALUES (:username, :email, :password, :role, :is_active, :created_at, :updated_at)";
        
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':username', $data['username'], PDO::PARAM_STR);
        $stmt->bindParam(':email', $data['email'], PDO::PARAM_STR);
        $stmt->bindParam(':password', $data['password'], PDO::PARAM_STR);
        $stmt->bindParam(':role', $data['role'], PDO::PARAM_STR);
        $stmt->bindParam(':is_active', $data['is_active'], PDO::PARAM_INT);
        $stmt->bindParam(':created_at', $data['created_at'], PDO::PARAM_STR);
        $stmt->bindParam(':updated_at', $data['updated_at'], PDO::PARAM_STR);
        
        if ($stmt->execute()) {
            return $this->db->lastInsertId();
        }
        
        return false;
    }

    /**
     * Met à jour un membre existant
     * 
     * @param int $id Identifiant du membre
     * @param array $data Données à mettre à jour
     * @return bool True si la mise à jour a réussi, false sinon
     */
    public function updateMember($id, $data)
    {
        // Construction de la requête dynamique
        $query = "UPDATE members SET ";
        $params = [];
        
        foreach ($data as $key => $value) {
            $params[] = "{$key} = :{$key}";
        }
        
        $query .= implode(', ', $params);
        $query .= " WHERE id = :id";
        
        // Préparation et exécution de la requête
        $stmt = $this->db->prepare($query);
        
        // Ajout des paramètres
        foreach ($data as $key => $value) {
            $stmt->bindValue(":{$key}", $value);
        }
        
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    /**
     * Supprime un membre
     * 
     * @param int $id Identifiant du membre
     * @return bool True si la suppression a réussi, false sinon
     */
    public function deleteMember($id)
    {
        $query = "DELETE FROM members WHERE id = :id";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':id', $id, PDO::PARAM_INT);
        
        return $stmt->execute();
    }

    /**
     * Compte le nombre d'administrateurs
     * 
     * @return int Nombre d'administrateurs
     */
    public function countAdmins()
    {
        $query = "SELECT COUNT(*) FROM members WHERE role = 'admin'";
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        
        return $stmt->fetchColumn();
    }

    /**
     * Authentifie un utilisateur
     * 
     * @param string $username Nom d'utilisateur ou email
     * @param string $password Mot de passe
     * @return array|false Données de l'utilisateur ou false si l'authentification échoue
     */
    public function authenticate($username, $password)
    {
        // Vérification si le nom d'utilisateur est une adresse email
        $isEmail = filter_var($username, FILTER_VALIDATE_EMAIL);
        
        if ($isEmail) {
            $user = $this->getMemberByEmail($username);
        } else {
            $user = $this->getMemberByUsername($username);
        }
        
        // Vérification que l'utilisateur existe et est actif
        if (!$user || $user['is_active'] != 1) {
            return false;
        }
        
        // Vérification du mot de passe
        if (password_verify($password, $user['password'])) {
            return $user;
        }
        
        return false;
    }
} 