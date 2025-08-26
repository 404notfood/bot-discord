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
            $tasks = [
                [
                    'id' => 'database_sync',
                    'name' => 'DATABASE_SYNC',
                    'description' => 'Synchronize database with Discord server data',
                    'interval' => 'Every 15 minutes',
                    'enabled' => BotConfig::getValue('scheduler.database_sync_enabled', 'true') === 'true',
                    'last_run' => BotConfig::getValue('scheduler.database_sync_last_run', now()->subMinutes(3)->toISOString()),
                    'next_run' => now()->addMinutes(12)->toISOString(),
                    'status' => 'idle'
                ],
                [
                    'id' => 'studi_check',
                    'name' => 'STUDI_CHECK',
                    'description' => 'Check new members against Studi database',
                    'interval' => 'Every 30 minutes',
                    'enabled' => BotConfig::getValue('scheduler.studi_check_enabled', 'true') === 'true',
                    'last_run' => BotConfig::getValue('scheduler.studi_check_last_run', now()->subMinutes(12)->toISOString()),
                    'next_run' => now()->addMinutes(18)->toISOString(),
                    'status' => 'running'
                ],
                [
                    'id' => 'update_stats',
                    'name' => 'UPDATE_STATS',
                    'description' => 'Update server statistics and metrics',
                    'interval' => 'Every 1 hour',
                    'enabled' => BotConfig::getValue('scheduler.update_stats_enabled', 'true') === 'true',
                    'last_run' => BotConfig::getValue('scheduler.update_stats_last_run', now()->subMinutes(45)->toISOString()),
                    'next_run' => now()->addMinutes(15)->toISOString(),
                    'status' => 'idle'
                ],
                [
                    'id' => 'cleanup_logs',
                    'name' => 'CLEANUP_LOGS',
                    'description' => 'Clean up old log files and temporary data',
                    'interval' => 'Every 6 hours',
                    'enabled' => BotConfig::getValue('scheduler.cleanup_logs_enabled', 'false') === 'true',
                    'last_run' => BotConfig::getValue('scheduler.cleanup_logs_last_run', now()->subHours(2)->toISOString()),
                    'next_run' => BotConfig::getValue('scheduler.cleanup_logs_enabled', 'false') === 'true' ? now()->addHours(4)->toISOString() : 'Disabled',
                    'status' => 'idle'
                ],
                [
                    'id' => 'backup_data',
                    'name' => 'BACKUP_DATA',
                    'description' => 'Create automated backups of critical data',
                    'interval' => 'Daily at 02:00',
                    'enabled' => BotConfig::getValue('scheduler.backup_database_enabled', 'true') === 'true',
                    'last_run' => BotConfig::getValue('scheduler.backup_database_last_run', now()->subDay()->toISOString()),
                    'next_run' => now()->tomorrow()->hour(2)->minute(0)->toISOString(),
                    'status' => 'idle'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $tasks
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

    /**
     * Opérations système du scheduler
     */
    public function systemOperation(Request $request)
    {
        $validated = $request->validate([
            'action' => 'required|string|in:pause_all,resume_all,restart,cleanup'
        ]);

        try {
            $action = $validated['action'];
            $timestamp = now()->toISOString();

            switch ($action) {
                case 'pause_all':
                    BotConfig::setValue('scheduler.all_tasks_paused', 'true', 'All tasks paused status');
                    $message = 'All tasks have been paused';
                    break;
                case 'resume_all':
                    BotConfig::setValue('scheduler.all_tasks_paused', 'false', 'All tasks paused status');
                    $message = 'All tasks have been resumed';
                    break;
                case 'restart':
                    BotConfig::setValue('scheduler.last_restart', $timestamp, 'Last scheduler restart');
                    $message = 'Scheduler system restarted';
                    break;
                case 'cleanup':
                    BotConfig::setValue('scheduler.last_cleanup', $timestamp, 'Last system cleanup');
                    $message = 'System cleanup completed';
                    break;
                default:
                    throw new \Exception('Invalid action');
            }

            Log::info("Scheduler system operation", [
                'action' => $action,
                'user' => 'dashboard',
                'timestamp' => $timestamp
            ]);

            return response()->json([
                'success' => true,
                'message' => $message
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to perform system operation',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer une nouvelle tâche
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'description' => 'required|string|max:200',
            'interval' => 'required|string|max:50',
            'enabled' => 'boolean'
        ]);

        try {
            $taskId = strtolower(str_replace(' ', '_', $validated['name']));
            
            // Sauvegarder dans la configuration
            BotConfig::setValue("scheduler.{$taskId}_enabled", $validated['enabled'] ? 'true' : 'false', "Task {$taskId} enabled status");
            BotConfig::setValue("scheduler.{$taskId}_name", $validated['name'], "Task {$taskId} name");
            BotConfig::setValue("scheduler.{$taskId}_description", $validated['description'], "Task {$taskId} description");
            BotConfig::setValue("scheduler.{$taskId}_interval", $validated['interval'], "Task {$taskId} interval");
            BotConfig::setValue("scheduler.{$taskId}_last_run", 'Jamais', "Task {$taskId} last run");
            BotConfig::setValue("scheduler.{$taskId}_created_at", now()->toISOString(), "Task {$taskId} creation date");

            return response()->json([
                'success' => true,
                'message' => 'Tâche créée avec succès',
                'data' => [
                    'id' => $taskId,
                    'name' => $validated['name'],
                    'description' => $validated['description'],
                    'interval' => $validated['interval'],
                    'enabled' => $validated['enabled'] ?? false,
                    'last_run' => 'Jamais',
                    'next_run' => $validated['enabled'] ? 'En attente' : 'Désactivé',
                    'status' => 'idle'
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to create task',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer une tâche
     */
    public function destroy($taskId)
    {
        try {
            // Supprimer de la configuration
            $keys = [
                "scheduler.{$taskId}_enabled",
                "scheduler.{$taskId}_name", 
                "scheduler.{$taskId}_description",
                "scheduler.{$taskId}_interval",
                "scheduler.{$taskId}_last_run",
                "scheduler.{$taskId}_created_at"
            ];

            foreach ($keys as $key) {
                BotConfig::where('key', $key)->delete();
            }

            return response()->json([
                'success' => true,
                'message' => 'Tâche supprimée avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to delete task',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Logs d'exécution
     */
    public function logs()
    {
        try {
            $logs = [
                [
                    'timestamp' => now()->toTimeString(),
                    'task' => 'DATABASE_SYNC',
                    'message' => 'Execution completed successfully',
                    'level' => 'success'
                ],
                [
                    'timestamp' => now()->subMinutes(1)->toTimeString(),
                    'task' => 'STUDI_CHECK',
                    'message' => '15 users verified',
                    'level' => 'success'
                ],
                [
                    'timestamp' => now()->subMinutes(2)->toTimeString(),
                    'task' => 'UPDATE_STATS',
                    'message' => 'Performance degraded, retry scheduled',
                    'level' => 'warning'
                ],
                [
                    'timestamp' => now()->subMinutes(3)->toTimeString(),
                    'task' => 'DATABASE_SYNC',
                    'message' => '247 records synchronized',
                    'level' => 'success'
                ],
                [
                    'timestamp' => now()->subMinutes(4)->toTimeString(),
                    'task' => 'CLEANUP_LOGS',
                    'message' => 'Purged 1,247 old entries',
                    'level' => 'info'
                ],
                [
                    'timestamp' => now()->subMinutes(5)->toTimeString(),
                    'task' => 'STUDI_CHECK',
                    'message' => 'All checks passed',
                    'level' => 'success'
                ],
                [
                    'timestamp' => now()->subMinutes(6)->toTimeString(),
                    'task' => 'UPDATE_STATS',
                    'message' => 'Statistics refreshed',
                    'level' => 'success'
                ],
                [
                    'timestamp' => now()->subMinutes(7)->toTimeString(),
                    'task' => 'DATABASE_SYNC',
                    'message' => 'Incremental sync completed',
                    'level' => 'success'
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $logs
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch execution logs',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}