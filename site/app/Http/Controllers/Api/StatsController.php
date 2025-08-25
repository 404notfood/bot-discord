<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BotAdmin;
use App\Models\DashboardMember;
use App\Models\MainProject;
use App\Models\ModerationLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * Statistiques générales du bot
     */
    public function index()
    {
        try {
            $stats = [
                'bot_admins' => BotAdmin::count(),
                'dashboard_members' => DashboardMember::where('is_active', true)->count(),
                'total_projects' => MainProject::count(),
                'active_projects' => MainProject::where('status', 'in_progress')->count(),
                'moderation_logs_today' => ModerationLog::whereDate('created_at', today())->count(),
                'moderation_logs_week' => ModerationLog::where('created_at', '>=', now()->subWeek())->count(),
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statistiques pour le dashboard
     */
    public function dashboard()
    {
        try {
            // Statistiques générales
            $stats = [
                'total_admins' => BotAdmin::count(),
                'total_members' => DashboardMember::where('is_active', true)->count(),
                'total_projects' => MainProject::count(),
                'recent_actions' => ModerationLog::where('created_at', '>=', now()->subDays(7))->count(),
            ];

            // Logs de modération récents
            $recent_logs = ModerationLog::orderBy('created_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($log) {
                    return [
                        'id' => $log->id,
                        'action_type' => $log->action_type,
                        'target_username' => $log->user_id,
                        'moderator_username' => $log->moderator_id,
                        'timestamp' => $log->created_at,
                        'reason' => $log->reason
                    ];
                });

            // Projets actifs
            $active_projects = MainProject::whereIn('status', ['planning', 'in_progress'])
                ->orderBy('updated_at', 'desc')
                ->limit(5)
                ->get()
                ->map(function ($project) {
                    return [
                        'id' => $project->id,
                        'name' => $project->name,
                        'status' => $project->status,
                        'progress_percentage' => 0, // À implémenter selon votre logique
                        'members_count' => 0, // À implémenter selon votre logique
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => [
                    'stats' => $stats,
                    'recent_logs' => $recent_logs,
                    'active_projects' => $active_projects,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch dashboard stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}