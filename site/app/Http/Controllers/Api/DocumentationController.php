<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocCategory;
use App\Models\DocResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DocumentationController extends Controller
{
    /**
     * Liste toutes les catégories de documentation
     */
    public function categories()
    {
        try {
            $categories = DocCategory::with(['resources' => function($query) {
                $query->where('is_active', true);
            }])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

            return response()->json([
                'success' => true,
                'data' => $categories
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch categories',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer une nouvelle catégorie
     */
    public function createCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:doc_categories,name',
            'description' => 'required|string|max:500',
            'icon' => 'nullable|string|max:50',
            'sort_order' => 'integer|min:0'
        ]);

        try {
            $category = DocCategory::create($validated + ['is_active' => true]);

            return response()->json([
                'success' => true,
                'data' => $category,
                'message' => 'Catégorie créée avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to create category',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Met à jour une catégorie
     */
    public function updateCategory(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'string|max:100|unique:doc_categories,name,' . $id,
            'description' => 'string|max:500',
            'icon' => 'nullable|string|max:50',
            'sort_order' => 'integer|min:0',
            'is_active' => 'boolean'
        ]);

        try {
            $category = DocCategory::findOrFail($id);
            $category->update($validated);

            return response()->json([
                'success' => true,
                'data' => $category,
                'message' => 'Catégorie mise à jour'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to update category',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Supprime une catégorie
     */
    public function deleteCategory($id)
    {
        try {
            $category = DocCategory::findOrFail($id);
            
            // Vérifier s'il y a des ressources liées
            $resourceCount = $category->resources()->count();
            if ($resourceCount > 0) {
                return response()->json([
                    'success' => false,
                    'error' => 'Cannot delete category with resources',
                    'message' => "Cette catégorie contient {$resourceCount} ressource(s). Supprimez-les d'abord."
                ], 409);
            }

            $category->delete();

            return response()->json([
                'success' => true,
                'message' => 'Catégorie supprimée'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to delete category',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Liste toutes les ressources de documentation
     */
    public function resources(Request $request)
    {
        try {
            $query = DocResource::with('category:id,name,icon')
                ->orderBy('created_at', 'desc');

            // Filtres
            if ($request->has('category_id')) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->has('language')) {
                $query->where('language', 'like', '%' . $request->language . '%');
            }

            if ($request->has('difficulty_level')) {
                $query->where('difficulty_level', $request->difficulty_level);
            }

            if ($request->has('is_active')) {
                $query->where('is_active', $request->boolean('is_active'));
            }

            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%')
                      ->orWhere('language', 'like', '%' . $search . '%')
                      ->orWhere('tags', 'like', '%' . $search . '%');
                });
            }

            $perPage = min($request->get('per_page', 20), 100);
            $resources = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $resources->items(),
                'pagination' => [
                    'current_page' => $resources->currentPage(),
                    'total_pages' => $resources->lastPage(),
                    'per_page' => $resources->perPage(),
                    'total' => $resources->total()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch resources',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Affiche une ressource spécifique
     */
    public function showResource($id)
    {
        try {
            $resource = DocResource::with('category:id,name,icon,description')
                ->findOrFail($id);

            // Incrémenter le compteur de vues
            $resource->increment('view_count');

            return response()->json([
                'success' => true,
                'data' => $resource
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Resource not found',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Créer une nouvelle ressource
     */
    public function createResource(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:doc_categories,id',
            'name' => 'required|string|max:255',
            'description' => 'required|string|max:1000',
            'language' => 'required|string|max:100',
            'url' => 'required|url|max:500',
            'search_url' => 'nullable|url|max:500',
            'tutorial_url' => 'nullable|url|max:500',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'difficulty_level' => 'required|in:beginner,intermediate,advanced'
        ]);

        // Convertir les tags en JSON
        if (isset($validated['tags'])) {
            $validated['tags'] = json_encode($validated['tags']);
        }

        try {
            $resource = DocResource::create($validated + [
                'is_active' => true,
                'view_count' => 0
            ]);

            return response()->json([
                'success' => true,
                'data' => $resource->load('category:id,name,icon'),
                'message' => 'Ressource créée avec succès'
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to create resource',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Met à jour une ressource
     */
    public function updateResource(Request $request, $id)
    {
        $validated = $request->validate([
            'category_id' => 'exists:doc_categories,id',
            'name' => 'string|max:255',
            'description' => 'string|max:1000',
            'language' => 'string|max:100',
            'url' => 'url|max:500',
            'search_url' => 'nullable|url|max:500',
            'tutorial_url' => 'nullable|url|max:500',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'difficulty_level' => 'in:beginner,intermediate,advanced',
            'is_active' => 'boolean'
        ]);

        // Convertir les tags en JSON
        if (isset($validated['tags'])) {
            $validated['tags'] = json_encode($validated['tags']);
        }

        try {
            $resource = DocResource::findOrFail($id);
            $resource->update($validated);

            return response()->json([
                'success' => true,
                'data' => $resource->load('category:id,name,icon'),
                'message' => 'Ressource mise à jour'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to update resource',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Supprime une ressource
     */
    public function deleteResource($id)
    {
        try {
            $resource = DocResource::findOrFail($id);
            $resource->delete();

            return response()->json([
                'success' => true,
                'message' => 'Ressource supprimée'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to delete resource',
                'message' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Recherche dans la documentation
     */
    public function search(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:2|max:200',
            'language' => 'nullable|string|max:100',
            'category_id' => 'nullable|exists:doc_categories,id',
            'difficulty_level' => 'nullable|in:beginner,intermediate,advanced'
        ]);

        try {
            $query = DocResource::with('category:id,name,icon')
                ->where('is_active', true);

            $searchTerm = $request->query;
            $query->where(function($q) use ($searchTerm) {
                $q->where('name', 'like', '%' . $searchTerm . '%')
                  ->orWhere('description', 'like', '%' . $searchTerm . '%')
                  ->orWhere('language', 'like', '%' . $searchTerm . '%')
                  ->orWhere('tags', 'like', '%' . $searchTerm . '%');
            });

            // Filtres additionnels
            if ($request->language) {
                $query->where('language', 'like', '%' . $request->language . '%');
            }

            if ($request->category_id) {
                $query->where('category_id', $request->category_id);
            }

            if ($request->difficulty_level) {
                $query->where('difficulty_level', $request->difficulty_level);
            }

            $resources = $query->orderByRaw("
                CASE 
                    WHEN name LIKE ? THEN 1
                    WHEN language LIKE ? THEN 2
                    WHEN description LIKE ? THEN 3
                    ELSE 4
                END
            ", [
                '%' . $searchTerm . '%',
                '%' . $searchTerm . '%', 
                '%' . $searchTerm . '%'
            ])
            ->limit(50)
            ->get();

            return response()->json([
                'success' => true,
                'data' => $resources,
                'query' => $searchTerm,
                'total_results' => $resources->count()
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to search documentation',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Statistiques de la documentation
     */
    public function stats()
    {
        try {
            $stats = [
                'total_categories' => DocCategory::where('is_active', true)->count(),
                'total_resources' => DocResource::where('is_active', true)->count(),
                'total_views' => DocResource::sum('view_count'),
                'languages_count' => DocResource::where('is_active', true)->distinct('language')->count(),
                'difficulty_distribution' => [
                    'beginner' => DocResource::where('difficulty_level', 'beginner')->where('is_active', true)->count(),
                    'intermediate' => DocResource::where('difficulty_level', 'intermediate')->where('is_active', true)->count(),
                    'advanced' => DocResource::where('difficulty_level', 'advanced')->where('is_active', true)->count(),
                ],
                'top_languages' => DocResource::select('language', DB::raw('count(*) as total'))
                    ->where('is_active', true)
                    ->groupBy('language')
                    ->orderBy('total', 'desc')
                    ->limit(10)
                    ->get(),
                'most_viewed' => DocResource::select('id', 'name', 'language', 'view_count')
                    ->where('is_active', true)
                    ->orderBy('view_count', 'desc')
                    ->limit(5)
                    ->get()
            ];

            return response()->json([
                'success' => true,
                'data' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Unable to fetch documentation stats',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}