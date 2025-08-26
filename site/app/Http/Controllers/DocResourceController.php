<?php

namespace App\Http\Controllers;

use App\Models\DocResource;
use App\Models\DocCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocResourceController extends Controller
{
    /**
     * Afficher la liste des ressources
     */
    public function index(Request $request)
    {
        $query = DocResource::with('category');

        // Filtrer par recherche
        if ($search = $request->get('search')) {
            $query->search($search);
        }

        // Filtrer par catégorie
        if ($categoryId = $request->get('category')) {
            $query->inCategory($categoryId);
        }

        // Filtrer par statut
        if ($request->has('status')) {
            if ($request->get('status') === 'active') {
                $query->where('is_active', true);
            } elseif ($request->get('status') === 'inactive') {
                $query->where('is_active', false);
            }
        }

        // Trier
        $sortBy = $request->get('sort', 'name');
        $sortDirection = $request->get('direction', 'asc');
        
        if ($sortBy === 'popularity') {
            $query->popular();
        } elseif ($sortBy === 'category') {
            $query->join('doc_categories', 'doc_resources.category_id', '=', 'doc_categories.id')
                  ->orderBy('doc_categories.name', $sortDirection)
                  ->select('doc_resources.*');
        } else {
            $query->orderBy($sortBy, $sortDirection);
        }

        $resources = $query->paginate(15)->withQueryString();

        // Charger les catégories pour le filtre
        $categories = DocCategory::active()->ordered()->get(['id', 'name']);

        return Inertia::render('documentation/resources/index', [
            'resources' => $resources,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category', 'status', 'sort', 'direction'])
        ]);
    }

    /**
     * Afficher le formulaire de création
     */
    public function create()
    {
        $categories = DocCategory::active()->ordered()->get(['id', 'name']);

        return Inertia::render('documentation/resources/create', [
            'categories' => $categories
        ]);
    }

    /**
     * Enregistrer une nouvelle ressource
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'description' => 'nullable|string|max:1000',
            'url' => 'nullable|url|max:500',
            'search_url' => 'nullable|url|max:500',
            'tutorial_url' => 'nullable|url|max:500',
            'language' => 'nullable|string|max:50',
            'category_id' => 'required|exists:doc_categories,id',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'difficulty_level' => 'nullable|in:beginner,intermediate,advanced',
            'popularity' => 'nullable|integer|min:0|max:9999',
            'is_active' => 'boolean'
        ]);

        // Valeurs par défaut
        $validated['is_active'] = $validated['is_active'] ?? true;
        $validated['popularity'] = $validated['popularity'] ?? 0;
        $validated['difficulty_level'] = $validated['difficulty_level'] ?? 'beginner';
        $validated['added_by'] = auth()->user()->name ?? 'WEB_ADMIN';

        // Nettoyer les tags
        if (isset($validated['tags'])) {
            $validated['tags'] = array_filter($validated['tags'], function($tag) {
                return !empty(trim($tag));
            });
            $validated['tags'] = array_map('trim', $validated['tags']);
        }

        $resource = DocResource::create($validated);

        return redirect()->route('doc-resources.index')
                        ->with('success', 'Ressource créée avec succès.');
    }

    /**
     * Afficher une ressource spécifique
     */
    public function show(DocResource $docResource)
    {
        $docResource->load('category');

        // Incrémenter le compteur de vues
        $docResource->increment('view_count');

        return Inertia::render('documentation/resources/show', [
            'resource' => $docResource
        ]);
    }

    /**
     * Afficher le formulaire de modification
     */
    public function edit(DocResource $docResource)
    {
        $categories = DocCategory::active()->ordered()->get(['id', 'name']);
        $docResource->load('category');

        return Inertia::render('documentation/resources/edit', [
            'resource' => $docResource,
            'categories' => $categories
        ]);
    }

    /**
     * Mettre à jour la ressource
     */
    public function update(Request $request, DocResource $docResource)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:200',
            'description' => 'nullable|string|max:1000',
            'url' => 'nullable|url|max:500',
            'search_url' => 'nullable|url|max:500',
            'tutorial_url' => 'nullable|url|max:500',
            'language' => 'nullable|string|max:50',
            'category_id' => 'required|exists:doc_categories,id',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'difficulty_level' => 'nullable|in:beginner,intermediate,advanced',
            'popularity' => 'nullable|integer|min:0|max:9999',
            'is_active' => 'boolean'
        ]);

        // Nettoyer les tags
        if (isset($validated['tags'])) {
            $validated['tags'] = array_filter($validated['tags'], function($tag) {
                return !empty(trim($tag));
            });
            $validated['tags'] = array_map('trim', $validated['tags']);
        }

        $docResource->update($validated);

        return redirect()->route('doc-resources.index')
                        ->with('success', 'Ressource modifiée avec succès.');
    }

    /**
     * Supprimer la ressource
     */
    public function destroy(DocResource $docResource)
    {
        $docResource->delete();

        return redirect()->route('doc-resources.index')
                        ->with('success', 'Ressource supprimée avec succès.');
    }

    /**
     * Basculer le statut actif/inactif
     */
    public function toggleActive(DocResource $docResource)
    {
        $docResource->update([
            'is_active' => !$docResource->is_active
        ]);

        $status = $docResource->is_active ? 'activée' : 'désactivée';
        
        return redirect()->back()
                        ->with('success', "Ressource {$status} avec succès.");
    }

    /**
     * Dupliquer une ressource
     */
    public function duplicate(DocResource $docResource)
    {
        $newResource = $docResource->replicate();
        $newResource->name = $docResource->name . ' (Copie)';
        $newResource->view_count = 0;
        $newResource->popularity = 0;
        $newResource->added_by = auth()->user()->name ?? 'WEB_ADMIN';
        $newResource->save();

        return redirect()->route('doc-resources.edit', $newResource)
                        ->with('success', 'Ressource dupliquée avec succès. Vous pouvez maintenant la modifier.');
    }

    /**
     * Export des ressources en JSON
     */
    public function export(Request $request)
    {
        $query = DocResource::with('category');

        // Appliquer les mêmes filtres que dans index()
        if ($search = $request->get('search')) {
            $query->search($search);
        }
        if ($categoryId = $request->get('category')) {
            $query->inCategory($categoryId);
        }
        if ($request->get('status') === 'active') {
            $query->where('is_active', true);
        }

        $resources = $query->get();

        $exportData = $resources->map(function($resource) {
            return [
                'name' => $resource->name,
                'description' => $resource->description,
                'url' => $resource->url,
                'search_url' => $resource->search_url,
                'tutorial_url' => $resource->tutorial_url,
                'language' => $resource->language,
                'category' => $resource->category->name,
                'tags' => $resource->tags,
                'difficulty_level' => $resource->difficulty_level,
                'is_active' => $resource->is_active
            ];
        });

        $filename = 'doc_resources_' . now()->format('Y-m-d_H-i-s') . '.json';

        return response()->json($exportData)
                        ->header('Content-Type', 'application/json')
                        ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
    }

    /**
     * API - Recherche de ressources
     */
    public function apiSearch(Request $request)
    {
        $query = DocResource::active()->with('category');

        if ($search = $request->get('q')) {
            $query->search($search);
        }

        if ($category = $request->get('category')) {
            $query->inCategory($category);
        }

        if ($language = $request->get('language')) {
            $query->where('language', 'LIKE', "%{$language}%");
        }

        $resources = $query->limit(20)->get([
            'id', 'name', 'description', 'url', 'language', 'category_id'
        ]);

        return response()->json($resources);
    }

    /**
     * API - Statistiques des ressources
     */
    public function apiStats()
    {
        $stats = [
            'total_resources' => DocResource::count(),
            'active_resources' => DocResource::active()->count(),
            'by_category' => DocCategory::withCount(['activeResources'])
                                      ->active()
                                      ->get(['id', 'name', 'active_resources_count']),
            'by_language' => DocResource::active()
                                       ->whereNotNull('language')
                                       ->selectRaw('language, COUNT(*) as count')
                                       ->groupBy('language')
                                       ->orderBy('count', 'desc')
                                       ->limit(10)
                                       ->get(),
            'most_popular' => DocResource::active()
                                        ->orderBy('popularity', 'desc')
                                        ->limit(5)
                                        ->get(['name', 'popularity', 'language'])
        ];

        return response()->json($stats);
    }
}