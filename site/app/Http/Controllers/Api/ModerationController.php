<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ModerationLog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ModerationController extends Controller
{
    /**
     * Liste des logs de modération
     */
    public function logs(Request $request)
    {
        $query = ModerationLog::orderBy('created_at', 'desc');

        // Filtres
        if ($request->has('guild_id')) {
            $query->where('guild_id', $request->guild_id);
        }

        if ($request->has('action_type')) {
            $query->where('action_type', $request->action_type);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('moderator_id')) {
            $query->where('moderator_id', $request->moderator_id);
        }

        // Pagination
        $perPage = min($request->get('per_page', 20), 100);
        $logs = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $logs->items(),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'total_pages' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total()
            ]
        ]);
    }

    /**
     * Créer un nouveau log de modération
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'guild_id' => 'required|string|max:50',
            'action_type' => ['required', Rule::in(['warn', 'kick', 'ban', 'unban', 'mute', 'unmute'])],
            'user_id' => 'required|string|max:50',
            'moderator_id' => 'required|string|max:50',
            'reason' => 'nullable|string',
            'additional_info' => 'nullable|array'
        ]);

        try {
            $log = ModerationLog::create($validated);

            return response()->json([
                'success' => true,
                'data' => $log,
                'message' => 'Log de modération créé avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to create moderation log',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un log spécifique
     */
    public function show($id)
    {
        try {
            $log = ModerationLog::findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $log
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Log not found',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Mettre à jour un log
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => 'nullable|string',
            'additional_info' => 'nullable|array'
        ]);

        try {
            $log = ModerationLog::findOrFail($id);
            $log->update($validated);

            return response()->json([
                'success' => true,
                'data' => $log,
                'message' => 'Log mis à jour avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to update log',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}