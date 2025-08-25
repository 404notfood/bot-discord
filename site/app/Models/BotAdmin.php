<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
     * Scope pour les admins actifs (tous les admins sont actifs)
     */
    public function scopeActive($query)
    {
        return $query; // Tous les admins sont considérés comme actifs
    }
}