<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Carbon\Carbon;

class BotModerator extends Model
{
    use HasFactory;

    protected $table = 'bot_moderators';
    
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
     * Relation avec les logs de modération créés par ce modérateur
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
     * Vérifier si le modérateur a une permission spécifique
     */
    public function hasPermission(string $permission): bool
    {
        $moderatorPermissions = [
            'moderate_users',
            'ban_users',
            'kick_users',
            'mute_users',
            'view_moderation_logs'
        ];
        
        return in_array($permission, $moderatorPermissions);
    }

    /**
     * Scope pour les modérateurs actifs
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
     * Vérifier si le modérateur est actif
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
     * Obtenir le statut du modérateur
     */
    public function getStatusAttribute()
    {
        return $this->isActive() ? 'active' : 'inactive';
    }

    /**
     * Obtenir le nombre d'actions de modération effectuées
     */
    public function getModerationCountAttribute()
    {
        return $this->moderationLogs()->count();
    }
}
