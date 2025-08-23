<?php
namespace Core;

use PDO;
use PDOException;

/**
 * Classe pour gérer la connexion à la base de données
 */
class Database
{
    /**
     * Instance PDO
     *
     * @var PDO
     */
    private $pdo;
    
    /**
     * Instance unique de la classe (pattern Singleton)
     *
     * @var Database
     */
    private static $instance = null;
    
    /**
     * Configuration de la base de données
     *
     * @var array
     */
    private $config;
    
    /**
     * Constructeur privé (pattern Singleton)
     */
    private function __construct()
    {
        $this->config = require dirname(__DIR__) . '/Config/config.php';
        $this->connect();
    }
    
    /**
     * Obtenir l'instance unique de la base de données
     *
     * @return Database
     */
    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        
        return self::$instance;
    }
    
    /**
     * Établir la connexion à la base de données
     */
    private function connect()
    {
        $dsn = "mysql:host={$this->config['database']['host']};dbname={$this->config['database']['dbname']};charset={$this->config['database']['charset']}";
        
        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        
        try {
            $this->pdo = new PDO(
                $dsn,
                $this->config['database']['username'],
                $this->config['database']['password'],
                $options
            );
        } catch (PDOException $e) {
            // En mode développement, afficher l'erreur
            if ($this->config['app']['debug']) {
                die("Erreur de connexion à la base de données : " . $e->getMessage());
            } else {
                // En production, journaliser l'erreur et afficher un message générique
                error_log("Erreur de connexion à la base de données : " . $e->getMessage());
                die("Une erreur est survenue lors de la connexion à la base de données.");
            }
        }
    }
    
    /**
     * Obtenir l'objet PDO
     *
     * @return PDO
     */
    public function getConnection()
    {
        return $this->pdo;
    }
    
    /**
     * Exécuter une requête SQL avec des paramètres
     *
     * @param string $sql Requête SQL
     * @param array $params Paramètres de la requête
     * @return \PDOStatement
     */
    public function query($sql, $params = [])
    {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
            return $stmt;
        } catch (PDOException $e) {
            if ($this->config['app']['debug']) {
                die("Erreur SQL : " . $e->getMessage() . "<br>Requête : " . $sql);
            } else {
                error_log("Erreur SQL : " . $e->getMessage() . " - Requête : " . $sql);
                die("Une erreur est survenue lors de l'exécution de la requête.");
            }
        }
    }
    
    /**
     * Obtenir le dernier ID inséré
     *
     * @return string
     */
    public function lastInsertId()
    {
        return $this->pdo->lastInsertId();
    }
    
    /**
     * Débuter une transaction
     *
     * @return bool
     */
    public function beginTransaction()
    {
        return $this->pdo->beginTransaction();
    }
    
    /**
     * Valider une transaction
     *
     * @return bool
     */
    public function commit()
    {
        return $this->pdo->commit();
    }
    
    /**
     * Annuler une transaction
     *
     * @return bool
     */
    public function rollBack()
    {
        return $this->pdo->rollBack();
    }
} 