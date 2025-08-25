<?php

namespace App\Http\Controllers;

use App\Models\DashboardMember;
use App\Models\BotAdmin;
use App\Models\ModerationLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MembersController extends Controller
{
    public function index()
    {
        // Récupérer tous les membres avec pagination
        $members = DashboardMember::orderBy('created_at', 'desc')
            ->paginate(20)
            ->through(function ($member) {
                return [
                    'id' => $member->id,
                    'username' => $member->username,
                    'email' => $member->email,
                    'role' => $member->role,
                    'is_active' => $member->is_active,
                    'last_login' => $member->last_login?->diffForHumans(),
                    'created_at' => $member->created_at->format('d/m/Y H:i'),
                ];
            });

        // Statistiques des membres
        $stats = [
            'total' => DashboardMember::count(),
            'active' => DashboardMember::where('is_active', true)->count(),
            'admins' => DashboardMember::where('role', 'admin')->count(),
            'editors' => DashboardMember::where('role', 'editor')->count(),
            'viewers' => DashboardMember::where('role', 'viewer')->count(),
        ];

        return Inertia::render('members/index', [
            'members' => $members,
            'stats' => $stats,
        ]);
    }

    public function show($id)
    {
        $member = DashboardMember::findOrFail($id);
        
        // Récupérer les logs de modération pour ce membre (si c'est un admin)
        $moderation_logs = [];
        if ($member->role === 'admin') {
            $admin = BotAdmin::where('username', $member->username)->first();
            if ($admin) {
                $moderation_logs = ModerationLog::where('moderator_id', $admin->user_id)
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
                    ->get()
                    ->map(function ($log) {
                        return [
                            'id' => $log->id,
                            'action_type' => $log->formatted_action_type,
                            'target' => $log->user_id,
                            'reason' => $log->reason,
                            'created_at' => $log->created_at->format('d/m/Y H:i'),
                        ];
                    });
            }
        }

        return Inertia::render('members/show', [
            'member' => [
                'id' => $member->id,
                'username' => $member->username,
                'email' => $member->email,
                'role' => $member->role,
                'is_active' => $member->is_active,
                'last_login' => $member->last_login,
                'created_at' => $member->created_at,
                'updated_at' => $member->updated_at,
            ],
            'moderation_logs' => $moderation_logs,
        ]);
    }

    public function update(Request $request, $id)
    {
        $member = DashboardMember::findOrFail($id);
        
        $request->validate([
            'role' => 'required|in:admin,editor,viewer',
            'is_active' => 'required|boolean',
        ]);

        $member->update([
            'role' => $request->role,
            'is_active' => $request->is_active,
        ]);

        return redirect()->back()->with('success', 'Membre mis à jour avec succès');
    }
}
