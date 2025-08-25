<?php

namespace App\Http\Controllers;

use App\Models\BotAdmin;
use App\Models\DashboardMember;
use App\Models\MainProject;
use App\Models\ModerationLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index()
    {
        // Statistiques générales
        $stats = [
            'total_admins' => BotAdmin::count(),
            'total_members' => DashboardMember::where('is_active', true)->count(),
            'total_projects' => MainProject::count(),
            'recent_actions' => ModerationLog::recent(7)->count(),
        ];

        // Logs de modération récents
        $recent_logs = ModerationLog::recent(7)
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'action_type' => $log->formatted_action_type,
                    'target_username' => $log->user_id,
                    'moderator_username' => $log->moderator_id,
                    'timestamp' => $log->created_at,
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
                    'progress_percentage' => 0, // À calculer selon votre logique
                    'members_count' => 0, // À calculer selon votre logique
                ];
            });

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recent_logs' => $recent_logs,
            'active_projects' => $active_projects,
        ]);
    }
}
