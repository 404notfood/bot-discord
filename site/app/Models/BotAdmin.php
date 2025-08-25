<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class BotAdmin extends Model
{
    use HasFactory;

    protected $table = 'bot_admins';
    
    protected $fillable = [
        'user_id',
        'username',
        'added_by',
        'added_at'
    ];

    protected $casts = [
        'added_at' => 'datetime'
    ];

    public $timestamps = false;

    /**
     * Boot du modèle pour gérer les timestamps manuellement
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->added_at)) {
                $model->added_at = Carbon::now();
            }
        });
    }

    /**
     * Relation avec le membre du dashboard
     */
    public function dashboardMember()
    {
        return $this->hasOne(DashboardMember::class, 'discord_id', 'user_id');
    }

    /**
     * Relation avec les logs de modération créés par cet admin
     */
    public function moderationLogs(): HasMany
    {
        return $this->hasMany(ModerationLog::class, 'moderator_id', 'user_id');
    }

    /**
     * Relation avec l'historique des commandes exécutées
     */
    public function commandHistory(): HasMany
    {
        return $this->hasMany(CommandHistory::class, 'user_id', 'user_id');
    }

    /**
     * Vérifier si l'admin a une permission spécifique
     * Pour l'instant, tous les admins ont toutes les permissions
     */
    public function hasPermission(string $permission): bool
    {
        return true; // Tous les admins ont toutes les permissions
    }

    /**
     * Scope pour les admins actifs
     */
    public function scopeActive($query)
    {
        return $query->whereHas('dashboardMember', function ($q) {
            $q->where('is_active', true);
        });
    }

    /**
     * Scope pour rechercher par nom d'utilisateur
     */
    public function scopeByUsername($query, $username)
    {
        return $query->where('username', 'like', '%' . $username . '%');
    }

    /**
     * Vérifier si l'admin est actif
     */
    public function isActive()
    {
        $dashboardMember = $this->dashboardMember;
        return $dashboardMember && $dashboardMember->is_active;
    }

    /**
     * Obtenir la date d'ajout formatée
     */
    public function getAddedAtFormattedAttribute()
    {
        return $this->added_at ? $this->added_at->format('d/m/Y H:i') : 'N/A';
    }

    /**
     * Obtenir le statut de l'admin
     */
    public function getStatusAttribute()
    {
        return $this->isActive() ? 'active' : 'inactive';
    }
}