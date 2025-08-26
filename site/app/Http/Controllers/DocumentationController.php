<?php

namespace App\Http\Controllers;

use App\Models\DocCategory;
use App\Models\DocResource;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocumentationController extends Controller
{
    /**
     * Page principale de gestion de la documentation
     */
    public function index(Request $request)
    {
        // Charger les catégories avec leurs statistiques
        $categories = DocCategory::withCount([
            'resources as total_resources',
            'activeResources as active_resources'
        ])
        ->ordered()
        ->get();

        // Requête de base pour les ressources
        $resourcesQuery = DocResource::with('category');

        // Filtrer par recherche
        if ($search = $request->get('search')) {
            $resourcesQuery->search($search);
        }

        // Filtrer par catégorie
        if ($categoryId = $request->get('category')) {
            $resourcesQuery->inCategory($categoryId);
        }

        // Filtrer par statut
        if ($request->has('status')) {
            if ($request->get('status') === 'active') {
                $resourcesQuery->where('is_active', true);
            } elseif ($request->get('status') === 'inactive') {
                $resourcesQuery->where('is_active', false);
            }
        }

        // Filtrer par difficulté
        if ($difficulty = $request->get('difficulty')) {
            $resourcesQuery->where('difficulty_level', $difficulty);
        }

        // Trier les ressources
        $sortBy = $request->get('sort', 'name');
        $sortDirection = $request->get('direction', 'asc');
        
        if ($sortBy === 'popularity') {
            $resourcesQuery->popular();
        } elseif ($sortBy === 'views') {
            $resourcesQuery->orderBy('view_count', 'desc');
        } elseif ($sortBy === 'category') {
            $resourcesQuery->join('doc_categories', 'doc_resources.category_id', '=', 'doc_categories.id')
                          ->orderBy('doc_categories.name', $sortDirection)
                          ->select('doc_resources.*');
        } else {
            $resourcesQuery->orderBy($sortBy, $sortDirection);
        }

        $resources = $resourcesQuery->limit(50)->get();

        // Statistiques générales
        $stats = [
            'total_categories' => DocCategory::count(),
            'active_categories' => DocCategory::active()->count(),
            'total_resources' => DocResource::count(),
            'active_resources' => DocResource::active()->count(),
        ];

        return Inertia::render('documentation', [
            'categories' => $categories,
            'resources' => $resources,
            'filters' => $request->only(['search', 'category', 'status', 'difficulty', 'sort', 'direction']),
            'stats' => $stats
        ]);
    }

    /**
     * Tableau de bord avec statistiques avancées
     */
    public function dashboard()
    {
        $stats = [
            'categories' => [
                'total' => DocCategory::count(),
                'active' => DocCategory::active()->count(),
                'with_resources' => DocCategory::has('resources')->count(),
            ],
            'resources' => [
                'total' => DocResource::count(),
                'active' => DocResource::active()->count(),
                'by_difficulty' => DocResource::active()
                                              ->selectRaw('difficulty_level, COUNT(*) as count')
                                              ->groupBy('difficulty_level')
                                              ->pluck('count', 'difficulty_level'),
                'by_language' => DocResource::active()
                                           ->whereNotNull('language')
                                           ->selectRaw('language, COUNT(*) as count')
                                           ->groupBy('language')
                                           ->orderBy('count', 'desc')
                                           ->limit(10)
                                           ->pluck('count', 'language'),
                'most_viewed' => DocResource::active()
                                           ->orderBy('view_count', 'desc')
                                           ->limit(10)
                                           ->get(['name', 'view_count', 'language']),
                'most_popular' => DocResource::active()
                                            ->orderBy('popularity', 'desc')
                                            ->limit(10)
                                            ->get(['name', 'popularity', 'language']),
                'recent' => DocResource::latest()
                                      ->limit(5)
                                      ->with('category')
                                      ->get(),
            ],
            'categories_breakdown' => DocCategory::active()
                                               ->withCount(['activeResources'])
                                               ->orderBy('active_resources_count', 'desc')
                                               ->get(['id', 'name', 'icon', 'active_resources_count']),
        ];

        return Inertia::render('documentation/dashboard', [
            'stats' => $stats
        ]);
    }

    /**
     * Export complet des données
     */
    public function export(Request $request)
    {
        $format = $request->get('format', 'json');
        
        $data = [
            'categories' => DocCategory::active()
                                     ->with(['activeResources' => function($query) {
                                         $query->select('id', 'category_id', 'name', 'url', 'language', 'difficulty_level');
                                     }])
                                     ->get(),
            'export_date' => now()->toISOString(),
            'export_version' => '1.0'
        ];

        $filename = 'documentation_export_' . now()->format('Y-m-d_H-i-s');

        switch ($format) {
            case 'json':
                return response()->json($data, 200, [
                    'Content-Type' => 'application/json',
                    'Content-Disposition' => "attachment; filename=\"{$filename}.json\""
                ]);
                
            case 'yaml':
                $yamlContent = yaml_emit($data);
                return response($yamlContent, 200, [
                    'Content-Type' => 'application/x-yaml',
                    'Content-Disposition' => "attachment; filename=\"{$filename}.yaml\""
                ]);
                
            default:
                return response()->json(['error' => 'Format non supporté'], 400);
        }
    }

    /**
     * Import de données
     */
    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:json,yaml,yml',
            'action' => 'required|in:replace,merge'
        ]);

        try {
            $content = file_get_contents($request->file('file')->getRealPath());
            
            // Tenter de décoder comme JSON d'abord
            $data = json_decode($content, true);
            
            // Si ce n'est pas du JSON, tenter YAML
            if (json_last_error() !== JSON_ERROR_NONE) {
                if (function_exists('yaml_parse')) {
                    $data = yaml_parse($content);
                } else {
                    throw new \Exception('Extension YAML non disponible');
                }
            }

            if (!$data || !isset($data['categories'])) {
                throw new \Exception('Format de fichier invalide');
            }

            \DB::transaction(function () use ($data, $request) {
                if ($request->get('action') === 'replace') {
                    // Supprimer toutes les données existantes
                    DocResource::truncate();
                    DocCategory::truncate();
                }

                // Importer les catégories
                foreach ($data['categories'] as $categoryData) {
                    $category = DocCategory::updateOrCreate(
                        ['name' => $categoryData['name']],
                        [
                            'description' => $categoryData['description'] ?? null,
                            'icon' => $categoryData['icon'] ?? null,
                            'sort_order' => $categoryData['sort_order'] ?? 0,
                            'is_active' => $categoryData['is_active'] ?? true,
                        ]
                    );

                    // Importer les ressources de cette catégorie
                    if (isset($categoryData['active_resources'])) {
                        foreach ($categoryData['active_resources'] as $resourceData) {
                            DocResource::updateOrCreate(
                                [
                                    'name' => $resourceData['name'],
                                    'category_id' => $category->id
                                ],
                                [
                                    'description' => $resourceData['description'] ?? null,
                                    'url' => $resourceData['url'] ?? null,
                                    'language' => $resourceData['language'] ?? null,
                                    'difficulty_level' => $resourceData['difficulty_level'] ?? 'beginner',
                                    'is_active' => true,
                                    'added_by' => 'IMPORT_' . auth()->user()->name ?? 'IMPORT_SYSTEM'
                                ]
                            );
                        }
                    }
                }
            });

            return redirect()->route('documentation.index')
                           ->with('success', 'Import réalisé avec succès.');

        } catch (\Exception $e) {
            return redirect()->back()
                           ->with('error', 'Erreur lors de l\'import: ' . $e->getMessage());
        }
    }

    /**
     * API - Recherche rapide
     */
    public function apiQuickSearch(Request $request)
    {
        $query = $request->get('q', '');
        
        if (strlen($query) < 2) {
            return response()->json([]);
        }

        $resources = DocResource::active()
                               ->with('category:id,name,icon')
                               ->where(function($q) use ($query) {
                                   $q->where('name', 'LIKE', "%{$query}%")
                                     ->orWhere('description', 'LIKE', "%{$query}%")
                                     ->orWhere('language', 'LIKE', "%{$query}%");
                               })
                               ->limit(10)
                               ->get(['id', 'name', 'description', 'url', 'language', 'category_id']);

        return response()->json($resources);
    }
}