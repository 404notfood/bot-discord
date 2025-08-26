<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BotConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class BotControlController extends Controller
{
    protected $botPath;
    protected $pidFilePath;

    public function __construct()
    {
        // Utiliser un chemin relatif qui fonctionne en développement et production
        $this->botPath = base_path('../src');
        $this->pidFilePath = storage_path('app/bot.pid');
        
        // Si nous sommes sur le serveur de production, ajuster les chemins
        if (str_contains(base_path(), '/home/discord/web/bot.rtfm2win.ovh/public_html/site')) {
            $this->botPath = '/home/discord/web/bot.rtfm2win.ovh/public_html/src';
        }
    }

    /**
     * Obtenir le statut du bot
     */
    public function status()
    {
        try {
            // Vérifier d'abord si les fonctions d'exécution sont disponibles
            if (!$this->canExecuteCommands()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'running' => false,
                        'pid' => null,
                        'uptime' => 'Command execution disabled',
                        'last_restart' => BotConfig::getValue('bot.last_restart', 'Never'),
                        'auto_restart' => false,
                        'memory_usage' => '0 MB',
                        'cpu_usage' => '0%',
                        'server_limitation' => true
                    ]
                ]);
            }

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
                'cpu_usage' => $this->getCpuUsage($pid),
                'server_limitation' => false
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
            // Debug: Log les informations système
            Log::info('Bot start attempt', [
                'botPath' => $this->botPath,
                'basePath' => base_path(),
                'canExecute' => $this->canExecuteCommands(),
                'fileExists' => file_exists($this->botPath . '/DiscordBot.js')
            ]);
            
            // Vérifier si les fonctions d'exécution sont disponibles
            if (!$this->canExecuteCommands()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Server limitation',
                    'message' => 'Les fonctions d\'exécution de commandes sont désactivées sur ce serveur. Contactez votre hébergeur.'
                ], 503);
            }

            if ($this->isBotRunning()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Bot already running',
                    'message' => 'Le bot est déjà en cours d\'exécution'
                ], 409);
            }

            // Vérifier que les fichiers nécessaires existent
            if (!file_exists($this->botPath . '/index.js')) {
                return response()->json([
                    'success' => false,
                    'error' => 'Bot files not found',
                    'message' => 'Fichiers du bot introuvables'
                ], 404);
            }

            // Utiliser index.js comme le fait start.js
            $testCommand = "cd {$this->botPath} && timeout 5 node index.js";
            Log::info('Testing bot startup first', ['command' => $testCommand]);
            
            $testResult = $this->executeCommand($testCommand);
            Log::info('Bot test result', [
                'successful' => $testResult['successful'],
                'output' => $testResult['output'],
                'return_code' => $testResult['return_code']
            ]);
            
            // Si le test réussit, lancer en arrière-plan avec index.js
            $command = "cd {$this->botPath} && nohup node index.js > " . storage_path('logs/bot.log') . " 2>&1 & echo $!";
            
            Log::info('Executing bot start command', ['command' => $command]);
            
            $result = $this->executeCommand($command);
            
            Log::info('Command result', [
                'successful' => $result['successful'],
                'output' => $result['output'],
                'return_code' => $result['return_code']
            ]);
            
            if ($result['successful'] && !empty($result['output'])) {
                $pid = trim($result['output']);
                
                // Sauvegarder le PID
                file_put_contents($this->pidFilePath, $pid);
                
                Log::info('PID saved', ['pid' => $pid, 'pidFile' => $this->pidFilePath]);
                
                // Mettre à jour la configuration
                BotConfig::setValue('bot.last_restart', now()->toISOString(), 'Bot last restart timestamp');
                BotConfig::setValue('bot.status', 'running', 'Bot current status');
                
                Log::info('Bot config updated');
                
                // Le bot se lance avec succès - ne vérifions pas immédiatement s'il tourne encore
                // Un bot Discord peut se terminer proprement s'il n'y a pas de token valide ou d'autres problèmes
                Log::info('Bot started successfully', ['pid' => $pid, 'user' => 'dashboard']);
                
                return response()->json([
                    'success' => true,
                    'data' => [
                        'pid' => $pid,
                        'started_at' => now()->toISOString()
                    ],
                    'message' => 'Bot démarré avec succès. Vérifiez le statut pour voir s\'il fonctionne correctement.'
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'error' => 'Failed to execute start command',
                    'message' => 'Erreur lors de l\'exécution de la commande de démarrage: ' . ($result['output'] ?? 'Unknown error')
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
            // Vérifier si les fonctions d'exécution sont disponibles
            if (!$this->canExecuteCommands()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Server limitation',
                    'message' => 'Les fonctions d\'exécution de commandes sont désactivées sur ce serveur. Contactez votre hébergeur.'
                ], 503);
            }

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
                $result = $this->executeCommand("kill -TERM {$pid}");
                
                // Attendre que le processus se termine
                sleep(5);
                
                // Si le processus est toujours actif, forcer l'arrêt
                if ($this->isProcessRunning($pid)) {
                    $this->executeCommand("kill -KILL {$pid}");
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
            // Vérifier si les fonctions d'exécution sont disponibles
            if (!$this->canExecuteCommands()) {
                return response()->json([
                    'success' => false,
                    'error' => 'Server limitation',
                    'message' => 'Les fonctions d\'exécution de commandes sont désactivées sur ce serveur. Contactez votre hébergeur.'
                ], 503);
            }

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
            $result = $this->executeCommand($command);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'logs' => $result['output'],
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
     * Vérifier si les fonctions d'exécution de commandes sont disponibles
     */
    private function canExecuteCommands(): bool
    {
        return function_exists('proc_open') || function_exists('exec') || function_exists('shell_exec') || function_exists('system');
    }

    /**
     * Exécuter des commandes en utilisant proc_open (disponible sur ce serveur)
     */
    private function executeCommand($command): array
    {
        // Essayer proc_open en premier (disponible sur ce serveur)
        if (function_exists('proc_open')) {
            $descriptorspec = [
                0 => ['pipe', 'r'], // stdin
                1 => ['pipe', 'w'], // stdout
                2 => ['pipe', 'w']  // stderr
            ];
            
            $process = proc_open($command, $descriptorspec, $pipes);
            
            if (is_resource($process)) {
                // Fermer stdin
                fclose($pipes[0]);
                
                // Lire stdout et stderr
                $output = stream_get_contents($pipes[1]);
                $error = stream_get_contents($pipes[2]);
                fclose($pipes[1]);
                fclose($pipes[2]);
                
                // Récupérer le code de sortie
                $returnCode = proc_close($process);
                
                return [
                    'successful' => $returnCode === 0,
                    'output' => trim($output ?: $error),
                    'return_code' => $returnCode
                ];
            }
        }
        
        // Fallback vers les autres fonctions si proc_open échoue
        if (function_exists('exec')) {
            $output = [];
            $returnVar = 0;
            exec($command . ' 2>&1', $output, $returnVar);
            
            return [
                'successful' => $returnVar === 0,
                'output' => implode("\n", $output),
                'return_code' => $returnVar
            ];
        }
        
        if (function_exists('shell_exec')) {
            $output = shell_exec($command . ' 2>&1');
            return [
                'successful' => !empty($output) && strpos($output, 'command not found') === false,
                'output' => $output ?: '',
                'return_code' => empty($output) ? 1 : 0
            ];
        }
        
        // Si aucune fonction n'est disponible
        return [
            'successful' => false,
            'output' => 'No command execution functions available',
            'return_code' => 1
        ];
    }

    /**
     * Vérifier si le bot est en cours d'exécution
     */
    private function isBotRunning(): bool
    {
        try {
            $pid = $this->getBotPid();
            Log::info('Checking bot running status', ['pid' => $pid]);
            
            if (!$pid) {
                Log::info('No PID found');
                return false;
            }
            
            $isRunning = $this->isProcessRunning($pid);
            Log::info('Process running check result', ['pid' => $pid, 'running' => $isRunning]);
            
            return $isRunning;
        } catch (\Exception $e) {
            Log::error('Error checking bot running status', ['error' => $e->getMessage()]);
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
            $result = $this->executeCommand("pgrep -f 'node.*index.js'");
            if ($result['successful'] && !empty(trim($result['output']))) {
                $pid = trim(explode("\n", $result['output'])[0]);
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
            $result = $this->executeCommand("kill -0 {$pid}");
            Log::info('Process check command result', [
                'pid' => $pid,
                'successful' => $result['successful'],
                'output' => $result['output'],
                'return_code' => $result['return_code']
            ]);
            return $result['successful'];
        } catch (\Exception $e) {
            Log::error('Error checking process', ['pid' => $pid, 'error' => $e->getMessage()]);
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
            
            $result = $this->executeCommand("ps -o etime= -p {$pid}");
            if ($result['successful']) {
                return trim($result['output']);
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
            
            $result = $this->executeCommand("ps -o rss= -p {$pid}");
            if ($result['successful']) {
                $kb = trim($result['output']);
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
            
            $result = $this->executeCommand("ps -o %cpu= -p {$pid}");
            if ($result['successful']) {
                $cpu = trim($result['output']);
                return "{$cpu}%";
            }
            
            return 'Unknown';
        } catch (\Exception $e) {
            return 'Unknown';
        }
    }
}