<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BotConfig;
use App\Models\DashboardMember;
use App\Models\BannedUser;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

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
}