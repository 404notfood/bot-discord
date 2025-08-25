<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MainProject;
use App\Models\ProjectSubgroup;
use App\Models\ProjectGroupMember;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProjectsApiController extends Controller
{
    /**
     * Liste des projets
     */
    public function index(Request $request)
    {
        $query = MainProject::with('subgroups')->orderBy('created_at', 'desc');

        // Filtres
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Pagination
        $perPage = min($request->get('per_page', 20), 100);
        $projects = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $projects->items(),
            'pagination' => [
                'current_page' => $projects->currentPage(),
                'total_pages' => $projects->lastPage(),
                'per_page' => $projects->perPage(),
                'total' => $projects->total()
            ]
        ]);
    }

    /**
     * Créer un nouveau projet
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:main_projects,name',
            'description' => 'nullable|string',
            'type' => ['required', Rule::in(['web', 'mobile', 'desktop', 'api', 'other'])],
            'status' => ['required', Rule::in(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'])],
            'leader_id' => 'required|string|max:50',
            'leader_username' => 'required|string|max:100',
            'channel_id' => 'nullable|string|max:50',
            'role_id' => 'nullable|string|max:50',
            'max_members' => 'nullable|integer|min:1|max:50',
            'technologies' => 'nullable|array',
            'technologies.*' => 'string|max:50'
        ]);

        try {
            $project = MainProject::create($validated);

            return response()->json([
                'success' => true,
                'data' => $project,
                'message' => 'Projet créé avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to create project',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un projet spécifique
     */
    public function show($id)
    {
        try {
            $project = MainProject::with(['subgroups.members'])->findOrFail($id);

            // Calculer les statistiques du projet
            $stats = [
                'total_subgroups' => $project->subgroups->count(),
                'total_members' => $project->subgroups->sum(function ($subgroup) {
                    return $subgroup->members->count();
                }),
                'active_subgroups' => $project->subgroups->where('is_active', true)->count()
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'project' => $project,
                    'stats' => $stats
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Project not found',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Mettre à jour un projet
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100|unique:main_projects,name,' . $id,
            'description' => 'nullable|string',
            'type' => ['sometimes', Rule::in(['web', 'mobile', 'desktop', 'api', 'other'])],
            'status' => ['sometimes', Rule::in(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'])],
            'leader_id' => 'sometimes|string|max:50',
            'leader_username' => 'sometimes|string|max:100',
            'channel_id' => 'nullable|string|max:50',
            'role_id' => 'nullable|string|max:50',
            'max_members' => 'nullable|integer|min:1|max:50',
            'technologies' => 'nullable|array',
            'technologies.*' => 'string|max:50'
        ]);

        try {
            $project = MainProject::findOrFail($id);
            $project->update($validated);

            return response()->json([
                'success' => true,
                'data' => $project,
                'message' => 'Projet mis à jour avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to update project',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un projet
     */
    public function destroy($id)
    {
        try {
            $project = MainProject::findOrFail($id);
            
            // Supprimer d'abord tous les sous-groupes et leurs membres
            foreach ($project->subgroups as $subgroup) {
                $subgroup->members()->delete();
                $subgroup->delete();
            }
            
            $project->delete();

            return response()->json([
                'success' => true,
                'message' => 'Projet supprimé avec succès'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to delete project',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste des sous-groupes d'un projet
     */
    public function subgroups($id)
    {
        try {
            $project = MainProject::findOrFail($id);
            $subgroups = $project->subgroups()->with('members')->get();

            return response()->json([
                'success' => true,
                'data' => $subgroups
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Project not found',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Créer un sous-groupe pour un projet
     */
    public function createSubgroup(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'nullable|string',
            'leader_id' => 'required|string|max:50',
            'leader_username' => 'required|string|max:100',
            'channel_id' => 'nullable|string|max:50',
            'role_id' => 'nullable|string|max:50',
            'max_members' => 'nullable|integer|min:1|max:20'
        ]);

        try {
            $project = MainProject::findOrFail($id);

            $subgroup = ProjectSubgroup::create(array_merge($validated, [
                'project_id' => $project->id,
                'is_active' => true
            ]));

            // Ajouter le leader comme membre du sous-groupe
            ProjectGroupMember::create([
                'subgroup_id' => $subgroup->id,
                'user_id' => $validated['leader_id'],
                'username' => $validated['leader_username'],
                'role' => 'leader',
                'joined_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'data' => $subgroup->load('members'),
                'message' => 'Sous-groupe créé avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to create subgroup',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}