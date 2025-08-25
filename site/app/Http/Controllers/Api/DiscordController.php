<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BotConfig;
use App\Models\DashboardMember;
use App\Models\BannedUser;
use App\Models\BotAdmin;
use App\Models\BotModerator;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class DiscordController extends Controller
{
    /**
     * Liste des membres du dashboard
     */
    public function members(Request $request)
    {
        $query = DashboardMember::orderBy('created_at', 'desc');

        // Filtres
        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('guild_id')) {
            $query->where('guild_id', $request->guild_id);
        }

        // Pagination
        $perPage = min($request->get('per_page', 20), 100);
        $members = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $members->items(),
            'pagination' => [
                'current_page' => $members->currentPage(),
                'total_pages' => $members->lastPage(),
                'per_page' => $members->perPage(),
                'total' => $members->total()
            ]
        ]);
    }

    /**
     * Afficher un membre spécifique
     */
    public function member($id)
    {
        try {
            $member = DashboardMember::where('user_id', $id)->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $member
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Member not found',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Bannir un membre
     */
    public function banMember(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
            'duration' => 'nullable|integer|min:1',
            'banned_by' => 'required|string|max:50'
        ]);

        try {
            // Vérifier si l'utilisateur existe dans le dashboard
            $member = DashboardMember::where('user_id', $id)->firstOrFail();

            // Créer le bannissement
            $ban = BannedUser::create([
                'user_id' => $id,
                'username' => $member->username,
                'reason' => $validated['reason'],
                'banned_by' => $validated['banned_by'],
                'duration_days' => $validated['duration'] ?? null,
                'expires_at' => $validated['duration'] ? 
                    now()->addDays($validated['duration']) : null,
                'is_active' => true
            ]);

            // Désactiver le membre du dashboard
            $member->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'data' => $ban,
                'message' => 'Membre banni avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to ban member',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Débannir un membre
     */
    public function unbanMember($id)
    {
        try {
            $ban = BannedUser::where('user_id', $id)
                ->where('is_active', true)
                ->firstOrFail();

            $ban->update(['is_active' => false]);

            // Réactiver le membre dans le dashboard s'il existe
            $member = DashboardMember::where('user_id', $id)->first();
            if ($member) {
                $member->update(['is_active' => true]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Membre débanni avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to unban member',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Configuration du bot
     */
    public function config(Request $request)
    {
        try {
            $configs = BotConfig::all();

            // Grouper par catégorie
            $grouped = $configs->groupBy(function ($item) {
                return explode('.', $item->config_key)[0];
            });

            return response()->json([
                'success' => true,
                'data' => $grouped
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch config',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour une configuration
     */
    public function updateConfig(Request $request, $key)
    {
        $validated = $request->validate([
            'value' => 'required|string',
            'description' => 'nullable|string'
        ]);

        try {
            $config = BotConfig::setValue(
                $key,
                $validated['value'],
                $validated['description'] ?? null
            );

            return response()->json([
                'success' => true,
                'data' => $config,
                'message' => 'Configuration mise à jour avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to update config',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Webhook - Nouveau membre
     */
    public function memberJoin(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|string|max:50',
            'username' => 'required|string|max:100',
            'guild_id' => 'required|string|max:30',
            'joined_at' => 'required|date'
        ]);

        try {
            $member = DashboardMember::updateOrCreate(
                ['user_id' => $validated['user_id']],
                [
                    'username' => $validated['username'],
                    'guild_id' => $validated['guild_id'],
                    'is_active' => true,
                    'last_seen_at' => $validated['joined_at']
                ]
            );

            return response()->json([
                'success' => true,
                'data' => $member,
                'message' => 'Membre ajouté au dashboard'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to process member join',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Webhook - Membre quitté
     */
    public function memberLeave(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|string|max:50'
        ]);

        try {
            $member = DashboardMember::where('user_id', $validated['user_id'])->first();
            
            if ($member) {
                $member->update(['is_active' => false]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Statut du membre mis à jour'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to process member leave',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Webhook - Message supprimé
     */
    public function messageDelete(Request $request)
    {
        $validated = $request->validate([
            'message_id' => 'required|string|max:50',
            'channel_id' => 'required|string|max:50',
            'guild_id' => 'required|string|max:30',
            'author_id' => 'nullable|string|max:50',
            'content' => 'nullable|string',
            'deleted_at' => 'required|date'
        ]);

        try {
            // Log l'événement (vous pourriez vouloir créer une table dédiée)
            // Pour l'instant, on utilise les logs de modération
            if ($validated['author_id']) {
                \App\Models\ModerationLog::create([
                    'guild_id' => $validated['guild_id'],
                    'action_type' => 'message_delete',
                    'user_id' => $validated['author_id'],
                    'moderator_id' => 'system',
                    'reason' => 'Message supprimé automatiquement',
                    'additional_info' => [
                        'message_id' => $validated['message_id'],
                        'channel_id' => $validated['channel_id'],
                        'content' => substr($validated['content'] ?? '', 0, 200)
                    ]
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Événement de suppression enregistré'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to process message delete',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste des administrateurs du bot
     */
    public function botAdmins(Request $request)
    {
        try {
            $admins = BotAdmin::orderBy('added_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $admins
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch bot admins',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ajouter un administrateur du bot
     */
    public function addBotAdmin(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|string|max:50|unique:bot_admins,user_id',
            'username' => 'required|string|max:100',
            'added_by' => 'required|string|max:50'
        ]);

        try {
            $admin = BotAdmin::create($validated);

            // Synchroniser avec dashboard_members si l'utilisateur existe
            $member = DashboardMember::where('discord_id', $validated['user_id'])->first();
            if ($member) {
                $member->update([
                    'role' => 'admin',
                    'is_active' => true,
                    'permissions' => ['bot_admin', 'dashboard_access', 'manage_users']
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $admin,
                'message' => 'Administrateur ajouté avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to add bot admin',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retirer un administrateur du bot
     */
    public function removeBotAdmin(Request $request, $userId)
    {
        try {
            $admin = BotAdmin::where('user_id', $userId)->firstOrFail();
            $admin->delete();

            // Mettre à jour dashboard_members
            $member = DashboardMember::where('discord_id', $userId)->first();
            if ($member) {
                $member->update([
                    'role' => 'member',
                    'permissions' => ['dashboard_access']
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Administrateur retiré avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to remove bot admin',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Liste des modérateurs du bot
     */
    public function botModerators(Request $request)
    {
        try {
            $moderators = BotModerator::orderBy('added_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $moderators
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch bot moderators',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ajouter un modérateur du bot
     */
    public function addBotModerator(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|string|max:50|unique:bot_moderators,user_id',
            'username' => 'required|string|max:100',
            'added_by' => 'required|string|max:50'
        ]);

        try {
            $moderator = BotModerator::create($validated);

            // Synchroniser avec dashboard_members si l'utilisateur existe
            $member = DashboardMember::where('discord_id', $validated['user_id'])->first();
            if ($member) {
                $member->update([
                    'role' => 'moderator',
                    'is_active' => true,
                    'permissions' => ['bot_moderator', 'dashboard_access', 'moderate_users']
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $moderator,
                'message' => 'Modérateur ajouté avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to add bot moderator',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retirer un modérateur du bot
     */
    public function removeBotModerator(Request $request, $userId)
    {
        try {
            $moderator = BotModerator::where('user_id', $userId)->firstOrFail();
            $moderator->delete();

            // Mettre à jour dashboard_members
            $member = DashboardMember::where('discord_id', $userId)->first();
            if ($member) {
                $member->update([
                    'role' => 'member',
                    'permissions' => ['dashboard_access']
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Modérateur retiré avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to remove bot moderator',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Synchroniser les utilisateurs entre le site et le bot
     */
    public function syncUsers(Request $request)
    {
        try {
            DB::beginTransaction();

            $syncStats = [
                'admins_synced' => 0,
                'moderators_synced' => 0,
                'members_updated' => 0
            ];

            // Synchroniser les admins
            $dashboardAdmins = DashboardMember::where('role', 'admin')
                ->where('is_active', true)
                ->whereNotNull('discord_id')
                ->get();

            foreach ($dashboardAdmins as $member) {
                $existing = BotAdmin::where('user_id', $member->discord_id)->first();
                if (!$existing) {
                    BotAdmin::create([
                        'user_id' => $member->discord_id,
                        'username' => $member->username,
                        'added_by' => 'system_sync'
                    ]);
                    $syncStats['admins_synced']++;
                }
            }

            // Synchroniser les modérateurs
            $dashboardModerators = DashboardMember::where('role', 'moderator')
                ->where('is_active', true)
                ->whereNotNull('discord_id')
                ->get();

            foreach ($dashboardModerators as $member) {
                $existing = BotModerator::where('user_id', $member->discord_id)->first();
                if (!$existing) {
                    BotModerator::create([
                        'user_id' => $member->discord_id,
                        'username' => $member->username,
                        'added_by' => 'system_sync'
                    ]);
                    $syncStats['moderators_synced']++;
                }
            }

            // Synchroniser dans l'autre sens - ajouter les bot admins/mods au dashboard
            $botAdmins = BotAdmin::all();
            foreach ($botAdmins as $admin) {
                $member = DashboardMember::where('discord_id', $admin->user_id)->first();
                if ($member) {
                    if ($member->role !== 'admin') {
                        $member->update([
                            'role' => 'admin',
                            'permissions' => ['bot_admin', 'dashboard_access', 'manage_users']
                        ]);
                        $syncStats['members_updated']++;
                    }
                } else {
                    // Créer un membre dashboard pour cet admin
                    DashboardMember::create([
                        'discord_id' => $admin->user_id,
                        'username' => $admin->username,
                        'role' => 'admin',
                        'is_active' => true,
                        'permissions' => ['bot_admin', 'dashboard_access', 'manage_users'],
                        'guild_id' => null // À remplir lors de la prochaine connexion
                    ]);
                    $syncStats['members_updated']++;
                }
            }

            $botModerators = BotModerator::all();
            foreach ($botModerators as $moderator) {
                $member = DashboardMember::where('discord_id', $moderator->user_id)->first();
                if ($member) {
                    if ($member->role !== 'moderator') {
                        $member->update([
                            'role' => 'moderator',
                            'permissions' => ['bot_moderator', 'dashboard_access', 'moderate_users']
                        ]);
                        $syncStats['members_updated']++;
                    }
                } else {
                    // Créer un membre dashboard pour ce modérateur
                    DashboardMember::create([
                        'discord_id' => $moderator->user_id,
                        'username' => $moderator->username,
                        'role' => 'moderator',
                        'is_active' => true,
                        'permissions' => ['bot_moderator', 'dashboard_access', 'moderate_users'],
                        'guild_id' => null // À remplir lors de la prochaine connexion
                    ]);
                    $syncStats['members_updated']++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => $syncStats,
                'message' => 'Synchronisation terminée avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to sync users',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques de synchronisation
     */
    public function syncStats(Request $request)
    {
        try {
            $stats = [
                'dashboard_members' => DashboardMember::count(),
                'active_members' => DashboardMember::where('is_active', true)->count(),
                'bot_admins' => BotAdmin::count(),
                'bot_moderators' => BotModerator::count(),
                'banned_users' => BannedUser::where('is_active', true)->count(),
                'roles' => [
                    'admin' => DashboardMember::where('role', 'admin')->count(),
                    'moderator' => DashboardMember::where('role', 'moderator')->count(),
                    'member' => DashboardMember::where('role', 'member')->count()
                ],
                'last_sync' => BotConfig::getValue('system.last_user_sync', 'Jamais'),
                'needs_sync' => $this->checkSyncNeeded()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch sync stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Vérifier si une synchronisation est nécessaire
     */
    private function checkSyncNeeded()
    {
        try {
            // Vérifier si des admins du dashboard ne sont pas dans bot_admins
            $dashboardAdmins = DashboardMember::where('role', 'admin')
                ->where('is_active', true)
                ->whereNotNull('discord_id')
                ->pluck('discord_id');

            $botAdmins = BotAdmin::pluck('user_id');
            $missingAdmins = $dashboardAdmins->diff($botAdmins);

            // Vérifier si des modérateurs du dashboard ne sont pas dans bot_moderators
            $dashboardModerators = DashboardMember::where('role', 'moderator')
                ->where('is_active', true)
                ->whereNotNull('discord_id')
                ->pluck('discord_id');

            $botModerators = BotModerator::pluck('user_id');
            $missingModerators = $dashboardModerators->diff($botModerators);

            return $missingAdmins->count() > 0 || $missingModerators->count() > 0;
        } catch (\Exception $e) {
            return false;
        }
    }
}