<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BannedUser extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'username',
        'reason',
        'banned_by',
        'duration_days',
        'expires_at',
        'is_active'
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'is_active' => 'boolean',
        'duration_days' => 'integer'
    ];

    /**
     * Vérifier si le bannissement est encore actif
     */
    public function isActive(): bool
    {
        if (!$this->is_active) {
            return false;
        }

        if ($this->expires_at && $this->expires_at->isPast()) {
            $this->update(['is_active' => false]);
            return false;
        }

        return true;
    }

    /**
     * Obtenir les bannissements actifs
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true)
                    ->where(function ($q) {
                        $q->whereNull('expires_at')
                          ->orWhere('expires_at', '>', now());
                    });
    }

    /**
     * Obtenir les bannissements temporaires
     */
    public function scopeTemporary($query)
    {
        return $query->whereNotNull('expires_at');
    }

    /**
     * Obtenir les bannissements permanents
     */
    public function scopePermanent($query)
    {
        return $query->whereNull('expires_at');
    }
}
