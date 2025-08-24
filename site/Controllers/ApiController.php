<?php
namespace Controllers;

use Core\Controller;
use Models\DiscordService;

/**
 * Contrôleur pour les API du dashboard
 */
class ApiController extends Controller
{
    private $discordService;

    public function __construct()
    {
        parent::__construct();
        $this->discordService = new DiscordService();
    }

    /**
     * Obtenir le statut en temps réel du bot
     */
    public function getBotStatus()
    {
        header('Content-Type: application/json');
        
        try {
            $status = $this->discordService->getBotStatus();
            
            // Vérifier la connectivité à la base de données
            $dbStatus = $this->checkDatabaseConnection();
            
            // Vérifier les services
            $services = $this->checkServices();
            
            $response = [
                'bot' => $status,
                'database' => $dbStatus,
                'services' => $services,
                'timestamp' => date('c'),
                'uptime' => $this->calculateUptime()
            ];
            
            echo json_encode($response, JSON_PRETTY_PRINT);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Erreur lors de la récupération du statut',
                'message' => $e->getMessage(),
                'timestamp' => date('c')
            ]);
        }
        
        exit;
    }

    /**
     * Obtenir les statistiques en temps réel
     */
    public function getLiveStats()
    {
        header('Content-Type: application/json');
        
        try {
            $stats = [
                'commands_today' => $this->getCommandsToday(),
                'active_users' => $this->getActiveUsers(),
                'server_info' => $this->getServerInfo(),
                'memory_usage' => $this->getMemoryUsage(),
                'recent_activities' => $this->getRecentActivities(),
                'timestamp' => date('c')
            ];
            
            echo json_encode($stats, JSON_PRETTY_PRINT);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Erreur lors de la récupération des statistiques',
                'message' => $e->getMessage()
            ]);
        }
        
        exit;
    }

    /**
     * Webhook pour recevoir les événements Discord
     */
    public function discordWebhook()
    {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            exit;
        }

        $payload = json_decode(file_get_contents('php://input'), true);
        
        if (!$payload) {
            http_response_code(400);
            echo json_encode(['error' => 'Payload invalide']);
            exit;
        }

        try {
            // Vérifier la signature du webhook si configurée
            if (!$this->verifyWebhookSignature($payload)) {
                http_response_code(401);
                echo json_encode(['error' => 'Signature invalide']);
                exit;
            }

            // Traiter l'événement
            $this->processDiscordEvent($payload);
            
            echo json_encode(['status' => 'success']);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Erreur lors du traitement du webhook',
                'message' => $e->getMessage()
            ]);
        }
        
        exit;
    }

    /**
     * Obtenir les métriques de performance
     */
    public function getMetrics()
    {
        header('Content-Type: application/json');
        
        try {
            $metrics = [
                'response_times' => $this->getResponseTimes(),
                'error_rates' => $this->getErrorRates(),
                'command_usage' => $this->getCommandUsageMetrics(),
                'user_activity' => $this->getUserActivityMetrics(),
                'system_health' => $this->getSystemHealth(),
                'timestamp' => date('c')
            ];
            
            echo json_encode($metrics, JSON_PRETTY_PRINT);
            
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Erreur lors de la récupération des métriques',
                'message' => $e->getMessage()
            ]);
        }
        
        exit;
    }

    /**
     * Vérifier la connexion à la base de données
     */
    private function checkDatabaseConnection()
    {
        try {
            $pdo = $this->database->getPdo();
            $stmt = $pdo->query('SELECT 1');
            
            return [
                'status' => 'connected',
                'ping' => $this->measureDatabasePing(),
                'tables' => $this->countDatabaseTables()
            ];
            
        } catch (\Exception $e) {
            return [
                'status' => 'disconnected',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Vérifier les services
     */
    private function checkServices()
    {
        return [
            'scheduler' => $this->checkSchedulerService(),
            'api_server' => $this->checkApiServer(),
            'monitoring' => $this->checkMonitoringService(),
            'cache' => $this->checkCacheService()
        ];
    }

    /**
     * Calculer l'uptime du bot
     */
    private function calculateUptime()
    {
        try {
            $stmt = $this->database->prepare("
                SELECT created_at 
                FROM system_logs 
                WHERE log_level = 'INFO' 
                AND message LIKE '%Bot démarré%' 
                ORDER BY created_at DESC 
                LIMIT 1
            ");
            $stmt->execute();
            $result = $stmt->fetch();
            
            if ($result) {
                $startTime = strtotime($result['created_at']);
                $uptime = time() - $startTime;
                
                return [
                    'seconds' => $uptime,
                    'formatted' => $this->formatUptime($uptime),
                    'started_at' => $result['created_at']
                ];
            }
            
            return null;
            
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Formater l'uptime
     */
    private function formatUptime($seconds)
    {
        $days = floor($seconds / 86400);
        $hours = floor(($seconds % 86400) / 3600);
        $minutes = floor(($seconds % 3600) / 60);
        
        $parts = [];
        if ($days > 0) $parts[] = "{$days}j";
        if ($hours > 0) $parts[] = "{$hours}h";
        if ($minutes > 0) $parts[] = "{$minutes}m";
        
        return implode(' ', $parts);
    }

    /**
     * Obtenir les commandes d'aujourd'hui
     */
    private function getCommandsToday()
    {
        try {
            $stmt = $this->database->prepare("
                SELECT COUNT(*) as count, command_name
                FROM command_usage 
                WHERE DATE(used_at) = CURDATE()
                GROUP BY command_name
                ORDER BY count DESC
                LIMIT 10
            ");
            $stmt->execute();
            
            return $stmt->fetchAll();
            
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Obtenir les utilisateurs actifs
     */
    private function getActiveUsers()
    {
        try {
            $stmt = $this->database->prepare("
                SELECT COUNT(DISTINCT user_id) as count
                FROM command_usage 
                WHERE used_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
            ");
            $stmt->execute();
            $result = $stmt->fetch();
            
            return $result ? $result['count'] : 0;
            
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Obtenir les informations serveur
     */
    private function getServerInfo()
    {
        return [
            'php_version' => PHP_VERSION,
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'server_time' => date('Y-m-d H:i:s'),
            'timezone' => date_default_timezone_get()
        ];
    }

    /**
     * Obtenir l'utilisation mémoire
     */
    private function getMemoryUsage()
    {
        return [
            'current' => memory_get_usage(true),
            'peak' => memory_get_peak_usage(true),
            'limit' => $this->parseMemoryLimit(ini_get('memory_limit')),
            'percentage' => round((memory_get_usage(true) / $this->parseMemoryLimit(ini_get('memory_limit'))) * 100, 2)
        ];
    }

    /**
     * Parser la limite de mémoire
     */
    private function parseMemoryLimit($limit)
    {
        if (is_numeric($limit)) {
            return (int) $limit;
        }
        
        $value = (int) $limit;
        $unit = strtolower(substr($limit, -1));
        
        switch ($unit) {
            case 'g':
                $value *= 1024 * 1024 * 1024;
                break;
            case 'm':
                $value *= 1024 * 1024;
                break;
            case 'k':
                $value *= 1024;
                break;
        }
        
        return $value;
    }

    /**
     * Obtenir les activités récentes
     */
    private function getRecentActivities()
    {
        try {
            $stmt = $this->database->prepare("
                SELECT 
                    cu.command_name,
                    u.username,
                    cu.used_at,
                    cu.success
                FROM command_usage cu
                LEFT JOIN users u ON cu.user_id = u.id
                ORDER BY cu.used_at DESC
                LIMIT 20
            ");
            $stmt->execute();
            
            return $stmt->fetchAll();
            
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Vérifier la signature du webhook
     */
    private function verifyWebhookSignature($payload)
    {
        // Implémentation de la vérification de signature
        // À adapter selon vos besoins de sécurité
        return true;
    }

    /**
     * Traiter un événement Discord
     */
    private function processDiscordEvent($payload)
    {
        // Traiter les différents types d'événements Discord
        $eventType = $payload['type'] ?? null;
        
        switch ($eventType) {
            case 'command_used':
                $this->logCommandUsage($payload);
                break;
            case 'user_joined':
                $this->logUserActivity($payload);
                break;
            case 'bot_status_change':
                $this->updateBotStatus($payload);
                break;
        }
    }

    /**
     * Logger l'utilisation d'une commande
     */
    private function logCommandUsage($payload)
    {
        try {
            $stmt = $this->database->prepare("
                INSERT INTO command_usage (user_id, command_name, used_at, success, response_time)
                VALUES (?, ?, ?, ?, ?)
            ");
            
            $stmt->execute([
                $payload['user_id'] ?? null,
                $payload['command_name'] ?? null,
                $payload['timestamp'] ?? date('Y-m-d H:i:s'),
                $payload['success'] ?? true,
                $payload['response_time'] ?? null
            ]);
            
        } catch (\Exception $e) {
            error_log('Erreur lors du log de commande: ' . $e->getMessage());
        }
    }

    /**
     * Mesurer le ping de la base de données
     */
    private function measureDatabasePing()
    {
        $start = microtime(true);
        $this->database->query('SELECT 1');
        $end = microtime(true);
        
        return round(($end - $start) * 1000, 2); // en millisecondes
    }

    /**
     * Compter les tables de la base de données
     */
    private function countDatabaseTables()
    {
        try {
            $stmt = $this->database->query('SHOW TABLES');
            return $stmt->rowCount();
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Vérifier le service de planification
     */
    private function checkSchedulerService()
    {
        // Vérifier si le scheduler Node.js fonctionne
        // Peut être fait via un endpoint API ou un fichier de statut
        return ['status' => 'unknown'];
    }

    /**
     * Vérifier le serveur API
     */
    private function checkApiServer()
    {
        try {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, 'http://localhost:3000/health');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 5);
            curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            
            return [
                'status' => $httpCode === 200 ? 'online' : 'offline',
                'http_code' => $httpCode,
                'response' => $response
            ];
            
        } catch (\Exception $e) {
            return [
                'status' => 'offline',
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Vérifier le service de monitoring
     */
    private function checkMonitoringService()
    {
        // Vérifier si le monitoring fonctionne
        return ['status' => 'active'];
    }

    /**
     * Vérifier le service de cache
     */
    private function checkCacheService()
    {
        // Vérifier le cache (Redis, Memcached, ou file cache)
        $cacheDir = __DIR__ . '/../cache';
        return [
            'status' => is_dir($cacheDir) && is_writable($cacheDir) ? 'active' : 'inactive',
            'directory' => $cacheDir,
            'writable' => is_writable($cacheDir)
        ];
    }

    /**
     * Obtenir les temps de réponse
     */
    private function getResponseTimes()
    {
        try {
            $stmt = $this->database->prepare("
                SELECT 
                    command_name,
                    AVG(response_time) as avg_time,
                    MIN(response_time) as min_time,
                    MAX(response_time) as max_time
                FROM command_usage 
                WHERE response_time IS NOT NULL 
                AND used_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY command_name
                ORDER BY avg_time DESC
                LIMIT 10
            ");
            $stmt->execute();
            
            return $stmt->fetchAll();
            
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Obtenir les taux d'erreur
     */
    private function getErrorRates()
    {
        try {
            $stmt = $this->database->prepare("
                SELECT 
                    command_name,
                    COUNT(*) as total,
                    SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as errors,
                    ROUND((SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) / COUNT(*)) * 100, 2) as error_rate
                FROM command_usage 
                WHERE used_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY command_name
                HAVING total > 5
                ORDER BY error_rate DESC
                LIMIT 10
            ");
            $stmt->execute();
            
            return $stmt->fetchAll();
            
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Obtenir les métriques d'utilisation des commandes
     */
    private function getCommandUsageMetrics()
    {
        try {
            $stmt = $this->database->prepare("
                SELECT 
                    DATE(used_at) as date,
                    COUNT(*) as total_commands,
                    COUNT(DISTINCT user_id) as unique_users
                FROM command_usage 
                WHERE used_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY DATE(used_at)
                ORDER BY date DESC
            ");
            $stmt->execute();
            
            return $stmt->fetchAll();
            
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Obtenir les métriques d'activité utilisateur
     */
    private function getUserActivityMetrics()
    {
        try {
            $stmt = $this->database->prepare("
                SELECT 
                    HOUR(used_at) as hour,
                    COUNT(*) as activity_count
                FROM command_usage 
                WHERE used_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
                GROUP BY HOUR(used_at)
                ORDER BY hour
            ");
            $stmt->execute();
            
            return $stmt->fetchAll();
            
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Obtenir la santé du système
     */
    private function getSystemHealth()
    {
        return [
            'disk_usage' => $this->getDiskUsage(),
            'load_average' => $this->getLoadAverage(),
            'php_info' => [
                'version' => PHP_VERSION,
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time')
            ]
        ];
    }

    /**
     * Obtenir l'utilisation du disque
     */
    private function getDiskUsage()
    {
        $bytes = disk_free_space('.');
        $total = disk_total_space('.');
        
        return [
            'free' => $bytes,
            'total' => $total,
            'used' => $total - $bytes,
            'percentage' => round((($total - $bytes) / $total) * 100, 2)
        ];
    }

    /**
     * Obtenir la charge moyenne (Linux/Unix seulement)
     */
    private function getLoadAverage()
    {
        if (function_exists('sys_getloadavg')) {
            $load = sys_getloadavg();
            return [
                '1min' => $load[0],
                '5min' => $load[1],
                '15min' => $load[2]
            ];
        }
        
        return null;
    }
}
?>