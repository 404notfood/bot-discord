<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DocCategory extends Model
{
    use HasFactory;

    protected $table = 'doc_categories';
    
    protected $fillable = [
        'name',
        'description',
        'icon',
        'sort_order',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'sort_order' => 'integer'
    ];

    /**
     * Relation avec les ressources
     */
    public function resources(): HasMany
    {
        return $this->hasMany(DocResource::class, 'category_id');
    }

    /**
     * Obtenir les ressources actives
     */
    public function activeResources(): HasMany
    {
        return $this->hasMany(DocResource::class, 'category_id')
                    ->where('is_active', true);
    }

    /**
     * Scope pour les catégories actives
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour trier par ordre
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }
}