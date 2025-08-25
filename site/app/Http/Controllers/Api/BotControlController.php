<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BotConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Log;

class BotControlController extends Controller
{
    protected $botPath;
    protected $pidFilePath;

    public function __construct()
    {
        $this->botPath = base_path('../src');
        $this->pidFilePath = storage_path('app/bot.pid');
    }

    /**
     * Obtenir le statut du bot
     */
    public function status()
    {
        try {
            $isRunning = $this->isBotRunning();
            $pid = $this->getBotPid();
            $uptime = $this->getBotUptime();
            
            $status = [
                'running' => $isRunning,
                'pid' => $pid,
                'uptime' => $uptime,
                'last_restart' => BotConfig::getValue('bot.last_restart', 'Never'),
                'auto_restart' => BotConfig::getValue('bot.auto_restart', 'false') === 'true',
                'memory_usage' => $this->getMemoryUsage($pid),
                'cpu_usage' => $this->getCpuUsage($pid)
            ];

            return response()->json([
                'success' => true,
                'data' => $status
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting bot status:', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to get bot status',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Démarrer le bot
     */
    public function start(Request $request)
    {
        try {
            if ($this->isBotRunning()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Bot already running',
                    'message' => 'Le bot est déjà en cours d\'exécution'
                ], 409);
            }

            // Vérifier que les fichiers nécessaires existent
            if (!file_exists($this->botPath . '/DiscordBot.js')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Bot files not found',
                    'message' => 'Fichiers du bot introuvables'
                ], 404);
            }

            // Démarrer le bot en arrière-plan
            $command = "cd {$this->botPath} && nohup node DiscordBot.js > " . storage_path('logs/bot.log') . " 2>&1 & echo $!";
            $result = Process::run($command);
            
            if ($result->successful()) {
                $pid = trim($result->output());
                
                // Sauvegarder le PID
                file_put_contents($this->pidFilePath, $pid);
                
                // Mettre à jour la configuration
                BotConfig::setValue('bot.last_restart', now()->toISOString(), 'Bot last restart timestamp');
                BotConfig::setValue('bot.status', 'running', 'Bot current status');
                
                // Attendre un peu pour vérifier que le bot démarre correctement
                sleep(3);
                
                if ($this->isBotRunning()) {
                    Log::info('Bot started successfully', ['pid' => $pid, 'user' => 'dashboard']);
                    
                    return response()->json([
                        'success' => true,
                        'data' => [
                            'pid' => $pid,
                            'started_at' => now()->toISOString()
                        ],
                        'message' => 'Bot démarré avec succès'
                    ]);
                } else {
                    return response()->json([
                        'success' => false,
                        'error' => 'Bot failed to start',
                        'message' => 'Le bot a échoué au démarrage, vérifiez les logs'
                    ], 500);
                }
            } else {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to execute start command',
                    'message' => 'Erreur lors de l\'exécution de la commande de démarrage'
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('Error starting bot:', ['error' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to start bot',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Arrêter le bot
     */
    public function stop(Request $request)
    {
        try {
            if (!$this->isBotRunning()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Bot not running',
                    'message' => 'Le bot n\'est pas en cours d\'exécution'
                ], 409);
            }

            $pid = $this->getBotPid();
            
            if ($pid) {
                // Arrêt gracieux d'abord
                $result = Process::run("kill -TERM {$pid}");
                
                // Attendre que le processus se termine
                sleep(5);
                
                // Si le processus est toujours actif, forcer l'arrêt
                if ($this->isProcessRunning($pid)) {
                    Process::run("kill -KILL {$pid}");
                    sleep(2);
                }
                
                // Nettoyer le fichier PID
                if (file_exists($this->pidFilePath)) {
                    unlink($this->pidFilePath);
                }
                
                // Mettre à jour la configuration
                BotConfig::setValue('bot.status', 'stopped', 'Bot current status');
                BotConfig::setValue('bot.last_stop', now()->toISOString(), 'Bot last stop timestamp');
                
                Log::info('Bot stopped successfully', ['pid' => $pid, 'user' => 'dashboard']);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Bot arrêté avec succès'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => 'Bot PID not found',
                    'message' => 'PID du bot introuvable'
                ], 404);
            }
        } catch (\Exception $e) {
            Log::error('Error stopping bot:', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to stop bot',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Redémarrer le bot
     */
    public function restart(Request $request)
    {
        try {
            // Arrêter le bot s'il est en cours d'exécution
            if ($this->isBotRunning()) {
                $stopResponse = $this->stop($request);
                if (!$stopResponse->getData()->success) {
                    return $stopResponse;
                }
                
                // Attendre un peu avant de redémarrer
                sleep(2);
            }
            
            // Démarrer le bot
            return $this->start($request);
        } catch (\Exception $e) {
            Log::error('Error restarting bot:', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to restart bot',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les logs du bot
     */
    public function logs(Request $request)
    {
        try {
            $lines = $request->get('lines', 50);
            $logFile = storage_path('logs/bot.log');
            
            if (!file_exists($logFile)) {
                return response()->json([
                    'success' => true,
                    'data' => ['logs' => 'Aucun log disponible']
                ]);
            }
            
            $command = "tail -n {$lines} {$logFile}";
            $result = Process::run($command);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'logs' => $result->output(),
                    'file_size' => filesize($logFile),
                    'last_modified' => date('c', filemtime($logFile))
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error getting bot logs:', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to get bot logs',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier si le bot est en cours d'exécution
     */
    private function isBotRunning(): bool
    {
        try {
            $pid = $this->getBotPid();
            return $pid && $this->isProcessRunning($pid);
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Obtenir le PID du bot
     */
    private function getBotPid(): ?string
    {
        try {
            if (file_exists($this->pidFilePath)) {
                $pid = trim(file_get_contents($this->pidFilePath));
                return $pid ?: null;
            }
            
            // Essayer de trouver le processus par son nom
            $result = Process::run("pgrep -f 'node.*DiscordBot.js'");
            if ($result->successful() && !empty(trim($result->output()))) {
                $pid = trim(explode("\n", $result->output())[0]);
                // Sauvegarder le PID trouvé
                file_put_contents($this->pidFilePath, $pid);
                return $pid;
            }
            
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Vérifier si un processus est en cours d'exécution
     */
    private function isProcessRunning($pid): bool
    {
        try {
            $result = Process::run("kill -0 {$pid}");
            return $result->successful();
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Obtenir le temps de fonctionnement du bot
     */
    private function getBotUptime(): string
    {
        try {
            $pid = $this->getBotPid();
            if (!$pid || !$this->isProcessRunning($pid)) {
                return 'Not running';
            }
            
            $result = Process::run("ps -o etime= -p {$pid}");
            if ($result->successful()) {
                return trim($result->output());
            }
            
            return 'Unknown';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Obtenir l'utilisation mémoire du bot
     */
    private function getMemoryUsage($pid): string
    {
        try {
            if (!$pid || !$this->isProcessRunning($pid)) {
                return '0 MB';
            }
            
            $result = Process::run("ps -o rss= -p {$pid}");
            if ($result->successful()) {
                $kb = trim($result->output());
                $mb = round($kb / 1024, 2);
                return "{$mb} MB";
            }
            
            return 'Unknown';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }

    /**
     * Obtenir l'utilisation CPU du bot
     */
    private function getCpuUsage($pid): string
    {
        try {
            if (!$pid || !$this->isProcessRunning($pid)) {
                return '0%';
            }
            
            $result = Process::run("ps -o %cpu= -p {$pid}");
            if ($result->successful()) {
                $cpu = trim($result->output());
                return "{$cpu}%";
            }
            
            return 'Unknown';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }
}