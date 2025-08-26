<?php

namespace App\Http\Controllers;

use App\Models\DocCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DocCategoryController extends Controller
{
    /**
     * Afficher la liste des catégories
     */
    public function index()
    {
        $categories = DocCategory::with(['resources' => function($query) {
            $query->select('id', 'category_id')->where('is_active', true);
        }])
        ->withCount(['resources as total_resources', 'activeResources as active_resources'])
        ->ordered()
        ->get();

        return Inertia::render('documentation/categories/index', [
            'categories' => $categories
        ]);
    }

    /**
     * Afficher le formulaire de création
     */
    public function create()
    {
        return Inertia::render('documentation/categories/create');
    }

    /**
     * Enregistrer une nouvelle catégorie
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:doc_categories,name',
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer|min:0|max:999',
            'is_active' => 'boolean'
        ]);

        // Si aucun ordre de tri spécifié, mettre à la fin
        if (!isset($validated['sort_order'])) {
            $maxOrder = DocCategory::max('sort_order') ?? 0;
            $validated['sort_order'] = $maxOrder + 10;
        }

        $validated['is_active'] = $validated['is_active'] ?? true;

        $category = DocCategory::create($validated);

        return redirect()->route('doc-categories.index')
                        ->with('success', 'Catégorie créée avec succès.');
    }

    /**
     * Afficher une catégorie spécifique
     */
    public function show(DocCategory $docCategory)
    {
        $docCategory->load(['resources' => function($query) {
            $query->latest();
        }]);

        return Inertia::render('documentation/categories/show', [
            'category' => $docCategory
        ]);
    }

    /**
     * Afficher le formulaire de modification
     */
    public function edit(DocCategory $docCategory)
    {
        return Inertia::render('documentation/categories/edit', [
            'category' => $docCategory
        ]);
    }

    /**
     * Mettre à jour la catégorie
     */
    public function update(Request $request, DocCategory $docCategory)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:doc_categories,name,' . $docCategory->id,
            'description' => 'nullable|string|max:500',
            'icon' => 'nullable|string|max:50',
            'sort_order' => 'nullable|integer|min:0|max:999',
            'is_active' => 'boolean'
        ]);

        $docCategory->update($validated);

        return redirect()->route('doc-categories.index')
                        ->with('success', 'Catégorie modifiée avec succès.');
    }

    /**
     * Supprimer la catégorie
     */
    public function destroy(DocCategory $docCategory)
    {
        // Vérifier si la catégorie a des ressources
        if ($docCategory->resources()->count() > 0) {
            return redirect()->route('doc-categories.index')
                            ->with('error', 'Impossible de supprimer une catégorie qui contient des ressources.');
        }

        $docCategory->delete();

        return redirect()->route('doc-categories.index')
                        ->with('success', 'Catégorie supprimée avec succès.');
    }

    /**
     * Basculer le statut actif/inactif
     */
    public function toggleActive(DocCategory $docCategory)
    {
        $docCategory->update([
            'is_active' => !$docCategory->is_active
        ]);

        $status = $docCategory->is_active ? 'activée' : 'désactivée';
        
        return redirect()->back()
                        ->with('success', "Catégorie {$status} avec succès.");
    }

    /**
     * Réorganiser l'ordre des catégories
     */
    public function reorder(Request $request)
    {
        $validated = $request->validate([
            'categories' => 'required|array',
            'categories.*.id' => 'required|exists:doc_categories,id',
            'categories.*.sort_order' => 'required|integer|min:0'
        ]);

        foreach ($validated['categories'] as $categoryData) {
            DocCategory::where('id', $categoryData['id'])
                      ->update(['sort_order' => $categoryData['sort_order']]);
        }

        return redirect()->back()
                        ->with('success', 'Ordre des catégories mis à jour avec succès.');
    }

    /**
     * API - Obtenir les catégories pour sélection
     */
    public function apiList()
    {
        $categories = DocCategory::active()
                                ->ordered()
                                ->select('id', 'name', 'icon')
                                ->get();

        return response()->json($categories);
    }
}