<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class DashboardMember extends Model
{
    use HasFactory;

    protected $table = 'dashboard_members';
    
    protected $fillable = [
        'username',
        'password',
        'email',
        'role',
        'is_active',
        'last_login'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'last_login' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public $timestamps = true;

    /**
     * Relation avec les contributions
     */
    public function contributions(): HasMany
    {
        return $this->hasMany(MemberContribution::class, 'member_id', 'user_id');
    }

    /**
     * Relation avec les projets (many-to-many)
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(
            MainProject::class,
            'project_group_members',
            'member_id',
            'project_id',
            'user_id',
            'id'
        )->withPivot(['role', 'joined_at', 'is_active']);
    }

    /**
     * Relation avec les sous-groupes de projet
     */
    public function subgroups(): BelongsToMany
    {
        return $this->belongsToMany(
            ProjectSubgroup::class,
            'project_group_members',
            'member_id',
            'subgroup_id',
            'user_id',
            'id'
        )->withPivot(['role', 'joined_at', 'is_active']);
    }

    /**
     * Vérifier si le membre a un rôle spécifique
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Vérifier si le membre a une permission spécifique
     */
    public function hasPermission(string $permission): bool
    {
        if (!$this->is_active) {
            return false;
        }

        // Les admins ont toutes les permissions
        if ($this->role === 'admin') {
            return true;
        }

        // Les éditeurs ont certaines permissions
        if ($this->role === 'editor') {
            return in_array($permission, ['read', 'write', 'edit']);
        }

        // Les viewers ont seulement la lecture
        if ($this->role === 'viewer') {
            return $permission === 'read';
        }

        return false;
    }

    /**
     * Obtenir le nom d'affichage complet
     */
    public function getDisplayNameAttribute(): string
    {
        return $this->username;
    }

    /**
     * Scope pour les membres actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope pour les membres vérifiés (alias pour actifs)
     */
    public function scopeVerified($query)
    {
        return $query->where('is_active', true);
    }
}
