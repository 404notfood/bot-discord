<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class MainProject extends Model
{
    use HasFactory;

    protected $table = 'projects';
    
    protected $fillable = [
        'name',
        'description',
        'status',
        'owner_id',
        'start_date',
        'due_date',
        'progress_percentage',
        'members_count'
    ];

    protected $casts = [
        'start_date' => 'date',
        'due_date' => 'date',
        'progress_percentage' => 'integer',
        'members_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relation avec les sous-groupes
     */
    public function subgroups(): HasMany
    {
        return $this->hasMany(ProjectSubgroup::class, 'project_id');
    }

    /**
     * Relation avec les membres (many-to-many)
     */
    public function members(): BelongsToMany
    {
        return $this->belongsToMany(
            DashboardMember::class,
            'project_group_members',
            'project_id',
            'member_id',
            'id',
            'user_id'
        )->withPivot(['role', 'joined_at', 'is_active']);
    }

    /**
     * Relation avec les contributions
     */
    public function contributions(): HasMany
    {
        return $this->hasMany(MemberContribution::class, 'project_id');
    }

    /**
     * Relation avec les réunions
     */
    public function meetings(): HasMany
    {
        return $this->hasMany(ProjectMeeting::class, 'project_id');
    }

    /**
     * Obtenir le propriétaire du projet
     */
    public function owner()
    {
        return $this->belongsTo(DashboardMember::class, 'owner_id', 'user_id');
    }

    /**
     * Calculer le nombre total de membres
     */
    public function getTotalMembersAttribute(): int
    {
        return $this->members()->where('is_active', true)->count();
    }

    /**
     * Obtenir les membres actifs
     */
    public function getActiveMembersAttribute()
    {
        return $this->members()->wherePivot('is_active', true)->get();
    }

    /**
     * Vérifier si le projet est en cours
     */
    public function getIsActiveAttribute(): bool
    {
        return in_array($this->status, ['active', 'in_progress']);
    }

    /**
     * Scope pour les projets actifs
     */
    public function scopeActive($query)
    {
        return $query->whereIn('status', ['active', 'in_progress']);
    }

    /**
     * Scope pour les projets par priorité
     */
    public function scopeByPriority($query, string $priority)
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope pour les projets avec un tag spécifique
     */
    public function scopeWithTag($query, string $tag)
    {
        return $query->whereJsonContains('tags', $tag);
    }
}
