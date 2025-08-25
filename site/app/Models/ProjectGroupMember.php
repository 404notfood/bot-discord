<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProjectGroupMember extends Model
{
    use HasFactory;

    protected $table = 'project_group_members';
    
    protected $fillable = [
        'project_id',
        'member_id',
        'role',
        'joined_at',
        'is_active'
    ];

    protected $casts = [
        'joined_at' => 'datetime',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    /**
     * Relation avec le projet
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(MainProject::class, 'project_id');
    }

    /**
     * Relation avec le membre
     */
    public function member(): BelongsTo
    {
        return $this->belongsTo(DashboardMember::class, 'member_id');
    }

    /**
     * Scope pour les membres actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope par rôle
     */
    public function scopeByRole($query, string $role)
    {
        return $query->where('role', $role);
    }

    /**
     * Obtenir le nom formaté du rôle
     */
    public function getFormattedRoleAttribute(): string
    {
        return match($this->role) {
            'owner' => 'Propriétaire',
            'admin' => 'Administrateur',
            'member' => 'Membre',
            'viewer' => 'Observateur',
            default => ucfirst($this->role)
        };
    }
}
