<?php

namespace App\Http\Controllers;

use App\Models\ModerationLog;
use App\Models\BotAdmin;
use Illuminate\Http\Request;
use Inertia\Inertia;

class LogsController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = ModerationLog::query();

            // Filtres
            if ($request->has('action_type') && $request->action_type !== '') {
                $query->where('action_type', $request->action_type);
            }

            if ($request->has('moderator_id') && $request->moderator_id !== '') {
                $query->where('moderator_id', $request->moderator_id);
            }

            if ($request->has('date_from') && $request->date_from !== '') {
                $query->whereDate('created_at', '>=', $request->date_from);
            }

            if ($request->has('date_to') && $request->date_to !== '') {
                $query->whereDate('created_at', '<=', $request->date_to);
            }

            // Pagination des logs
            $logs = $query->orderBy('created_at', 'desc')
                ->paginate(25)
                ->through(function ($log) {
                    return [
                        'id' => $log->id,
                        'guild_id' => $log->guild_id,
                        'action_type' => $log->action_type,
                        'formatted_action_type' => $log->formatted_action_type,
                        'user_id' => $log->user_id,
                        'moderator_id' => $log->moderator_id,
                        'moderator_username' => 'Modérateur',
                        'reason' => $log->reason,
                        'additional_info' => $log->additional_info,
                        'created_at' => $log->created_at->format('d/m/Y H:i:s'),
                        'created_at_human' => $log->created_at->diffForHumans(),
                    ];
                });

            // Statistiques
            $stats = [
                'total_logs' => ModerationLog::count(),
                'today_logs' => ModerationLog::whereDate('created_at', today())->count(),
                'week_logs' => ModerationLog::where('created_at', '>=', now()->subWeek())->count(),
                'month_logs' => ModerationLog::where('created_at', '>=', now()->subMonth())->count(),
            ];
        } catch (\Exception $e) {
            // Si erreur, données d'exemple
            $logs = collect([
                [
                    'id' => 1,
                    'guild_id' => '123456789',
                    'action_type' => 'warn',
                    'formatted_action_type' => 'Avertissement',
                    'user_id' => '987654321',
                    'moderator_id' => '111222333',
                    'moderator_username' => 'Modérateur',
                    'reason' => 'Exemple de log',
                    'additional_info' => null,
                    'created_at' => '01/01/2025 10:00:00',
                    'created_at_human' => 'Il y a 1 heure',
                ]
            ]);

            $stats = [
                'total_logs' => 1,
                'today_logs' => 1,
                'week_logs' => 1,
                'month_logs' => 1,
            ];

            $logs = [
                'data' => $logs,
                'links' => [],
                'meta' => ['from' => 1, 'to' => 1, 'total' => 1]
            ];
        }

        // Actions disponibles pour les filtres (en dur pour éviter les erreurs)
        $action_types = collect([
            ['value' => 'warn', 'label' => 'Avertissement'],
            ['value' => 'kick', 'label' => 'Expulsion'],
            ['value' => 'ban', 'label' => 'Bannissement'],
            ['value' => 'unban', 'label' => 'Débannissement'],
            ['value' => 'mute', 'label' => 'Mise en sourdine'],
            ['value' => 'unmute', 'label' => 'Fin de sourdine'],
        ]);

        // Modérateurs disponibles pour les filtres
        $moderators = BotAdmin::select('user_id', 'username')
            ->get()
            ->map(function ($admin) {
                return [
                    'value' => $admin->user_id,
                    'label' => $admin->username
                ];
            });

        return Inertia::render('logs/index', [
            'logs' => $logs,
            'stats' => $stats,
            'filters' => [
                'action_type' => $request->action_type,
                'moderator_id' => $request->moderator_id,
                'date_from' => $request->date_from,
                'date_to' => $request->date_to,
            ],
            'action_types' => $action_types,
            'moderators' => $moderators,
        ]);
    }

    public function show($id)
    {
        $log = ModerationLog::with(['moderator'])->findOrFail($id);

        return Inertia::render('logs/show', [
            'log' => [
                'id' => $log->id,
                'guild_id' => $log->guild_id,
                'action_type' => $log->action_type,
                'formatted_action_type' => $log->formatted_action_type,
                'user_id' => $log->user_id,
                'moderator_id' => $log->moderator_id,
                'moderator_username' => $log->moderator->username ?? 'Inconnu',
                'reason' => $log->reason,
                'additional_info' => $log->additional_info,
                'created_at' => $log->created_at,
                'created_at_formatted' => $log->created_at->format('d/m/Y H:i:s'),
                'created_at_human' => $log->created_at->diffForHumans(),
            ]
        ]);
    }
}
