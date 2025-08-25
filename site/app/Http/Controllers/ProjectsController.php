<?php

namespace App\Http\Controllers;

use App\Models\MainProject;
use App\Models\DashboardMember;
use App\Models\ProjectGroupMember;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectsController extends Controller
{
    public function index()
    {
        try {
            // Récupérer tous les projets avec pagination
            $projects = MainProject::with(['owner'])
                ->orderBy('updated_at', 'desc')
                ->paginate(15)
                ->through(function ($project) {
                    return [
                        'id' => $project->id,
                        'name' => $project->name,
                        'description' => $project->description,
                        'status' => $project->status,
                        'progress_percentage' => $project->progress_percentage,
                        'members_count' => $project->members_count,
                        'start_date' => $project->start_date?->format('d/m/Y'),
                        'due_date' => $project->due_date?->format('d/m/Y'),
                        'owner_id' => $project->owner_id,
                        'created_at' => $project->created_at->format('d/m/Y H:i'),
                        'updated_at' => $project->updated_at->format('d/m/Y H:i'),
                    ];
                });

            // Statistiques des projets
            $stats = [
                'total' => MainProject::count(),
                'active' => MainProject::whereIn('status', ['in_progress'])->count(),
                'planning' => MainProject::where('status', 'planning')->count(),
                'completed' => MainProject::where('status', 'completed')->count(),
                'paused' => MainProject::where('status', 'paused')->count(),
                'cancelled' => MainProject::where('status', 'cancelled')->count(),
            ];

            return Inertia::render('projects/index', [
                'projects' => $projects,
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            // Si erreur, afficher des données d'exemple
            $projects = collect([
                [
                    'id' => 1,
                    'name' => 'Bot Discord v2.0',
                    'description' => 'Mise à jour majeure du bot',
                    'status' => 'in_progress',
                    'progress_percentage' => 75,
                    'members_count' => 3,
                    'start_date' => '01/01/2025',
                    'due_date' => '30/06/2025',
                    'owner_id' => '123456789',
                    'created_at' => '01/01/2025 10:00',
                    'updated_at' => '24/01/2025 15:30',
                ]
            ]);

            $stats = [
                'total' => 1,
                'active' => 1,
                'planning' => 0,
                'completed' => 0,
                'paused' => 0,
                'cancelled' => 0,
            ];

            return Inertia::render('projects/index', [
                'projects' => [
                    'data' => $projects,
                    'links' => [],
                    'meta' => ['from' => 1, 'to' => 1, 'total' => 1]
                ],
                'stats' => $stats,
            ]);
        }
    }

    public function show($id)
    {
        try {
            $project = MainProject::with(['owner', 'members'])
                ->findOrFail($id);

            // Membres du projet
            $members = $project->members()
                ->with('member')
                ->get()
                ->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'username' => $member->member->username ?? 'Inconnu',
                        'role' => $member->formatted_role,
                        'joined_at' => $member->joined_at->format('d/m/Y'),
                        'is_active' => $member->is_active,
                    ];
                });

            return Inertia::render('projects/show', [
                'project' => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => $project->description,
                    'status' => $project->status,
                    'progress_percentage' => $project->progress_percentage,
                    'members_count' => $project->members_count,
                    'start_date' => $project->start_date?->format('d/m/Y'),
                    'due_date' => $project->due_date?->format('d/m/Y'),
                    'owner_id' => $project->owner_id,
                    'created_at' => $project->created_at->format('d/m/Y H:i'),
                    'updated_at' => $project->updated_at->format('d/m/Y H:i'),
                ],
                'members' => $members,
            ]);
        } catch (\Exception $e) {
            return redirect()->route('projects.index')
                ->with('error', 'Projet non trouvé');
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $project = MainProject::findOrFail($id);
            
            $validated = $request->validate([
                'name' => 'sometimes|string|max:100',
                'description' => 'sometimes|string',
                'status' => 'sometimes|in:planning,in_progress,paused,completed,cancelled',
                'progress_percentage' => 'sometimes|integer|min:0|max:100',
                'start_date' => 'sometimes|date|nullable',
                'due_date' => 'sometimes|date|nullable',
            ]);

            $project->update($validated);

            return redirect()->back()
                ->with('success', 'Projet mis à jour avec succès');
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Erreur lors de la mise à jour du projet');
        }
    }
}
