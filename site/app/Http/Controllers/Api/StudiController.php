<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BotConfig;
use App\Models\StudiBannedUser;
use App\Models\StudiConfig;
use App\Models\StudiWhitelist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudiController extends Controller
{
    /**
     * Configuration du système Anti-Studi
     */
    public function config()
    {
        try {
            $config = StudiConfig::first();
            
            if (!$config) {
                $config = StudiConfig::create([
                    'is_enabled' => false,
                    'max_offenses' => 3,
                    'ban_duration_hours' => 24,
                    'whitelist_enabled' => true
                ]);
            }

            return response()->json([
                'success' => true,
                'data' => $config
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch Studi config',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Met à jour la configuration Anti-Studi
     */
    public function updateConfig(Request $request)
    {
        $validated = $request->validate([
            'is_enabled' => 'boolean',
            'max_offenses' => 'integer|min:1|max:10',
            'ban_duration_hours' => 'integer|min:1|max:168',
            'whitelist_enabled' => 'boolean'
        ]);

        try {
            $config = StudiConfig::first();
            
            if ($config) {
                $config->update($validated);
            } else {
                $config = StudiConfig::create($validated);
            }

            return response()->json([
                'success' => true,
                'data' => $config,
                'message' => 'Configuration Anti-Studi mise à jour'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to update Studi config',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statut du système Anti-Studi
     */
    public function status()
    {
        try {
            $config = StudiConfig::first();
            $bannedCount = StudiBannedUser::where('is_active', true)->count();
            $whitelistCount = StudiWhitelist::where('is_active', true)->count();
            $totalChecks = BotConfig::getValue('studi.total_checks', 0);
            $lastCheck = BotConfig::getValue('studi.last_check', 'Jamais');

            $status = [
                'system_enabled' => $config?->is_enabled ?? false,
                'whitelist_enabled' => $config?->whitelist_enabled ?? false,
                'max_offenses' => $config?->max_offenses ?? 3,
                'ban_duration_hours' => $config?->ban_duration_hours ?? 24,
                'statistics' => [
                    'banned_users' => $bannedCount,
                    'whitelisted_users' => $whitelistCount,
                    'total_checks' => $totalChecks,
                    'last_check' => $lastCheck
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $status
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch Studi status',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste des utilisateurs bannis Anti-Studi
     */
    public function bannedUsers(Request $request)
    {
        try {
            $query = StudiBannedUser::with('bannedBy:user_id,username')
                ->orderBy('created_at', 'desc');

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $perPage = min($request->get('per_page', 20), 100);
            $bannedUsers = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $bannedUsers->items(),
                'pagination' => [
                    'current_page' => $bannedUsers->currentPage(),
                    'total_pages' => $bannedUsers->lastPage(),
                    'per_page' => $bannedUsers->perPage(),
                    'total' => $bannedUsers->total()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch banned users',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ajouter un utilisateur à la liste Anti-Studi
     */
    public function banUser(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|string|max:50',
            'username' => 'required|string|max:100',
            'email' => 'nullable|email|max:255',
            'reason' => 'required|string|max:500',
            'banned_by' => 'required|string|max:50',
            'evidence_url' => 'nullable|url'
        ]);

        try {
            // Vérifier si déjà banni
            $existing = StudiBannedUser::where('user_id', $validated['user_id'])
                ->where('is_active', true)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'error' => 'User already banned'
                ], 409);
            }

            $bannedUser = StudiBannedUser::create($validated + ['is_active' => true]);

            return response()->json([
                'success' => true,
                'data' => $bannedUser,
                'message' => 'Utilisateur ajouté à la liste Anti-Studi'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to ban user',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retirer un utilisateur de la liste Anti-Studi
     */
    public function unbanUser(Request $request, $userId)
    {
        try {
            $bannedUser = StudiBannedUser::where('user_id', $userId)
                ->where('is_active', true)
                ->firstOrFail();

            $bannedUser->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur retiré de la liste Anti-Studi'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to unban user',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Liste des utilisateurs en whitelist
     */
    public function whitelist(Request $request)
    {
        try {
            $query = StudiWhitelist::orderBy('created_at', 'desc');

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            $perPage = min($request->get('per_page', 20), 100);
            $whitelistUsers = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $whitelistUsers->items(),
                'pagination' => [
                    'current_page' => $whitelistUsers->currentPage(),
                    'total_pages' => $whitelistUsers->lastPage(),
                    'per_page' => $whitelistUsers->perPage(),
                    'total' => $whitelistUsers->total()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch whitelist',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Ajouter un utilisateur à la whitelist
     */
    public function addToWhitelist(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|string|max:50',
            'username' => 'required|string|max:100',
            'email' => 'required|email|max:255',
            'reason' => 'required|string|max:500',
            'added_by' => 'required|string|max:50'
        ]);

        try {
            // Vérifier si déjà en whitelist
            $existing = StudiWhitelist::where('user_id', $validated['user_id'])
                ->where('is_active', true)
                ->first();

            if ($existing) {
                return response()->json([
                    'success' => false,
                    'error' => 'User already whitelisted'
                ], 409);
            }

            $whitelistUser = StudiWhitelist::create($validated + ['is_active' => true]);

            return response()->json([
                'success' => true,
                'data' => $whitelistUser,
                'message' => 'Utilisateur ajouté à la whitelist'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to add to whitelist',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retirer un utilisateur de la whitelist
     */
    public function removeFromWhitelist(Request $request, $userId)
    {
        try {
            $whitelistUser = StudiWhitelist::where('user_id', $userId)
                ->where('is_active', true)
                ->firstOrFail();

            $whitelistUser->update(['is_active' => false]);

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur retiré de la whitelist'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to remove from whitelist',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Dashboard Anti-Studi avec statistiques complètes
     */
    public function dashboard()
    {
        try {
            $config = StudiConfig::first();
            
            // Statistiques générales
            $stats = [
                'total_banned' => StudiBannedUser::count(),
                'active_banned' => StudiBannedUser::where('is_active', true)->count(),
                'total_whitelisted' => StudiWhitelist::count(),
                'active_whitelisted' => StudiWhitelist::where('is_active', true)->count(),
                'total_checks' => (int) BotConfig::getValue('studi.total_checks', 0),
                'checks_today' => (int) BotConfig::getValue('studi.checks_today', 0)
            ];

            // Activité récente
            $recentBans = StudiBannedUser::with('bannedBy:user_id,username')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            $recentWhitelist = StudiWhitelist::orderBy('created_at', 'desc')
                ->limit(5)
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'config' => $config,
                    'statistics' => $stats,
                    'recent_activity' => [
                        'recent_bans' => $recentBans,
                        'recent_whitelist' => $recentWhitelist
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch Studi dashboard',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Initialiser la base de données Anti-Studi
     */
    public function initializeDatabase()
    {
        try {
            DB::beginTransaction();

            // Créer la configuration par défaut si elle n'existe pas
            if (!StudiConfig::exists()) {
                StudiConfig::create([
                    'is_enabled' => false,
                    'max_offenses' => 3,
                    'ban_duration_hours' => 24,
                    'whitelist_enabled' => true
                ]);
            }

            // Initialiser les compteurs
            BotConfig::setValue('studi.total_checks', '0', 'Total checks counter');
            BotConfig::setValue('studi.checks_today', '0', 'Today checks counter');
            BotConfig::setValue('studi.last_check', 'Jamais', 'Last check timestamp');
            BotConfig::setValue('studi.initialized', 'true', 'Studi system initialized');

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Base de données Anti-Studi initialisée avec succès'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to initialize Studi database',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}