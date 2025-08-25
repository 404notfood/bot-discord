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

    /**
     * Liste tous les sous-groupes (global)
     */
    public function listSubgroups(Request $request)
    {
        try {
            $query = ProjectSubgroup::with(['project:id,name', 'members'])->orderBy('created_at', 'desc');

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            if ($request->has('project_id')) {
                $query->where('project_id', $request->project_id);
            }

            $perPage = min($request->get('per_page', 20), 100);
            $subgroups = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $subgroups->items(),
                'pagination' => [
                    'current_page' => $subgroups->currentPage(),
                    'total_pages' => $subgroups->lastPage(),
                    'per_page' => $subgroups->perPage(),
                    'total' => $subgroups->total()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch subgroups',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher un sous-groupe spécifique
     */
    public function showSubgroup($id)
    {
        try {
            $subgroup = ProjectSubgroup::with(['project:id,name,description', 'members'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => $subgroup
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Subgroup not found',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Mettre à jour un sous-groupe
     */
    public function updateSubgroup(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'leader_id' => 'sometimes|string|max:50',
            'leader_username' => 'sometimes|string|max:100',
            'channel_id' => 'nullable|string|max:50',
            'role_id' => 'nullable|string|max:50',
            'max_members' => 'nullable|integer|min:1|max:20',
            'is_active' => 'boolean'
        ]);

        try {
            $subgroup = ProjectSubgroup::findOrFail($id);
            $subgroup->update($validated);

            return response()->json([
                'success' => true,
                'data' => $subgroup->load('members'),
                'message' => 'Sous-groupe mis à jour'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to update subgroup',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un sous-groupe
     */
    public function deleteSubgroup($id)
    {
        try {
            $subgroup = ProjectSubgroup::findOrFail($id);
            
            // Supprimer tous les membres du sous-groupe
            $subgroup->members()->delete();
            $subgroup->delete();

            return response()->json([
                'success' => true,
                'message' => 'Sous-groupe supprimé'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to delete subgroup',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Liste des membres d'un sous-groupe
     */
    public function subgroupMembers($id)
    {
        try {
            $subgroup = ProjectSubgroup::with(['members', 'project:id,name'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'subgroup' => $subgroup,
                    'members' => $subgroup->members,
                    'member_count' => $subgroup->members->count(),
                    'max_members' => $subgroup->max_members
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Subgroup not found',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Ajouter un membre à un sous-groupe
     */
    public function addToSubgroup(Request $request, $id)
    {
        $validated = $request->validate([
            'user_id' => 'required|string|max:50',
            'username' => 'required|string|max:100',
            'role' => 'sometimes|in:member,leader'
        ]);

        try {
            $subgroup = ProjectSubgroup::with('members')->findOrFail($id);

            // Vérifier si l'utilisateur est déjà membre
            $existingMember = $subgroup->members()
                ->where('user_id', $validated['user_id'])
                ->first();

            if ($existingMember) {
                return response()->json([
                    'success' => false,
                    'error' => 'User already in subgroup'
                ], 409);
            }

            // Vérifier la limite de membres
            if ($subgroup->max_members && $subgroup->members->count() >= $subgroup->max_members) {
                return response()->json([
                    'success' => false,
                    'error' => 'Subgroup is full',
                    'message' => "Le sous-groupe a atteint sa limite de {$subgroup->max_members} membres"
                ], 409);
            }

            $member = ProjectGroupMember::create([
                'subgroup_id' => $subgroup->id,
                'user_id' => $validated['user_id'],
                'username' => $validated['username'],
                'role' => $validated['role'] ?? 'member',
                'joined_at' => now()
            ]);

            return response()->json([
                'success' => true,
                'data' => $member,
                'message' => 'Membre ajouté au sous-groupe'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to add member to subgroup',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Retirer un membre d'un sous-groupe
     */
    public function removeFromSubgroup(Request $request, $id, $userId)
    {
        try {
            $subgroup = ProjectSubgroup::findOrFail($id);

            $member = ProjectGroupMember::where('subgroup_id', $id)
                ->where('user_id', $userId)
                ->firstOrFail();

            // Ne pas permettre de retirer le leader
            if ($member->role === 'leader') {
                return response()->json([
                    'success' => false,
                    'error' => 'Cannot remove leader',
                    'message' => 'Impossible de retirer le leader du sous-groupe'
                ], 409);
            }

            $member->delete();

            return response()->json([
                'success' => true,
                'message' => 'Membre retiré du sous-groupe'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to remove member from subgroup',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Statistiques des projets
     */
    public function stats()
    {
        try {
            $stats = [
                'total_projects' => MainProject::count(),
                'active_projects' => MainProject::whereIn('status', ['planning', 'in_progress'])->count(),
                'completed_projects' => MainProject::where('status', 'completed')->count(),
                'total_subgroups' => ProjectSubgroup::count(),
                'active_subgroups' => ProjectSubgroup::where('is_active', true)->count(),
                'total_members' => ProjectGroupMember::count(),
                'projects_by_type' => [
                    'web' => MainProject::where('type', 'web')->count(),
                    'mobile' => MainProject::where('type', 'mobile')->count(),
                    'desktop' => MainProject::where('type', 'desktop')->count(),
                    'api' => MainProject::where('type', 'api')->count(),
                    'other' => MainProject::where('type', 'other')->count(),
                ],
                'projects_by_status' => [
                    'planning' => MainProject::where('status', 'planning')->count(),
                    'in_progress' => MainProject::where('status', 'in_progress')->count(),
                    'on_hold' => MainProject::where('status', 'on_hold')->count(),
                    'completed' => MainProject::where('status', 'completed')->count(),
                    'cancelled' => MainProject::where('status', 'cancelled')->count(),
                ]
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch project stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}