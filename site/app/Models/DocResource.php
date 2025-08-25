<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocResource extends Model
{
    use HasFactory;

    protected $table = 'doc_resources';
    
    protected $fillable = [
        'name',
        'description',
        'url',
        'language',
        'category_id',
        'tags',
        'search_url',
        'tutorial_url',
        'popularity',
        'is_active',
        'added_by'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'popularity' => 'integer',
        'tags' => 'array'
    ];

    /**
     * Relation avec la catégorie
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(DocCategory::class, 'category_id');
    }

    /**
     * Scope pour les ressources actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour rechercher par nom ou description
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function($q) use ($term) {
            $q->where('name', 'LIKE', "%{$term}%")
              ->orWhere('description', 'LIKE', "%{$term}%")
              ->orWhere('language', 'LIKE', "%{$term}%");
        });
    }

    /**
     * Scope pour filtrer par catégorie
     */
    public function scopeInCategory($query, $categoryId)
    {
        return $query->where('category_id', $categoryId);
    }

    /**
     * Scope pour trier par popularité
     */
    public function scopePopular($query)
    {
        return $query->orderBy('popularity', 'desc');
    }
}