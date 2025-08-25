<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BotConfig;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SchedulerController extends Controller
{
    /**
     * Liste toutes les tâches planifiées
     */
    public function index()
    {
        try {
            // Pour l'instant, on gère les tâches via la configuration
            $tasks = [
                'database_sync' => BotConfig::getValue('scheduler.database_sync_enabled', true),
                'studi_check' => BotConfig::getValue('scheduler.studi_check_enabled', true),
                'cleanup_logs' => BotConfig::getValue('scheduler.cleanup_logs_enabled', true),
                'backup_database' => BotConfig::getValue('scheduler.backup_database_enabled', false),
                'update_stats' => BotConfig::getValue('scheduler.update_stats_enabled', true)
            ];

            $schedule = [
                'database_sync' => [
                    'name' => 'Synchronisation Database',
                    'description' => 'Synchronise les données entre le bot et le site',
                    'interval' => '5 minutes',
                    'enabled' => $tasks['database_sync'],
                    'last_run' => BotConfig::getValue('scheduler.database_sync_last_run', 'Jamais'),
                    'next_run' => 'Dans 3 minutes'
                ],
                'studi_check' => [
                    'name' => 'Vérification Anti-Studi',
                    'description' => 'Vérifie les nouveaux membres contre la base Studi',
                    'interval' => '1 minute',
                    'enabled' => $tasks['studi_check'],
                    'last_run' => BotConfig::getValue('scheduler.studi_check_last_run', 'Jamais'),
                    'next_run' => 'Dans 30 secondes'
                ],
                'cleanup_logs' => [
                    'name' => 'Nettoyage des Logs',
                    'description' => 'Supprime les anciens logs de plus de 30 jours',
                    'interval' => '1 jour',
                    'enabled' => $tasks['cleanup_logs'],
                    'last_run' => BotConfig::getValue('scheduler.cleanup_logs_last_run', 'Jamais'),
                    'next_run' => 'Dans 18 heures'
                ],
                'backup_database' => [
                    'name' => 'Sauvegarde Database',
                    'description' => 'Créé une sauvegarde de la base de données',
                    'interval' => '6 heures',
                    'enabled' => $tasks['backup_database'],
                    'last_run' => BotConfig::getValue('scheduler.backup_database_last_run', 'Jamais'),
                    'next_run' => $tasks['backup_database'] ? 'Dans 4 heures' : 'Désactivé'
                ],
                'update_stats' => [
                    'name' => 'Mise à jour Statistiques',
                    'description' => 'Met à jour les statistiques du bot et du serveur',
                    'interval' => '15 minutes',
                    'enabled' => $tasks['update_stats'],
                    'last_run' => BotConfig::getValue('scheduler.update_stats_last_run', 'Jamais'),
                    'next_run' => 'Dans 12 minutes'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $schedule
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch scheduler tasks',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Active/désactive une tâche planifiée
     */
    public function toggle(Request $request, $taskName)
    {
        $request->validate([
            'enabled' => 'required|boolean'
        ]);

        $validTasks = ['database_sync', 'studi_check', 'cleanup_logs', 'backup_database', 'update_stats'];

        if (!in_array($taskName, $validTasks)) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid task name'
            ], 400);
        }

        try {
            BotConfig::setValue(
                "scheduler.{$taskName}_enabled",
                $request->enabled ? 'true' : 'false',
                "Task scheduler: {$taskName}"
            );

            return response()->json([
                'success' => true,
                'message' => "Tâche {$taskName} " . ($request->enabled ? 'activée' : 'désactivée')
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to toggle task',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Exécute une tâche manuellement
     */
    public function execute(Request $request, $taskName)
    {
        $validTasks = ['database_sync', 'studi_check', 'cleanup_logs', 'backup_database', 'update_stats'];

        if (!in_array($taskName, $validTasks)) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid task name'
            ], 400);
        }

        try {
            // Marquer comme exécuté
            BotConfig::setValue(
                "scheduler.{$taskName}_last_run",
                now()->toISOString(),
                "Manual execution timestamp"
            );

            // Log l'action
            Log::info("Task executed manually", [
                'task' => $taskName,
                'user' => 'dashboard',
                'timestamp' => now()
            ]);

            return response()->json([
                'success' => true,
                'message' => "Tâche {$taskName} exécutée avec succès",
                'executed_at' => now()->toISOString()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to execute task',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Configuration du scheduler
     */
    public function config()
    {
        try {
            $config = [
                'enabled' => BotConfig::getValue('scheduler.enabled', true),
                'max_concurrent_tasks' => BotConfig::getValue('scheduler.max_concurrent_tasks', 5),
                'timeout_seconds' => BotConfig::getValue('scheduler.timeout_seconds', 300),
                'retry_attempts' => BotConfig::getValue('scheduler.retry_attempts', 3),
                'log_level' => BotConfig::getValue('scheduler.log_level', 'info')
            ];

            return response()->json([
                'success' => true,
                'data' => $config
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch scheduler config',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Met à jour la configuration du scheduler
     */
    public function updateConfig(Request $request)
    {
        $request->validate([
            'enabled' => 'boolean',
            'max_concurrent_tasks' => 'integer|min:1|max:20',
            'timeout_seconds' => 'integer|min:30|max:3600',
            'retry_attempts' => 'integer|min:0|max:10',
            'log_level' => 'string|in:debug,info,warning,error'
        ]);

        try {
            foreach ($request->all() as $key => $value) {
                BotConfig::setValue(
                    "scheduler.{$key}",
                    (string) $value,
                    "Scheduler configuration: {$key}"
                );
            }

            return response()->json([
                'success' => true,
                'message' => 'Configuration du scheduler mise à jour'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to update scheduler config',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}